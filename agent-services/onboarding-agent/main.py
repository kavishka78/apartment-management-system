"""
Resident Onboarding Assistant: FastAPI entry point.

Endpoints:
  GET  /health              liveness check
  POST /onboarding/draft    turn pasted text into a resident draft with issues

Architecture:
  Manager (React) -> ASP.NET Core -> HERE -> draft + issues -> manager reviews -> existing onboard endpoint
The agent never writes to the database. A manager confirms every resident.
"""

import os
import secrets
import uuid
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException

import extraction
import validation
from models import OnboardingDraftResponse, OnboardingRequest

load_dotenv()
AGENT_SHARED_SECRET = os.getenv("AGENT_SHARED_SECRET", "")
APP_ENV = os.getenv("APP_ENV", "development").lower()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if APP_ENV == "production" and not AGENT_SHARED_SECRET:
        raise RuntimeError("AGENT_SHARED_SECRET must be set when APP_ENV=production.")
    yield


app = FastAPI(
    title="Resident Onboarding Assistant",
    description="Reads pasted resident details with an LLM, checks them against the complex's records, and returns a draft for manager review.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "service": "Resident Onboarding Assistant", "llm_configured": bool(os.getenv("GEMINI_API_KEY"))}


@app.post("/onboarding/draft", response_model=OnboardingDraftResponse, summary="Draft a resident from text")
async def draft(req: OnboardingRequest, x_agent_key: str | None = Header(default=None)) -> OnboardingDraftResponse:
    if AGENT_SHARED_SECRET and not (x_agent_key and secrets.compare_digest(x_agent_key, AGENT_SHARED_SECRET)):
        raise HTTPException(status_code=401, detail="Internal agent authentication failed.")

    resident_draft, extracted_by = await extraction.extract(req.text)
    issues = validation.validate(resident_draft, req)
    return OnboardingDraftResponse(
        draft=resident_draft,
        issues=issues,
        ready=not any(i.severity == "error" for i in issues),
        extractedBy=extracted_by,
    )
