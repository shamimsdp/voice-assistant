import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AnalyticsSummary {
  period_days: number;
  total_calls: number;
  calls_booked: number;
  booking_rate_pct: number;
  total_appointments: number;
  total_revenue_bdt: number;
  avg_call_duration_seconds: number;
}

export interface CallsByDayEntry {
  day: string;
  total: number;
  booked: number;
}

export interface LanguageBreakdown {
  language: string;
  count: number;
}

export interface KpiDashboard {
  period_days: number;
  appointments: { total: number; confirmed: number; completed: number; no_shows: number; cancelled: number; utilization_rate_pct: number; no_show_rate_pct: number; cancellation_rate_pct: number };
  calls: { total: number; booked: number; booking_rate_pct: number };
  revenue: { total_booked_bdt: number; collected_bdt: number; collection_rate_pct: number };
  satisfaction: { avg_nps: number | null; nps_score: number | null; total_responses: number; promoters: number; detractors: number };
}

export interface Demographics {
  total_patients: number;
  gender_distribution: Record<string, number>;
  age_groups: Record<string, number>;
  language_distribution: Record<string, number>;
}

export interface TrendsResponse {
  period_months: number;
  monthly_appointment_volume: Record<string, number>;
  top_specialties: { specialty: string; appointments: number }[];
  status_distribution: Record<string, number>;
}

export interface PredictiveStaffing {
  target_date: string;
  day_of_week: string;
  predicted_appointments: number;
  historical_avg: number;
  growth_factor: number;
  peak_hours: { hour: string; avg_appointments: number }[];
  recommended_doctors: number;
  recommended_staff: number;
}

export interface OutbreakTrends {
  period_days: number;
  total_appointments_analyzed: number;
  symptom_frequency: Record<string, number>;
  rising_symptoms: { symptom: string; previous_week: number; current_week: number; increase_pct: number }[];
  alert: boolean;
}

export interface NoShowRisk {
  appointment_id: string;
  no_show_risk: number;
  risk_level: "low" | "medium" | "high";
  recommended_action: string;
}

export interface SmartReminderResponse {
  appointment_id: string;
  no_show_risk: number;
  reminder_sent: boolean;
  reminder_count: number;
}

export interface Appointment {
  id: string;
  scheduled_at: string;
  status: string;
  payment_status: string;
  consultation_fee: number;
  advance_amount: number;
  notes: string | null;
  notes_bn?: string | null;
  doctor_id: string;
  patient_id: string;
  duration_min?: number;
  appointment_type?: string | null;
  no_show_risk?: number | null;
  reminder_sent?: boolean;
  reminder_count?: number;
  satisfaction_nps?: number | null;
}

export interface CallLogSummary {
  id: string;
  caller_phone: string;
  status: string;
  direction: string;
  started_at: string;
  duration_seconds: number;
  detected_language: string | null;
  appointment_booked: boolean;
  appointment_id: string | null;
}

export interface CallLogDetail {
  id: string;
  caller_phone: string;
  status: string;
  direction: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  detected_language: string | null;
  transcript: unknown[];
  appointment_booked: boolean;
  appointment_id: string | null;
  stt_confidence: number | null;
  llm_tokens_used: number | null;
}

export interface ClinicProfile {
  id: string;
  name: string;
  name_bn: string | null;
  phone: string | null;
  address: string | null;
  address_bn: string | null;
  district: string | null;
  working_hours: Record<string, unknown> | null;
  bkash_merchant_number: string | null;
  twilio_number: string | null;
}

export interface Doctor {
  id: string;
  name: string;
  name_bn: string | null;
  specialty: string | null;
  specialty_bn: string | null;
  qualification?: string | null;
  phone?: string | null;
  consultation_fee: number;
  slot_duration_minutes: number;
  available_slots: Record<string, unknown> | null;
  is_active?: boolean;
}

export interface Patient {
  id: string;
  phone: string;
  name: string | null;
  name_bn: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  email: string | null;
  preferred_language: string;
  is_active: boolean;
  created_at: string;
  appointment_count: number;
}

export interface ScheduleEntry {
  id: string;
  doctor_id: string;
  shift_type: string;
  start_time: string;
  end_time: string;
  max_patients: number;
  room_number: string | null;
}

