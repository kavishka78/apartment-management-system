from datetime import datetime
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from state import FacilityWorkflowState
from tools import check_facility_and_parking_availability
from dotenv import load_dotenv

load_dotenv()

# Initialize the LLM (Temperature = 0 for deterministic outputs)
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", temperature=0)

class PlanOutput(BaseModel):
    plan: list[str] = Field(description="A step by step list of internal actions needed to fulfill the integrated facility reservation and visitor parking request.")

class ExtractionOutput(BaseModel):
    is_inquiry: bool = Field(default=False, description="True if the user is asking an information/capacity query (e.g. 'How much capacity available...', 'Is gym open?'), False if requesting a booking/reservation.")
    facility: str = Field(description="Name of the facility requested (e.g., Clubhouse, Swimming Pool, Gym, Party Hall).")
    date: str = Field(description="The date requested, formatted as YYYY-MM-DD.")
    start_time: str = Field(default="16:00:00", description="Start time requested in HH:MM:SS format.")
    end_time: str = Field(default="20:00:00", description="End time requested in HH:MM:SS format.")
    guests: int = Field(default=1, description="Number of guests attending.")
    visitor_vehicles: int = Field(default=0, description="Number of visitor vehicles requiring parking allocation.")

# 1. Planner Agent
def planner_node(state: FacilityWorkflowState):
    print("AGENT 1 (Planner): Generating multi-step execution plan...")
    
    prompt = (
        f"You are an AI planner for an apartment management complex. "
        f"Create a high level 4 step internal execution plan for processing a resident request (booking or inquiry): '{state['objective']}'. "
        f"Steps should include entity extraction, backend availability verification for facility and parking, business rule validation, and human approval determination."
    )
    
    structured_llm = llm.with_structured_output(PlanOutput)
    result = structured_llm.invoke(prompt)
    
    state["plan"] = result.plan
    return state

# 2. Domain Analysis Agent
def domain_analysis_node(state: FacilityWorkflowState):
    print("AGENT 2 (Domain Analyzer): Extracting event details, dates, and vehicle counts...")
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    prompt = (
        f"Analyze this request: '{state['objective']}'. "
        f"Determine if it is an information/capacity inquiry (is_inquiry = True) or a booking request (is_inquiry = False). "
        f"Extract requested facility name, requested date (assume today is {today_str} if relative terms like 'today', 'tomorrow' are used), "
        f"start_time, end_time, guest count, and visitor vehicle count."
    )
    
    structured_llm = llm.with_structured_output(ExtractionOutput)
    result = structured_llm.invoke(prompt)
    
    state["extracted_data"] = result.model_dump()
    print(f"   -> Extracted Data: {state['extracted_data']}")
    return state

# 3. Action Agent (Controlled Tool Execution)
def action_node(state: FacilityWorkflowState):
    print("AGENT 3 (Action Agent): Calling allow listed tools for facility & parking checks...")
    data = state["extracted_data"]
    
    check_result = check_facility_and_parking_availability(
        facility_name=data["facility"],
        requested_date=data["date"],
        visitor_vehicles_count=data.get("visitor_vehicles", 0)
    )
    
    state["tool_results"] = {
        "facility_and_parking_check": check_result
    }
    return state

# 4. Validation & Safety Agent
def validation_node(state: FacilityWorkflowState):
    print("AGENT 4 (Validator): Applying strict deterministic business & security rules...")
    
    data = state["extracted_data"]
    guests = data.get("guests", 1)
    visitor_vehicles = data.get("visitor_vehicles", 0)
    check_res = state["tool_results"]["facility_and_parking_check"]
    
    if "error" in check_res:
        state["validation_status"] = f"Failed: {check_res['error']}"
        state["requires_approval"] = False
        return state

    capacity_remaining = check_res.get("capacityRemaining", 0)
    parking_available = check_res.get("parkingAvailable", True)
    total_available_parking = check_res.get("totalAvailableVisitorParking", 0)

    # Check if request is an Inquiry Question (NOT a booking)
    if data.get("is_inquiry", False):
        answer_text = f"Inquiry Answer: {check_res.get('facilityName')} has {capacity_remaining} spots available for {data.get('date')} with {total_available_parking} visitor parking slots available."
        state["validation_status"] = answer_text
        state["requires_approval"] = False
        state["final_proposal"] = {
            "isInquiry": True,
            "facilityName": check_res.get("facilityName"),
            "date": data.get("date"),
            "capacityRemaining": capacity_remaining,
            "totalAvailableVisitorParking": total_available_parking,
            "answer": answer_text,
            "status": "Inquiry Answered"
        }
        return state

    # Rule Check 1: Facility Capacity
    if capacity_remaining < guests:
        state["validation_status"] = f"Rejected: Facility capacity exceeded. Needed for {guests} guests, but only {capacity_remaining} spots available."
        state["requires_approval"] = False
        return state

    # Rule Check 2: Parking Slot Availability
    if not parking_available:
        state["validation_status"] = f"Rejected: Insufficient visitor parking. Needed {visitor_vehicles} slots, but only {total_available_parking} available."
        state["requires_approval"] = False
        return state

    # Rule Check 3: Deterministic High-Impact Threshold Trigger (High-Risk Policy)
    # Large events (>10 guests OR >2 visitor vehicles) MUST pause for Resident/Human Approval.
    is_high_impact = (guests > 10) or (visitor_vehicles > 2)

    if is_high_impact:
        state["validation_status"] = f"Valid Proposal Created - High Impact Event (>10 guests or >2 vehicles). Resident Approval Required."
        state["requires_approval"] = True
    else:
        state["validation_status"] = "Valid Proposal Created - Standard Event (Auto-Approved & Booked)."
        state["requires_approval"] = False

    state["final_proposal"] = {
        "isInquiry": False,
        "facilityId": check_res.get("facilityId"),
        "facilityName": check_res.get("facilityName"),
        "date": data.get("date"),
        "startTime": data.get("start_time", "16:00:00"),
        "endTime": data.get("end_time", "20:00:00"),
        "guests": guests,
        "visitorVehicles": visitor_vehicles,
        "assignedParkingSlots": check_res.get("availableSlotNumbers", []),
        "isHighImpact": is_high_impact,
        "status": "Awaiting Resident Approval" if is_high_impact else "Auto-Approved"
    }

    return state