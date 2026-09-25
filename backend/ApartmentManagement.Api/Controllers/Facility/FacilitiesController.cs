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
        private readonly ILogger<FacilitiesController> _logger;

        public FacilitiesController(AppDbContext context, ILogger<FacilitiesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FacilityResponseDto>>> GetFacilities([FromQuery] bool includeInactive = true)
        {
            try
            {
                var query = _context.Facilities.AsQueryable();
                if (!includeInactive)
                {
                    query = query.Where(f => f.IsActive);
                }

                var facilities = await query
                    .Select(f => new FacilityResponseDto
                    {
                        Id = f.FacilityId,
                        Name = f.FacilityName,
                        Description = f.FacilityDescription,
                        Capacity = f.Capacity,
                        OpenTime = f.OpenTime,
                        CloseTime = f.CloseTime,
                        IsActive = f.IsActive,
                        DeactivationReason = f.DeactivationReason
                    }).ToListAsync();

                return Ok(facilities);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetFacilities");
                return StatusCode(500, new { Message = "An error occurred while fetching facilities.", Details = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FacilityResponseDto>> GetFacility(int id)
        {
            try
            {
                var facility = await _context.Facilities
                    .Where(f => f.FacilityId == id)
                    .Select(f => new FacilityResponseDto
                    {
                        Id = f.FacilityId,
                        Name = f.FacilityName,
                        Description = f.FacilityDescription,
                        Capacity = f.Capacity,
                        OpenTime = f.OpenTime,
                        CloseTime = f.CloseTime,
                        IsActive = f.IsActive,
                        DeactivationReason = f.DeactivationReason
                    }).FirstOrDefaultAsync();

                if (facility == null)
                    return NotFound("Facility not found.");

                return Ok(facility);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in GetFacility with Id: {FacilityId}", id);
                return StatusCode(500, new { Message = "An error occurred while fetching the facility.", Details = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<FacilityResponseDto>> CreateFacility(CreateFacilityDto dto)
        {
            try
            {
                var facility = new Facility
                {
                    FacilityName = dto.Name,
                    FacilityDescription = dto.Description,
                    Capacity = dto.Capacity,
                    OpenTime = dto.OpenTime,
                    CloseTime = dto.CloseTime,
                    IsActive = dto.IsActive,
                    DeactivationReason = dto.IsActive ? null : dto.DeactivationReason
                };

                _context.Facilities.Add(facility);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetFacility), new { id = facility.FacilityId }, facility);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in CreateFacility");
                return StatusCode(500, new { Message = "An error occurred while creating the facility.", Details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFacility(int id, CreateFacilityDto dto)
        {
            try
            {
                var facility = await _context.Facilities.FindAsync(id);
                if (facility == null)
                    return NotFound("Facility not found.");

                facility.FacilityName = dto.Name;
                facility.FacilityDescription = dto.Description;
                facility.Capacity = dto.Capacity;
                facility.OpenTime = dto.OpenTime;
                facility.CloseTime = dto.CloseTime;
                facility.IsActive = dto.IsActive;
                facility.DeactivationReason = dto.IsActive ? null : dto.DeactivationReason;
                facility.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (DbUpdateConcurrencyException ex)
            {
                _logger.LogError(ex, "Concurrency error occurred in UpdateFacility for Id: {FacilityId}", id);
                return StatusCode(409, new { Message = "Facility details were modified by another transaction." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in UpdateFacility for Id: {FacilityId}", id);
                return StatusCode(500, new { Message = "An error occurred while updating the facility.", Details = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateFacilityStatus(int id, [FromBody] UpdateFacilityStatusDto dto)
        {
            try
            {
                var facility = await _context.Facilities.FindAsync(id);
                if (facility == null)
                    return NotFound("Facility not found.");

                facility.IsActive = dto.IsActive;
                facility.DeactivationReason = dto.IsActive ? null : dto.DeactivationReason;
                facility.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { id = facility.FacilityId, isActive = facility.IsActive, deactivationReason = facility.DeactivationReason });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in UpdateFacilityStatus for Id: {FacilityId}", id);
                return StatusCode(500, new { Message = "An error occurred while updating facility status.", Details = ex.Message });
            }
        }

        [HttpPatch("{id}/toggle-status")]
        public async Task<IActionResult> ToggleFacilityStatus(int id)
        {
            try
            {
                var facility = await _context.Facilities.FindAsync(id);
                if (facility == null)
                    return NotFound("Facility not found.");

                facility.IsActive = !facility.IsActive;
                if (facility.IsActive)
                {
                    facility.DeactivationReason = null;
                }
                facility.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { id = facility.FacilityId, isActive = facility.IsActive, deactivationReason = facility.DeactivationReason });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred in ToggleFacilityStatus for Id: {FacilityId}", id);
                return StatusCode(500, new { Message = "An error occurred while toggling facility status.", Details = ex.Message });
            }
        }
    }
}