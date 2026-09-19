namespace ApartmentManagement.Api.Models
{
    public class InvoiceItem
    {
        public int Id { get; set; }

        public int InvoiceId { get; set; }

        public string Description { get; set; } = string.Empty;

        public string ChargeType { get; set; } = string.Empty;

        public decimal Amount { get; set; }

        public Invoice? Invoice { get; set; }
    }
}