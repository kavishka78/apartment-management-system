from datetime import datetime
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from state import FacilityWorkflowState
from tools import check_facility_availability
from dotenv import load_dotenv

load_dotenv()

# Initialize the LLM Temperature = 0 
#llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash-lite", temperature=0)


class PlanOutput(BaseModel):
    plan: list[str] = Field(description="A step-by-step list of internal actions needed to fulfill the request.")

class ExtractionOutput(BaseModel):
    facility: str = Field(description="Name of the facility requested (e.g., Clubhouse, Pool, Gym).")
    date: str = Field(description="The date requested, formatted as YYYY-MM-DD.")
    guests: int = Field(description="Number of guests attending. Default is 1.")


# Planner Agent

def planner_node(state: FacilityWorkflowState):
    print("AGENT 1 (Planner): Asking LLM to create a plan...")
    
    prompt = (
        f"You are an AI planner for an apartment complex. "
        f"Create a high-level internal plan to process this resident request: '{state['objective']}'. "
        f"The plan should include extracting requirements, checking facility databases, and validating rules."
    )
    
    structured_llm = llm.with_structured_output(PlanOutput)
    result = structured_llm.invoke(prompt)
    
    state["plan"] = result.plan
    return state


# Domain Analysis Agent

def domain_analysis_node(state: FacilityWorkflowState):
    print("AGENT 2 (Analyzer): Asking LLM to extract dates and entities...")
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    prompt = (
        f"Extract the specific facility name, requested date, and guest count "
        f"from this user request: '{state['objective']}'. "
        f"Assume today is {today_str} if relative dates (like 'tomorrow' or 'next Friday') are used."
    )
    
    structured_llm = llm.with_structured_output(ExtractionOutput)
    result = structured_llm.invoke(prompt)
    
    state["extracted_data"] = result.model_dump()
    print(f"   -> Extracted: {state['extracted_data']}")
    return state


# 3. Action / Tool Agent

def action_node(state: FacilityWorkflowState):
    print("AGENT 3 (Action): Executing C# APIs with LLM data...")
    data = state["extracted_data"]
    
    # Safely execute the allow-listed tool[cite: 2]
    facility_result = check_facility_availability(data["facility"], data["date"])
    
    state["tool_results"] = {
        "facility_check": facility_result
    }
    return state


# 4. Validation  Agent

def validation_node(state: FacilityWorkflowState):
    print("AGENT 4 (Validator): Applying strict business rules...")
    
    guests = state["extracted_data"].get("guests", 1)
    facility_response = state["tool_results"]["facility_check"]
    
    # Handle API errors 
    if "error" in facility_response:
        state["validation_status"] = "Failed: Facility API Error"
        state["requires_approval"] = False
        return state

    capacity_remaining = facility_response.get("capacityRemaining", 0)

    # Deterministic Business Logic Rule
    if capacity_remaining < guests:
        state["validation_status"] = f"Rejected: Need space for {guests}, but only {capacity_remaining} available."
        state["requires_approval"] = False
    else:
        state["validation_status"] = "Valid Proposal Created"
        state["requires_approval"] = True # Pause high-impact action for human approval
        state["final_proposal"] = {
            "facility": state["extracted_data"]["facility"],
            "date": state["extracted_data"]["date"],
            "guests": guests,
            "status": "Awaiting Manager Approval"
        }
        
    return state