export interface WeeklySchedule {
  clinic_id: string;
  schedule: Record<string, ScheduleEntry[]>;
}

export interface DoctorAvailability {
  date: string;
  doctor_id?: string;
  available: boolean;
  reason?: string;
  shifts?: { shift_type: string; start_time: string; end_time: string; max_patients: number; override_type?: string }[];
}

export interface TimeOffEntry {
  id: string;
  doctor_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  reason_bn: string | null;
  status: string;
  approved_by: string | null;
}

export interface MedicalRecord {
  id: string;
  visit_date: string;
  visit_type: string;
  doctor_id: string;
  chief_complaint: string | null;
  assessment: string | null;
  plan: string | null;
  created_at: string;
}

export interface RecordDetail {
  id: string;
  visit_date: string;
  visit_type: string;
  doctor_id: string;
  chief_complaint: string | null;
  history_of_present_illness: string | null;
  assessment: string | null;
  plan: string | null;
  clinical_notes: string | null;
  vitals: { parameter_name: string; value: number; unit: string }[];
  diagnoses: { name: string; icd_code: string | null; type: string }[];
  prescriptions: { medicine_name: string; dosage: string; frequency: string; duration_days: number | null; route: string; instructions: string | null }[];
}

export interface PatientSummary {
  total_visits: number;
  visit_types: Record<string, number>;
  chronic_diagnoses: string[];
  active_allergies: { allergen: string; severity: string; reaction: string | null }[];
  immunizations: { vaccine: string; dose: number | null; date: string; next_due: string | null }[];
  family_history: { relationship: string; condition: string }[];
}

export interface Allergy {
  id: string;
  allergen: string;
  severity: string;
  reaction: string | null;
}

export interface Immunization {
  id: string;
  vaccine: string;
  dose: number | null;
  date: string;
  next_due: string | null;
}

