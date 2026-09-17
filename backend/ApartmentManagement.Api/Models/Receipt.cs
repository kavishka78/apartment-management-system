namespace ApartmentManagement.Api.Models
{
    public class Receipt
    {
        public int Id { get; set; }

        public int PaymentId { get; set; }

        public string ReceiptNumber { get; set; } = string.Empty;

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;

        public Payment? Payment { get; set; }
    }
}