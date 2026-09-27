import requests
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5073/api")

def get_facilities() -> list:
    """Fetch all active facilities from backend API."""
    try:
        response = requests.get(f"{BACKEND_API_URL}/facilities", verify=False)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching facilities: {e}")
        return []

def check_facility_availability(facility_name: str, requested_date: str) -> dict:
    """Allow-listed tool to check if a facility exists and calculate availability/capacity."""
    print(f"TOOL: Checking '{facility_name}' availability for {requested_date}")
    
    try:
        # 1. Fetch facilities list to resolve facility name, capacity, and ID
        facilities = get_facilities()
        target_facility = next(
            (f for f in facilities if f.get("name", "").lower() == facility_name.lower() or facility_name.lower() in f.get("name", "").lower()),
            None
        )
        
        if not target_facility:
            return {"error": f"Facility '{facility_name}' not found."}
        
        facility_id = target_facility.get("id")
        total_capacity = target_facility.get("capacity", 0)
        
        # 2. Get existing bookings for this facility
        response = requests.get(
            f"{BACKEND_API_URL}/bookings/facility/{facility_id}",
            verify=False
        )
        
        existing_bookings = []
        if response.status_code == 200:
            existing_bookings = response.json()
            
        # Filter bookings for the requested date where status is not Rejected
        date_bookings = [
            b for b in existing_bookings 
            if b.get("bookingDate", "").startswith(requested_date) and b.get("status") != "Rejected"
        ]
        
        return {
            "facilityId": facility_id,
            "facilityName": target_facility.get("name"),
            "totalCapacity": total_capacity,
            "existingBookingsCount": len(date_bookings),
            "capacityRemaining": max(0, total_capacity - len(date_bookings)),
            "openTime": target_facility.get("openTime"),
            "closeTime": target_facility.get("closeTime")
        }
    except Exception as e:
        return {"error": str(e)}