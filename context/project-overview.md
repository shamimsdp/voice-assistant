# Shasthya Seba AI — Project Overview

## Overview

Shasthya Seba AI is a production-ready, Bangladesh-focused clinic management system with an AI-powered voice assistant. It automates incoming patient phone calls in Bangla, English, or Banglish, integrating Twilio telephony → Google Cloud STT/TTS → Gemini 2.0 Flash LLM for natural conversation. The system handles appointment booking, bKash payment deposits, SMS notifications, and full clinic operations — all in one platform.

## Goals

1. Automate 90%+ of incoming clinic phone calls using AI voice agents in Bangla
2. Provide a complete clinic management dashboard (appointments, patients, billing, analytics)
3. Support Bangladesh-specific workflows: bKash payments, Jumma prayer guards, BD phone/ SMS gateways
4. Offer multilingual support (Bangla primary, English/Banglish secondary)
5. Enable offline clinics to operate with zero human receptionist overhead

## Core User Flow

1. Patient calls the clinic's Twilio phone number
2. AI receptionist (Gemini 2.0 Flash) answers in Bangla with Islamic greeting
3. Patient states intent (book appointment, check info, payment inquiry, etc.)
4. AI checks doctor availability, finds slots, books appointment
5. AI sends bKash payment link via SMS for deposit
6. Patient pays, appointment is confirmed
7. Clinic staff monitor everything from the dashboard

## Features

### Clinical Operations

- **Overview Dashboard** — Real-time stats, live call monitor, appointment queue
- **Appointments** — Full CRUD with search, filters, status tracking, bKash payment integration
- **Call Logs** — Transcript viewer with sentiment analysis and intent extraction
- **Analytics** — KPIs, call volume trends, latency metrics, no-show prediction, outbreak detection
- **Schedule** — Weekly doctor schedules, time-off requests, shift overrides
- **Patients** — Registration, medical history, allergies, immunizations, family history

### Clinical Services

- **EHR / Medical Records** — Structured clinical data with vitals, diagnoses, prescriptions
- **Lab Integration** — Test catalog, lab orders, results, imaging studies
- **Pharmacy** — Order management, dispensing, delivery tracking
- **Emergency / ER** — Triage cases, ambulance dispatch, status tracking
- **Telemedicine** — Video consultation scheduling

### Operations

- **Inventory** — Medicine/supply/equipment tracking with stock alerts
- **Staff Scheduling** — Doctor shift plans, availability, time-off approval
- **Billing** — Invoice generation, bKash payments, insurance claims, financial reports
- **Notifications** — SMS confirmations, smart reminders, in-app alerts

### Setup & Account

- **Settings** — Clinic profile, localization guards, SMS gateway, AI persona tuning
- **AI Agents** — Voice agent prompt configuration, intent mapping
- **Doctor Management** — Add/edit/deactivate doctors with specialties and fees

## Scope

### In Scope

- Inbound phone call handling with Bangla AI voice agent
- Appointment booking with bKash payment deposit
- Full clinic management dashboard (5 existing pages + more planned)
- Electronic health records (EHR)
- Lab test ordering and results
- Pharmacy dispensing
- Emergency case and ambulance management
- Telemedicine session scheduling
- Inventory management with low-stock alerts
- Staff scheduling and time-off workflows
- Analytics with predictive insights (no-show, staffing, outbreak)
- Insurance claims (Pragoti, MetLife, Delta)
- BD-specific: Jumma prayer guard, public holiday blocks, Unicode SMS, local SMS gateways

### Out of Scope

- Patient-facing mobile app (only clinic admin portal)
- Multi-language support beyond Bangla/English
- Desktop/native applications (web-only PWA)
- Blockchain or cryptocurrency payments
- Generic hospital-wide ERP (focused on outpatient clinics)
- HL7/FHIR interoperability (future consideration)

## Success Criteria

1. A patient can call, converse in Bangla, and book an appointment end-to-end without human intervention
2. Clinic staff can manage all operations from a single dashboard
3. bKash payments are processed and reconciled automatically
4. Backend test suite exceeds 150 tests with >90% coverage on core services
5. System handles 200+ concurrent calls with <1s STT→LLM→TTS latency
6. Frontend builds in under 30s with zero TypeScript errors
