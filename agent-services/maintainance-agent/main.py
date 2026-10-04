"""
Maintenance Triage AI Agent — FastAPI application entry point.

Endpoints:
  GET  /health   — liveness check
  POST /triage   — analyze a complaint and return a recommendation

Architecture:
  React → ASP.NET Core → HERE → Gemini API → structured JSON
"""

import os
import secrets
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import TriageRequest, TriageResponse
from agent import triage_complaint

load_dotenv()
AI_PORT = int(os.getenv("AI_PORT", "8000"))
AGENT_SHARED_SECRET = os.getenv("AGENT_SHARED_SECRET", "")


# ─── Startup / shutdown ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=== Maintenance Triage AI Agent starting ===")
    print(f"  Gemini model : {os.getenv('GEMINI_MODEL', 'gemini-2.0-flash')}")
    print(f"  Port         : {AI_PORT}")
    print("  POST /triage  ready")
    yield
    print("=== Agent shutting down ===")


# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Maintenance Triage AI Agent",
    description=(
        "AI-powered maintenance triage for the Apartment Management System. "
        "Analyzes complaints and recommends technicians using Gemini. "
        "Advisory only — never assigns or modifies the database."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Allow ASP.NET Core backend (and local dev tools) to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5073", "http://localhost:5000", "http://localhost:8000"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health", summary="Health check")
async def health():
    """Returns OK when the agent is running."""
    return {
        "status": "ok",
        "service": "Maintenance Triage AI Agent",
        "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
    }


@app.post(
    "/triage",
    response_model=TriageResponse,
    summary="Triage a maintenance complaint",
    description=(
        "Receives complaint details, technician list, and SLA context from ASP.NET. "
        "Calls Gemini to produce a structured recommendation. "
        "Does NOT assign a technician or modify any database."
    ),
)
async def triage(request: TriageRequest, x_agent_key: str | None = Header(default=None)) -> TriageResponse:
    """
    Analyze a maintenance complaint and recommend a technician.

    The recommendation must be reviewed and approved by a Manager
    before the assignment is made in ASP.NET Core.
    """
    if AGENT_SHARED_SECRET and not (x_agent_key and secrets.compare_digest(x_agent_key, AGENT_SHARED_SECRET)):
        raise HTTPException(status_code=401, detail="Internal agent authentication failed.")

    try:
        recommendation = await triage_complaint(request)
        return TriageResponse(success=True, recommendation=recommendation)

    except EnvironmentError as e:
        # Missing API key — surface clearly
        raise HTTPException(status_code=503, detail=str(e))

    except Exception as e:
        # All other failures — return a structured error, don't crash
        return TriageResponse(success=False, error=str(e))

@app.get("/workflow/graph", summary="Get LangGraph Mermaid graph")
async def get_workflow_graph():
    """Returns the Mermaid representation of the orchestration graph."""
    from graph import build_graph
    try:
        app_graph = build_graph()
        mermaid = app_graph.get_graph().draw_mermaid()
        return {"mermaid": mermaid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
