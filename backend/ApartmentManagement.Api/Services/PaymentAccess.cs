using System.Security.Claims;
using ApartmentManagement.Api.Data;
using ApartmentManagement.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace ApartmentManagement.Api.Services;

// All payment reads and object lookups must start from these scoped queries.
public static class PaymentAccess
{
    public const string AdminRoles = "ApartmentAdmin,SuperAdmin";
    public const string Roles = "Resident," + AdminRoles;

    public static IQueryable<Invoice> VisibleInvoices(this AppDbContext db, ClaimsPrincipal user)
    {
        if (user.IsInRole("SuperAdmin")) return db.Invoices;
        if (!int.TryParse(user.FindFirstValue("tenantId"), out var tenantId))
            return db.Invoices.Where(i => false);

        var residents = db.Residents.Where(r => r.TenantId == tenantId);
        if (user.IsInRole("Resident"))
        {
            if (!int.TryParse(user.FindFirstValue("residentId"), out var residentId))
                return db.Invoices.Where(i => false);
            residents = residents.Where(r => r.Id == residentId && r.Status == "Active");
        }
        else if (!user.IsInRole("ApartmentAdmin")) return db.Invoices.Where(i => false);

        return db.Invoices.Where(i => residents.Any(r => r.Id == i.ResidentId));
    }

    public static IQueryable<Payment> VisiblePayments(this AppDbContext db, ClaimsPrincipal user)
    {
        var invoices = db.VisibleInvoices(user);
        return db.Payments.Where(p => invoices.Any(i => i.Id == p.InvoiceId));
    }

    public static Task<bool> CanManageResident(this AppDbContext db, ClaimsPrincipal user, int residentId)
    {
        int.TryParse(user.FindFirstValue("tenantId"), out var tenantId);
        var super = user.IsInRole("SuperAdmin");
        var admin = user.IsInRole("ApartmentAdmin");
        return db.Residents.AnyAsync(r => r.Id == residentId &&
            (super || (admin && r.TenantId == tenantId)));
    }
}