export interface InventorySummary {
  total_items: number;
  total_stock_units: number;
  total_stock_value_bdt: number;
  by_alert_level: Record<string, number>;
  items: {
    id: string;
    name: string;
    name_bn: string | null;
    category: string;
    current_stock: number;
    min_stock: number;
    unit: string;
    alert_level: string;
    batch_number: string | null;
    expiry_date: string | null;
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  name_bn: string | null;
  category: string;
  generic_name: string | null;
  current_stock: number;
  min_stock: number;
  unit: string;
  unit_price: number;
  selling_price: number;
  alert_level: string;
  expiry_date: string | null;
  batch_number: string | null;
  requires_prescription: boolean;
}

export interface InventoryTransaction {
  id: string;
  item_id: string;
  transaction_type: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

export interface Supply {
  id: string;
  name: string;
  name_bn: string | null;
  supply_type: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  unit_price: number;
  low_stock: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  model: string | null;
  serial_number: string | null;
  status: string;
  purchase_date: string | null;
  warranty_expiry: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  maintenance_overdue: boolean;
}

export interface LabTest {
  id: string;
  name: string;
  name_bn: string | null;
  category: string;
  specimen_type: string;
  fee: number;
  turnaround_hours: number;
  preparation_instructions: string | null;
  preparation_instructions_bn: string | null;
}

export interface LabOrder {
  id: string;
  order_number: string;
  patient_id: string;
  doctor_id: string;
  status: string;
  priority: string;
  total_fee: number;
  is_paid: boolean;
  clinical_notes: string | null;
  ordered_at: string;
  completed_at: string | null;
}

export interface LabResult {
  id: string;
  test_id: string;
  parameter_name: string;
  result_value: string;
  unit: string | null;
  reference_range: string | null;
  is_abnormal: boolean | null;
  notes: string | null;
  performed_by: string | null;
  verified_by: string | null;
  verified_at: string | null;
}

export interface ImagingStudy {
  id: string;
  study_type: string;
  body_part: string;
  status: string;
  clinical_reason: string | null;
  findings: string | null;
  impression: string | null;
  fee: number;
  is_paid: boolean;
  ordered_at: string;
  reported_at: string | null;
}

export interface PharmacyOrder {
  id: string;
  order_number: string;
  patient_id: string;
  dispense_status: string;
  delivery_status: string | null;
  total_amount: number;
  is_paid: boolean;
  delivery_address: string | null;
  delivery_partner: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  issued_at: string | null;
}

export interface InsuranceClaim {
  id: string;
  provider: string;
  claim_amount: number;
  status: string;
  submitted_at: string | null;
}

export interface PaymentHistoryEntry {
  appointment_id: string;
  scheduled_at: string;
  patient_name: string;
  patient_phone: string;
  consultation_fee: number;
  advance_amount: number;
  payment_status: string;
  bkash_trx_id: string | null;
}

export interface FinancialReport {
  period: { start: string; end: string };
  summary: { total_appointments: number; total_revenue_bdt: number; collected_bdt: number; pending_bdt: number; refunded_bdt: number; invoice_total_bdt: number; collection_rate_pct: number };
  breakdown: { paid_count: number; unpaid_count: number; refunded_count: number };
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_min: number;
  price: number;
  category: string | null;
  is_active: boolean;
}

export interface Agent {
  id: string;
  name: string;
  voice: string;
  tone: string;
  greeting_message: string | null;
  system_prompt: string | null;
  is_active: boolean;
  is_predefined: boolean;
  service_ids: string[];
}

export interface TelemedicineSession {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_min: number;
  status: string;
  meeting_url: string | null;
  room_name: string | null;
}

export interface EmergencyCase {
  id: string;
  case_number: string;
  triage_level: string;
  status: string;
  patient_name: string | null;
  chief_complaint: string;
  triaged_at: string;
  age: number | null;
  gender: string | null;
  triaged_by: string | null;
  treated_by: string | null;
  disposition: string | null;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  type: string;
  title: string;
  title_bn: string | null;
  body: string | null;
  body_bn: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// ─── Notification Hooks ─────────────────────────────────────────────────────

export function useNotifications(params?: { unread_only?: boolean; limit?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (params?.unread_only) qs.set("unread_only", "true");
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  return useQuery<Notification[]>({ queryKey: ["notifications", params], queryFn: () => api.get(`/api/notifications?${qs}`) });
}

export function useUnreadCount() {
  return useQuery<{ count: number }>({ queryKey: ["notifications", "unread-count"], queryFn: () => api.get("/api/notifications/unread-count"), refetchInterval: 30000 });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({
    mutationFn: (id) => api.patch(`/api/notifications/${id}/read`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation<any, Error, void>({
    mutationFn: () => api.post("/api/notifications/read-all", {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); },
  });
}

// ─── Analytics Hooks ────────────────────────────────────────────────────────

export function useAnalyticsSummary(days = 7) {
  return useQuery<AnalyticsSummary>({ queryKey: ["analytics", "summary", days], queryFn: () => api.get(`/api/analytics/summary?days=${days}`) });
}

export function useCallsByDay(days = 14) {
  return useQuery<CallsByDayEntry[]>({ queryKey: ["analytics", "calls-by-day", days], queryFn: () => api.get(`/api/analytics/calls-by-day?days=${days}`) });
}

export function useLanguageBreakdown(days = 30) {
  return useQuery<LanguageBreakdown[]>({ queryKey: ["analytics", "language", days], queryFn: () => api.get(`/api/analytics/language-breakdown?days=${days}`) });
}

export function useKpiDashboard(days = 30) {
  return useQuery<KpiDashboard>({ queryKey: ["analytics", "v2", "kpi", days], queryFn: () => api.get(`/api/analytics/v2/kpi?days=${days}`) });
}

export function useDemographics() {
  return useQuery<Demographics>({ queryKey: ["analytics", "v2", "demographics"], queryFn: () => api.get("/api/analytics/v2/demographics") });
}

export function useTrends(months = 6) {
  return useQuery<TrendsResponse>({ queryKey: ["analytics", "v2", "trends", months], queryFn: () => api.get(`/api/analytics/v2/trends?months=${months}`) });
}

export function usePredictiveStaffing(targetDate: string) {
  return useQuery<PredictiveStaffing>({ queryKey: ["analytics", "v2", "predictive-staffing", targetDate], queryFn: () => api.get(`/api/analytics/v2/predictive-staffing?target_date=${targetDate}`), enabled: !!targetDate });
}

export function useOutbreakTrends(days = 30) {
  return useQuery<OutbreakTrends>({ queryKey: ["analytics", "v2", "outbreak", days], queryFn: () => api.get(`/api/analytics/v2/outbreak-trends?days=${days}`) });
}

export function useNoShowRisk(appointmentId: string | null) {
  return useQuery<NoShowRisk>({ queryKey: ["analytics", "v2", "no-show-risk", appointmentId], queryFn: () => api.get(`/api/analytics/v2/appointments/${appointmentId}/no-show-risk`), enabled: !!appointmentId });
}

export function useSendReminder() {
  return useMutation<SmartReminderResponse, Error, string>({ mutationFn: (appointmentId) => api.post(`/api/analytics/v2/appointments/${appointmentId}/remind`) });
}

export function useNoShowSummary(days = 30) {
  return useQuery<any[]>({ queryKey: ["analytics", "v2", "no-show-summary", days], queryFn: () => api.get(`/api/analytics/v2/no-show-summary?days=${days}`) });
}

// ─── Appointments Hooks ─────────────────────────────────────────────────────

export function useAppointments(params?: { date?: string; status?: string; doctor_id?: string }) {
  const qs = new URLSearchParams();
  if (params?.date) qs.set("date", params.date);
  if (params?.status) qs.set("status", params.status);
  if (params?.doctor_id) qs.set("doctor_id", params.doctor_id);
  return useQuery<Appointment[]>({ queryKey: ["appointments", params], queryFn: () => api.get(`/api/appointments?${qs}`) });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/appointments", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.patch(`/api/appointments/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => api.delete(`/api/appointments/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
}

// ─── Call Logs Hooks ────────────────────────────────────────────────────────

export function useCallLogs(limit = 50, offset = 0) {
  return useQuery<CallLogSummary[]>({ queryKey: ["calls", limit, offset], queryFn: () => api.get(`/api/calls?limit=${limit}&offset=${offset}`) });
}

export function useCallDetail(callId: string | null) {
  return useQuery<CallLogDetail>({ queryKey: ["calls", callId], queryFn: () => api.get(`/api/calls/${callId}`), enabled: !!callId });
}

// ─── Clinics Hooks ──────────────────────────────────────────────────────────

export function useClinicProfile() {
  return useQuery<ClinicProfile>({ queryKey: ["clinic", "me"], queryFn: () => api.get("/api/clinics/me") });
}

export function useUpdateClinic() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.patch("/api/clinics/me", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["clinic"] }) });
}

export function useDoctors() {
  return useQuery<Doctor[]>({ queryKey: ["doctors"], queryFn: () => api.get("/api/clinics/doctors") });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/clinics/doctors", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }) });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({ mutationFn: (id) => api.delete(`/api/clinics/doctors/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }) });
}

// ─── Patients Hooks ─────────────────────────────────────────────────────────

export function usePatients(search?: string) {
  return useQuery<Patient[]>({ queryKey: ["patients", search], queryFn: () => api.get(`/api/patients?search=${search || ""}`) });
}

export function usePatient(id: string | null) {
  return useQuery<Patient>({ queryKey: ["patient", id], queryFn: () => api.get(`/api/patients/${id}`), enabled: !!id });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/patients", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }) });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.put(`/api/patients/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["patients"] }); qc.invalidateQueries({ queryKey: ["patient"] }); } });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (id) => api.delete(`/api/patients/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }) });
}

// ─── Staff Scheduling Hooks ─────────────────────────────────────────────────

export function useWeeklySchedule(doctorId?: string) {
  return useQuery<WeeklySchedule>({ queryKey: ["schedule", doctorId], queryFn: () => api.get(`/api/staff-scheduling/weekly-schedule${doctorId ? `?doctor_id=${doctorId}` : ""}`) });
}

export function useDoctorAvailability(doctorId: string, targetDate: string) {
  return useQuery<DoctorAvailability>({ queryKey: ["schedule", "availability", doctorId, targetDate], queryFn: () => api.get(`/api/staff-scheduling/availability?doctor_id=${doctorId}&target_date=${targetDate}`), enabled: !!doctorId && !!targetDate });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/staff-scheduling/schedules", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }) });
}

export function useTimeOffRequests(params?: { status?: string; doctor_id?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.doctor_id) qs.set("doctor_id", params.doctor_id);
  return useQuery<TimeOffEntry[]>({ queryKey: ["schedule", "time-off", params], queryFn: () => api.get(`/api/staff-scheduling/time-off?${qs}`) });
}

export function useCreateTimeOff() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/staff-scheduling/time-off", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule", "time-off"] }) });
}

