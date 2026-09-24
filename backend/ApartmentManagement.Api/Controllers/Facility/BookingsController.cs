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

        public BookingsController(AppDbContext context)
        {
            _context = context;
        }

        // Get All Bookings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookings()
        {
            var bookings = await _context.FacilityBookings
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
                    Status = b.Status.ToString()
                }).ToListAsync();

            return Ok(bookings);
        }

        // Create a Booking For A Facility
        [HttpPost]
        public async Task<ActionResult<BookingResponseDto>> CreateBooking(CreateBookingDto dto)
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

            // Check Capacity & Existing Bookings Count
            var activeBookingsCount = await _context.FacilityBookings.CountAsync(b =>
                b.FacilityId == dto.FacilityId &&
                b.BookingDate.Date == bookingDateUtc &&
                b.Status != BookingStatus.Rejected &&
                ((dto.StartTime < b.EndTime) && (dto.EndTime > b.StartTime))
            );

            if (activeBookingsCount >= facility.Capacity)
            {
                return Conflict($"Facility capacity limit reached ({activeBookingsCount}/{facility.Capacity} spots taken) for the selected time slot.");
            }

            // Auto-Confirm Booking
            var booking = new FacilityBooking
            {
                FacilityId = dto.FacilityId,
                ResidentId = dto.ResidentId,
                BookingDate = bookingDateUtc,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = BookingStatus.Approved
            };

            _context.FacilityBookings.Add(booking);
            await _context.SaveChangesAsync();

            return StatusCode(201, new { Message = "Booking confirmed! Spot reserved successfully.", BookingId = booking.BookingId });
        }


        // Booking Approval
        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveBooking(int id)
        {
            var booking = await _context.FacilityBookings.FindAsync(id);
            if (booking == null) return NotFound();

            if(booking.Status != BookingStatus.Pending)
                return BadRequest("Only Pending Bookings can be Approved");

            booking.Status = BookingStatus.Approved;
            await _context.SaveChangesAsync();

            return Ok(new {Message = "Booking Approved Succesfully "});
        }

    }
}