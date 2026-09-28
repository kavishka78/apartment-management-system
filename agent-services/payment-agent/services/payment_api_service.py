import os

import httpx
from dotenv import load_dotenv

load_dotenv()

BACKEND_API_URL = os.getenv(
    "BACKEND_API_URL",
    "http://127.0.0.1:5073/api",
)


class PaymentApiService:

    @staticmethod
    async def get_pending_invoices(
        resident_id: int,
        token: str | None = None,
    ):
        headers = {
            "Content-Type": "application/json",
        }

        if token:
            headers["Authorization"] = f"Bearer {token}"

        params = {
            "residentId": resident_id,
            "status": "Pending",
            "page": 1,
            "pageSize": 100,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BACKEND_API_URL}/invoices",
                params=params,
                headers=headers,
            )

            response.raise_for_status()
            data = response.json()

        return data.get("items", [])
    
    @staticmethod
    async def get_resident_payments(
        resident_id: int,
        token: str | None = None,
    ):
        headers = {
            "Content-Type": "application/json",
        }

        if token:
            headers["Authorization"] = f"Bearer {token}"

        # First get all invoices belonging to this resident.
        params = {
            "residentId": resident_id,
            "page": 1,
            "pageSize": 100,
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            invoice_response = await client.get(
                f"{BACKEND_API_URL}/invoices",
                params=params,
                headers=headers,
            )

            invoice_response.raise_for_status()
            invoice_data = invoice_response.json()

            invoices = invoice_data.get("items", [])

            payments = []

            # Collect payments only from this resident's invoices.
            for invoice in invoices:
                invoice_id = invoice.get("id")

                if invoice_id is None:
                    continue

                payment_response = await client.get(
                    f"{BACKEND_API_URL}/payments",
                    params={
                        "invoiceId": invoice_id,
                        "page": 1,
                        "pageSize": 100,
                    },
                    headers=headers,
                )

                payment_response.raise_for_status()
                payment_data = payment_response.json()

                for payment in payment_data.get("items", []):
                    payment["invoiceNumber"] = invoice.get("invoiceNumber")
                    payments.append(payment)

        payments.sort(
            key=lambda payment: payment.get("paidAt") or "",
            reverse=True,
        )

        return payments