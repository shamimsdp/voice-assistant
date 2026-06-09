"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Plus,
  X,
  Search,
  User,
  Clock,
  Loader2,
  Ambulance,
  HeartPulse,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useEmergencyCases, useCreateEmergencyCase, useUpdateCaseStatus, useDispatchAmbulance } from "@/lib/api-hooks";

const TRIAGE_COLORS: Record<string, string> = {
  resuscitation: "bg-red-500/20 text-red-300 border-red-500/40",
  emergency: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  urgent: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  semi_urgent: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
  non_urgent: "bg-green-500/20 text-green-300 border-green-500/40",
};

const STATUS_STYLES: Record<string, string> = {
  triaged: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  in_treatment: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  admitted: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  transferred: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  discharged: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  deceased: "bg-red-500/10 text-red-400 border-red-500/25",
};

const AMBULANCE_STATUS_STYLES: Record<string, string> = {
  dispatched: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  en_route: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  arrived: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  at_hospital: "bg-purple-500/10 text-purple-400 border-purple-500/25",
  available: "bg-slate-500/10 text-slate-400 border-slate-500/25",
};

const TRIAGE_OPTIONS = [
  { value: "resuscitation", label: "Resuscitation (Level 1)" },
  { value: "emergency", label: "Emergency (Level 2)" },
  { value: "urgent", label: "Urgent (Level 3)" },
  { value: "semi_urgent", label: "Semi-Urgent (Level 4)" },
  { value: "non_urgent", label: "Non-Urgent (Level 5)" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-BD", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState<"cases" | "ambulance">("cases");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [triageFilter, setTriageFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [showAmbulance, setShowAmbulance] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });
  const [detail, setDetail] = useState<any>(null);

  const { data: cases, isLoading, error } = useEmergencyCases(
    statusFilter !== "all" || triageFilter !== "all"
      ? { ...(statusFilter !== "all" ? { status: statusFilter } : {}), ...(triageFilter !== "all" ? { triage_level: triageFilter } : {}) }
      : undefined
  );
  const createCase = useCreateEmergencyCase();
  const updateStatus = useUpdateCaseStatus();
  const dispatchAmbulance = useDispatchAmbulance();

  const [form, setForm] = useState({
    patient_name: "", patient_phone: "", age: 0, gender: "",
    triage_level: "urgent", chief_complaint: "", allergies: "",
  });

  const [ambulanceForm, setAmbulanceForm] = useState({
    case_id: "", pickup_address: "", destination: "",
    driver_name: "", driver_phone: "", notes: "",
  });

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  }

  function handleCreateCase(e: React.FormEvent) {
    e.preventDefault();
    if (!form.chief_complaint || !form.patient_name) {
      showToast("Patient name and chief complaint are required", "error");
      return;
    }
    createCase.mutate(form, {
      onSuccess: (data) => {
        setShowCreate(false);
        setForm({ patient_name: "", patient_phone: "", age: 0, gender: "", triage_level: "urgent", chief_complaint: "", allergies: "" });
        showToast(`Case ${data.case_number} created`);
      },
      onError: (err) => showToast(err.message, "error"),
    });
  }

  function handleDispatchAmbulance(e: React.FormEvent) {
    e.preventDefault();
    if (!ambulanceForm.case_id || !ambulanceForm.pickup_address || !ambulanceForm.destination) {
      showToast("Fill all required fields", "error");
      return;
    }
    dispatchAmbulance.mutate(ambulanceForm, {
      onSuccess: () => {
        setShowAmbulance(false);
        setAmbulanceForm({ case_id: "", pickup_address: "", destination: "", driver_name: "", driver_phone: "", notes: "" });
        showToast("Ambulance dispatched");
      },
      onError: (err) => showToast(err.message, "error"),
    });
  }

  function handleStatusChange(caseId: string, newStatus: string, disposition?: string) {
    updateStatus.mutate(
      { id: caseId, data: { status: newStatus, disposition } },
      { onSuccess: () => showToast(`Case status updated to ${newStatus.replace("_", " ")}`), onError: (err) => showToast(err.message, "error") }
    );
  }

  async function fetchDetail(caseId: string) {
    try {
      const res = await fetch(`http://localhost:8000/api/emergency/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      setDetail(await res.json());
    } catch {
      setDetail(null);
    }
  }

  const activeCritical = cases?.filter((c) => c.triage_level === "resuscitation" || c.triage_level === "emergency")?.filter((c) => c.status === "triaged" || c.status === "in_treatment").length || 0;

  const filtered = (cases || []).filter((c) => {
    const m = (c.patient_name || "").toLowerCase().includes(search.toLowerCase()) || c.case_number.toLowerCase().includes(search.toLowerCase());
    return m;
  });

  const summary = {
    active: cases?.filter((c) => !["discharged", "deceased"].includes(c.status)).length || 0,
    critical: activeCritical,
    inTreatment: cases?.filter((c) => c.status === "in_treatment").length || 0,
    triaged: cases?.filter((c) => c.status === "triaged").length || 0,
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Critical Alert Banner */}
      {activeCritical > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-300">{activeCritical} Critical Patient{activeCritical > 1 ? "s" : ""} Require Immediate Attention</p>
            <p className="text-xs text-red-400/80 mt-0.5">Resuscitation or Emergency level cases waiting for treatment</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Emergency & Triage</h1>
          <p className="text-sm text-slate-400 mt-1">Emergency case management and ambulance dispatch</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "cases" && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-semibold transition-all text-sm">
              <Plus className="w-4 h-4" /> New Case
            </button>
          )}
          {activeTab === "ambulance" && (
            <button onClick={() => setShowAmbulance(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-semibold transition-all text-sm">
              <Ambulance className="w-4 h-4" /> Dispatch Ambulance
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Active Cases</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.active}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <HeartPulse className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Critical</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{summary.critical}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">In Treatment</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{summary.inTreatment}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Awaiting Triage</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{summary.triaged}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-1 w-fit">
        {[
          { key: "cases", label: "Emergency Cases", icon: HeartPulse },
          { key: "ambulance", label: "Ambulance Dispatch", icon: Ambulance },
        ].map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key as typeof activeTab); setSearch(""); }} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 border border-transparent"}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── CASES TAB ─── */}
      {activeTab === "cases" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search by case number or patient..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer">
              <option value="all">All Status</option>
              <option value="triaged">Triaged</option>
              <option value="in_treatment">In Treatment</option>
              <option value="admitted">Admitted</option>
              <option value="transferred">Transferred</option>
              <option value="discharged">Discharged</option>
            </select>
            <select value={triageFilter} onChange={(e) => setTriageFilter(e.target.value)} className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer">
              <option value="all">All Triage</option>
              <option value="resuscitation">Resuscitation</option>
              <option value="emergency">Emergency</option>
              <option value="urgent">Urgent</option>
              <option value="semi_urgent">Semi-Urgent</option>
              <option value="non_urgent">Non-Urgent</option>
            </select>
          </div>

          {isLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800" />
                    <div className="flex-1"><div className="h-4 w-40 bg-slate-800 rounded" /><div className="h-3 w-56 bg-slate-800 rounded mt-2" /></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-center"><p className="text-sm text-red-400">Failed to load: {error.message}</p></div>}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-16"><HeartPulse className="w-12 h-12 text-slate-700 mx-auto mb-4" /><p className="text-slate-400 text-sm">No emergency cases</p></div>
          )}

          {!isLoading && !error && filtered.map((c) => (
            <div key={c.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
              <button onClick={() => { setExpandedId(expandedId === c.id ? null : c.id); if (expandedId !== c.id) fetchDetail(c.id); }} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${TRIAGE_COLORS[c.triage_level]}`}>
                    <HeartPulse className={`w-5 h-5 ${c.triage_level === "resuscitation" || c.triage_level === "emergency" ? "animate-pulse" : ""}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-white">{c.patient_name || "Unknown"}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${TRIAGE_COLORS[c.triage_level]}`}>{c.triage_level.replace("_", " ")}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[c.status] || ""}`}>{c.status.replace("_", " ")}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-400">{c.case_number}</span>
                      <span className="text-xs text-slate-500">{c.chief_complaint?.slice(0, 50)}{c.chief_complaint?.length > 50 ? "..." : ""}</span>
                      {c.age && <span className="text-xs text-slate-500">{c.age}y {c.gender || ""}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] text-slate-500">{formatDate(c.triaged_at)}</span>
                  {expandedId === c.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {expandedId === c.id && detail?.id === c.id && (
                <div className="border-t border-slate-800/60 px-5 py-4 bg-[#080d1a]/50">
                  {detail.vital_signs && Object.keys(detail.vital_signs).length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Vital Signs</p>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {Object.entries(detail.vital_signs as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} className="bg-[#070b13] rounded-xl px-3 py-2 border border-slate-800/60 text-center">
                            <p className="text-[10px] text-slate-500 uppercase">{k}</p>
                            <p className="text-sm font-semibold text-white">{String(v)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.symptoms && <div className="mb-4"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Symptoms</p><p className="text-xs text-slate-300">{JSON.stringify(detail.symptoms)}</p></div>}
                  {detail.allergies && <div className="mb-4"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Allergies</p><p className="text-xs text-slate-300">{detail.allergies}</p></div>}
                  {detail.preliminary_diagnosis && <div className="mb-4"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Preliminary Diagnosis</p><p className="text-xs text-slate-300">{detail.preliminary_diagnosis}</p></div>}
                  {detail.treatment_notes && <div className="mb-4"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Treatment Notes</p><p className="text-xs text-slate-300">{detail.treatment_notes}</p></div>}
                  {detail.referral_hospital && <div className="mb-4"><p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Referral</p><p className="text-xs text-slate-300">{detail.referral_hospital}{detail.disposition ? ` — ${detail.disposition}` : ""}</p></div>}

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800/60">
                    {c.status === "triaged" && <button onClick={() => handleStatusChange(c.id, "in_treatment")} className="px-3 py-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 text-xs font-semibold hover:bg-amber-500/20 transition-colors">Start Treatment</button>}
                    {c.status === "in_treatment" && <>
                      <button onClick={() => handleStatusChange(c.id, "admitted")} className="px-3 py-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/25 text-xs font-semibold hover:bg-purple-500/20 transition-colors">Admit</button>
                      <button onClick={() => handleStatusChange(c.id, "discharged", "discharged")} className="px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">Discharge</button>
                    </>}
                    {(c.status === "triaged" || c.status === "in_treatment") && (
                      <button onClick={() => { setAmbulanceForm({ ...ambulanceForm, case_id: c.id }); setShowAmbulance(true); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/25 text-xs font-semibold hover:bg-blue-500/20 transition-colors">
                        <Ambulance className="w-3.5 h-3.5" /> Dispatch Ambulance
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ─── AMBULANCE TAB ─── */}
      {activeTab === "ambulance" && (
        <div className="flex flex-col gap-3">
          {/* Ambulance dispatches would be fetched here - reuse useEmergencyCases + show dedicated list */}
          <div className="text-center py-16">
            <Ambulance className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Ambulance dispatch log will appear here</p>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">New Emergency Case</h2><button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleCreateCase} className="flex flex-col gap-4">
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient Name *</label><input type="text" value={form.patient_name} onChange={(e) => setForm({ ...form, patient_name: e.target.value })} placeholder="Full name" className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500" /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-xs font-semibold text-slate-400 mb-1.5">Phone</label><input type="text" value={form.patient_phone} onChange={(e) => setForm({ ...form, patient_phone: e.target.value })} placeholder="017..." className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500" /></div>
                <div className="w-20"><label className="block text-xs font-semibold text-slate-400 mb-1.5">Age</label><input type="number" min={0} max={150} value={form.age || ""} onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                <div className="flex-1"><label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender</label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Triage Level *</label><select value={form.triage_level} onChange={(e) => setForm({ ...form, triage_level: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer">{TRIAGE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}</select></div>
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Chief Complaint *</label><textarea value={form.chief_complaint} onChange={(e) => setForm({ ...form, chief_complaint: e.target.value })} placeholder="What the patient is reporting..." rows={3} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none" /></div>
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Allergies</label><input type="text" value={form.allergies} onChange={(e) => setForm({ ...form, allergies: e.target.value })} placeholder="Known allergies..." className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500" /></div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={createCase.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2">{createCase.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Case"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Ambulance Modal */}
      {showAmbulance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-bold text-white">Dispatch Ambulance</h2><button onClick={() => setShowAmbulance(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleDispatchAmbulance} className="flex flex-col gap-4">
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Emergency Case *</label><select value={ambulanceForm.case_id} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, case_id: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"><option value="">Select case...</option>{(cases || []).map((c) => (<option key={c.id} value={c.id}>{c.case_number} — {c.patient_name}</option>))}</select></div>
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Pickup Address *</label><textarea value={ambulanceForm.pickup_address} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, pickup_address: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none" /></div>
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Destination *</label><input type="text" value={ambulanceForm.destination} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, destination: e.target.value })} placeholder="Hospital name" className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500" /></div>
              <div className="flex gap-3">
                <div className="flex-1"><label className="block text-xs font-semibold text-slate-400 mb-1.5">Driver Name</label><input type="text" value={ambulanceForm.driver_name} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, driver_name: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
                <div className="flex-1"><label className="block text-xs font-semibold text-slate-400 mb-1.5">Driver Phone</label><input type="text" value={ambulanceForm.driver_phone} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, driver_phone: e.target.value })} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" /></div>
              </div>
              <div><label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes</label><textarea value={ambulanceForm.notes} onChange={(e) => setAmbulanceForm({ ...ambulanceForm, notes: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none" /></div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setShowAmbulance(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
                <button type="submit" disabled={dispatchAmbulance.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2">{dispatchAmbulance.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching...</> : "Dispatch"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${toast.type === "success" ? "bg-emerald-500 text-[#070b13]" : "bg-red-500 text-white"}`}>{toast.message}</div>}
    </div>
  );
}
