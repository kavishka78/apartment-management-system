using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Data;

namespace ApartmentManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<BookingsController> _logger;

        public BookingsController(AppDbContext context, ILogger<BookingsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // Get Bookings (Filtered by ResidentId if provided)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookings([FromQuery] int? residentId)
        {
            try
            {
                var query = _context.FacilityBookings.AsQueryable();

                if (residentId.HasValue && residentId.Value > 0)
                {
                    query = query.Where(b => b.ResidentId == residentId.Value);
                }

                var bookings = await query
                    .Include(b => b.Facility)
                    .OrderByDescending(b => b.BookingDate)
                    .Select(b => new BookingResponseDto
                    {
                        Id = b.BookingId,
                        FacilityId = b.FacilityId,
                        FacilityName = b.Facility != null ? b.Facility.FacilityName : "Unknown",
                        ResidentId = b.ResidentId,
                        BookingDate = b.BookingDate,
                        StartTime = b.StartTime,
                        EndTime = b.EndTime,
                        BookedCapacity = b.BookedCapacity > 0 ? b.BookedCapacity : 1,
                        HourlyCost = b.Facility != null ? b.Facility.HourlyCost : 0,
                        TotalCost = b.TotalCost,
                        Status = b.Status.ToString()
                    }).ToListAsync();

                return Ok(bookings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetBookings");
                return StatusCode(500, new { Message = "An error occurred while retrieving bookings.", Details = ex.Message });
            }
        }

        // Get Bookings for a Specific Facility
        [HttpGet("facility/{facilityId}")]
        public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookingsForFacility(int facilityId)
        {
            try
            {
                var bookings = await _context.FacilityBookings
                    .Include(b => b.Facility)
                    .Where(b => b.FacilityId == facilityId && b.Status != BookingStatus.Rejected)
                    .OrderBy(b => b.BookingDate)
                    .ThenBy(b => b.StartTime)
                    .Select(b => new BookingResponseDto
                    {
                        Id = b.BookingId,
                        FacilityId = b.FacilityId,
                        FacilityName = b.Facility != null ? b.Facility.FacilityName : "Unknown",
                        ResidentId = b.ResidentId,
                        BookingDate = b.BookingDate,
                        StartTime = b.StartTime,
                        EndTime = b.EndTime,
                        BookedCapacity = b.BookedCapacity > 0 ? b.BookedCapacity : 1,
                        HourlyCost = b.Facility != null ? b.Facility.HourlyCost : 0,
                        TotalCost = b.TotalCost,
                        Status = b.Status.ToString()
                    }).ToListAsync();

                return Ok(bookings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetBookingsForFacility for FacilityId: {FacilityId}", facilityId);
                return StatusCode(500, new { Message = "An error occurred while retrieving bookings for the facility.", Details = ex.Message });
            }
        }


        // Create a Booking For A Facility
        [HttpPost]
        public async Task<ActionResult<BookingResponseDto>> CreateBooking(CreateBookingDto dto)
        {
            try
            {
                // Validate Facility Exist
                var facility = await _context.Facilities.FindAsync(dto.FacilityId);
                if (facility == null || !facility.IsActive)
                    return NotFound("Facility Not Found or InActive");

                // Validate Operating Hours
                if (dto.EndTime <= dto.StartTime)
                    return BadRequest("End time must be after the start time.");
                if (dto.StartTime < facility.OpenTime || dto.EndTime > facility.CloseTime)
                    return BadRequest("Booking Time is Outside Facility Operating Hours");

                // Ensure UTC DateTime for PostgreSQL Npgsql compatibility
                var bookingDateUtc = dto.BookingDate.Kind == DateTimeKind.Utc
                    ? dto.BookingDate.Date
                    : DateTime.SpecifyKind(dto.BookingDate.Date, DateTimeKind.Utc);

                // Validate Past Date & Time
                var bookingStartDateTime = bookingDateUtc.Add(dto.StartTime);
                if (bookingStartDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    return BadRequest("Cannot book a facility for a past date or time.");
                }

                // Check Capacity & Sum of Existing Booked Capacity for Overlapping Time Slot
                var overlappingBookings = await _context.FacilityBookings
                    .Where(b => b.FacilityId == dto.FacilityId &&
                                b.BookingDate.Date == bookingDateUtc &&
                                b.Status != BookingStatus.Rejected &&
                                ((dto.StartTime < b.EndTime) && (dto.EndTime > b.StartTime)))
                    .ToListAsync();

                int alreadyBookedCapacity = overlappingBookings.Sum(b => b.BookedCapacity > 0 ? b.BookedCapacity : 1);
                int requestedCapacity = dto.BookedCapacity > 0 ? dto.BookedCapacity : 1;
                int remainingCapacity = Math.Max(0, facility.Capacity - alreadyBookedCapacity);

                if (alreadyBookedCapacity + requestedCapacity > facility.Capacity)
                {
                    return Conflict($"Booking request for {requestedCapacity} {(requestedCapacity == 1 ? "spot" : "spots")} exceeds remaining facility capacity ({remainingCapacity} {(remainingCapacity == 1 ? "spot" : "spots")} available for this time slot).");
                }

                // Calculate Total Cost (Hours * HourlyCost * BookedCapacity)
                double hours = (dto.EndTime - dto.StartTime).TotalHours;
                decimal calculatedCost = dto.TotalCost > 0 
                    ? dto.TotalCost 
                    : (decimal)hours * facility.HourlyCost * requestedCapacity;

                // Validate Resident Exists or fallback to valid resident in DB
                var residentExists = await _context.Residents.AnyAsync(r => r.Id == dto.ResidentId);
                int validResidentId = dto.ResidentId;
                if (!residentExists)
                {
                    var firstResident = await _context.Residents.FirstOrDefaultAsync();
                    validResidentId = firstResident?.Id ?? 1;
                }

                // Auto-Confirm Booking
                var booking = new FacilityBooking
                {
                    FacilityId = dto.FacilityId,
                    ResidentId = validResidentId,
                    BookingDate = bookingDateUtc,
                    StartTime = dto.StartTime,
                    EndTime = dto.EndTime,
                    BookedCapacity = requestedCapacity,
                    TotalCost = Math.Round(calculatedCost, 2),
                    Status = BookingStatus.Approved
                };

                _context.FacilityBookings.Add(booking);
                await _context.SaveChangesAsync();

                return StatusCode(201, new { Message = "Booking confirmed! Spot reserved successfully.", BookingId = booking.BookingId, TotalCost = booking.TotalCost });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in CreateBooking for FacilityId: {FacilityId}, ResidentId: {ResidentId}", dto.FacilityId, dto.ResidentId);
                return StatusCode(500, new { Message = "An error occurred while processing your booking request.", Details = ex.Message });
            }
        }

        // Booking Approval
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            try
            {
                var booking = await _context.FacilityBookings.FindAsync(id);
                if (booking == null) return NotFound("Booking not found.");

                if (booking.Status != BookingStatus.Pending)
                    return BadRequest("Only Pending Bookings can be Approved");

                booking.Status = BookingStatus.Approved;
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Booking Approved Successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in ApproveBooking for BookingId: {BookingId}", id);
                return StatusCode(500, new { Message = "An error occurred while approving the booking.", Details = ex.Message });
            }
        }

        // Cancel / Delete Booking (Upcoming only)
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelBooking(int id)
        {
            try
            {
                var booking = await _context.FacilityBookings.FindAsync(id);
                if (booking == null) return NotFound("Booking not found.");

                // Validate past booking
                var bookingStartDateTime = booking.BookingDate.Date.Add(booking.StartTime);
                if (bookingStartDateTime < DateTime.UtcNow.AddMinutes(-5))
                {
                    return BadRequest("Past bookings cannot be cancelled.");
                }

                _context.FacilityBookings.Remove(booking);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Booking cancelled successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in CancelBooking for BookingId: {BookingId}", id);
                return StatusCode(500, new { Message = "An error occurred while cancelling the booking.", Details = ex.Message });
            }
        }
    }
}