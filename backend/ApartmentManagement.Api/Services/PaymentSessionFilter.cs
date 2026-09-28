using System.Security.Claims;
using ApartmentManagement.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Services;

// Fail closed for old resident tokens and deactivated accounts, before any payment action.
public sealed class PaymentSessionFilter(AppDbContext db) : IAsyncActionFilter
{
    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var user = context.HttpContext.User;
        bool active;
        if (user.IsInRole("Resident"))
        {
            active = int.TryParse(user.FindFirstValue("residentId"), out var residentId) &&
                int.TryParse(user.FindFirstValue("tenantId"), out var tenantId) &&
                await db.Residents.AnyAsync(r => r.Id == residentId && r.TenantId == tenantId && r.Status == "Active");
        }
        else
        {
            var role = user.FindFirstValue(ClaimTypes.Role);
            int.TryParse(user.FindFirstValue("tenantId"), out var tenantId);
            active = int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var accountId) &&
                await db.UserAccounts.AnyAsync(u => u.Id == accountId && u.Status == "Active" &&
                    u.Role == role && (role == "SuperAdmin" || u.TenantId == tenantId));
        }
        if (!active)
        {
            context.Result = new UnauthorizedResult();
            return;
        }
        await next();
    }
}
