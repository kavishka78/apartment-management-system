namespace ApartmentManagement.Api.Models
{
    public class Payment
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }

        public string PaymentReference { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public string PaymentMethod { get; set; } = "Card";

        public string Status { get; set; } = "Pending";

        public DateTime? PaidAt { get; set; }

        // For demo card payments only.
        // Never store the full card number or CVV.
        public string? CardLastFourDigits { get; set; }

        public Invoice? Invoice { get; set; }

        public Receipt? Receipt { get; set; }
    }
}