export function useApproveTimeOff() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; approved: boolean }>({ mutationFn: ({ id, approved }) => api.post(`/api/staff-scheduling/time-off/${id}/approve`, { approved }), onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule", "time-off"] }) });
}

export function useCreateOverride() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/staff-scheduling/overrides", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule"] }) });
}

// ─── EHR Hooks ──────────────────────────────────────────────────────────────

export function usePatientSummary(patientId: string | null) {
  return useQuery<PatientSummary>({ queryKey: ["ehr", "summary", patientId], queryFn: () => api.get(`/api/ehr/patients/${patientId}/summary`), enabled: !!patientId });
}

export function useMedicalRecords(patientId: string | null) {
  return useQuery<MedicalRecord[]>({ queryKey: ["ehr", "records", patientId], queryFn: () => api.get(`/api/ehr/records?patient_id=${patientId}`), enabled: !!patientId });
}

export function useRecordDetail(recordId: string | null) {
  return useQuery<RecordDetail>({ queryKey: ["ehr", "record", recordId], queryFn: () => api.get(`/api/ehr/records/${recordId}`), enabled: !!recordId });
}

export function useCreateRecord() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/ehr/records", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ehr"] }) });
}

export function usePatientAllergies(patientId: string | null) {
  return useQuery<Allergy[]>({ queryKey: ["ehr", "allergies", patientId], queryFn: () => api.get(`/api/ehr/patients/${patientId}/allergies`), enabled: !!patientId });
}

