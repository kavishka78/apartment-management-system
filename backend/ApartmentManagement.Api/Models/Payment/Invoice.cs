namespace ApartmentManagement.Api.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        public int ResidentId { get; set; }

        public int ApartmentId { get; set; }

        public string InvoiceNumber { get; set; } = string.Empty;

        public DateTime BillingMonth { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime DueDate { get; set; }

        public string Status { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<InvoiceItem> InvoiceItems { get; set; } = new();

        [System.ComponentModel.DataAnnotations.Schema.NotMapped]
        public bool CanPay => Status == "Pending" &&
            !Payments.Any(p => p.Status == "Successful" || p.Status == "Verified");

        public List<Payment> Payments { get; set; } = new();
    }
}