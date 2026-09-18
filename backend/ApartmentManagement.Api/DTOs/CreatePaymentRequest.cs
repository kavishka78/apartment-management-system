using System.ComponentModel.DataAnnotations;

namespace ApartmentManagement.Api.DTOs
{
    public class CreatePaymentRequest
    {
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Valid invoice ID is required.")]
        public int InvoiceId { get; set; }

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Payment amount must be greater than zero.")]
        public decimal Amount { get; set; }

        [Required]
        public string PaymentMethod { get; set; } = "Card";

        [Required(ErrorMessage = "Cardholder name is required.")]
        [StringLength(100)]
        public string CardholderName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Card number is required.")]
        [RegularExpression(@"^\d{16}$",
            ErrorMessage = "Card number must contain exactly 16 digits.")]
        public string CardNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Expiry date is required.")]
        [RegularExpression(@"^(0[1-9]|1[0-2])\/\d{2}$",
            ErrorMessage = "Expiry date must use MM/YY format.")]
        public string ExpiryDate { get; set; } = string.Empty;

        [Required(ErrorMessage = "CVV is required.")]
        [RegularExpression(@"^\d{3}$",
            ErrorMessage = "CVV must contain exactly 3 digits.")]
        public string Cvv { get; set; } = string.Empty;
    }
}