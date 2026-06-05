import pytest
from datetime import datetime, date
import respx
import httpx
from utils.prayer_times import is_bd_public_holiday, is_jumma_time, should_avoid_scheduling
from services.bkash_service import create_payment, execute_payment

def test_bd_public_holidays():
    # Feb 21 is Mother Language Day
    is_holiday, name = is_bd_public_holiday(date(2026, 2, 21))
    assert is_holiday is True
    assert "Mother Language Day" in name

    # June 1 is not a standard fixed BD public holiday listed
    is_holiday, name = is_bd_public_holiday(date(2026, 6, 1))
    assert is_holiday is False

def test_jumma_time_guard():
    # Friday 12:30 PM is Jumma time
    friday_jumma = datetime(2026, 6, 5, 12, 30) # June 5, 2026 is Friday
    assert is_jumma_time(friday_jumma) is True

    # Friday 10:00 AM is not Jumma time
    friday_morning = datetime(2026, 6, 5, 10, 0)
    assert is_jumma_time(friday_morning) is False

    # Saturday 12:30 PM is not Jumma time
    saturday_noon = datetime(2026, 6, 6, 12, 30)
    assert is_jumma_time(saturday_noon) is False

def test_should_avoid_scheduling():
    # Too early (e.g. 7 AM)
    should_avoid, reason = should_avoid_scheduling(datetime(2026, 6, 1, 7, 0))
    assert should_avoid is True
    assert "Too early" in reason

    # Too late (e.g. 10 PM)
    should_avoid, reason = should_avoid_scheduling(datetime(2026, 6, 1, 22, 0))
    assert should_avoid is True
    assert "Too late" in reason

    # Whitelisted normal hours (e.g. 10 AM on Monday)
    should_avoid, reason = should_avoid_scheduling(datetime(2026, 6, 1, 10, 0)) # June 1, 2026 is Monday
    assert should_avoid is False
    assert reason == ""

@respx.mock
@pytest.mark.asyncio
async def test_bkash_create_payment():
    # Mock token request
    token_route = respx.post("https://tokenized.sandbox.bka.sh/v1.2.0-beta/token/grant").respond(
        json={"id_token": "mock-token-123"}
    )
    # Mock create payment request
    create_route = respx.post("https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout/create").respond(
        json={"bkashURL": "https://mock.bkash.com/payment", "paymentID": "PAY123", "statusCode": "0000"}
    )

    resp = await create_payment(
        amount=500,
        appointment_id="APT999",
        patient_phone="01711223344",
        callback_url="http://localhost:8000/payments/callback"
    )

    assert token_route.called
    assert create_route.called
    assert resp["paymentID"] == "PAY123"
    assert resp["statusCode"] == "0000"
    assert "mock.bkash.com" in resp["bkashURL"]
