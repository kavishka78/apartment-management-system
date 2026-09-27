from fastapi import FastAPI
from pydantic import BaseModel
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.memory import MemorySaver
import uuid

from state import FacilityWorkflowState
from agents import planner_node, domain_analysis_node, action_node, validation_node

# Wire the Graph
workflow = StateGraph(FacilityWorkflowState)

workflow.add_node("planner", planner_node)
workflow.add_node("analyzer", domain_analysis_node)
workflow.add_node("action", action_node)
workflow.add_node("validator", validation_node)

# Define the flow
workflow.set_entry_point("planner")
workflow.add_edge("planner", "analyzer")
workflow.add_edge("analyzer", "action")
workflow.add_edge("action", "validator")
workflow.add_edge("validator", END)

# MemorySaver persists the state so we can pause the workflow for human approval
memory = MemorySaver()
# interrupt_before=[END] pauses the graph before it finishes
# app_graph = workflow.compile(checkpointer=memory, interrupt_before=[END])
app_graph = workflow.compile(checkpointer=memory)

# 2. FastAPI Setup
app = FastAPI(title="Facility Agent API")

class AgentRequest(BaseModel):
    objective: str
    resident_id: str

@app.post("/api/internal/agent/plan-facility")
async def plan_facility_access(request: AgentRequest):
    # Generate a unique ID for this specific thread/conversation
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    
    initial_state = FacilityWorkflowState(
        workflow_id=thread_id,
        resident_id=request.resident_id,
        objective=request.objective,
        plan=[],
        extracted_data={},
        tool_results={},
        validation_status="Pending",
        requires_approval=False,
        final_proposal=None
    )
    
    # Run the graph until it hits the interrupt (pause)
    for event in app_graph.stream(initial_state, config):
        pass # The graph nodes print their own status

    # Fetch the paused state to send back to C#
    current_state = app_graph.get_state(config).values
    
    validation_status = current_state.get("validation_status", "Completed")
    requires_approval = current_state.get("requires_approval", False)
    
    status_str = "Awaiting Manager Approval" if requires_approval else validation_status
    
    return {
        "workflow_id": thread_id,
        "status": status_str,
        "requires_approval": requires_approval,
        "proposal": current_state.get("final_proposal"),
        "validation_status": validation_status
    }