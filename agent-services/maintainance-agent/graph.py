"""LangGraph routing for the controlled maintenance triage workflow."""
from __future__ import annotations

import operator
from typing import Annotated, Any, Dict, List, Optional

from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field

from agent import ComplaintAnalysisAgent, PlanningAgent, SafetyValidationAgent, TechnicianSelectionAgent, _step
from models import AgentStep, TriageRequest


class TriageState(BaseModel):
    request: TriageRequest
    plan: List[str] = Field(default_factory=list)
    delegation_order: List[str] = Field(default_factory=list)
    next_delegation_index: int = 0
    analysis: Dict[str, Any] = Field(default_factory=dict)
    candidates: List[Dict[str, Any]] = Field(default_factory=list)
    recommendation_id: Optional[int] = None
    technician_reason: str = ""
    validation_result: str = ""
    sla_tool_result: Dict[str, str] = Field(default_factory=dict)
    model_retries: int = 0
    errors: Annotated[List[str], operator.add] = Field(default_factory=list)
    agent_steps: Annotated[List[AgentStep], operator.add] = Field(default_factory=list)
    is_safe_failure: bool = False


async def node_plan(state: TriageState) -> dict:
    plan, order, step, error, retries = await PlanningAgent().run(state.request)
    return {"plan": plan, "delegation_order": order, "agent_steps": [step], "errors": [f"PlanningAgent:{error}"] if error else [], "model_retries": retries}


async def node_analyze(state: TriageState) -> dict:
    analysis, step, error, retries, sla_tool_result = await ComplaintAnalysisAgent().run(state.request)
    return {"analysis": analysis, "sla_tool_result": sla_tool_result, "agent_steps": [step], "errors": [f"ComplaintAnalysisAgent:{error}"] if error else [], "model_retries": state.model_retries + retries, "next_delegation_index": state.next_delegation_index + 1}


async def node_select(state: TriageState) -> dict:
    recommendation_id, reason, step, candidates = TechnicianSelectionAgent().run(state.request, state.analysis.get("category", "General"))
    return {"recommendation_id": recommendation_id, "technician_reason": reason, "candidates": candidates, "agent_steps": [step], "next_delegation_index": state.next_delegation_index + 1}


async def node_validate(state: TriageState) -> dict:
    try:
        step = SafetyValidationAgent().run(state.request, state.analysis, state.recommendation_id)
        return {"validation_result": step.validationResult, "agent_steps": [step], "next_delegation_index": state.next_delegation_index + 1}
    except ValueError as exc:
        return {"is_safe_failure": True, "errors": [f"SafetyValidationAgent:{type(exc).__name__}"], "next_delegation_index": state.next_delegation_index + 1}


async def node_safe_failure(state: TriageState) -> dict:
    step = _step(4, "SafetyValidationAgent", "Validate schema and business rules", status="Blocked", validation="Failed; unsafe recommendation was not actioned.")
    safe_analysis = {**state.analysis, "category": "General", "priority": "Medium", "slaRisk": "Medium"}
    return {"recommendation_id": None, "technician_reason": "Recommendation blocked by deterministic safety validation.", "validation_result": step.validationResult, "agent_steps": [step], "analysis": safe_analysis}


async def node_await_approval(_: TriageState) -> dict:
    return {}


def route_next_delegation(state: TriageState) -> str:
    if state.next_delegation_index >= len(state.delegation_order):
        return "await_approval"
    role = state.delegation_order[state.next_delegation_index]
    return {"ComplaintAnalysisAgent": "analyst", "TechnicianSelectionAgent": "selector", "SafetyValidationAgent": "validator"}.get(role, "safe_failure")


def route_validation(state: TriageState) -> str:
    return "safe_failure" if state.is_safe_failure else route_next_delegation(state)


def build_graph() -> StateGraph:
    builder = StateGraph(TriageState)
    builder.add_node("planner", node_plan)
    builder.add_node("analyst", node_analyze)
    builder.add_node("selector", node_select)
    builder.add_node("validator", node_validate)
    builder.add_node("safe_failure", node_safe_failure)
    builder.add_node("await_approval", node_await_approval)
    builder.set_entry_point("planner")
    builder.add_conditional_edges("planner", route_next_delegation)
    builder.add_conditional_edges("analyst", route_next_delegation)
    builder.add_conditional_edges("selector", route_next_delegation)
    builder.add_conditional_edges("validator", route_validation)
    builder.add_edge("safe_failure", END)
    builder.add_edge("await_approval", END)
    return builder.compile()

if __name__ == "__main__":
    print("Generating flowchart...")
    app = build_graph()
    
    img = app.get_graph().draw_mermaid_png()
    with open("maintenance_graph.png", "wb") as f:
        f.write(img)
        
    print("Success! Saved as maintenance_graph.png")
