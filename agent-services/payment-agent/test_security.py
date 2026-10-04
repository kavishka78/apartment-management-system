"""Run: python -m unittest -v test_security (no credentials/network required)."""
import unittest
from unittest.mock import AsyncMock, patch

import httpx
from fastapi.testclient import TestClient

import main
from agent import PaymentAgent
from services.payment_api_service import PaymentApiService


class ChatSecurityTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(main.app)
        self.headers = {"Authorization": "Bearer test-session"}

    def test_missing_or_malformed_header(self):
        for headers in ({}, {"Authorization": "Basic abc"}, {"Authorization": "Bearer "}):
            self.assertEqual(self.client.post('/chat', json={'message': 'hello'}, headers=headers).status_code, 401)

    def test_body_cannot_supply_identity_or_token(self):
        for extra in ({'resident_id': 6}, {'token': 'body-token'}):
            self.assertEqual(self.client.post('/chat', json={'message': 'hi', **extra}, headers=self.headers).status_code, 422)

    def test_invalid_or_expired_backend_token_rejected_before_gemini(self):
        for status in (401, 403):
            response = httpx.Response(status, request=httpx.Request('GET', 'http://backend/auth/me'))
            error = httpx.HTTPStatusError('denied', request=response.request, response=response)
            with patch.object(PaymentApiService, 'validate_resident', AsyncMock(side_effect=error)), patch.object(main, 'classify_message', AsyncMock()) as classify:
                result = self.client.post('/chat', json={'message': 'hello'}, headers=self.headers)
                self.assertEqual(result.status_code, status)
                classify.assert_not_called()

    def test_gemini_reply_cannot_invent_financial_information(self):
        with patch.object(PaymentApiService, 'validate_resident', AsyncMock()), patch.object(main, 'classify_message', AsyncMock(return_value={'intent': 'payment_help', 'reply': 'Your balance is 999999'})):
            result = self.client.post('/chat', json={'message': 'How do payments work?'}, headers=self.headers)
            self.assertEqual(result.status_code, 200)
            self.assertNotIn('999999', result.text)
            self.assertIn('admin verification', result.text)

    def test_sensitive_data_not_sent_to_gemini(self):
        with patch.object(PaymentApiService, 'validate_resident', AsyncMock()), patch.object(main, 'classify_message', AsyncMock()) as classify:
            result = self.client.post('/chat', json={'message': '4242 4242 4242 4242'}, headers=self.headers)
            self.assertEqual(result.status_code, 200)
            classify.assert_not_called()

    def test_all_routes_forward_header_and_return_tool_data(self):
        routes = {'pending_invoices': 'get_pending_invoices', 'latest_payment': 'get_latest_payment',
                  'payment_history': 'get_payment_history', 'receipts': 'get_receipts',
                  'outstanding_balance': 'get_outstanding_balance'}
        for intent, method in routes.items():
            with patch.object(PaymentApiService, 'validate_resident', AsyncMock()) as validate, patch.object(main, 'classify_message', AsyncMock(return_value={'intent': intent})), patch.object(PaymentAgent, method, AsyncMock(return_value={'message': 'database result'})) as tool:
                result = self.client.post('/chat', json={'message': intent}, headers=self.headers)
                self.assertEqual(result.status_code, 200)
                validate.assert_awaited_once_with('Bearer test-session')
                tool.assert_awaited_once_with(authorization='Bearer test-session')

    def test_backend_failure_does_not_become_empty_balance(self):
        with patch.object(PaymentApiService, 'validate_resident', AsyncMock(side_effect=httpx.ConnectError('offline'))):
            result = self.client.post('/chat', json={'message': 'balance due'}, headers=self.headers)
            self.assertEqual(result.status_code, 503)


class ToolTests(unittest.IsolatedAsyncioTestCase):
    async def test_successful_and_verified_payments_are_not_payable(self):
        invoices = [
            {'id': 1, 'totalAmount': 10.10, 'status': 'Pending', 'canPay': True, 'payments': []},
            {'id': 2, 'totalAmount': 90, 'status': 'Pending', 'canPay': False, 'payments': [{'status': 'Successful'}]},
            {'id': 3, 'totalAmount': 100, 'status': 'Pending', 'canPay': False, 'payments': [{'status': 'Verified'}]},
            {'id': 4, 'totalAmount': 0.20, 'status': 'Pending', 'canPay': True, 'payments': []},
        ]
        with patch.object(PaymentApiService, 'get_pending_invoices', AsyncMock(return_value=invoices)):
            pending = await PaymentAgent.get_pending_invoices('Bearer test-session')
            self.assertEqual([i['canPay'] for i in pending['data']], [True, False, False, True])
            balance = await PaymentAgent.get_outstanding_balance('Bearer test-session')
            self.assertEqual(str(balance['data']['totalOutstanding']), '10.3')
            self.assertEqual(balance['data']['invoiceCount'], 2)

    async def test_pagination_header_and_no_resident_query(self):
        requests = []
        def handler(request):
            requests.append(request)
            self.assertEqual(request.headers['Authorization'], 'Bearer exact-session')
            self.assertNotIn('residentId', request.url.params)
            page = int(request.url.params['page'])
            return httpx.Response(200, json={'items': [{'id': page}], 'totalPages': 2})
        original = httpx.AsyncClient
        with patch('services.payment_api_service.httpx.AsyncClient', side_effect=lambda **kwargs: original(transport=httpx.MockTransport(handler), **kwargs)):
            rows = await PaymentApiService.get_resident_payments('Bearer exact-session')
        self.assertEqual(rows, [{'id': 1}, {'id': 2}])
        self.assertEqual(len(requests), 2)


if __name__ == '__main__':
    unittest.main()
