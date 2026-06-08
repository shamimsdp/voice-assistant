"""
Tests for payment_service.py — Invoicing, insurance, financial reports
"""
import pytest
from datetime import datetime, date
from unittest.mock import AsyncMock, Mock, patch

from sqlalchemy.ext.asyncio import AsyncSession

from services.payment_service import (
    generate_invoice,
    compute_financial_report,
    process_insurance_claim,
    submit_insurance_claim,
    process_bkash_refund,
    get_payment_history,
)
from models.appointment import Appointment, PaymentStatus
from models.patient import Patient
from models.payment import (
    InsuranceClaim, InsuranceProvider, ClaimStatus,
)

pytestmark = pytest.mark.asyncio


def _mock_db(rows, invoice_rows=None):
    result = Mock()
    result.scalars.return_value.all.return_value = rows
    result.scalar.return_value = 0
    db = AsyncMock(spec=AsyncSession)

    if invoice_rows is not None:
        results = [result]
        inv_result = Mock()
        inv_result.scalars.return_value.all.return_value = invoice_rows
        inv_result.scalar.return_value = 0
        results.append(inv_result)
        db.execute.side_effect = results
    else:
        db.execute.return_value = result

    return db


def _make_appt(**kwargs):
    defaults = dict(
        id="apt-1",
        clinic_id="clinic-1",
        doctor_id="doc-1",
        patient_id="pat-1",
        consultation_fee=500,
        advance_amount=200,
        payment_status=PaymentStatus.UNPAID,
        scheduled_at=datetime(2026, 6, 15, 10, 0),
        duration_min=20,
        created_at=datetime(2026, 6, 1, 9, 0),
    )
    defaults.update(kwargs)
    return Appointment(**defaults)


# ── Invoice Generation ────────────────────────────────────────────────────────

class TestInvoiceGeneration:
    async def test_generates_invoice_with_defaults(self):
        appt = _make_appt()
        patient = Patient(id="pat-1", name="Test", phone="01711111111")
        db = _mock_db([])

        invoice = await generate_invoice(appt, patient, db)

        assert invoice.clinic_id == "clinic-1"
        assert invoice.appointment_id == "apt-1"
        assert invoice.subtotal == 500
        assert invoice.total == 500
        assert invoice.status.value == "draft"
        assert invoice.invoice_number.startswith("INV-")

    async def test_invoice_with_tax_and_discount(self):
        appt = _make_appt()
        patient = Patient(id="pat-1", name="Test", phone="01711111111")
        db = _mock_db([])

        invoice = await generate_invoice(appt, patient, db, tax_pct=10.0, discount=50)

        assert invoice.subtotal == 500
        assert invoice.tax_amount == 50
        assert invoice.discount == 50
        assert invoice.total == 500  # 500 + 50 - 50

    async def test_invoice_custom_line_items(self):
        appt = _make_appt()
        patient = Patient(id="pat-1", name="Test", phone="01711111111")
        db = _mock_db([])

        items = [
            {"description": "Consultation", "amount": 500},
            {"description": "Lab test", "amount": 300},
        ]
        invoice = await generate_invoice(appt, patient, db, line_items=items)

        assert invoice.subtotal == 800
        assert len(invoice.line_items) == 2


# ── Financial Report ──────────────────────────────────────────────────────────

class TestFinancialReport:
    async def test_empty_period_returns_zeroes(self):
        db = _mock_db([])

        report = await compute_financial_report(
            "clinic-1", db,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 30),
        )

        assert report["summary"]["total_appointments"] == 0
        assert report["summary"]["total_revenue_bdt"] == 0
        assert report["summary"]["collection_rate_pct"] == 0.0

    async def test_calculates_revenue_correctly(self):
        db = _mock_db(
            rows=[
                _make_appt(payment_status=PaymentStatus.PAID),
                _make_appt(payment_status=PaymentStatus.PAID,
                           consultation_fee=1000, advance_amount=500),
                _make_appt(payment_status=PaymentStatus.UNPAID),
            ],
            invoice_rows=[],
        )

        report = await compute_financial_report(
            "clinic-1", db,
            start_date=date(2026, 6, 1),
            end_date=date(2026, 6, 30),
        )

        assert report["summary"]["total_appointments"] == 3
        assert report["summary"]["total_revenue_bdt"] == 1500
        assert report["summary"]["pending_bdt"] == 500
        assert report["breakdown"]["paid_count"] == 2
        assert report["breakdown"]["unpaid_count"] == 1


# ── Insurance Claims ──────────────────────────────────────────────────────────

