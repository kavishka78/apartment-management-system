from decimal import Decimal
from services.payment_api_service import PaymentApiService


class PaymentAgent:

    # -------------------------------------------------
    # 1. Pending Invoices
    # -------------------------------------------------
    @staticmethod
    async def get_pending_invoices(
        authorization: str,
    ):
        invoices = await PaymentApiService.get_pending_invoices(
            authorization=authorization,
        )

        if not invoices:
            return {
                "message": "You have no pending invoices.",
                "action": None,
                "data": [],
            }

        invoice_cards = []

        for invoice in invoices:
            payments = invoice.get("payments", [])

            has_successful_payment = any(
                payment.get("status") in ["Successful", "Verified"]
                for payment in payments
            )

            verified = any(payment.get("status") == "Verified" for payment in payments)
            invoice_cards.append({
                "id": invoice.get("id"),
                "invoiceNumber": invoice.get("invoiceNumber"),
                "billingMonth": invoice.get("billingMonth"),
                "totalAmount": invoice.get("totalAmount"),
                "dueDate": invoice.get("dueDate"),
                "status": invoice.get("status"),
                "canPay": invoice.get("canPay") is True and not has_successful_payment,
                "paymentStatus": "Verified" if verified else (
                    "Awaiting admin verification" if has_successful_payment else invoice.get("status")
                ),
            })

        payable_count = sum(card["canPay"] for card in invoice_cards)
        awaiting_count = sum(card["paymentStatus"] == "Awaiting admin verification" for card in invoice_cards)
        return {
            "message": (
                f"You have {payable_count} payable invoice(s) and "
                f"{awaiting_count} payment(s) awaiting admin verification."
            ),
            "action": {
                "type": "show_invoices",
                "label": "View Pending Invoices",
            },
            "data": invoice_cards,
        }

    # -------------------------------------------------
    # 2. Latest Payment
    # -------------------------------------------------
    @staticmethod
    async def get_latest_payment(
        authorization: str,
    ):
        payments = await PaymentApiService.get_resident_payments(
            authorization=authorization,
        )

        if not payments:
            return {
                "message": "You do not have any payment records yet.",
                "action": None,
                "data": None,
            }

        latest_payment = payments[0]

        payment_data = {
            "id": latest_payment.get("id"),
            "paymentReference": latest_payment.get("paymentReference"),
            "invoiceId": latest_payment.get("invoiceId"),
            "invoiceNumber": latest_payment.get("invoiceNumber"),
            "amount": latest_payment.get("amount"),
            "paymentMethod": latest_payment.get("paymentMethod"),
            "status": latest_payment.get("status"),
            "paidAt": latest_payment.get("paidAt"),
            "receiptNumber": latest_payment.get("receiptNumber"),
        }

        return {
            "message": (
                f"Your latest payment is Rs. "
                f"{latest_payment.get('amount')} for invoice "
                f"{latest_payment.get('invoiceNumber')}. "
                f"Status: {latest_payment.get('status')}."
            ),
            "action": {
                "type": "show_payment",
                "payment_id": latest_payment.get("id"),
                "label": "View Payment",
            },
            "data": payment_data,
        }

    # -------------------------------------------------
    # 3. Payment History
    # -------------------------------------------------
    @staticmethod
    async def get_payment_history(
        authorization: str,
    ):
        payments = await PaymentApiService.get_resident_payments(
            authorization=authorization,
        )

        if not payments:
            return {
                "message": "You do not have any payment history yet.",
                "action": None,
                "data": [],
            }

        payment_history = []

        for payment in payments:
            payment_history.append({
                "id": payment.get("id"),
                "paymentReference": payment.get("paymentReference"),
                "invoiceId": payment.get("invoiceId"),
                "invoiceNumber": payment.get("invoiceNumber"),
                "amount": payment.get("amount"),
                "paymentMethod": payment.get("paymentMethod"),
                "status": payment.get("status"),
                "paidAt": payment.get("paidAt"),
                "receiptNumber": payment.get("receiptNumber"),
            })

        return {
            "message": (
                f"You have {len(payment_history)} payment records."
            ),
            "action": {
                "type": "show_payment_history",
                "label": "View Payment History",
            },
            "data": payment_history,
        }

    # -------------------------------------------------
    # 4. Receipts
    # -------------------------------------------------
    @staticmethod
    async def get_receipts(
        authorization: str,
    ):
        payments = await PaymentApiService.get_resident_payments(
            authorization=authorization,
        )

        receipts = []

        for payment in payments:
            receipt_number = payment.get("receiptNumber")

            if receipt_number:
                receipts.append({
                    "paymentId": payment.get("id"),
                    "paymentReference": payment.get("paymentReference"),
                    "invoiceId": payment.get("invoiceId"),
                    "invoiceNumber": payment.get("invoiceNumber"),
                    "amount": payment.get("amount"),
                    "paidAt": payment.get("paidAt"),
                    "status": payment.get("status"),
                    "receiptNumber": receipt_number,
                })

        if not receipts:
            return {
                "message": "You do not have any receipts yet.",
                "action": None,
                "data": [],
            }

        return {
            "message": f"You have {len(receipts)} receipts.",
            "action": {
                "type": "show_receipts",
                "label": "View Receipts",
            },
            "data": receipts,
        }

    # -------------------------------------------------
    # 5. Outstanding Balance
    # -------------------------------------------------
    @staticmethod
    async def get_outstanding_balance(
        authorization: str,
    ):
        invoices = await PaymentApiService.get_pending_invoices(
            authorization=authorization,
        )

        outstanding_invoices = []
        total_outstanding = Decimal("0")

        for invoice in invoices:
            payments = invoice.get("payments", [])

            has_successful_payment = any(
                payment.get("status") in ["Successful", "Verified"]
                for payment in payments
            )

            if invoice.get("canPay") is True and not has_successful_payment:
                amount = Decimal(str(invoice["totalAmount"]))

                total_outstanding += amount

                outstanding_invoices.append({
                    "id": invoice.get("id"),
                    "invoiceNumber": invoice.get("invoiceNumber"),
                    "billingMonth": invoice.get("billingMonth"),
                    "totalAmount": amount,
                    "dueDate": invoice.get("dueDate"),
                    "status": invoice.get("status"),
                    "canPay": True,
                })

        if not outstanding_invoices:
            return {
                "message": "You have no outstanding balance.",
                "action": None,
                "data": {
                    "totalOutstanding": 0,
                    "invoiceCount": 0,
                    "invoices": [],
                },
            }

        return {
            "message": (
                f"Your total outstanding balance is Rs. "
                f"{total_outstanding} across "
                f"{len(outstanding_invoices)} invoice(s)."
            ),
            "action": {
                "type": "show_outstanding_balance",
                "label": "View Outstanding Balance",
            },
            "data": {
                "totalOutstanding": total_outstanding,
                "invoiceCount": len(outstanding_invoices),
                "invoices": outstanding_invoices,
            },
        }
