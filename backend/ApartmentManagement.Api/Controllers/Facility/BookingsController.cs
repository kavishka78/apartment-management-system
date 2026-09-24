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

            // Check for Double Bookings
            var hasConflicts = await _context.FacilityBookings.AnyAsync(b =>
                b.FacilityId == dto.FacilityId &&
                b.BookingDate.Date == dto.BookingDate.Date &&
                b.Status != BookingStatus.Rejected &&
                ((dto.StartTime < b.EndTime) && (dto.EndTime > b.StartTime))
            );

            if(hasConflicts)
                return Conflict("The Facility is Already Booked for the Selected Time.");

            var booking = new FacilityBooking
            {
                FacilityId = dto.FacilityId,
                ResidentId = dto.ResidentId,
                BookingDate = dto.BookingDate.Date,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = BookingStatus.Pending
            };

            _context.FacilityBookings.Add(booking);
            await _context.SaveChangesAsync();

            return StatusCode(201, "Booking Request Submitted Successfully.");
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