class TestInsuranceClaims:
    async def test_create_claim(self):
        db = _mock_db([])
        claim = await process_insurance_claim(
            clinic_id="clinic-1",
            patient_id="pat-1",
            appointment_id="apt-1",
            provider=InsuranceProvider.PRAGOTI,
            policy_number="POL-12345",
            claim_amount=5000,
            db=db,
        )

        assert claim.provider == InsuranceProvider.PRAGOTI
        assert claim.policy_number == "POL-12345"
        assert claim.claim_amount == 5000
        assert claim.status == ClaimStatus.DRAFT

    async def test_create_claim_with_codes(self):
        db = _mock_db([])
        claim = await process_insurance_claim(
            clinic_id="clinic-1",
            patient_id="pat-1",
            appointment_id="apt-1",
            provider=InsuranceProvider.METLIFE,
            policy_number="POL-67890",
            claim_amount=8000,
            db=db,
            diagnosis_code="J45",
            treatment_code="T01",
        )

        assert claim.diagnosis_code == "J45"
        assert claim.treatment_code == "T01"

    async def test_submit_claim_changes_status(self):
        db = AsyncMock(spec=AsyncSession)
        claim = InsuranceClaim(
            id="claim-1",
            clinic_id="clinic-1",
            patient_id="pat-1",
            appointment_id="apt-1",
            provider=InsuranceProvider.DELTA,
            policy_number="POL-111",
            claim_amount=3000,
            status=ClaimStatus.DRAFT,
        )
        db.execute.return_value = Mock()
        db.execute.return_value.scalar_one_or_none.return_value = claim

        result = await submit_insurance_claim("claim-1", db)
        assert result.status == ClaimStatus.SUBMITTED
        assert result.submitted_at is not None

    async def test_submit_non_draft_raises_error(self):
        db = AsyncMock(spec=AsyncSession)
        claim = InsuranceClaim(
            id="claim-2",
            clinic_id="clinic-1",
            patient_id="pat-1",
            appointment_id="apt-1",
            provider=InsuranceProvider.GENERAL,
            policy_number="POL-222",
            claim_amount=2000,
            status=ClaimStatus.SUBMITTED,
        )
        db.execute.return_value = Mock()
        db.execute.return_value.scalar_one_or_none.return_value = claim

        with pytest.raises(ValueError, match="Cannot submit claim"):
            await submit_insurance_claim("claim-2", db)


# ── bKash Refund ──────────────────────────────────────────────────────────────

class TestBkashRefund:
    async def test_refund_requires_payment_info(self):
        appt = _make_appt(bkash_payment_id=None, bkash_trx_id=None)
        db = AsyncMock()

        with pytest.raises(ValueError, match="No bKash payment to refund"):
            await process_bkash_refund(appt, 200, "Cancelled by patient", db)

    @patch("services.payment_service.refund_payment")
    async def test_refund_calls_bkash(self, mock_refund):
        mock_refund.return_value = {"statusCode": "0000", "trxID": "TRX123"}

        appt = _make_appt(
            bkash_payment_id="PAY001",
            bkash_trx_id="TRX001",
        )
        db = AsyncMock()

        result = await process_bkash_refund(appt, 200, "Test refund", db)
        assert result["statusCode"] == "0000"
        assert appt.payment_status == PaymentStatus.REFUNDED

    @patch("services.payment_service.refund_payment")
    async def test_refund_failure_does_not_mark_refunded(self, mock_refund):
        mock_refund.return_value = {"statusCode": "9999", "statusMessage": "Failed"}

        appt = _make_appt(
            bkash_payment_id="PAY001",
            bkash_trx_id="TRX001",
        )
        db = AsyncMock()

        result = await process_bkash_refund(appt, 200, "Test", db)
        assert result["statusCode"] == "9999"
        assert appt.payment_status != PaymentStatus.REFUNDED


# ── Payment History ───────────────────────────────────────────────────────────

class TestPaymentHistory:
    async def test_empty_history_returns_empty_list(self):
        db = _mock_db([])

        history = await get_payment_history("clinic-1", db, days=30)
        assert history == []

    async def test_history_includes_patient_details(self):
        appt = _make_appt(payment_status=PaymentStatus.PAID)
        db = _mock_db([appt])

        patient = Patient(id="pat-1", name="Rahim", phone="01711111111")
        db.get.return_value = patient

        history = await get_payment_history("clinic-1", db, days=30)
        assert len(history) == 1
        assert history[0]["patient_name"] == "Rahim"
        assert history[0]["patient_phone"] == "01711111111"
        assert history[0]["payment_status"] == "paid"
