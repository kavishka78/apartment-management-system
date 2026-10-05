namespace ApartmentManagement.Api.Models
{
    public class Invoice
    {
        public int Id { get; set; }

        public int ResidentId { get; set; }

        public int ApartmentId { get; set; }

        // Set for invoices created from a facility booking. The unique index
        // prevents the same booking from being invoiced more than once.
        public int? FacilityBookingId { get; set; }

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

        public bool AddOverduePenalty(DateTime utcNow)
        {
            if (Status != "Pending" || DueDate.Date >= utcNow.Date ||
                Payments.Any(p => p.Status == "Successful" || p.Status == "Verified") ||
                InvoiceItems.Any(item => item.ChargeType == "OverduePenalty"))
            {
                return false;
            }

            var penalty = decimal.Round(TotalAmount * 0.05m, 2, MidpointRounding.AwayFromZero);
            if (penalty <= 0)
                return false;

            InvoiceItems.Add(new InvoiceItem
            {
                Description = "Overdue Penalty (5%)",
                ChargeType = "OverduePenalty",
                Amount = penalty
            });
            TotalAmount += penalty;
            return true;
        }

        public List<Payment> Payments { get; set; } = new();
    }
}
