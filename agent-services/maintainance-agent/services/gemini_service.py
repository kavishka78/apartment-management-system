"""
Gemini service - generic module that communicates with the Google Gemini API.
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

_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY and genai else None

async def call_gemini(prompt: str, system_instruction: str, response_schema: dict) -> Any:
    """
    Send a prompt to Gemini and return a parsed dict/list.
    """
    if _client is None or types is None:
        raise EnvironmentError("Gemini client is unavailable.")

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type="application/json",
        response_schema=response_schema,
        temperature=0.1,
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

    raw_text = raw_text.strip()
    
    try:
        return json.loads(raw_text)
    except json.JSONDecodeError as exc:
        raise ValueError("Gemini returned invalid structured JSON.") from exc
