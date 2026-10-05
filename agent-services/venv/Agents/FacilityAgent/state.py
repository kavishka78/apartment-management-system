from typing import TypedDict, List, Optional, Dict, Any

class FacilityWorkflowState(TypedDict):
    workflow_id: str
    resident_id: str
    resident_name: Optional[str]
    objective: str
    plan: List[str]
    extracted_data: Dict[str, Any]
    tool_results: Dict[str, Any]
    validation_status: str
    requires_approval: bool
    final_proposal: Optional[Dict[str, Any]]