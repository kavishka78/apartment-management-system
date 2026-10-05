"""
Validation & Safety Agent: FastAPI entry point.

Endpoints:
  GET  /health            liveness check
  POST /safety/validate   validate a proposed action before it runs

Architecture:
  Other agents -> ASP.NET Core -> HERE (deterministic checks + injection scan) -> verdict
  The verdict is returned to ASP.NET, which logs it and enforces it.
"""

import os
import secrets
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException

import validator
from models import ProposedAction, SafetyVerdict

load_dotenv()
AGENT_SHARED_SECRET = os.getenv("AGENT_SHARED_SECRET", "")
APP_ENV = os.getenv("APP_ENV", "development").lower()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail closed: a production deployment must not accept unauthenticated requests.
    if APP_ENV == "production" and not AGENT_SHARED_SECRET:
        raise RuntimeError("AGENT_SHARED_SECRET must be set when APP_ENV=production.")
    yield


app = FastAPI(
    title="Validation & Safety Agent",
    description="Validates AI-proposed actions against tenant isolation, role permissions, spend limits and prompt-injection rules.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health", summary="Health check")
async def health():
    return {"status": "ok", "service": "Validation & Safety Agent"}


@app.post("/safety/validate", response_model=SafetyVerdict, summary="Validate a proposed action")
async def validate_action(proposal: ProposedAction, x_agent_key: str | None = Header(default=None)) -> SafetyVerdict:
    if AGENT_SHARED_SECRET and not (x_agent_key and secrets.compare_digest(x_agent_key, AGENT_SHARED_SECRET)):
        raise HTTPException(status_code=401, detail="Internal agent authentication failed.")
    return validator.validate(proposal)
