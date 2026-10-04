from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import re
import asyncio
from services.payment_api_service import PaymentApiService
from datetime import datetime

from agent import PaymentAgent
from models import ChatRequest, ChatResponse
from services.gemini_service import classify_message


app = FastAPI(
    title="Apartment Payment Agent",
    description=(
        "AI-powered payment assistant for apartment residents. "
        "Uses Gemini to understand natural-language requests and "
        "read-only payment tools to retrieve real financial data."
    ),
    version="1.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("PAYMENT_AGENT_ALLOWED_ORIGINS", "").split(",") if origin.strip()],
    allow_methods=["POST"], allow_headers=["Authorization", "Content-Type"],
)


# -------------------------------------------------
# Health Check
# -------------------------------------------------
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "payment-agent",
        "ai": "Gemini",
    }


# -------------------------------------------------
# Deterministic Fallback Intent Detection
# -------------------------------------------------
def detect_fallback_intent(message: str) -> str:
    """
    Used only when Gemini is temporarily unavailable.

    This keeps basic payment commands working without
    allowing the model to invent financial information.
    """

    message = message.strip().lower()

    greeting_phrases = [
        "hi",
        "hello",
        "hey",
        "good morning",
        "good afternoon",
        "good evening",
    ]

    if message in greeting_phrases:
        return "greeting"

    latest_payment_phrases = [
        "last payment",
        "latest payment",
        "show my last payment",
        "show my latest payment",
        "my last payment",
        "my latest payment",
        "recent payment",
    ]

    if any(
        phrase in message
        for phrase in latest_payment_phrases
    ):
        return "latest_payment"

    payment_history_phrases = [
        "payment history",
        "show payment history",
        "show my payment history",
        "my payment history",
        "all payments",
        "show all payments",
        "previous payments",
    ]

    if any(
        phrase in message
        for phrase in payment_history_phrases
    ):
        return "payment_history"

    receipt_phrases = [
        "receipts",
        "my receipts",
        "show receipts",
        "show my receipts",
        "payment receipts",
        "show payment receipts",
    ]

    if any(
        phrase in message
        for phrase in receipt_phrases
    ):
        return "receipts"

    outstanding_balance_phrases = [
        "outstanding balance",
        "my outstanding balance",
        "show outstanding balance",
        "show my outstanding balance",
        "how much do i owe",
        "how much i owe",
        "amount due",
        "total due",
        "balance due",
    ]

    if any(
        phrase in message
        for phrase in outstanding_balance_phrases
    ):
        return "outstanding_balance"

    pending_invoice_phrases = [
        "pending invoice",
        "pending invoices",
        "show pending",
        "my invoices",
        "unpaid invoice",
        "unpaid invoices",
        "pay now",
        "pay my",
        "make a payment",
    ]

    if any(
        phrase in message
        for phrase in pending_invoice_phrases
    ):
        return "pending_invoices"

    if any(phrase in message for phrase in ["how do", "how can i pay", "payment help", "verification"]):
        return "payment_help"

    return "unknown"


# -------------------------------------------------
# Greeting
# -------------------------------------------------
def create_greeting(local_time: str | None) -> str:
    try:
        if local_time:
            current_time = datetime.fromisoformat(local_time)
        else:
            current_time = datetime.now()

        hour = current_time.hour

        if hour < 12:
            greeting = "Good morning"
        elif hour < 17:
            greeting = "Good afternoon"
        else:
            greeting = "Good evening"

    except ValueError:
        greeting = "Hello"

    return (
        f"{greeting}! I'm your Payment Assistant. "
        "I can help you check pending invoices, "
        "payment history, latest payments, receipts, "
        "and outstanding balances."
    )


# -------------------------------------------------
# Chat Endpoint
# -------------------------------------------------
@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, authorization: str | None = Header(default=None)):
    if not authorization or not re.fullmatch(r"Bearer [^\s]+", authorization, re.IGNORECASE):
        raise HTTPException(status_code=401, detail="A Bearer token is required.", headers={"WWW-Authenticate": "Bearer"})
    try:
        # .NET remains the sole JWT validator, including greeting/help requests.
        await PaymentApiService.validate_resident(authorization)
        message = request.message.strip()
        # Reject apparent credentials/card data before anything is sent to Gemini.
        if re.search(r"(?:\d[ -]?){13,19}|\b(?:cvv|cvc|expiry|expiration|password|bearer|api[_ -]?key|secret[_ -]?key)\b|(?:sk|pk)_(?:live|test)_|AIza|eyJ[A-Za-z0-9_-]+\.", message, re.IGNORECASE):
            return ChatResponse(message="Please do not share card details or credentials in chat. Use the secure Stripe payment window.")

        # -----------------------------------------
        # Step 1: Ask Gemini to understand intent
        # -----------------------------------------
        try:
            ai_result = await asyncio.wait_for(classify_message(message), timeout=15)

            intent = ai_result.get(
                "intent",
                "unknown",
            )

        except Exception as exc:
            # Gemini may temporarily be unavailable.
            # Basic commands must continue working.
            print(
                "Gemini unavailable. "
                f"Using fallback routing: {type(exc).__name__}"
            )

            intent = detect_fallback_intent(message)

        # -----------------------------------------
        # Step 2: Execute allow-listed tools
        # -----------------------------------------

        # Greeting
        if intent == "greeting":
            return ChatResponse(
                message=create_greeting(
                    request.local_time
                )
            )

        # Pending Invoices
        if intent == "pending_invoices":
            result = await PaymentAgent.get_pending_invoices(
                authorization=authorization,
            )

            return ChatResponse(**result)

        # Latest Payment
        if intent == "latest_payment":
            result = await PaymentAgent.get_latest_payment(
                authorization=authorization,
            )

            return ChatResponse(**result)

        # Payment History
        if intent == "payment_history":
            result = await PaymentAgent.get_payment_history(
                authorization=authorization,
            )

            return ChatResponse(**result)

        # Receipts
        if intent == "receipts":
            result = await PaymentAgent.get_receipts(
                authorization=authorization,
            )

            return ChatResponse(**result)

        # Outstanding Balance
        if intent == "outstanding_balance":
            result = await PaymentAgent.get_outstanding_balance(
                authorization=authorization,
            )

            return ChatResponse(**result)

        # -----------------------------------------
        # General Payment Help
        # -----------------------------------------
        if intent == "payment_help":
            safe_reply = (
                "I can help explain invoices, payments, "
                "receipts, and payment verification. "
                "Payments are completed through the "
                "Stripe PaymentSheet in the application. Successful payments await "
                "admin verification before the invoice is Paid and a receipt is issued."
            )

            return ChatResponse(
                message=safe_reply
            )

        # -----------------------------------------
        # Unknown / unrelated request
        # -----------------------------------------
        return ChatResponse(
            message=(
                "I can help you with apartment billing "
                "and payments. You can ask about pending "
                "invoices, your outstanding balance, "
                "latest payment, payment history, "
                "or receipts."
            )
        )

    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        if status in (401, 403):
            raise HTTPException(status_code=status, detail="Please sign in with an active resident account.",
                                headers={"WWW-Authenticate": "Bearer"} if status == 401 else None) from None
        raise HTTPException(status_code=502, detail="Payment service is unavailable.") from None
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Payment service is unavailable.") from None
    except HTTPException:
        raise
    except Exception as exc:
        print(
            "Payment agent request failed: "
            f"{type(exc).__name__}"
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The Payment Assistant could not "
                "complete the request."
            ),
        )
