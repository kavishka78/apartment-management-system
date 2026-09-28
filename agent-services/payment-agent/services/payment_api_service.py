import os

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()
BACKEND_API_URL = os.getenv('BACKEND_API_URL', 'http://127.0.0.1:5073/api').rstrip('/')


class PaymentApiService:
    """Read-only tools. Identity is resolved exclusively by the .NET API."""

    @staticmethod
    async def validate_resident(authorization: str):
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f'{BACKEND_API_URL}/v1/auth/me',
                headers={'Authorization': authorization},
            )
            response.raise_for_status()
            if response.json().get('role') != 'Resident':
                raise HTTPException(status_code=403, detail='A resident session is required.')

    @staticmethod
    async def _get_pages(path: str, authorization: str, **filters):
        items = []
        page = 1
        async with httpx.AsyncClient(timeout=10.0) as client:
            while True:
                response = await client.get(
                    f'{BACKEND_API_URL}/{path}',
                    params={**filters, 'page': page, 'pageSize': 100},
                    headers={'Authorization': authorization},
                )
                response.raise_for_status()
                data = response.json()
                items.extend(data['items'])
                if page >= data['totalPages']:
                    return items
                page += 1

    @staticmethod
    async def get_pending_invoices(authorization: str):
        return await PaymentApiService._get_pages('invoices', authorization, status='Pending')

    @staticmethod
    async def get_resident_payments(authorization: str):
        return await PaymentApiService._get_pages(
            'payments', authorization, sortBy='paidAt', sortOrder='desc'
        )
