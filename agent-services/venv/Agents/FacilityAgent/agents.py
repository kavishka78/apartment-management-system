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
    is_cancellation: bool = Field(default=False, description="True if the prompt is asking to CANCEL, MODIFY, REMOVE, or DELETE an existing booking/reservation (e.g., 'Cancel my booking', 'Delete reservation', 'Cancel tennis court').")
    is_general_query: bool = Field(default=False, description="True if the prompt is a general greeting, greeting question, or out-of-scope question (e.g., 'Hi', 'Hello', 'How are you?', 'Who built this?', 'What is the weather?').")
    is_inquiry: bool = Field(default=False, description="True if the user is asking a facility/parking capacity query (e.g. 'How much capacity available...', 'Is gym open?'), False if requesting a NEW booking/reservation.")
    facility: str = Field(default="Clubhouse", description="Name of the facility requested (e.g., Clubhouse, Swimming Pool, Gym, Party Hall, Tennis & Squash Court).")
    date: str = Field(default="", description="The date requested, formatted as YYYY-MM-DD.")
    start_time: str = Field(default="16:00:00", description="Start time requested in HH:MM:SS format.")
    end_time: str = Field(default="20:00:00", description="End time requested in HH:MM:SS format.")
    guests: int = Field(default=1, description="Number of guests attending.")
    visitor_vehicles: int = Field(default=0, description="Number of visitor vehicles requiring parking allocation.")

# 1. Planner Agent
def planner_node(state: FacilityWorkflowState):
    print("AGENT 1 (Planner): Generating multi-step execution plan...")
    
    prompt = (
        f"You are an AI planner for an apartment management complex. "
        f"Create a high level 4 step internal execution plan for processing a resident request (booking, cancellation request, inquiry, or greeting): '{state['objective']}'. "
        f"Steps should include intent classification, availability verification if applicable, business rule validation, and response generation."
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
        f"1. Determine if it is asking to CANCEL, MODIFY, REMOVE, or DELETE an existing booking (is_cancellation = True).\n"
        f"2. Determine if it is a general greeting/casual query like 'Hi', 'How are you', 'Hello' (is_general_query = True).\n"
        f"3. If not cancellation or greeting, determine if it is an information/capacity inquiry (is_inquiry = True) or a NEW booking reservation (is_inquiry = False).\n"
        f"4. Extract requested facility name (Clubhouse, Swimming Pool, Gym, Party Hall, Tennis & Squash Court), requested date (assume today is {today_str} if relative terms like 'today', 'tomorrow' are used), "
        f"start_time, end_time, guest count, and visitor vehicle count."
    )
    
    structured_llm = llm.with_structured_output(ExtractionOutput)
    result = structured_llm.invoke(prompt)
    
    extracted = result.model_dump()
    if not extracted.get("date"):
        extracted["date"] = today_str

    state["extracted_data"] = extracted
    print(f"   -> Extracted Data: {state['extracted_data']}")
    return state

