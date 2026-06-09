"""
models/__init__.py — re-export all models so Alembic sees them
"""
from .clinic import Clinic
from .doctor import Doctor
from .patient import Patient
from .appointment import Appointment, AppointmentStatus, PaymentStatus
from .call_log import CallLog, CallStatus
from .user import User, UserRole
from .advanced_appointments import (
    WaitingListEntry, WaitingListStatus,
    RecurringAppointmentTemplate,
    GroupBooking, GroupBookingMember,
    Questionnaire, QuestionnaireResponse, QuestionStatus,
)
from .payment import Invoice, InvoiceStatus, InsuranceClaim, InsuranceProvider, ClaimStatus
from .clinic_operations import (
    InventoryItem, InventoryTransaction, MedicalSupply, Equipment,
    MedicineCategory, TransactionType, StockAlertLevel,
)
from .staff_scheduling import (
    DoctorSchedule, ShiftOverride, Unavailability,
    DayOfWeek, ShiftType, TimeOffStatus,
)
from .ehr import (
    MedicalRecord, VitalSign, Diagnosis, Prescription, Allergy, Immunization, FamilyHistory,
    VisitType, VitalSignUnit, AllergySeverity, DiagnosisType,
)
from .telemedicine import TelemedicineSession, SessionStatus
from .pharmacy import PharmacyOrder, PharmacyOrderItem, DispenseStatus, DeliveryStatus
from .emergency import EmergencyCase, AmbulanceDispatch, TriageLevel, EmergencyStatus, AmbulanceStatus
from .lab_integration import (
    LabTest, LabOrder, LabResult, ImagingStudy,
    LabTestCategory, SpecimenType, OrderStatus,
)
from .notification import Notification
from .website import ClinicWebsite
from .support import SupportTicket, TicketComment, TicketPriority, TicketStatus
from .knowledge import KnowledgeArticle
from .agent import Agent, Service, AgentService

__all__ = [
    "Clinic", "Doctor", "Patient",
    "Appointment", "AppointmentStatus", "PaymentStatus",
    "CallLog", "CallStatus",
    "User", "UserRole",
    "WaitingListEntry", "WaitingListStatus",
    "RecurringAppointmentTemplate",
    "GroupBooking", "GroupBookingMember",
    "Questionnaire", "QuestionnaireResponse", "QuestionStatus",
    "Invoice", "InvoiceStatus",
    "InsuranceClaim", "InsuranceProvider", "ClaimStatus",
    "MedicalRecord", "VitalSign", "Diagnosis", "Prescription", "Allergy", "Immunization", "FamilyHistory",
    "VisitType", "VitalSignUnit", "AllergySeverity", "DiagnosisType",
    "TelemedicineSession", "SessionStatus",
    "PharmacyOrder", "PharmacyOrderItem", "DispenseStatus", "DeliveryStatus",
    "EmergencyCase", "AmbulanceDispatch", "TriageLevel", "EmergencyStatus", "AmbulanceStatus",
    "InventoryItem", "InventoryTransaction", "MedicalSupply", "Equipment",
    "MedicineCategory", "TransactionType", "StockAlertLevel",
    "DoctorSchedule", "ShiftOverride", "Unavailability",
    "DayOfWeek", "ShiftType", "TimeOffStatus",
    "LabTest", "LabOrder", "LabResult", "ImagingStudy",
    "LabTestCategory", "SpecimenType", "OrderStatus",
    "Agent", "Service", "AgentService",
    "Notification",
    "ClinicWebsite",
    "SupportTicket", "TicketComment", "TicketPriority", "TicketStatus",
    "KnowledgeArticle",
]
