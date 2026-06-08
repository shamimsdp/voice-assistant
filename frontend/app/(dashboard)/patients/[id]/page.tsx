"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Phone,
  CalendarDays,
  Mail,
  MapPin,
  Activity,
  FileText,
  HeartPulse,
  Stethoscope,
  Pill,
  AlertTriangle,
  Syringe,
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

interface Patient {
  id: string;
  phone: string;
  name: string;
  nameBn: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  preferredLanguage: string;
  isActive: boolean;
}

interface MedRecord {
  id: string;
  visitDate: string;
  visitType: string;
  doctor: string;
  chiefComplaint: string;
  assessment: string;
  plan: string;
  vitals: Vital[];
  diagnoses: Diagnosis[];
  prescriptions: Prescription[];
}

interface Vital {
  id: string;
  parameter: string;
  value: number;
  unit: string;
}

interface Diagnosis {
  id: string;
  name: string;
  icdCode: string;
  type: string;
}

interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  route: string;
  instructions: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  reaction: string;
}

interface Immunization {
  id: string;
  vaccine: string;
  dose: number;
  date: string;
  nextDue: string;
  administeredBy: string;
}

interface FamilyEntry {
  id: string;
  relationship: string;
  condition: string;
  notes: string;
}

// ── Mock Patient ─────────────────────────────────────────────────────────────
const PATIENT: Patient = {
  id: "p1",
  phone: "01711223344",
  name: "Imran Khan",
  nameBn: "ইমরান খান",
  email: "imran.khan@email.com",
  dateOfBirth: "1985-06-15",
  gender: "Male",
  address: "42 Gulshan Avenue, Dhaka 1212",
  preferredLanguage: "bn-BD",
  isActive: true,
};

const MOCK_RECORDS: MedRecord[] = [
  {
    id: "r1",
    visitDate: "2026-06-04",
    visitType: "follow_up",
    doctor: "Dr. Shah Alam",
    chiefComplaint: "Chest discomfort, mild shortness of breath",
    assessment: "Stable angina. Patient responding well to medication. Continue current regimen.",
    plan: "Follow up in 3 months. ECG at next visit. Continue exercise regimen.",
    vitals: [
      { id: "v1", parameter: "Blood Pressure", value: 128, unit: "mmHg" },
      { id: "v2", parameter: "Heart Rate", value: 82, unit: "bpm" },
      { id: "v3", parameter: "Temperature", value: 36.8, unit: "celsius" },
      { id: "v4", parameter: "Weight", value: 78, unit: "kg" },
      { id: "v5", parameter: "Height", value: 172, unit: "cm" },
    ],
    diagnoses: [
      { id: "d1", name: "Stable Angina Pectoris", icdCode: "I20.8", type: "primary" },
      { id: "d2", name: "Hypertension", icdCode: "I10", type: "secondary" },
    ],
    prescriptions: [
      { id: "p1", medicine: "Aspirin 75mg", dosage: "75mg", frequency: "Once daily", durationDays: 90, route: "oral", instructions: "Take after breakfast" },
      { id: "p2", medicine: "Atorvastatin 20mg", dosage: "20mg", frequency: "Once daily", durationDays: 90, route: "oral", instructions: "Take at bedtime" },
    ],
  },
  {
    id: "r2",
    visitDate: "2026-03-15",
    visitType: "new",
    doctor: "Dr. Shah Alam",
    chiefComplaint: "Chest pain on exertion, fatigue, occasional dizziness",
    assessment: "Initial diagnosis of angina with underlying hypertension. Started on medication. Patient advised lifestyle modifications.",
    plan: "Cardiac workup completed. Stress test scheduled. Dietary consult recommended.",
    vitals: [
      { id: "v6", parameter: "Blood Pressure", value: 145, unit: "mmHg" },
      { id: "v7", parameter: "Heart Rate", value: 88, unit: "bpm" },
      { id: "v8", parameter: "Temperature", value: 36.6, unit: "celsius" },
      { id: "v9", parameter: "Weight", value: 82, unit: "kg" },
      { id: "v10", parameter: "Height", value: 172, unit: "cm" },
    ],
    diagnoses: [
      { id: "d3", name: "Unstable Angina", icdCode: "I20.0", type: "primary" },
      { id: "d4", name: "Essential Hypertension", icdCode: "I10", type: "primary" },
    ],
    prescriptions: [
      { id: "p3", medicine: "Aspirin 75mg", dosage: "75mg", frequency: "Once daily", durationDays: 30, route: "oral", instructions: "Take after breakfast" },
      { id: "p4", medicine: "Atorvastatin 20mg", dosage: "20mg", frequency: "Once daily", durationDays: 30, route: "oral", instructions: "Take at bedtime" },
      { id: "p5", medicine: "Metoprolol 50mg", dosage: "50mg", frequency: "Twice daily", durationDays: 30, route: "oral", instructions: "Take with meals" },
    ],
  },
  {
    id: "r3",
    visitDate: "2025-11-20",
    visitType: "routine_checkup",
    doctor: "Dr. Farzana Huq",
    chiefComplaint: "Annual health checkup",
    assessment: "Generally healthy. Mildly elevated BP noted. Lab results within normal range except borderline cholesterol.",
    plan: "Repeat lipid panel in 6 months. Lifestyle counseling provided.",
    vitals: [
      { id: "v11", parameter: "Blood Pressure", value: 135, unit: "mmHg" },
      { id: "v12", parameter: "Heart Rate", value: 76, unit: "bpm" },
      { id: "v13", parameter: "Temperature", value: 36.5, unit: "celsius" },
      { id: "v14", parameter: "Weight", value: 80, unit: "kg" },
    ],
    diagnoses: [],
    prescriptions: [],
  },
];

