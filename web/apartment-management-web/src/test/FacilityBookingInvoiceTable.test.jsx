import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import FacilityBookingInvoiceTable from "../components/payment/FacilityBookingInvoiceTable";
import GenerateInvoice from "../pages/payment/GenerateInvoice";
import * as api from "../services/api";

vi.mock("../components/payment/PaymentSidebar", () => ({ default: () => null }));

const bookings = [
  { bookingId: 2, residentId: 10, residentName: "Resident A", apartmentId: 1,
    facilityName: "Pool", bookingDate: "2026-10-31", startTime: "14:00:00",
    amount: 500, status: "Approved", isInvoiced: false },
  { bookingId: 17, residentId: 2, residentName: "Resident B", apartmentId: 2,
    facilityName: "Gym", bookingDate: "2026-10-12", startTime: "18:00:00",
    amount: 800, status: "Approved", isInvoiced: false },
];

const rowIds = () => screen.getAllByRole("row").slice(1)
  .map((row) => within(row).getAllByRole("cell")[0].textContent);

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(api, "getInvoiceFacilityBookings").mockResolvedValue(bookings);
});

describe("Facility invoice bookings", () => {
  it("shows newly created bookings first instead of future booking dates", async () => {
    render(<FacilityBookingInvoiceTable onSelect={vi.fn()} />);
    await screen.findByText("Resident A");
    expect(rowIds()).toEqual(["17", "2"]);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "bookingDate-desc" } });
    expect(rowIds()).toEqual(["2", "17"]);
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "residentId-asc" } });
    expect(rowIds()).toEqual(["17", "2"]);
  });

  it("combines numeric ID sorting with search", async () => {
    render(<FacilityBookingInvoiceTable onSelect={vi.fn()} />);
    await screen.findByText("Resident A");
    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "bookingId-asc" } });
    expect(rowIds()).toEqual(["2", "17"]);
    fireEvent.change(screen.getByLabelText("Search bookings"), { target: { value: "Resident B" } });
    expect(rowIds()).toEqual(["17"]);
  });

  it("filters by the displayed Invoiced status", async () => {
    render(<FacilityBookingInvoiceTable onSelect={vi.fn()} invoicedBookingIds={[17]} />);
    await screen.findByText("Resident A");
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Invoiced" } });
    expect(rowIds()).toEqual(["17"]);
    expect(screen.getByRole("button", { name: "Invoiced" })).toBeDisabled();
  });

  it("labels zero-cost bookings as No charge rather than Invoiced", async () => {
    api.getInvoiceFacilityBookings.mockResolvedValue([{ ...bookings[0], amount: 0 }]);
    render(<FacilityBookingInvoiceTable onSelect={vi.fn()} />);
    expect(await screen.findByRole("button", { name: "No charge" })).toBeDisabled();
    expect(screen.getByRole("cell", { name: "Approved" })).toBeInTheDocument();
  });

  it("marks only the successfully generated booking invoiced even during a stale refresh", async () => {
    vi.spyOn(api, "paymentFetch").mockResolvedValue({ ok: true, json: async () => ({ id: 42 }) });
    render(<GenerateInvoice />);
    await screen.findByText("Resident B");
    fireEvent.click(screen.getAllByRole("button", { name: "Generate Invoice" })[0]);
    const submit = screen.getAllByRole("button", { name: "Generate Invoice" }).at(-1);
    fireEvent.submit(submit.closest("form"));
    expect(await screen.findByRole("button", { name: "Invoiced" })).toBeDisabled();
    await waitFor(() => expect(api.getInvoiceFacilityBookings).toHaveBeenCalledTimes(2));
    expect(api.paymentFetch).toHaveBeenCalledWith("/invoices/generate-booking", expect.objectContaining({
      body: expect.stringContaining('"bookingId":17'),
    }));
    const row = screen.getByText("Resident A").closest("tr");
    expect(within(row).getByRole("button", { name: "Generate Invoice" })).toBeEnabled();
  });
});
