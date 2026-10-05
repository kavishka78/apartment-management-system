using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs;

public class GenerateBookingInvoiceRequest
{
    [Range(1, int.MaxValue)]
    public int BookingId { get; set; }

    [Required]
    public DateTime DueDate { get; set; }

    [Range(1, int.MaxValue)]
    public int ApartmentId { get; set; }

    [Range(typeof(decimal), "0.01", "100000000")]
    public decimal Amount { get; set; }
}