const MOCK_ALLERGIES: Allergy[] = [
  { id: "a1", allergen: "Penicillin", severity: "moderate", reaction: "Skin rash, itching" },
  { id: "a2", allergen: "Sulfa Drugs", severity: "mild", reaction: "Nausea" },
];

const MOCK_IMMUNIZATIONS: Immunization[] = [
  { id: "i1", vaccine: "COVID-19 Moderna", dose: 1, date: "2025-03-01", nextDue: "", administeredBy: "Dr. Farzana Huq" },
  { id: "i2", vaccine: "COVID-19 Moderna", dose: 2, date: "2025-04-01", nextDue: "", administeredBy: "Dr. Farzana Huq" },
  { id: "i3", vaccine: "Influenza (Seasonal)", dose: 1, date: "2025-10-15", nextDue: "2026-10-15", administeredBy: "Dr. Shah Alam" },
  { id: "i4", vaccine: "Tetanus Booster", dose: 1, date: "2024-06-10", nextDue: "2034-06-10", administeredBy: "Dr. M. Rahman" },
];

const MOCK_FAMILY: FamilyEntry[] = [
  { id: "f1", relationship: "Father", condition: "Hypertension", notes: "Diagnosed at age 55" },
  { id: "f2", relationship: "Mother", condition: "Type 2 Diabetes", notes: "Diagnosed at age 60" },
  { id: "f3", relationship: "Brother", condition: "Coronary Artery Disease", notes: "Bypass surgery at age 50" },
];

type Tab = "summary" | "records" | "vitals" | "diagnoses" | "prescriptions" | "allergies" | "immunizations" | "family";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "summary", label: "Summary", icon: Activity },
  { key: "records", label: "Records", icon: FileText },
  { key: "vitals", label: "Vitals", icon: HeartPulse },
  { key: "diagnoses", label: "Diagnoses", icon: Stethoscope },
  { key: "prescriptions", label: "Prescriptions", icon: Pill },
  { key: "allergies", label: "Allergies", icon: AlertTriangle },
  { key: "immunizations", label: "Immunizations", icon: Syringe },
  { key: "family", label: "Family History", icon: Users },
];

