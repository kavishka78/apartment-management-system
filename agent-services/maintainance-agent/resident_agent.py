import json
import os
from typing import List, Dict, Any, Optional

from google import genai
from google.genai import types

from models import ResidentChatRequest, ResidentChatResponse, DraftComplaint
from pydantic import ValidationError

# --- FEATURE 1: TOOL USE (Allow-listed function) ---
def check_building_outages(issue_category: str) -> str:
    """
    Checks the system for building-wide outages.
    Currently returns no active outages to allow normal ticket drafting.
    """
    return "SYSTEM TOOL ALERT: No active outages for this category. Proceed with standard troubleshooting." 

# Prompt for the Main Drafting Agent
SYSTEM_INSTRUCTION = """
You are a helpful, professional Maintenance Assistant for a luxury apartment complex.
Your job is to talk to residents and help them file maintenance complaints.

You need exactly 3 pieces of information to file a complaint:
1. WHAT: A clear description of the issue.
2. WHERE: The location (e.g., Kitchen, Master Bathroom).
3. WHEN/SEVERITY: When it started or how severe it is.

CRITICAL INSTRUCTION - SMART TROUBLESHOOTING:
Before finalizing the draft, you MUST suggest one quick, safe troubleshooting step for the resident to try if applicable. If they say it didn't work or they can't do it, THEN finalize the draft.

INSTRUCTIONS:
- Review the conversation history and the SYSTEM TOOL ALERTS provided.
- If the SYSTEM TOOL ALERT explains their issue (e.g., scheduled maintenance), gently inform them and ask if they still want to log a ticket.
- If you are missing any of the 3 pieces of info, return status="clarifying" and ask a short, polite question to get it.
- If you have all 3 pieces of info but haven't offered a troubleshooting step, return status="clarifying" and offer one.
- If you have all 3 pieces of info AND troubleshooting failed/was skipped, return status="ready", provide a polite closing message, and fill out the draftComplaint JSON.
- For categoryId, use: 1 (Plumbing), 2 (Electrical), 3 (HVAC), 4 (General), 5 (Appliance). Guess based on the description.

Your response must ALWAYS be valid JSON matching the schema.
"""

async def handle_resident_chat(request: ResidentChatRequest) -> ResidentChatResponse:
    """
    Handles a resident chat message using Gemini structured outputs, tool execution, and self-correction.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=api_key)
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    # --- FEATURE 2: DELEGATION (Classifier Agent) ---
    # We delegate the first step to a mini-agent to classify the issue to use our tool.
    last_user_message = next((msg.content for msg in reversed(request.messages) if msg.role == 'user'), "")
    
    classifier_prompt = f"Analyze this user message: '{last_user_message}'. Is it related to 'Electrical', 'Plumbing', or 'Other'? Reply with exactly one word."
    try:
        class_resp = client.models.generate_content(
            model=model_name,
            contents=classifier_prompt,
            config=types.GenerateContentConfig(temperature=0.0)
        )
        category = class_resp.text.strip()
    except Exception:
        category = "Other"

    # Execute Tool based on Classification
    tool_result = check_building_outages(category)

    # Build the conversation history for the Main Agent
    contents = []
    for msg in request.messages:
        role = "model" if msg.role == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=msg.content)]))
        
    # Inject the Tool Result as the latest context
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=f"[{tool_result}]")]))

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "status": {
                "type": "STRING",
                "enum": ["clarifying", "ready"]
            },
            "reply": {
                "type": "STRING"
            },
            "draftComplaint": {
                "type": "OBJECT",
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

    # --- FEATURE 3: ACTIONABLE SELF-CORRECTION LOOP (Deterministic Validation) ---
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_INSTRUCTION,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    temperature=0.2,
                )
            )
            
            result_dict = json.loads(response.text)
            
            # Step 1: Pydantic Deterministic Validation
            draft = None
            if "draftComplaint" in result_dict and result_dict["draftComplaint"]:
                # This will raise ValidationError if business rules fail (e.g. invalid categoryId or title too short)
                draft = DraftComplaint(**result_dict["draftComplaint"])
                
            return ResidentChatResponse(
                success=True,
                status=result_dict.get("status", "clarifying"),
                reply=result_dict.get("reply", "I'm sorry, I didn't understand."),
                draftComplaint=draft
            )

        except ValidationError as ve:
            # Self-Correction: Catch the validation error and instruct the AI to fix it
            error_msg = f"SYSTEM VALIDATION ERROR: The generated draft failed business rules: {ve}. Please correct the JSON and regenerate."
            contents.append(types.Content(role="model", parts=[types.Part.from_text(text=response.text)]))
            contents.append(types.Content(role="user", parts=[types.Part.from_text(text=error_msg)]))
            print(f"Agent validation failed on attempt {attempt + 1}. Self-correcting...")
            
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            return ResidentChatResponse(
                success=False,
                status="error",
                reply="I'm having trouble connecting to the system right now.",
                error=str(e)
            )
            
    # If it fails 3 times, return safe failure
    return ResidentChatResponse(
        success=False,
        status="error",
        reply="I encountered a complex validation error. Please try rewording your request.",
        error="Max validation retries exceeded."
    )
