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

def get_parking_slots() -> list:
    """Fetch all parking slots from backend API."""
    try:
        response = requests.get(f"{BACKEND_API_URL}/parkingslots", verify=False)
        if response.status_code == 200:
            return response.json()
        return []
    except Exception as e:
        print(f"Error fetching parking slots: {e}")
        return []

def check_facility_and_parking_availability(facility_name: str, requested_date: str, visitor_vehicles_count: int = 0) -> dict:
    """
    Allow-listed tool to check both facility existence/capacity and visitor parking slot availability.
    """
    print(f"TOOL: Checking facility '{facility_name}' & {visitor_vehicles_count} parking slots for {requested_date}")
    
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
        
        facility_capacity_remaining = max(0, total_capacity - len(date_bookings))

        # 3. Check Parking Slots Availability
        parking_slots = get_parking_slots()
        visitor_slots = [
            s for s in parking_slots 
            if s.get("slotType") == "Visitor" or s.get("slotType") == "Unassigned" or s.get("isOccupied") == False
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
            "availableSlotNumbers": [s.get("slotNumber") for s in visitor_slots[:visitor_vehicles_count]]
        }
    except Exception as e:
        return {"error": str(e)}