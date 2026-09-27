import requests
import os
from dotenv import load_dotenv

load_dotenv()

BACKEND_API_URL = os.getenv("BACKEND_API_URL", "http://localhost:5073/api")

def get_facilities() -> list:
    """Fetch all active facilities directly from the backend PostgreSQL database."""
    try:
        response = requests.get(f"{BACKEND_API_URL}/facilities", verify=False)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching facilities from DB: {e}")
        return []

def get_parking_slots() -> list:
    """Fetch all parking slots directly from the backend PostgreSQL database."""
    try:
        response = requests.get(f"{BACKEND_API_URL}/parkingslots", verify=False)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching parking slots from DB: {e}")
        return []

def check_facility_and_parking_availability(facility_name: str, requested_date: str, visitor_vehicles_count: int = 0) -> dict:
    """
    Allow-listed tool to query database facility capacity and visitor parking slot availability.
    NO mock data used.
    """
    print(f"TOOL: Checking database for facility '{facility_name}' & {visitor_vehicles_count} parking slots for {requested_date}")
    
    try:
        facilities = get_facilities()
        available_names = [f.get("name") for f in facilities if f.get("name")]

        if not facilities:
            return {"error": "No facilities currently configured in database."}

        fname_lower = (facility_name or "").lower()

        # Find matching facility from DB records
        target_facility = None
        for f in facilities:
            db_name = f.get("name", "").lower()
            if db_name == fname_lower or fname_lower in db_name or db_name in fname_lower:
                target_facility = f
                break
            if any(k in fname_lower for k in ["clubhouse", "party", "hall", "banquet"]) and any(k in db_name for k in ["banquet", "party", "hall"]):
                target_facility = f
                break
            if any(k in fname_lower for k in ["gym", "fitness"]) and "fitness" in db_name:
                target_facility = f
                break
            if any(k in fname_lower for k in ["pool", "swimming"]) and "pool" in db_name:
                target_facility = f
                break
            if any(k in fname_lower for k in ["tennis", "squash", "court"]) and "tennis" in db_name:
                target_facility = f
                break

        if not target_facility:
            names_str = ", ".join([f"'{n}'" for n in available_names]) if available_names else "None"
            return {"error": f"Facility '{facility_name}' not found. Available facilities in your complex are: {names_str}."}

        facility_id = target_facility.get("id")
        total_capacity = target_facility.get("capacity", 0)
        
        # Get existing database bookings for this facility
        response = requests.get(
            f"{BACKEND_API_URL}/bookings/facility/{facility_id}",
            verify=False
        )
        
        existing_bookings = []
        if response.status_code == 200:
            existing_bookings = response.json()
            
        date_bookings = [
            b for b in existing_bookings 
            if b.get("bookingDate", "").startswith(requested_date) and b.get("status") != "Rejected"
        ]
        
        facility_capacity_remaining = max(0, total_capacity - len(date_bookings))

        # Check real Database Parking Slots
        parking_slots = get_parking_slots()
        visitor_slots = [
            s for s in parking_slots 
            if s.get("slotType") == "Visitor" or s.get("slotType") == "Unassigned" or s.get("isAvailable") == True
        ]
        available_parking_count = len(visitor_slots)
        
        return {
            "facilityId": facility_id,
            "facilityName": target_facility.get("name"),
            "totalCapacity": total_capacity,
            "existingBookingsCount": len(date_bookings),
            "capacityRemaining": facility_capacity_remaining,
            "openTime": target_facility.get("openTime"),
            "closeTime": target_facility.get("closeTime"),
            "totalAvailableVisitorParking": available_parking_count,
            "requestedVisitorVehicles": visitor_vehicles_count,
            "parkingAvailable": available_parking_count >= visitor_vehicles_count,
            "availableSlotNumbers": [s.get("slotNumber", f"Slot-{s.get('slotId')}") for s in visitor_slots[:visitor_vehicles_count]]
        }
    except Exception as e:
        return {"error": str(e)}