export function useAddAllergy() {
  const qc = useQueryClient();
  return useMutation<any, Error, { patientId: string; data: any }>({ mutationFn: ({ patientId, data }) => api.post(`/api/ehr/patients/${patientId}/allergies`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ehr", "allergies"] }) });
}

export function usePatientImmunizations(patientId: string | null) {
  return useQuery<Immunization[]>({ queryKey: ["ehr", "immunizations", patientId], queryFn: () => api.get(`/api/ehr/patients/${patientId}/immunizations`), enabled: !!patientId });
}

export function useAddImmunization() {
  const qc = useQueryClient();
  return useMutation<any, Error, { patientId: string; data: any }>({ mutationFn: ({ patientId, data }) => api.post(`/api/ehr/patients/${patientId}/immunizations`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ehr", "immunizations"] }) });
}

export function useAddFamilyHistory() {
  const qc = useQueryClient();
  return useMutation<any, Error, { patientId: string; data: any }>({ mutationFn: ({ patientId, data }) => api.post(`/api/ehr/patients/${patientId}/family-history`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["ehr", "summary"] }) });
}

// ─── Inventory Hooks ────────────────────────────────────────────────────────

export function useInventorySummary(category?: string, alertLevel?: string) {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (alertLevel) qs.set("alert_level", alertLevel);
  return useQuery<InventorySummary>({ queryKey: ["inventory", "summary", category, alertLevel], queryFn: () => api.get(`/api/inventory/summary?${qs}`) });
}

export function useInventorySearch(q?: string, category?: string) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (category) qs.set("category", category);
  return useQuery<InventoryItem[]>({ queryKey: ["inventory", "search", q, category], queryFn: () => api.get(`/api/inventory/search?${qs}`) });
}

export function useCreateInventoryItem() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/inventory/items", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }) });
}

export function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/inventory/stock", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }) });
}

export function useInventoryTransactions(itemId?: string) {
  const qs = itemId ? `?item_id=${itemId}` : "";
  return useQuery<InventoryTransaction[]>({ queryKey: ["inventory", "transactions", itemId], queryFn: () => api.get(`/api/inventory/transactions${qs}`) });
}

export function useSupplies(supplyType?: string) {
  const qs = supplyType ? `?supply_type=${supplyType}` : "";
  return useQuery<Supply[]>({ queryKey: ["inventory", "supplies", supplyType], queryFn: () => api.get(`/api/inventory/supplies${qs}`) });
}

export function useCreateSupply() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/inventory/supplies", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "supplies"] }) });
}

export function useEquipment(status?: string) {
  const qs = status ? `?status=${status}` : "";
  return useQuery<Equipment[]>({ queryKey: ["inventory", "equipment", status], queryFn: () => api.get(`/api/inventory/equipment${qs}`) });
}

export function useCreateEquipment() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/inventory/equipment", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory", "equipment"] }) });
}

