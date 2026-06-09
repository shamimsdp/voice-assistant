"use client";

import React, { useState } from "react";
import {
  Video,
  Plus,
  X,
  Search,
  User,
  Calendar,
  Clock,
  CheckCircle,
  Loader2,
  PhoneOff,
  Play,
} from "lucide-react";
import { useTelemedicineSessions, useScheduleTelemedicine, useUpdateSessionStatus, useDoctors, usePatients } from "@/lib/api-hooks";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  in_progress: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  completed: "bg-slate-500/10 text-slate-400 border-slate-500/25",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/25",
  no_show: "bg-amber-500/10 text-amber-400 border-amber-500/25",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const prefix = target.getTime() === today.getTime() ? "Today" :
    target.getTime() === yesterday.getTime() ? "Yesterday" : "";
  const time = d.toLocaleTimeString("en-BD", { hour: "2-digit", minute: "2-digit" });
  return prefix ? `${prefix} at ${time}` : d.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function TelemedicinePage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showSchedule, setShowSchedule] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const { data: doctors } = useDoctors();
  const { data: patients } = usePatients();
  const { data: sessions, isLoading, error } = useTelemedicineSessions(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const scheduleSession = useScheduleTelemedicine();
  const updateStatus = useUpdateSessionStatus();

  const [form, setForm] = useState({
    patient_id: "",
    doctor_id: "",
    scheduled_at: "",
    scheduled_time: "",
    duration_min: 20,
    meeting_url: "",
    room_name: "",
    notes: "",
  });

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  }

  function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patient_id || !form.doctor_id || !form.scheduled_at || !form.scheduled_time) {
      showToast("Fill in all required fields", "error");
      return;
    }
    const scheduled_at = `${form.scheduled_at}T${form.scheduled_time}:00`;
    scheduleSession.mutate(
      {
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        scheduled_at,
        duration_min: form.duration_min,
        meeting_url: form.meeting_url || undefined,
        room_name: form.room_name || undefined,
      },
      {
        onSuccess: () => {
          setShowSchedule(false);
          setForm({ patient_id: "", doctor_id: "", scheduled_at: "", scheduled_time: "", duration_min: 20, meeting_url: "", room_name: "", notes: "" });
          showToast("Telemedicine session scheduled");
        },
        onError: (err) => showToast(err.message, "error"),
      }
    );
  }

  function handleStatusChange(sessionId: string, newStatus: string) {
    updateStatus.mutate(
      { id: sessionId, status: newStatus },
      {
        onSuccess: () => showToast(`Session marked as ${newStatus.replace("_", " ")}`),
        onError: (err) => showToast(err.message, "error"),
      }
    );
  }

  const doctorMap = new Map(doctors?.map((d) => [d.id, d.name]) || []);
  const patientMap = new Map(patients?.map((p) => [p.id, p.name || p.phone]) || []);

  const filtered = (sessions || []).filter((s) => {
    const name = patientMap.get(s.patient_id) || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const summary = {
    total: sessions?.length || 0,
    scheduled: sessions?.filter((s) => s.status === "scheduled").length || 0,
    inProgress: sessions?.filter((s) => s.status === "in_progress").length || 0,
    completed: sessions?.filter((s) => s.status === "completed").length || 0,
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Telemedicine</h1>
          <p className="text-sm text-slate-400 mt-1">Video consultations and remote patient sessions</p>
        </div>
        <button
          onClick={() => setShowSchedule(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-semibold transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Schedule Session
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Sessions</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Video className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Scheduled</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{summary.scheduled}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">In Progress</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.inProgress}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Play className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Completed</p>
              <p className="text-2xl font-bold text-slate-400 mt-1">{summary.completed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-slate-800 rounded" />
                  <div className="h-3 w-56 bg-slate-800 rounded mt-2" />
                </div>
                <div className="h-4 w-16 bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 text-center">
          <p className="text-sm text-red-400">Failed to load sessions: {error.message}</p>
        </div>
      )}

      {/* Session List */}
      {!isLoading && !error && (
        <div className="flex flex-col gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Video className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">No telemedicine sessions found</p>
            </div>
          )}
          {filtered.map((session) => (
            <div key={session.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#070b13] border border-slate-800 flex items-center justify-center shrink-0">
                    <Video className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-white">
                        {patientMap.get(session.patient_id) || "Unknown Patient"}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[session.status] || "bg-slate-500/10 text-slate-400"}`}>
                        {session.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <User className="w-3 h-3" />
                        {doctorMap.get(session.doctor_id) || "Unknown Doctor"}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {session.duration_min} min
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {formatDate(session.scheduled_at)}
                    </p>
                    {session.meeting_url && (
                      <a
                        href={session.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-emerald-400 hover:text-emerald-300 underline"
                      >
                        <Video className="w-3 h-3" />
                        Join Meeting
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {session.status === "scheduled" && (
                    <>
                      <button
                        onClick={() => handleStatusChange(session.id, "in_progress")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Start
                      </button>
                      <button
                        onClick={() => handleStatusChange(session.id, "cancelled")}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/25 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </>
                  )}
                  {session.status === "in_progress" && (
                    <button
                      onClick={() => handleStatusChange(session.id, "completed")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-xs font-semibold transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      End
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Schedule Telemedicine Session</h2>
              <button onClick={() => setShowSchedule(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSchedule} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient *</label>
                <select
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="">Select patient...</option>
                  {(patients || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name || p.phone}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Doctor *</label>
                <select
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="">Select doctor...</option>
                  {(doctors || []).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date *</label>
                  <input
                    type="date"
                    value={form.scheduled_at}
                    onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Time *</label>
                  <input
                    type="time"
                    value={form.scheduled_time}
                    onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Duration (min)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={form.duration_min}
                  onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 20 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Meeting URL</label>
                <input
                  type="url"
                  value={form.meeting_url}
                  onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
                  placeholder="https://meet.example.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Room Name</label>
                <input
                  type="text"
                  value={form.room_name}
                  onChange={(e) => setForm({ ...form, room_name: e.target.value })}
                  placeholder="Optional room identifier"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowSchedule(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleSession.isPending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors disabled:bg-slate-700 disabled:text-slate-500 flex items-center justify-center gap-2"
                >
                  {scheduleSession.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling...</> : "Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${toast.type === "success" ? "bg-emerald-500 text-[#070b13]" : "bg-red-500 text-white"}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
