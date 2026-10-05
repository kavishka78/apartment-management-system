import json
import os
from typing import List, Dict, Any, Optional

from google import genai
from google.genai import types

from models import ResidentChatRequest, ResidentChatResponse, DraftComplaint

# Prompt defining the Resident Assistant's behavior
SYSTEM_INSTRUCTION = """
You are a helpful, professional Maintenance Assistant for a luxury apartment complex.
Your job is to talk to residents and help them file maintenance complaints.

You need exactly 3 pieces of information to file a complaint:
1. WHAT: A clear description of the issue.
2. WHERE: The location (e.g., Kitchen, Master Bathroom).
3. WHEN/SEVERITY: When it started or how severe it is.

CRITICAL NEW INSTRUCTION - SMART TROUBLESHOOTING:
Before finalizing the draft, you MUST suggest one quick, safe troubleshooting step for the resident to try if applicable (e.g., "Have you tried pressing the reset button?", "Is the breaker tripped?"). If they say it didn't work or they can't do it, THEN finalize the draft.

INSTRUCTIONS:
- Review the conversation history.
- If you are missing any of the 3 pieces of info, return status="clarifying" and ask a short, polite question to get it.
- If you have all 3 pieces of info but haven't offered a troubleshooting step, return status="clarifying" and offer one.
- If you have all 3 pieces of info AND troubleshooting failed/was skipped, return status="ready", provide a polite closing message, and fill out the draftComplaint JSON.
- For categoryId, use: 1 (Plumbing), 2 (Electrical), 3 (HVAC), 4 (General), 5 (Appliance). Guess based on the description.

Your response must ALWAYS be valid JSON matching the schema.
"""

async def handle_resident_chat(request: ResidentChatRequest) -> ResidentChatResponse:
    """
    Handles a resident chat message using Gemini structured outputs.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY is not set.")

    # Initialize the modern Gemini client
    client = genai.Client(api_key=api_key)
    
    # We'll use gemini-2.0-flash as it's fast and supports structured output well
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # Build the conversation history for Gemini
    contents = []
    for msg in request.messages:
        role = "model" if msg.role == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))

    # Define the expected JSON schema using Gemini's dict format
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "status": {
                "type": "STRING",
                "enum": ["clarifying", "ready"],
                "description": "clarifying if you need more info, ready if you have enough to draft the complaint."
            },
            "reply": {
                "type": "STRING",
                "description": "The polite message to show to the resident."
            },
            "draftComplaint": {
                "type": "OBJECT",
                "description": "Only include this if status is ready.",
                "properties": {
                    "title": {"type": "STRING"},
                    "description": {"type": "STRING"},
                    "categoryId": {"type": "INTEGER"}
                },
                "required": ["title", "description", "categoryId"]
            }
        },
        "required": ["status", "reply"]
    }

    # Call Gemini
    try:
        response = client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                response_mime_type="application/json",
                response_schema=response_schema,
                temperature=0.2, # Low temperature for more deterministic drafting
            )
        )
        
        # Parse the JSON response
        result_dict = json.loads(response.text)
        
        # Convert to Pydantic model
        draft = None
        if "draftComplaint" in result_dict and result_dict["draftComplaint"]:
            draft = DraftComplaint(**result_dict["draftComplaint"])
            
        return ResidentChatResponse(
            success=True,
            status=result_dict.get("status", "clarifying"),
            reply=result_dict.get("reply", "I'm sorry, I didn't understand."),
            draftComplaint=draft
        )

    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return ResidentChatResponse(
            success=False,
            status="error",
            reply="I'm having trouble connecting to the system right now.",
            error=str(e)
        )