// ─── Lab Hooks ──────────────────────────────────────────────────────────────

export function useLabTests(category?: string) {
  return useQuery<LabTest[]>({ queryKey: ["lab", "tests", category], queryFn: () => api.get(`/api/lab/tests${category ? `?category=${category}` : ""}`) });
}

export function useCreateLabTest() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/lab/tests", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["lab", "tests"] }) });
}

export function useLabOrders(params?: { patient_id?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.patient_id) qs.set("patient_id", params.patient_id);
  if (params?.status) qs.set("status", params.status);
  return useQuery<LabOrder[]>({ queryKey: ["lab", "orders", params], queryFn: () => api.get(`/api/lab/orders?${qs}`) });
}

export function usePlaceLabOrder() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/lab/orders", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["lab", "orders"] }) });
}

export function useLabResults(orderId: string | null) {
  return useQuery<LabResult[]>({ queryKey: ["lab", "results", orderId], queryFn: () => api.get(`/api/lab/orders/${orderId}/results`), enabled: !!orderId });
}

export function useAddLabResult() {
  const qc = useQueryClient();
  return useMutation<any, Error, { orderId: string; data: any }>({ mutationFn: ({ orderId, data }) => api.post(`/api/lab/orders/${orderId}/results`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["lab", "results"] }) });
}

export function useCompleteLabOrder() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (orderId) => api.post(`/api/lab/orders/${orderId}/complete`), onSuccess: () => qc.invalidateQueries({ queryKey: ["lab", "orders"] }) });
}

export function useImaging(params?: { patient_id?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.patient_id) qs.set("patient_id", params.patient_id);
  if (params?.status) qs.set("status", params.status);
  return useQuery<ImagingStudy[]>({ queryKey: ["lab", "imaging", params], queryFn: () => api.get(`/api/lab/imaging?${qs}`) });
}

export function useCreateImaging() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/lab/imaging", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["lab", "imaging"] }) });
}

// ─── Pharmacy Hooks ─────────────────────────────────────────────────────────

export function usePharmacyOrders(params?: { patient_id?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.patient_id) qs.set("patient_id", params.patient_id);
  if (params?.status) qs.set("status", params.status);
  return useQuery<PharmacyOrder[]>({ queryKey: ["pharmacy", "orders", params], queryFn: () => api.get(`/api/pharmacy/orders?${qs}`) });
}

export function useCreatePharmacyOrder() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/pharmacy/orders", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy", "orders"] }) });
}

export function useAddPharmacyItem() {
  const qc = useQueryClient();
  return useMutation<any, Error, { orderId: string; data: any }>({ mutationFn: ({ orderId, data }) => api.post(`/api/pharmacy/orders/${orderId}/items`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy", "orders"] }) });
}

export function useDispenseOrder() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (orderId) => api.post(`/api/pharmacy/orders/${orderId}/dispense`), onSuccess: () => qc.invalidateQueries({ queryKey: ["pharmacy", "orders"] }) });
}

// ─── Billing / Payments Hooks ───────────────────────────────────────────────

export function useInvoices(status?: string) {
  return useQuery<Invoice[]>({ queryKey: ["payments", "invoices", status], queryFn: () => api.get(`/api/payments/invoices${status ? `?status=${status}` : ""}`) });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/payments/invoices", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["payments", "invoices"] }) });
}

