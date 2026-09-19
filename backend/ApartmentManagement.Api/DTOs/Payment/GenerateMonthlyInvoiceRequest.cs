namespace ApartmentManagement.Api.DTOs
{
    public class GenerateMonthlyInvoiceRequest
    {
        public int ResidentId { get; set; }

        public int ApartmentId { get; set; }

        public DateTime BillingMonth { get; set; }

        public DateTime DueDate { get; set; }

        public decimal MaintenanceFee { get; set; }

        public decimal UtilityCharge { get; set; }

        public decimal ParkingCharge { get; set; }

        public decimal FacilityCharge { get; set; }
    }
}