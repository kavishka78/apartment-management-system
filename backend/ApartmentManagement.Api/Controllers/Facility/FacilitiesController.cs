using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.Api.Data;


namespace ApartmentManagement.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class FacilitiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FacilitiesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FacilityResponseDto>>> GetFacilities()
        {
            var facilities = await _context.Facilities
                .Where(f => f.IsActive)
                .Select(f => new FacilityResponseDto
                {
                    Id = f.FacilityId,
                    Name = f.FacilityName,
                    Description = f.FacilityDescription,
                    Capacity = f.Capacity,
                    OpenTime = f.OpenTime,
                    CloseTime = f.CloseTime,
                    IsActive = f.IsActive
                }).ToListAsync();

                return Ok(facilities);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FacilityResponseDto>> GetFacility(int id)
        {
            var facility = await _context.Facilities
                .Where(f => f.IsActive && f.FacilityId == id)
                .Select(f => new FacilityResponseDto
                {
                    Id = f.FacilityId,
                    Name = f.FacilityName,
                    Description = f.FacilityDescription,
                    Capacity = f.Capacity,
                    OpenTime = f.OpenTime,
                    CloseTime = f.CloseTime,
                    IsActive = f.IsActive
                }).FirstOrDefaultAsync();

            if (facility == null)
                return NotFound("Facility not found.");

            return Ok(facility);
        }


        [HttpPost]
        public async Task<ActionResult<FacilityResponseDto>> CreateFacility (CreateFacilityDto dto)
        {
            var facility = new Facility
            {
                FacilityName = dto.Name,
                FacilityDescription = dto.Description,
                Capacity = dto.Capacity,
                OpenTime = dto.OpenTime,
                CloseTime = dto.CloseTime,
                IsActive = true
            };

            _context.Facilities.Add(facility);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFacility), new {id = facility.FacilityId }, facility);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFacility(int id, CreateFacilityDto dto)
        {
            var facility = await _context.Facilities.FindAsync(id);
            if (facility == null)
                return NotFound("Facility not found.");

            facility.FacilityName = dto.Name;
            facility.FacilityDescription = dto.Description;
            facility.Capacity = dto.Capacity;
            facility.OpenTime = dto.OpenTime;
            facility.CloseTime = dto.CloseTime;

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

}