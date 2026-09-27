from fastapi import FastAPI
from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
import uuid

from state import FacilityWorkflowState
from agents import planner_node, domain_analysis_node, action_node, validation_node

# Wire the LangGraph Multi-Agent Architecture
workflow = StateGraph(FacilityWorkflowState)

workflow.add_node("planner", planner_node)
workflow.add_node("analyzer", domain_analysis_node)
workflow.add_node("action", action_node)
workflow.add_node("validator", validation_node)

workflow.set_entry_point("planner")
workflow.add_edge("planner", "analyzer")
workflow.add_edge("analyzer", "action")
workflow.add_edge("action", "validator")
workflow.add_edge("validator", END)

memory = MemorySaver()
app_graph = workflow.compile(checkpointer=memory)

# FastAPI Application
app = FastAPI(title="Facility & Parking Agent API", version="1.0.0")

class AgentRequest(BaseModel):
    objective: str
    resident_id: str = "1"
    resident_name: str = "Resident"

@app.post("/api/internal/agent/plan-facility")
@app.post("/api/internal/agent/plan-facility-parking")
async def plan_facility_parking(request: AgentRequest):
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    initial_state = FacilityWorkflowState(
        workflow_id=thread_id,
        resident_id=request.resident_id,
        resident_name=request.resident_name,
        objective=request.objective,
        plan=[],
        extracted_data={},
        tool_results={},
        validation_status="Pending",
        requires_approval=False,
        final_proposal=None
    )
    
    # Run the multi-agent graph streaming through each node
    for event in app_graph.stream(initial_state, config):
        pass

    current_state = app_graph.get_state(config).values
    
    validation_status = current_state.get("validation_status", "Completed")
    requires_approval = current_state.get("requires_approval", False)
    status_str = "Awaiting Manager Approval" if requires_approval else validation_status
    
    return {
        "workflow_id": thread_id,
        "objective": request.objective,
        "resident_id": request.resident_id,
        "resident_name": request.resident_name,
        "status": status_str,
        "requires_approval": requires_approval,
        "plan": current_state.get("plan", []),
        "extracted_data": current_state.get("extracted_data", {}),
        "tool_results": current_state.get("tool_results", {}),
        "validation_status": validation_status,
        "proposal": current_state.get("final_proposal")
    }

@app.get("/health")
async def health():
    return {"status": "ok", "service": "Facility & Parking Agentic AI"}