const SEVERITY_COLORS: Record<string, string> = {
  mild: "bg-slate-800 text-slate-400 border border-slate-700/50",
  moderate: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
  severe: "bg-red-500/10 text-red-400 border border-red-500/25",
  life_threatening: "bg-red-500/20 text-red-300 border border-red-500/50",
};

function getVisitTypeLabel(t: string): string {
  const map: Record<string, string> = { new: "New Visit", follow_up: "Follow-up", emergency: "Emergency", routine_checkup: "Routine Checkup", telemedicine: "Telemedicine", home_visit: "Home Visit" };
  return map[t] || t;
}

function getVisitTypeColor(t: string): string {
  const map: Record<string, string> = { new: "bg-blue-500/10 text-blue-400", follow_up: "bg-emerald-500/10 text-emerald-400", emergency: "bg-red-500/10 text-red-400", routine_checkup: "bg-slate-800 text-slate-400" };
  return map[t] || "bg-slate-800 text-slate-400";
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [showImmunizationForm, setShowImmunizationForm] = useState(false);
  const [showFamilyForm, setShowFamilyForm] = useState(false);

  const p = PATIENT;
  const allVitals = MOCK_RECORDS.flatMap(r => r.vitals.map(v => ({ ...v, visitDate: r.visitDate, doctor: r.doctor })));
  const allDiagnoses = MOCK_RECORDS.flatMap(r => r.diagnoses.map(d => ({ ...d, visitDate: r.visitDate, doctor: r.doctor })));
  const allPrescriptions = MOCK_RECORDS.flatMap(r => r.prescriptions.map(p => ({ ...p, visitDate: r.visitDate, doctor: r.doctor })));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Patients
      </button>

      {/* Patient Bio Header */}
      <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0">
              <User className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white">{p.name}</h1>
                <span className="text-xs text-slate-500">({p.nameBn})</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{p.phone}</span>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{p.email}</span>
                <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(p.dateOfBirth)}</span>
                <span>{p.gender}</span>
                <span><span className="text-slate-600">Language:</span> {p.preferredLanguage === "bn-BD" ? "Bangla" : "English"}</span>
              </div>
              {p.address && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{p.address}</p>}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{MOCK_RECORDS.length}</p>
              <p className="text-[10px] text-slate-500">Total Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{allDiagnoses.length}</p>
              <p className="text-[10px] text-slate-500">Diagnoses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{MOCK_ALLERGIES.length}</p>
              <p className="text-[10px] text-slate-500">Allergies</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-1 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-1 mb-6">
        {TABS.map(t => {
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${
                isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── SUMMARY TAB ── */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Visit Summary</h3>
            <div className="space-y-2">
              {["new", "follow_up", "emergency", "routine_checkup", "telemedicine", "home_visit"].map(t => {
                const count = MOCK_RECORDS.filter(r => r.visitType === t).length;
                if (count === 0) return null;
                return (
                  <div key={t} className="flex items-center justify-between bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                    <span className="text-xs text-slate-400">{getVisitTypeLabel(t)}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getVisitTypeColor(t)}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Chronic Diagnoses</h3>
            {allDiagnoses.length === 0 ? (
              <p className="text-xs text-slate-500">No chronic diagnoses recorded</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(allDiagnoses.map(d => d.name))).map(n => (
                  <span key={n} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-1 rounded-lg">{n}</span>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              Active Allergies
              <button onClick={() => setShowAllergyForm(true)} className="text-emerald-400 hover:text-emerald-300"><Plus className="w-4 h-4" /></button>
            </h3>
            {MOCK_ALLERGIES.length === 0 ? (
              <p className="text-xs text-slate-500">No allergies recorded</p>
            ) : (
              <div className="space-y-2">
                {MOCK_ALLERGIES.map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                    <div>
                      <p className="text-xs font-semibold text-white">{a.allergen}</p>
                      <p className="text-[10px] text-slate-500">{a.reaction}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              Immunizations
              <button onClick={() => setShowImmunizationForm(true)} className="text-emerald-400 hover:text-emerald-300"><Plus className="w-4 h-4" /></button>
            </h3>
            {MOCK_IMMUNIZATIONS.length === 0 ? (
              <p className="text-xs text-slate-500">No immunizations recorded</p>
            ) : (
              <div className="space-y-2">
                {MOCK_IMMUNIZATIONS.slice(0, 3).map(i => (
                  <div key={i.id} className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{i.vaccine}</span>
                      <span className="text-[10px] text-slate-500">Dose {i.dose}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(i.date)}{i.nextDue ? ` · Next: ${formatDate(i.nextDue)}` : ""}</p>
                  </div>
                ))}
                {MOCK_IMMUNIZATIONS.length > 3 && <p className="text-[10px] text-slate-500 text-center mt-1">+{MOCK_IMMUNIZATIONS.length - 3} more</p>}
              </div>
            )}
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              Family History
              <button onClick={() => setShowFamilyForm(true)} className="text-emerald-400 hover:text-emerald-300"><Plus className="w-4 h-4" /></button>
            </h3>
            {MOCK_FAMILY.length === 0 ? (
              <p className="text-xs text-slate-500">No family history recorded</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MOCK_FAMILY.map(f => (
                  <div key={f.id} className="bg-[#070b13] rounded-xl px-4 py-3 border border-slate-800/60">
                    <p className="text-xs font-semibold text-emerald-400">{f.relationship}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{f.condition}</p>
                    {f.notes && <p className="text-[10px] text-slate-500 mt-1">{f.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RECORDS TAB ── */}
      {activeTab === "records" && (
        <div className="flex flex-col gap-4">
          {MOCK_RECORDS.length === 0 ? (
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-10 text-center">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No medical records found</p>
            </div>
          ) : (
            MOCK_RECORDS.map(r => {
              const isExpanded = expandedRecord === r.id;
              return (
                <div key={r.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedRecord(isExpanded ? null : r.id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{formatDate(r.visitDate)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${getVisitTypeColor(r.visitType)}`}>{getVisitTypeLabel(r.visitType)}</span>
                          <span className="text-[10px] text-slate-500">{r.doctor}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500">{r.diagnoses.length} dx · {r.prescriptions.length} rx</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-slate-800/60">
                      {r.chiefComplaint && (
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Chief Complaint</p>
                          <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{r.chiefComplaint}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        {r.assessment && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assessment</p>
                            <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{r.assessment}</p>
                          </div>
                        )}
                        {r.plan && (
                          <div>
                            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan</p>
                            <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{r.plan}</p>
                          </div>
                        )}
                      </div>

                      {r.vitals.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Vitals</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                            {r.vitals.map(v => (
                              <div key={v.id} className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60 text-center">
                                <p className="text-[10px] text-slate-500">{v.parameter}</p>
                                <p className="text-sm font-bold text-white">{v.value}<span className="text-[10px] text-slate-500 ml-0.5">{v.unit}</span></p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.diagnoses.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Diagnoses</p>
                          <div className="flex flex-wrap gap-2">
                            {r.diagnoses.map(d => (
                              <span key={d.id} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-lg">{d.name} {d.icdCode && <span className="text-blue-400/60">({d.icdCode})</span>}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {r.prescriptions.length > 0 && (
                        <div className="mt-4">
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Prescriptions</p>
                          <div className="space-y-1.5">
                            {r.prescriptions.map(p => (
                              <div key={p.id} className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60 flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-white">{p.medicine}</p>
                                  <p className="text-[10px] text-slate-500">{p.dosage} · {p.frequency} · {p.route}{p.durationDays ? ` · ${p.durationDays}d` : ""}</p>
                                </div>
                                {p.instructions && <span className="text-[10px] text-slate-500 max-w-[180px] text-right">{p.instructions}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── VITALS TAB ── */}
      {activeTab === "vitals" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          {allVitals.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No vitals recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Doctor</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Parameter</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allVitals.map(v => (
                    <tr key={v.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-xs text-slate-400">{formatDate(v.visitDate)}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{v.doctor}</td>
                      <td className="py-3 pr-4 text-xs text-white">{v.parameter}</td>
                      <td className="py-3 pr-4 text-xs font-semibold text-white">{v.value} <span className="text-slate-500">{v.unit}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── DIAGNOSES TAB ── */}
      {activeTab === "diagnoses" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          {allDiagnoses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No diagnoses recorded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allDiagnoses.map(d => (
                <div key={d.id} className="bg-[#070b13] rounded-xl px-4 py-3 border border-slate-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{d.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      d.type === "primary" ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-400"
                    }`}>{d.type}</span>
                  </div>
                  {d.icdCode && <p className="text-[10px] text-slate-500">ICD-10: {d.icdCode}</p>}
                  <p className="text-[10px] text-slate-500 mt-1">Recorded {formatDate(d.visitDate)} by {d.doctor}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRESCRIPTIONS TAB ── */}
      {activeTab === "prescriptions" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          {allPrescriptions.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No prescriptions recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Medicine</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Dosage</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Frequency</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Route</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Duration</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Doctor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allPrescriptions.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-xs font-semibold text-white">{p.medicine}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{p.dosage}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{p.frequency}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300 capitalize">{p.route}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{p.durationDays}d</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{p.doctor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── ALLERGIES TAB ── */}
      {activeTab === "allergies" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Allergies</p>
            <button onClick={() => setShowAllergyForm(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Allergy
            </button>
          </div>
          {MOCK_ALLERGIES.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No allergies recorded</p>
          ) : (
            <div className="space-y-2">
              {MOCK_ALLERGIES.map(a => (
                <div key={a.id} className="flex items-center justify-between bg-[#070b13] rounded-xl px-4 py-3 border border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-4 h-4 ${a.severity === "severe" || a.severity === "life_threatening" ? "text-red-400" : "text-amber-400"}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{a.allergen}</p>
                      <p className="text-xs text-slate-500">{a.reaction}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${SEVERITY_COLORS[a.severity]}`}>{a.severity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IMMUNIZATIONS TAB ── */}
      {activeTab === "immunizations" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Immunizations</p>
            <button onClick={() => setShowImmunizationForm(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Immunization
            </button>
          </div>
          {MOCK_IMMUNIZATIONS.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No immunizations recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Vaccine</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Dose</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Date</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Next Due</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-3 pr-4">Administered By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {MOCK_IMMUNIZATIONS.map(i => (
                    <tr key={i.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-xs font-semibold text-white">{i.vaccine}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{i.dose}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{formatDate(i.date)}</td>
                      <td className="py-3 pr-4 text-xs">{i.nextDue ? <span className="text-amber-400">{formatDate(i.nextDue)}</span> : <span className="text-slate-600">—</span>}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{i.administeredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── FAMILY HISTORY TAB ── */}
      {activeTab === "family" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">Family History</p>
            <button onClick={() => setShowFamilyForm(true)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/20 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Entry
            </button>
          </div>
          {MOCK_FAMILY.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No family history recorded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_FAMILY.map(f => (
                <div key={f.id} className="bg-[#070b13] rounded-xl px-5 py-4 border border-slate-800/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{f.relationship}</p>
                  </div>
                  <p className="text-base font-bold text-white">{f.condition}</p>
                  {f.notes && <p className="text-xs text-slate-500 mt-1">{f.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Allergy Form Modal ── */}
      {showAllergyForm && <AddFormModal title="Add Allergy" onClose={() => setShowAllergyForm(false)}>
        <p className="text-xs text-slate-500">Allergy recording form</p>
      </AddFormModal>}

      {showImmunizationForm && <AddFormModal title="Add Immunization" onClose={() => setShowImmunizationForm(false)}>
        <p className="text-xs text-slate-500">Immunization recording form</p>
      </AddFormModal>}

      {showFamilyForm && <AddFormModal title="Add Family History" onClose={() => setShowFamilyForm(false)}>
        <p className="text-xs text-slate-500">Family history entry form</p>
      </AddFormModal>}
    </div>
  );
}

function AddFormModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
      <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-md p-6 mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
