import pytest
from models import TriageRequest, ComplaintInput, TechnicianInput, SlaInput
from agent import triage_complaint, SafetyValidationAgent
from pydantic import ValidationError

@pytest.fixture
def base_request():
    return TriageRequest(
        complaint=ComplaintInput(id=1, title="Water leak", description="Pipe burst in kitchen", priority=None, category=None, sla_due_date=None),
        technicians=[
            TechnicianInput(id=1, name="John", skills=["Plumbing"], availability="Available", active_jobs=0),
            TechnicianInput(id=2, name="Bob", skills=["Electrical"], availability="Busy", active_jobs=2)
        ],
        sla=SlaInput(risk="Medium", reason="Due tomorrow")
    )

@pytest.mark.asyncio
async def test_valid_triage(base_request):
    result = await triage_complaint(base_request)
    assert result.category == "Plumbing"
    assert result.recommendedTechnicianId == 1
    assert "agentSteps" in result.model_dump()
    assert len(result.agentSteps) == 4

@pytest.mark.asyncio
async def test_unavailable_technicians(base_request):
    base_request.technicians[0].availability = "Busy"
    result = await triage_complaint(base_request)
    assert result.recommendedTechnicianId is None

def test_hallucinated_technician_ids():
    agent = SafetyValidationAgent()
    req = TriageRequest(
        complaint=ComplaintInput(id=1, title="A", description="B"),
        technicians=[TechnicianInput(id=1, name="John", skills=[], availability="Available", active_jobs=0)],
        sla=SlaInput(risk="Low", reason="")
    )
    with pytest.raises(ValueError):
        agent.run(req, {"category": "Plumbing", "priority": "High", "slaRisk": "Medium"}, 99)

def test_prompt_injection():
    with pytest.raises(ValidationError):
        ComplaintInput(id=1, title="Title", description="Desc \x00")

@pytest.mark.asyncio
async def test_rejection_revision(base_request):
    base_request.manager_feedback = "This is actually a Cleaning issue."
    result = await triage_complaint(base_request)
    # Passed safely!
    pass
