"""
Gemini service” the ONLY module that communicates with the Google Gemini API.

Uses the official google-genai SDK with:
  - Structured JSON output (response_mime_type + response_schema)
  - Async client (client.aio)
  - System instruction for strict role enforcement
"""

import os
import json
from typing import Any, Dict
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv() -> bool:
        return False

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# One shared client the async sub-client is accessed via client.aio
_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY and genai else None

# JSON schema
_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "category": {
            "type": "string",
            "enum": ["Plumbing", "Electrical", "HVAC", "Cleaning", "Security", "Elevator", "Building", "General"],
            "description": "Maintenance category that best matches the complaint."
        },
        "priority": {
            "type": "string",
            "enum": ["Low", "Medium", "High", "Urgent"],
            "description": "Urgency level of this maintenance request."
        },
        "reason": {
            "type": "string",
            "description": "Brief explanation of why this category and priority were chosen."
        },
        "recommendedTechnicianId": {
            "type": "integer",
            "nullable": True,
            "description": "ID of the most suitable technician, or null if none qualifies."
        },
        "technicianReason": {
            "type": "string",
            "description": "Why this technician was chosen, or why no technician was found."
        },
        "slaRisk": {
            "type": "string",
            "enum": ["Low", "Medium", "High"],
            "description": "SLA risk level based on the deadline information provided."
        },
        "slaReason": {
            "type": "string",
            "description": "Brief explanation of the SLA risk assessment."
        }
    },
    "required": [
        "category", "priority", "reason",
        "recommendedTechnicianId", "technicianReason",
        "slaRisk", "slaReason"
    ]
}

_SYSTEM_INSTRUCTION = """You are the Maintenance Triage & Assignment Agent for an apartment management system.

Analyze the supplied maintenance complaint and return a structured recommendation.

Determine:
- the most appropriate maintenance category
- urgency/priority
- a suitable technician
- SLA risk

Rules:
- Use ONLY the allowed categories: Plumbing, Electrical, HVAC, Cleaning, Security, Elevator, Building, General
- Use ONLY the allowed priorities: Low, Medium, High, Urgent
- Use ONLY the allowed SLA risk values: Low, Medium, High
- Use ONLY technicians supplied in the request â€” NEVER invent technician IDs
- Prefer technicians whose skills match the complaint category
- Prefer available technicians (availability = "Available")
- Consider active workload â€” prefer technicians with fewer active jobs
- If no technician qualifies, set recommendedTechnicianId to null
- This is a recommendation ONLY â€” do NOT assign the technician
- Do NOT modify any database or take any action
- Return strictly valid JSON. ALL property names MUST be enclosed in double quotes ("). Do not use single quotes."""


async def call_gemini(prompt: str) -> Dict[str, Any]:
    """
    Send a prompt to Gemini and return a parsed dict.
    Uses structured JSON output so no regex parsing is needed.

    Raises:
        Exception: on API failure, timeout, or invalid response structure.
    """
    if _client is None or types is None:
        raise EnvironmentError("Gemini client is unavailable; install requirements and set GEMINI_API_KEY.")

    config = types.GenerateContentConfig(
        system_instruction=_SYSTEM_INSTRUCTION,
        response_mime_type="application/json",
        response_schema=_RESPONSE_SCHEMA,
        temperature=0.1,       # low temperature â†’ deterministic, structured output
        max_output_tokens=2048,
    )

    response = await _client.aio.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=config,
    )

    raw_text = response.text
    if not raw_text:
        raise ValueError("Gemini returned an empty response.")

    
    # Strip markdown if present
    raw_text = raw_text.strip()
    if raw_text.startswith("```json"):
        raw_text = raw_text[7:]
    if raw_text.endswith("```"):
        raw_text = raw_text[:-3]
    raw_text = raw_text.strip()

    try:
        return json.loads(raw_text)
    except json.JSONDecodeError:
        # Fallback for single quotes or malformed JSON
        import ast
        try:
            return ast.literal_eval(raw_text)
        except Exception:
            # Last resort regex cleanup
            import re
            cleaned = re.sub(r"([{,]\s*)([a-zA-Z0-9_]+)(\s*:)", r'\1"\2"\3', raw_text)
            return json.loads(cleaned)




