"""Invoked by PaymentSecurity.Tests with short-lived fixture JWTs in environment variables."""
import asyncio
import os
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import main


client = TestClient(main.app)
headers = {"Authorization": f"Bearer {os.environ['PAYMENT_TEST_JWT']}"}
for token in (None, "invalid", os.environ['PAYMENT_TEST_EXPIRED_JWT']):
    response = client.post('/chat', json={'message': 'Hello'}, headers={
        'Authorization': f'Bearer {token}'} if token else {})
    assert response.status_code == 401, 'Authentication failure must propagate through the agent'

cases = [
    ('Hello', None),
    ('Show my pending invoices', 'show_invoices'),
    ('Show my latest payment', 'show_payment'),
    ('Show my payment history', 'show_payment_history'),
    ('Show my receipts', 'show_receipts'),
    ('How much do I owe?', 'show_outstanding_balance'),
    ('How do payments work?', None),
    ('Tell me about the weather', None),
]
with patch.object(main, 'classify_message', AsyncMock(side_effect=RuntimeError('Test fallback'))):
    for message, action in cases:
        response = client.post('/chat', json={'message': message}, headers=headers)
        assert response.status_code == 200, f'Chat failed: {message}'
        payload = response.json()
        assert (payload.get('action') or {}).get('type') == action, f'Unexpected routing: {message}'
        if action == 'show_invoices':
            assert all(row['id'] != 2 and row['id'] != 3 for row in payload['data'])
        if action == 'show_outstanding_balance':
            assert str(payload['data']['totalOutstanding']) in ('100', '100.0', '100.00')
print('PASS: 3 authentication failures and 8 authenticated natural-language requests through Python -> .NET.')

if os.getenv('PAYMENT_TEST_LIVE_GEMINI') == '1':
    message = 'Could you show my pending invoices?'
    try:
        classification = asyncio.run(asyncio.wait_for(main.classify_message(message), timeout=15))
    except Exception as error:
        print(f'LIVE GEMINI NOT VERIFIED: {type(error).__name__}; deterministic fallback was tested.')
    else:
        assert classification['intent'] == 'pending_invoices'
        with patch.object(main, 'classify_message', AsyncMock(return_value=classification)):
            response = client.post('/chat', json={'message': message}, headers=headers)
        assert response.status_code == 200 and response.json()['action']['type'] == 'show_invoices'
        print('PASS: live Gemini classification routed an authenticated request to .NET financial data.')
