namespace ApartmentManagement.Api.DTOs
{
    public class CreatePaymentRequest
    {
        public int InvoiceId { get; set; }

        public decimal Amount { get; set; }

        public string PaymentMethod { get; set; } = "Card";

        // Demo card details - these will NOT be stored in the database
        public string CardholderName { get; set; } = string.Empty;

        public string CardNumber { get; set; } = string.Empty;

        public string ExpiryDate { get; set; } = string.Empty;

        public string Cvv { get; set; } = string.Empty;
    }
}