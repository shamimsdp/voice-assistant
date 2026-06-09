"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  usePatient,
  usePatientSummary,
  useMedicalRecords,
  useRecordDetail,
  usePatientAllergies,
  useAddAllergy,
  usePatientImmunizations,
  useAddImmunization,
  useAddFamilyHistory,
} from "@/lib/api-hooks";
import type { RecordDetail as RecordDetailType, Allergy, Immunization } from "@/lib/api-hooks";
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
  Loader2,
} from "lucide-react";

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

  const [allergyForm, setAllergyForm] = useState({ allergen: "", severity: "mild", reaction: "" });
  const [immunizationForm, setImmunizationForm] = useState({ vaccine: "", dose: 1, date: "", next_due: "" });
  const [familyForm, setFamilyForm] = useState({ relationship: "", condition: "" });

  const { data: patient, isLoading: patientLoading, error: patientError } = usePatient(patientId);
  const { data: summary, isLoading: summaryLoading } = usePatientSummary(patientId);
  const { data: medicalRecords, isLoading: recordsLoading } = useMedicalRecords(patientId);
  const { data: allergies, isLoading: allergiesLoading } = usePatientAllergies(patientId);
  const { data: immunizations, isLoading: immunizationsLoading } = usePatientImmunizations(patientId);
  const { data: expandedRecordDetail, isLoading: detailLoading } = useRecordDetail(expandedRecord);

  const recordsList = medicalRecords || [];

  const recordDetailQueries = useQueries({
    queries: recordsList.map((record) => ({
      queryKey: ["ehr", "record-detail", record.id],
      queryFn: () => api.get(`/api/ehr/records/${record.id}`),
      staleTime: 30000,
    })),
  });

  const allRecordDetails = recordDetailQueries.map((q) => q.data as RecordDetailType | undefined).filter(Boolean);
  const areDetailsLoading = recordDetailQueries.some((q) => q.isLoading) && recordsList.length > 0;

  const allVitals = allRecordDetails.flatMap((d) =>
    (d?.vitals || []).map((v) => ({
      parameter_name: v.parameter_name,
      value: v.value,
      unit: v.unit,
      visitDate: d!.visit_date,
      doctorId: d!.doctor_id,
    }))
  );

  const allDiagnoses = allRecordDetails.flatMap((d) =>
    (d?.diagnoses || []).map((diag) => ({
      name: diag.name,
      icd_code: diag.icd_code,
      type: diag.type,
      visitDate: d!.visit_date,
      doctorId: d!.doctor_id,
    }))
  );

  const allPrescriptions = allRecordDetails.flatMap((d) =>
    (d?.prescriptions || []).map((p) => ({
      medicine_name: p.medicine_name,
      dosage: p.dosage,
      frequency: p.frequency,
      duration_days: p.duration_days,
      route: p.route,
      instructions: p.instructions,
      visitDate: d!.visit_date,
      doctorId: d!.doctor_id,
    }))
  );

  const addAllergyMutation = useAddAllergy();
  const addImmunizationMutation = useAddImmunization();
  const addFamilyHistoryMutation = useAddFamilyHistory();

  const handleAddAllergy = () => {
    if (!allergyForm.allergen.trim()) return;
    addAllergyMutation.mutate(
      { patientId, data: { allergen: allergyForm.allergen, severity: allergyForm.severity, reaction: allergyForm.reaction } },
      { onSuccess: () => { setShowAllergyForm(false); setAllergyForm({ allergen: "", severity: "mild", reaction: "" }); } }
    );
  };

  const handleAddImmunization = () => {
    if (!immunizationForm.vaccine.trim() || !immunizationForm.date) return;
    addImmunizationMutation.mutate(
      { patientId, data: { vaccine: immunizationForm.vaccine, dose: immunizationForm.dose, date: immunizationForm.date, next_due: immunizationForm.next_due || null } },
      { onSuccess: () => { setShowImmunizationForm(false); setImmunizationForm({ vaccine: "", dose: 1, date: "", next_due: "" }); } }
    );
  };

  const handleAddFamilyHistory = () => {
    if (!familyForm.relationship.trim() || !familyForm.condition.trim()) return;
    addFamilyHistoryMutation.mutate(
      { patientId, data: { relationship: familyForm.relationship, condition: familyForm.condition } },
      { onSuccess: () => { setShowFamilyForm(false); setFamilyForm({ relationship: "", condition: "" }); } }
    );
  };

  if (patientLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-32 bg-slate-800/50 rounded-lg animate-pulse mb-4" />
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-64 bg-slate-800/50 rounded-lg animate-pulse" />
              <div className="h-4 w-80 bg-slate-800/30 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
        <div className="h-10 bg-[#0a1120] border border-slate-800/60 rounded-2xl animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
              <div className="h-4 w-24 bg-slate-800/50 rounded-lg animate-pulse mb-3" />
              <div className="space-y-2">
                <div className="h-10 bg-slate-800/20 rounded-lg animate-pulse" />
                <div className="h-10 bg-slate-800/20 rounded-lg animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Patients
        </button>
        <div className="bg-[#0a1120] border border-red-500/20 rounded-2xl p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-base font-bold text-white mb-1">Patient Not Found</p>
          <p className="text-sm text-slate-500">Could not load patient details. They may have been removed or you may not have access.</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-xl font-bold text-white">{patient.name || "Unknown"}</h1>
                {patient.name_bn && <span className="text-xs text-slate-500">({patient.name_bn})</span>}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{patient.phone}</span>
                {patient.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{patient.email}</span>}
                {patient.date_of_birth && <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{formatDate(patient.date_of_birth)}</span>}
                {patient.gender && <span>{patient.gender}</span>}
                <span><span className="text-slate-600">Language:</span> {patient.preferred_language === "bn-BD" ? "Bangla" : "English"}</span>
              </div>
              {patient.address && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{patient.address}</p>}
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{summary?.total_visits ?? recordsList.length}</p>
              <p className="text-[10px] text-slate-500">Total Visits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{allDiagnoses.length || (summary?.chronic_diagnoses?.length ?? 0)}</p>
              <p className="text-[10px] text-slate-500">Diagnoses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{allergies?.length ?? summary?.active_allergies?.length ?? 0}</p>
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
            {summaryLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => <div key={i} className="h-10 bg-slate-800/20 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {(Object.entries(summary?.visit_types || {})).length === 0 ? (
                  <p className="text-xs text-slate-500">No visits recorded</p>
                ) : (
                  Object.entries(summary?.visit_types || {}).map(([t, count]) => (
                    <div key={t} className="flex items-center justify-between bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                      <span className="text-xs text-slate-400">{getVisitTypeLabel(t)}</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getVisitTypeColor(t)}`}>{count}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-3">Chronic Diagnoses</h3>
            {summaryLoading ? (
              <div className="h-10 bg-slate-800/20 rounded-lg animate-pulse" />
            ) : (summary?.chronic_diagnoses?.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-500">No chronic diagnoses recorded</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {(summary?.chronic_diagnoses || []).map((n) => (
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
            {summaryLoading ? (
              <div className="space-y-2">
                {[1].map((i) => <div key={i} className="h-10 bg-slate-800/20 rounded-lg animate-pulse" />)}
              </div>
            ) : ((summary?.active_allergies?.length ?? 0) === 0) ? (
              <p className="text-xs text-slate-500">No allergies recorded</p>
            ) : (
              <div className="space-y-2">
                {(summary?.active_allergies || []).map((a, i) => (
                  <div key={`allergy-${i}`} className="flex items-center justify-between bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                    <div>
                      <p className="text-xs font-semibold text-white">{a.allergen}</p>
                      {a.reaction && <p className="text-[10px] text-slate-500">{a.reaction}</p>}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.mild}`}>{a.severity}</span>
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
            {summaryLoading ? (
              <div className="space-y-2">
                {[1].map((i) => <div key={i} className="h-14 bg-slate-800/20 rounded-lg animate-pulse" />)}
              </div>
            ) : ((summary?.immunizations?.length ?? 0) === 0) ? (
              <p className="text-xs text-slate-500">No immunizations recorded</p>
            ) : (
              <div className="space-y-2">
                {(summary?.immunizations || []).slice(0, 3).map((i, idx) => (
                  <div key={`imm-${idx}`} className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white">{i.vaccine}</span>
                      {i.dose != null && <span className="text-[10px] text-slate-500">Dose {i.dose}</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{formatDate(i.date)}{i.next_due ? ` · Next: ${formatDate(i.next_due)}` : ""}</p>
                  </div>
                ))}
                {(summary?.immunizations?.length ?? 0) > 3 && <p className="text-[10px] text-slate-500 text-center mt-1">+{(summary?.immunizations?.length ?? 0) - 3} more</p>}
              </div>
            )}
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              Family History
              <button onClick={() => setShowFamilyForm(true)} className="text-emerald-400 hover:text-emerald-300"><Plus className="w-4 h-4" /></button>
            </h3>
            {summaryLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-800/20 rounded-xl animate-pulse" />)}
              </div>
            ) : ((summary?.family_history?.length ?? 0) === 0) ? (
              <p className="text-xs text-slate-500">No family history recorded</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(summary?.family_history || []).map((f, i) => (
                  <div key={`fam-${i}`} className="bg-[#070b13] rounded-xl px-4 py-3 border border-slate-800/60">
                    <p className="text-xs font-semibold text-emerald-400">{f.relationship}</p>
                    <p className="text-sm font-bold text-white mt-0.5">{f.condition}</p>
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
          {recordsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-slate-800/50 rounded-lg animate-pulse" />
                      <div className="h-3 w-48 bg-slate-800/30 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : recordsList.length === 0 ? (
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-10 text-center">
              <FileText className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No medical records found</p>
            </div>
          ) : (
            recordsList.map((r) => {
              const isExpanded = expandedRecord === r.id;
              const detail = isExpanded ? expandedRecordDetail : null;
              return (
                <div key={r.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
                  <button onClick={() => setExpandedRecord(isExpanded ? null : r.id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        <FileText className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{formatDate(r.visit_date)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${getVisitTypeColor(r.visit_type)}`}>{getVisitTypeLabel(r.visit_type)}</span>
                          <span className="text-[10px] text-slate-500">{r.doctor_id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {detail && <span className="text-[10px] text-slate-500">{detail.diagnoses.length} dx · {detail.prescriptions.length} rx</span>}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-slate-800/60">
                      {detailLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                          <span className="text-xs text-slate-500 ml-2">Loading record details...</span>
                        </div>
                      ) : detail ? (
                        <>
                          {detail.chief_complaint && (
                            <div className="mt-4">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Chief Complaint</p>
                              <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{detail.chief_complaint}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                            {detail.assessment && (
                              <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Assessment</p>
                                <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{detail.assessment}</p>
                              </div>
                            )}
                            {detail.plan && (
                              <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Plan</p>
                                <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{detail.plan}</p>
                              </div>
                            )}
                          </div>

                          {detail.clinical_notes && (
                            <div className="mt-4">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Clinical Notes</p>
                              <p className="text-xs text-slate-300 bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">{detail.clinical_notes}</p>
                            </div>
                          )}

                          {detail.vitals.length > 0 && (
                            <div className="mt-4">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Vitals</p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {detail.vitals.map((v, vi) => (
                                  <div key={`vital-${vi}`} className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60 text-center">
                                    <p className="text-[10px] text-slate-500">{v.parameter_name}</p>
                                    <p className="text-sm font-bold text-white">{v.value}<span className="text-[10px] text-slate-500 ml-0.5">{v.unit}</span></p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {detail.diagnoses.length > 0 && (
                            <div className="mt-4">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Diagnoses</p>
                              <div className="flex flex-wrap gap-2">
                                {detail.diagnoses.map((d, di) => (
                                  <span key={`diag-${di}`} className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-lg">
                                    {d.name} {d.icd_code && <span className="text-blue-400/60">({d.icd_code})</span>}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {detail.prescriptions.length > 0 && (
                            <div className="mt-4">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Prescriptions</p>
                              <div className="space-y-1.5">
                                {detail.prescriptions.map((p, pi) => (
                                  <div key={`rx-${pi}`} className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60 flex items-center justify-between">
                                    <div>
                                      <p className="text-xs font-semibold text-white">{p.medicine_name}</p>
                                      <p className="text-[10px] text-slate-500">{p.dosage} · {p.frequency} · {p.route}{p.duration_days ? ` · ${p.duration_days}d` : ""}</p>
                                    </div>
                                    {p.instructions && <span className="text-[10px] text-slate-500 max-w-[180px] text-right">{p.instructions}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : null}
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
          {areDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-500 ml-2">Loading vitals...</span>
            </div>
          ) : allVitals.length === 0 ? (
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
                  {allVitals.map((v, i) => (
                    <tr key={`vital-${i}`} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-xs text-slate-400">{formatDate(v.visitDate)}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{v.doctorId}</td>
                      <td className="py-3 pr-4 text-xs text-white">{v.parameter_name}</td>
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
          {areDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-500 ml-2">Loading diagnoses...</span>
            </div>
          ) : allDiagnoses.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No diagnoses recorded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allDiagnoses.map((d, i) => (
                <div key={`diag-${i}`} className="bg-[#070b13] rounded-xl px-4 py-3 border border-slate-800/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{d.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                      d.type === "primary" ? "bg-blue-500/10 text-blue-400" : "bg-slate-800 text-slate-400"
                    }`}>{d.type}</span>
                  </div>
                  {d.icd_code && <p className="text-[10px] text-slate-500">ICD-10: {d.icd_code}</p>}
                  <p className="text-[10px] text-slate-500 mt-1">Recorded {formatDate(d.visitDate)} by {d.doctorId}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── PRESCRIPTIONS TAB ── */}
      {activeTab === "prescriptions" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          {areDetailsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              <span className="text-xs text-slate-500 ml-2">Loading prescriptions...</span>
            </div>
          ) : allPrescriptions.length === 0 ? (
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
                  {allPrescriptions.map((p, i) => (
                    <tr key={`rx-${i}`} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-xs font-semibold text-white">{p.medicine_name}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{p.dosage}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{p.frequency}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300 capitalize">{p.route}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{p.duration_days ? `${p.duration_days}d` : "—"}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{p.doctorId}</td>
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
          {allergiesLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-16 bg-slate-800/20 rounded-xl animate-pulse" />)}
            </div>
          ) : (allergies?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No allergies recorded</p>
          ) : (
            <div className="space-y-2">
              {(allergies || []).map((a) => (
                <div key={a.id} className="flex items-center justify-between bg-[#070b13] rounded-xl px-4 py-3 border border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-4 h-4 ${a.severity === "severe" || a.severity === "life_threatening" ? "text-red-400" : "text-amber-400"}`} />
                    <div>
                      <p className="text-sm font-semibold text-white">{a.allergen}</p>
                      {a.reaction && <p className="text-xs text-slate-500">{a.reaction}</p>}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${SEVERITY_COLORS[a.severity] || SEVERITY_COLORS.mild}`}>{a.severity}</span>
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
          {immunizationsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-800/20 rounded-xl animate-pulse" />)}
            </div>
          ) : (immunizations?.length ?? 0) === 0 ? (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(immunizations || []).map((i) => (
                    <tr key={i.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 pr-4 text-xs font-semibold text-white">{i.vaccine}</td>
                      <td className="py-3 pr-4 text-xs text-slate-300">{i.dose ?? "—"}</td>
                      <td className="py-3 pr-4 text-xs text-slate-400">{formatDate(i.date)}</td>
                      <td className="py-3 pr-4 text-xs">{i.next_due ? <span className="text-amber-400">{formatDate(i.next_due)}</span> : <span className="text-slate-600">—</span>}</td>
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
          {summaryLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-slate-800/20 rounded-xl animate-pulse" />)}
            </div>
          ) : ((summary?.family_history?.length ?? 0) === 0) ? (
            <p className="text-sm text-slate-500 text-center py-10">No family history recorded</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(summary?.family_history || []).map((f, i) => (
                <div key={`fam-${i}`} className="bg-[#070b13] rounded-xl px-5 py-4 border border-slate-800/60">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Users className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{f.relationship}</p>
                  </div>
                  <p className="text-base font-bold text-white">{f.condition}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Add Allergy Form Modal ── */}
      {showAllergyForm && (
        <AddFormModal title="Add Allergy" onClose={() => { setShowAllergyForm(false); setAllergyForm({ allergen: "", severity: "mild", reaction: "" }); }}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Allergen</label>
              <input
                value={allergyForm.allergen}
                onChange={(e) => setAllergyForm((f) => ({ ...f, allergen: e.target.value }))}
                placeholder="e.g. Penicillin"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Severity</label>
              <select
                value={allergyForm.severity}
                onChange={(e) => setAllergyForm((f) => ({ ...f, severity: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
                <option value="life_threatening">Life Threatening</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Reaction</label>
              <input
                value={allergyForm.reaction}
                onChange={(e) => setAllergyForm((f) => ({ ...f, reaction: e.target.value }))}
                placeholder="e.g. Skin rash, itching"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={handleAddAllergy}
              disabled={!allergyForm.allergen.trim() || addAllergyMutation.isPending}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {addAllergyMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Allergy
            </button>
          </div>
        </AddFormModal>
      )}

      {/* ── Add Immunization Form Modal ── */}
      {showImmunizationForm && (
        <AddFormModal title="Add Immunization" onClose={() => { setShowImmunizationForm(false); setImmunizationForm({ vaccine: "", dose: 1, date: "", next_due: "" }); }}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Vaccine</label>
              <input
                value={immunizationForm.vaccine}
                onChange={(e) => setImmunizationForm((f) => ({ ...f, vaccine: e.target.value }))}
                placeholder="e.g. Influenza (Seasonal)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Dose</label>
                <input
                  type="number"
                  min={1}
                  value={immunizationForm.dose}
                  onChange={(e) => setImmunizationForm((f) => ({ ...f, dose: Number(e.target.value) }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Date</label>
                <input
                  type="date"
                  value={immunizationForm.date}
                  onChange={(e) => setImmunizationForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Next Due Date (optional)</label>
              <input
                type="date"
                value={immunizationForm.next_due}
                onChange={(e) => setImmunizationForm((f) => ({ ...f, next_due: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <button
              onClick={handleAddImmunization}
              disabled={!immunizationForm.vaccine.trim() || !immunizationForm.date || addImmunizationMutation.isPending}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {addImmunizationMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Immunization
            </button>
          </div>
        </AddFormModal>
      )}

      {/* ── Add Family History Form Modal ── */}
      {showFamilyForm && (
        <AddFormModal title="Add Family History" onClose={() => { setShowFamilyForm(false); setFamilyForm({ relationship: "", condition: "" }); }}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Relationship</label>
              <input
                value={familyForm.relationship}
                onChange={(e) => setFamilyForm((f) => ({ ...f, relationship: e.target.value }))}
                placeholder="e.g. Father, Mother"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Condition</label>
              <input
                value={familyForm.condition}
                onChange={(e) => setFamilyForm((f) => ({ ...f, condition: e.target.value }))}
                placeholder="e.g. Hypertension, Diabetes"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder:text-slate-600"
              />
            </div>
            <button
              onClick={handleAddFamilyHistory}
              disabled={!familyForm.relationship.trim() || !familyForm.condition.trim() || addFamilyHistoryMutation.isPending}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {addFamilyHistoryMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Entry
            </button>
          </div>
        </AddFormModal>
      )}
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