export function useInsuranceClaims(status?: string) {
  return useQuery<InsuranceClaim[]>({ queryKey: ["payments", "claims", status], queryFn: () => api.get(`/api/payments/insurance-claims${status ? `?status=${status}` : ""}`) });
}

export function useCreateInsuranceClaim() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/payments/insurance-claims", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["payments", "claims"] }) });
}

export function useSubmitClaim() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (claimId) => api.post(`/api/payments/insurance-claims/${claimId}/submit`), onSuccess: () => qc.invalidateQueries({ queryKey: ["payments", "claims"] }) });
}

export function usePaymentHistory(days = 30) {
  return useQuery<PaymentHistoryEntry[]>({ queryKey: ["payments", "history", days], queryFn: () => api.get(`/api/payments/history?days=${days}`) });
}

export function useFinancialReport(startDate: string, endDate: string) {
  return useQuery<FinancialReport>({ queryKey: ["payments", "report", startDate, endDate], queryFn: () => api.get(`/api/payments/reports/financial?start_date=${startDate}&end_date=${endDate}`), enabled: !!startDate && !!endDate });
}

// ─── Services Hooks ─────────────────────────────────────────────────────────

export function useServices(category?: string) {
  return useQuery<Service[]>({ queryKey: ["services", category], queryFn: () => api.get(`/api/services${category ? `?category=${category}` : ""}`) });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/services", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }) });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.put(`/api/services/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }) });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (id) => api.delete(`/api/services/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["services"] }) });
}

// ─── AI Agents Hooks ────────────────────────────────────────────────────────

export function useAgents() {
  return useQuery<Agent[]>({ queryKey: ["agents"], queryFn: () => api.get("/api/agents") });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/agents", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }) });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.put(`/api/agents/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }) });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (id) => api.delete(`/api/agents/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }) });
}

export function useToggleAgent() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (id) => api.patch(`/api/agents/${id}/toggle`), onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }) });
}

export function useAssignAgentServices() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; service_ids: string[] }>({ mutationFn: ({ id, service_ids }) => api.post(`/api/agents/${id}/services`, { service_ids }), onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }) });
}

// ─── Telemedicine Hooks ─────────────────────────────────────────────────────

export function useTelemedicineSessions(params?: { patient_id?: string; doctor_id?: string; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.patient_id) qs.set("patient_id", params.patient_id);
  if (params?.doctor_id) qs.set("doctor_id", params.doctor_id);
  if (params?.status) qs.set("status", params.status);
  return useQuery<TelemedicineSession[]>({ queryKey: ["telemedicine", params], queryFn: () => api.get(`/api/telemedicine/sessions?${qs}`) });
}

export function useScheduleTelemedicine() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/telemedicine/sessions", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["telemedicine"] }) });
}

export function useUpdateSessionStatus() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; status: string }>({ mutationFn: ({ id, status }) => api.patch(`/api/telemedicine/sessions/${id}/status`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ["telemedicine"] }) });
}

// ─── Emergency Hooks ────────────────────────────────────────────────────────

export function useEmergencyCases(params?: { status?: string; triage_level?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.triage_level) qs.set("triage_level", params.triage_level);
  return useQuery<EmergencyCase[]>({ queryKey: ["emergency", "cases", params], queryFn: () => api.get(`/api/emergency/cases?${qs}`) });
}

export function useCreateEmergencyCase() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/emergency/cases", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency", "cases"] }) });
}

export function useUpdateCaseStatus() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.patch(`/api/emergency/cases/${id}/status`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency", "cases"] }) });
}

export function useDispatchAmbulance() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/emergency/ambulance", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["emergency"] }) });
}

// ─── Website Hooks ──────────────────────────────────────────────────────────

export interface ClinicWebsite {
  id: string;
  clinic_id: string;
  custom_domain: string | null;
  theme_color: string;
  hero_title: string | null;
  hero_title_bn: string | null;
  hero_subtitle: string | null;
  hero_subtitle_bn: string | null;
  about_text: string | null;
  about_text_bn: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  address_bn: string | null;
  working_hours: Record<string, unknown> | null;
  services_heading: string | null;
  services_heading_bn: string | null;
  doctors_heading: string | null;
  doctors_heading_bn: string | null;
  show_doctors: boolean;
  show_services: boolean;
  show_appointment_button: boolean;
  footer_text: string | null;
  footer_text_bn: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export function useClinicWebsite() {
  return useQuery<ClinicWebsite | null>({ queryKey: ["website"], queryFn: () => api.get("/api/website") });
}

export function useUpdateWebsite() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.put("/api/website", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["website"] }) });
}