# 3. Action Agent (Controlled Tool Execution)
def action_node(state: FacilityWorkflowState):
    print("AGENT 3 (Action Agent): Calling allow listed tools for facility & parking checks...")
    data = state["extracted_data"]
    
    if data.get("is_general_query", False) or data.get("is_cancellation", False):
        print("   -> General query or cancellation request detected. Skipping database availability tool call.")
        state["tool_results"] = {
            "facility_and_parking_check": {"is_general_query": True}
        }
        return state

    check_result = check_facility_and_parking_availability(
        facility_name=data.get("facility", "Clubhouse"),
        requested_date=data.get("date", datetime.now().strftime("%Y-%m-%d")),
        visitor_vehicles_count=data.get("visitor_vehicles", 0),
        start_time_str=data.get("start_time", "16:00:00"),
        end_time_str=data.get("end_time", "20:00:00")
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

    # Check 0.1: Cancellation / Modification Request
    if data.get("is_cancellation", False):
        facility_name = data.get("facility", "facility")
        answer_text = (
            f"Cancellation Guidance: To cancel or modify your existing booking for {facility_name}, "
            "please navigate to the 'My Facilities / Bookings' tab in your app or contact building management directly. "
            "The AI Assistant currently specializes in checking real-time availability and creating new reservations."
        )
        state["validation_status"] = answer_text
        state["requires_approval"] = False
        state["final_proposal"] = {
            "isInquiry": True,
            "isCancellation": True,
            "answer": answer_text,
            "status": "InquiryAnswered"
        }
        return state

    # Check 0.2: General Conversational Greeting or Out-of-Scope Query
    if data.get("is_general_query", False):
        answer_text = (
            "Hello! I am your Resident AI Assistant for Facility Bookings & Visitor Parking. "
            "I can help you check facility availability, reserve amenities (Gym, Swimming Pool, Clubhouse, Party Hall), "
            "or allocate visitor parking passes. How can I assist you with your facility needs today?"
        )
        state["validation_status"] = answer_text
        state["requires_approval"] = False
        state["final_proposal"] = {
            "isInquiry": True,
            "isGeneralQuery": True,
            "answer": answer_text,
            "status": "InquiryAnswered"
        }
        return state
    
    if "error" in check_res:
        state["validation_status"] = f"Failed: {check_res['error']}"
        state["requires_approval"] = False
        return state

    # Rule Check 0.3: Active Facility Status Check
    if check_res.get("isActive") == False:
        reason = check_res.get("deactivationReason") or "Facility is currently closed for maintenance."
        state["validation_status"] = f"Rejected: Facility '{check_res.get('facilityName')}' is currently closed or inactive. Reason: {reason}"
        state["requires_approval"] = False
        return state

    # Rule Check 0.4: Past Date / Time Check
    if check_res.get("isPast"):
        state["validation_status"] = f"Rejected: Cannot book for a past date or time ({check_res.get('requestedDate')} at {check_res.get('requestedTime')[:5]})."
        state["requires_approval"] = False
        return state

    # Rule Check 0.5: Facility Operating Hours Check
    if check_res.get("isOutsideHours"):
        open_t = str(check_res.get("openTime", ""))[:5]
        close_t = str(check_res.get("closeTime", ""))[:5]
        req_s = str(check_res.get("requestedStart", ""))[:5]
        req_e = str(check_res.get("requestedEnd", ""))[:5]
        state["validation_status"] = f"Rejected: Requested time ({req_s} - {req_e}) is outside operating hours ({open_t} - {close_t}) for {check_res.get('facilityName')}."
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
            "status": "InquiryAnswered"
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

    # Calculate Total Estimated Cost
    hourly_cost = check_res.get("hourlyCost", 0.0) or 0.0
    start_t_str = data.get("start_time", "16:00:00")
    end_t_str = data.get("end_time", "20:00:00")
    
    def get_hours(s_str, e_str):
        try:
            s_fmt = "%H:%M:%S" if len(s_str.split(":")) == 3 else "%H:%M"
            e_fmt = "%H:%M:%S" if len(e_str.split(":")) == 3 else "%H:%M"
            s_dt = datetime.strptime(s_str[:8], s_fmt)
            e_dt = datetime.strptime(e_str[:8], e_fmt)
            return max(0.5, (e_dt - s_dt).total_seconds() / 3600.0)
        except Exception:
            return 1.0

    duration_hours = get_hours(start_t_str, end_t_str)
    estimated_total_cost = round(duration_hours * hourly_cost * guests, 2)

    # Rule Check 3: Deterministic High-Impact Threshold Trigger (High-Risk Policy)
    # Events (>10 guests OR >2 visitor vehicles OR total cost > 3000 LKR) MUST pause for Resident/Human Approval.
    is_high_impact = (guests > 10) or (visitor_vehicles > 2) or (estimated_total_cost > 3000)

    if is_high_impact:
        reasons = []
        if guests > 10:
            reasons.append(">10 guests")
        if visitor_vehicles > 2:
            reasons.append(">2 visitor vehicles")
        if estimated_total_cost > 3000:
            reasons.append(f"cost exceeds 3000 LKR (Total: LKR {estimated_total_cost:.2f})")
        reason_str = ", ".join(reasons)

        state["validation_status"] = f"Valid Proposal Created - High Impact Event ({reason_str}). Resident Approval Required."
        state["requires_approval"] = True
    else:
        state["validation_status"] = "Valid Proposal Created - Standard Event (Auto-Approved & Booked)."
        state["requires_approval"] = False

    state["final_proposal"] = {
        "isInquiry": False,
        "facilityId": check_res.get("facilityId"),
        "facilityName": check_res.get("facilityName"),
        "date": data.get("date"),
        "startTime": start_t_str,
        "endTime": end_t_str,
        "guests": guests,
        "visitorVehicles": visitor_vehicles,
        "estimatedTotalCost": estimated_total_cost,
        "assignedParkingSlots": check_res.get("availableSlotNumbers", []),
        "isHighImpact": is_high_impact,
        "status": "Awaiting Resident Approval" if is_high_impact else "Auto-Approved"
    }

    return state