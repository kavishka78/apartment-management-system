using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ApartmentManagement.Api.Models;
using ApartmentManagement.Api.DTOs;
using ApartmentManagement.APi.Data;


namespace ApartmentManagement.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class FacilitiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FacilitiesController(ApplicationDbContext context)
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
                    Id = f.Id,
                    Name = f.Name,
                    Description = f.Description,
                    Capacity = f.Capacity,
                    OpenTime = f.OpenTime,
                    CloseTime = f.CloseTime,
                    IsActive = f.IsActive
                }).ToListAsync();

                return Ok(facilities);
        }


        [HttpPost]
        public async Task<ActionResult<FacilityResponseDto>> CreateFacility (CreateFacilityDto dto)
        {
            var facility = new Facility
            {
                Name = dto.Name,
                Description = dto.Description,
                Capacity = dto.Capacity,
                OpenTime = dto.OpenTime,
                CloseTime = dto.CloseTime,
                IsActive = true
            };

            _context.Facilities.Add(facility);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFacilities), new {id = facility.id }, facility);
        }
    }

}