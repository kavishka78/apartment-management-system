namespace ApartmentManagement.Api.DTOs
{
    public class ConfirmStripePaymentRequest
    {
        public string PaymentIntentId { get; set; } = string.Empty;
    }
}