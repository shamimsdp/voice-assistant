# Shasthya Seba AI — Project Overview

## Overview

Shasthya Seba AI is a **Healthcare AI Agents platform** and **Healthcare Management SaaS** that enables clinics and medical offices to deploy AI-powered voice agents for patient communication and automate healthcare workflows. The platform uses modern LLMs (Gemini 2.0 Flash) with real-time voice conversations (Twilio → Google Cloud STT/TTS) to handle patient interactions across Bangla, English, and Banglish.

The system serves as both a **reusable healthcare AI agent framework** and a **production-ready clinic management SaaS**, covering patient management, appointments, medical records, billing, and full clinic operations — all accessible through a modern Next.js dashboard.

## What These Healthcare AI Agents Can Do

- **Manage patient appointments & scheduling** — Voice-driven booking, rescheduling, cancellation, availability checks
- **Handle medical inquiries & patient support** — Answer clinic info, doctor schedules, treatment queries in natural language
- **Automate healthcare communication workflows** — SMS notifications, bKash payment links, smart reminders, follow-up prompts
- **Assist with patient follow-ups & reminders** — Post-appointment check-ins, medication reminders, no-show risk prevention
- **Improve medical office management & operations** — EHR, lab orders, pharmacy dispensing, inventory, staff scheduling, emergency coordination
- **Support healthcare customer service automation** — 24/7 AI receptionist handling incoming calls with sentiment-aware responses

## What You'll Learn From This Project

- Build Healthcare AI Voice Agents with modern LLMs (Gemini 2.0 Flash)
- Create real-time medical voice conversations (STT → LLM → TTS pipeline)
- Build a Healthcare Management SaaS platform from scratch
- Manage patients, appointments, and medical workflows end-to-end
- Integrate relational databases (PostgreSQL + SQLAlchemy async) for healthcare data
- Build scalable medical industry SaaS applications (FastAPI + async patterns)
- Create reusable healthcare AI systems (modular agent architecture)
- Build a modern frontend with Next.js 16 + React 19 + Tailwind v4
- Handle AI prompts, automation, and healthcare business logic
- Manage authentication, authorization, and multi-tenant clinic data

## Goals

1. Automate 90%+ of incoming clinic phone calls using AI voice agents in Bangla/English
2. Provide a complete clinic management SaaS dashboard (appointments, patients, billing, analytics, EHR)
3. Support Bangladesh-specific workflows: bKash payments, Jumma prayer guards, BD phone/SMS gateways
4. Offer multilingual support (Bangla primary, English/Banglish secondary)
5. Enable clinics to operate with minimal human receptionist overhead
6. Serve as a reusable blueprint for building healthcare AI agent systems

## Core User Flows

### Flow 1: Inbound Call → Appointment Booking
1. Patient calls the clinic's Twilio phone number
2. AI receptionist (Gemini 2.0 Flash) answers in Bangla with Islamic greeting
3. Patient states intent (book appointment, check info, payment inquiry, emergency)
4. AI checks doctor availability, finds suitable slots, books appointment
5. AI sends bKash payment link via SMS for deposit
6. Patient pays via bKash, appointment is confirmed
7. Clinic staff monitor everything from the dashboard

### Flow 2: Manual Dashboard Booking
1. Receptionist opens the dashboard
2. Searches or registers a new patient
3. Selects doctor, date, time slot
4. System checks for conflicts and Jumma prayer blocks
5. Creates appointment with Pending Payment status
6. Triggers SMS notification to patient with payment link

### Flow 3: Post-Visit Follow-up
1. Appointment marked as Completed
2. System sends satisfaction survey (NPS) via SMS
3. High no-show risk appointments get smart reminders
4. Follow-up appointments can be scheduled via voice or dashboard
5. Prescriptions forwarded to pharmacy for dispensing

### Flow 4: Emergency Handling
1. Patient calls with emergency keywords detected (heart attack, bleeding, etc.)
2. AI immediately transfers to emergency protocol
3. Emergency case created in system with triage level
4. Ambulance dispatched if needed
5. ER staff notified via dashboard

## Features

### AI Voice Agent Capabilities
- **Inbound Call Handling** — Twilio Media Streams → STT (Google Cloud) → LLM (Gemini 2.0 Flash) → TTS → Audio response
- **Multi-turn Conversation** — Context-aware dialogue with sentiment detection and intent recognition
- **Medical Intent Recognition** — 8 intents: appointment booking, clinic info, doctor schedule, payment inquiry, prescription refill, test results, emergency, general help
- **Bangla Dialect Support** — Sylheti, Chittagonian, Rangpuri variations
- **Emergency Keyword Detection** — Real-time alerts for medical emergencies
- **Tool Calling** — Book appointments, check availability, initiate payments, dispatch ambulances

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

### Operations & Management
- **Inventory** — Medicine/supply/equipment tracking with stock alerts
- **Staff Scheduling** — Doctor shift plans, availability, time-off approval
- **Billing** — Invoice generation, bKash payments, insurance claims, financial reports
- **Notifications** — SMS confirmations, smart reminders, in-app alerts

### Setup & Configuration
- **Settings** — Clinic profile, localization guards, SMS gateway, AI persona tuning
- **AI Agents** — Voice agent prompt configuration, intent mapping, model selection
- **Doctor Management** — Add/edit/deactivate doctors with specialties and fees

## Scope

### In Scope
- Healthcare AI voice agents with real-time conversation capabilities
- Appointment booking and scheduling automation
- Patient management with full EHR (medical records, vitals, diagnoses, prescriptions)
- Lab test ordering and results delivery
- Pharmacy dispensing workflow
- Emergency case and ambulance management
- Telemedicine session scheduling
- Inventory management with low-stock alerts
- Staff scheduling and time-off workflows
- Billing with invoice generation, payment processing, insurance claims
- Analytics with predictive insights (no-show risk, staffing, outbreak detection)
- Multilingual support (Bangla primary, English/Banglish secondary)
- Bangladesh-specific: bKash payments, Jumma prayer guard, public holiday blocks, Unicode SMS, local SMS gateway (SSL Wireless)
- Role-based access (Admin, Receptionist, Doctor)
- SMS notifications and smart reminders
- Pre-visit questionnaires and group/family bookings
- Waiting list management and recurring appointments
- Symptom-to-doctor matching

### Out of Scope
- Patient-facing mobile app (clinic admin portal only for now)
- Desktop/native applications (web-only)
- Blockchain or cryptocurrency payments
- Generic hospital-wide ERP (focused on outpatient clinics)
- HL7/FHIR interoperability (future consideration)

## Success Criteria

1. A patient can call, converse in Bangla/English, and book an appointment end-to-end without human intervention
2. Clinic staff can manage all operations from a single dashboard
3. bKash payments are processed and reconciled automatically
4. Backend test suite exceeds 150 tests with >90% coverage on core services
5. System handles 200+ concurrent calls with <1s STT→LLM→TTS latency
6. Frontend builds in under 30s with zero TypeScript errors
7. The platform can be deployed as a reusable SaaS for any clinic
8. AI voice agent handles 8+ distinct medical intents accurately
