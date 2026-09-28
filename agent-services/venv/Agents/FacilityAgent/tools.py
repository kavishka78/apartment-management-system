import requests
import os
from datetime import datetime
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

def check_facility_and_parking_availability(
    facility_name: str,
    requested_date: str,
    visitor_vehicles_count: int = 0,
    start_time_str: str = "16:00:00",
    end_time_str: str = "20:00:00"
) -> dict:
    """
    Allow-listed tool to query database facility capacity and visitor parking slot availability.
    Applies strict business rule checks for active status, operating hours, and time slot overlaps.
    """
    print(f"TOOL: Checking database for facility '{facility_name}' & {visitor_vehicles_count} parking slots for {requested_date} ({start_time_str}-{end_time_str})")
    
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
        is_active = target_facility.get("isActive", True)
        deactivation_reason = target_facility.get("deactivationReason")
        open_time_str = target_facility.get("openTime", "00:00:00")
        close_time_str = target_facility.get("closeTime", "23:59:59")
        hourly_cost = target_facility.get("hourlyCost", 0.0)

        # 1. Active Check
        if not is_active:
            return {
                "isActive": False,
                "deactivationReason": deactivation_reason,
                "facilityName": target_facility.get("name"),
                "facilityId": facility_id
            }

        # Parse Times for Validation
        def parse_time(t_str):
            if not t_str:
                return datetime.strptime("00:00:00", "%H:%M:%S").time()
            parts = t_str.split(":")
            if len(parts) == 2:
                t_str = f"{t_str}:00"
            return datetime.strptime(t_str[:8], "%H:%M:%S").time()

        req_start = parse_time(start_time_str)
        req_end = parse_time(end_time_str)
        open_t = parse_time(open_time_str)
        close_t = parse_time(close_time_str)

        # 2. Operating Hours Check
        if req_end <= req_start or req_start < open_t or req_end > close_t:
            return {
                "isOutsideHours": True,
                "facilityName": target_facility.get("name"),
                "facilityId": facility_id,
                "openTime": open_time_str,
                "closeTime": close_time_str,
                "requestedStart": start_time_str,
                "requestedEnd": end_time_str
            }

        # 3. Past Date & Time Check
        try:
            req_datetime = datetime.strptime(f"{requested_date} {start_time_str[:5]}", "%Y-%m-%d %H:%M")
            if req_datetime < datetime.now():
                return {
                    "isPast": True,
                    "facilityName": target_facility.get("name"),
                    "facilityId": facility_id,
                    "requestedDate": requested_date,
                    "requestedTime": start_time_str
                }
        except Exception as dt_err:
            print(f"Date check error: {dt_err}")

        # Get existing database bookings for this facility
        response = requests.get(
            f"{BACKEND_API_URL}/bookings/facility/{facility_id}",
            verify=False
        )
        
        existing_bookings = []
        if response.status_code == 200:
            existing_bookings = response.json()
            
        # Filter bookings that OVERLAP with requested time slot on the requested date
        date_bookings = []
        for b in existing_bookings:
            if not b.get("bookingDate", "").startswith(requested_date) or b.get("status") == "Rejected":
                continue
            b_start = parse_time(b.get("startTime", "00:00:00"))
            b_end = parse_time(b.get("endTime", "23:59:59"))
            # Overlap condition: req_start < b_end AND req_end > b_start
            if req_start < b_end and req_end > b_start:
                date_bookings.append(b)
        
        total_booked_capacity = sum(
            (b.get("bookedCapacity") if (b.get("bookedCapacity") and b.get("bookedCapacity") > 0) else 1)
            for b in date_bookings
        )
        
        facility_capacity_remaining = max(0, total_capacity - total_booked_capacity)

        # Check real Database Parking Slots
        parking_slots = get_parking_slots()
        visitor_slots = [
            s for s in parking_slots 
            if s.get("slotType") == "Visitor" or s.get("slotType") == "Unassigned" or s.get("isAvailable") == True
        ]
        available_parking_count = len(visitor_slots)
        
        return {
            "isActive": True,
            "facilityId": facility_id,
            "facilityName": target_facility.get("name"),
            "totalCapacity": total_capacity,
            "existingBookingsCount": len(date_bookings),
            "capacityRemaining": facility_capacity_remaining,
            "openTime": open_time_str,
            "closeTime": close_time_str,
            "hourlyCost": hourly_cost,
            "totalAvailableVisitorParking": available_parking_count,
            "requestedVisitorVehicles": visitor_vehicles_count,
            "parkingAvailable": available_parking_count >= visitor_vehicles_count,
            "availableSlotNumbers": [s.get("slotNumber", f"Slot-{s.get('slotId')}") for s in visitor_slots[:visitor_vehicles_count]]
        }
    except Exception as e:
        return {"error": str(e)}