// ─── Support Ticket Hooks ────────────────────────────────────────────────────

export interface SupportTicket {
  id: string;
  created_by: string;
  assigned_to: string | null;
  subject: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  comments?: Array<{
    id: string;
    user_id: string;
    body: string;
    created_at: string;
  }>;
}

export function useSupportTickets(params?: { status?: string; priority?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.priority) qs.set("priority", params.priority);
  return useQuery<SupportTicket[]>({ queryKey: ["support", "tickets", params], queryFn: () => api.get(`/api/support/tickets?${qs}`) });
}

export function useSupportTicket(id: string) {
  return useQuery<SupportTicket>({ queryKey: ["support", "tickets", id], queryFn: () => api.get(`/api/support/tickets/${id}`), enabled: !!id });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/support/tickets", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["support", "tickets"] }) });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.patch(`/api/support/tickets/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["support", "tickets"] }) });
}

export function useAddTicketComment() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; body: string }>({ mutationFn: ({ id, body }) => api.post(`/api/support/tickets/${id}/comments`, { body }), onSuccess: () => qc.invalidateQueries({ queryKey: ["support", "tickets"] }) });
}

// ─── Knowledge Base Hooks ───────────────────────────────────────────────────

export interface KnowledgeArticle {
  id: string;
  title: string;
  title_bn: string | null;
  content: string;
  content_bn: string | null;
  category: string | null;
  tags: string[] | null;
  is_public: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeArticles(params?: { category?: string; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.q) qs.set("q", params.q);
  return useQuery<KnowledgeArticle[]>({ queryKey: ["knowledge", params], queryFn: () => api.get(`/api/knowledge?${qs}`) });
}

export function useKnowledgeCategories() {
  return useQuery<string[]>({ queryKey: ["knowledge", "categories"], queryFn: () => api.get("/api/knowledge/categories") });
}

export function useKnowledgeArticle(id: string) {
  return useQuery<KnowledgeArticle>({ queryKey: ["knowledge", id], queryFn: () => api.get(`/api/knowledge/${id}`), enabled: !!id });
}

export function useCreateKnowledgeArticle() {
  const qc = useQueryClient();
  return useMutation<any, Error, any>({ mutationFn: (data) => api.post("/api/knowledge", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }) });
}

export function useUpdateKnowledgeArticle() {
  const qc = useQueryClient();
  return useMutation<any, Error, { id: string; data: any }>({ mutationFn: ({ id, data }) => api.patch(`/api/knowledge/${id}`, data), onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }) });
}

export function useDeleteKnowledgeArticle() {
  const qc = useQueryClient();
  return useMutation<any, Error, string>({ mutationFn: (id) => api.delete(`/api/knowledge/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["knowledge"] }) });
}

// ─── Patient Portal Hooks ───────────────────────────────────────────────────

export interface PatientAppointment {
  id: string;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string;
  payment_status: string;
  fee: number | null;
  doctor_name: string | null;
  doctor_specialty: string | null;
  created_at: string;
}

export interface PatientInvoice {
  id: string;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  issued_at: string | null;
  due_at: string | null;
}

const patientApi = {
  get: async <T = any>(path: string, token: string): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async <T = any>(path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
};

export function usePatientAppointments(token: string | null) {
  return useQuery<PatientAppointment[]>({
    queryKey: ["patient-portal", "appointments", token],
    queryFn: () => patientApi.get("/api/patient-portal/appointments", token!),
    enabled: !!token,
  });
}

export function usePatientInvoices(token: string | null) {
  return useQuery<PatientInvoice[]>({
    queryKey: ["patient-portal", "invoices", token],
    queryFn: () => patientApi.get("/api/patient-portal/invoices", token!),
    enabled: !!token,
  });
}
