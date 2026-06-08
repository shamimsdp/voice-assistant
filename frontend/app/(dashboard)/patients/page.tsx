"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  AlertCircle,
  Loader2,
  X,
  User,
  Phone,
  CalendarDays,
  Mail,
  ChevronRight,
  History,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";

interface Patient {
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

const defaultForm = {
  phone: "",
  name: "",
  name_bn: "",
  email: "",
  date_of_birth: "",
  gender: "",
  address: "",
};

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : "";
      const data = await api.get<Patient[]>(`/api/patients${params}`);
      setPatients(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => {
    const timer = setTimeout(() => { fetchPatients(); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) return;
    setSaving(true);
    try {
      await api.post("/api/patients", form);
      setShowForm(false);
      setForm(defaultForm);
      await fetchPatients();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Patients</h1>
          <p className="text-sm text-slate-400 mt-1">View and manage your clinic's registered patients</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Register Patient
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-2.5 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text" placeholder="Search by name or phone..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0a1120] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
      ) : patients.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No patients found</p>
          <p className="text-xs mt-1">Register your first patient to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {patients.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedPatient(p)}
              className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{p.name || "Unnamed"}</h3>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {p.phone}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>}
                {p.gender && <span>{p.gender}</span>}
                <span>{p.appointment_count} appointment{p.appointment_count !== 1 ? "s" : ""}</span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-800/40 flex items-center justify-between">
                <span className="text-[10px] text-slate-600">Registered {formatDate(p.created_at)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/patients/${p.id}`); }}
                    className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> EHR
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Patient Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreate}
              className="w-full max-w-lg bg-[#0a1120] border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-400" /> Register Patient
                </h2>
                <button type="button" onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Phone *</label>
                  <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                    placeholder="01712345678" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Name (EN)</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      placeholder="Patient name" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Name (BN)</label>
                    <input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      placeholder="রোগীর নাম" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                      placeholder="patient@email.com" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Date of Birth</label>
                    <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Gender</label>
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Address</label>
                  <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || !form.phone.trim()}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Register Patient"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Patient Detail Slideover */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-lg bg-[#0a1120] border-l border-slate-800 h-full overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-white">Patient Details</h2>
                  <button onClick={() => setSelectedPatient(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPatient.name || "Unnamed"}</h3>
                    {selectedPatient.name_bn && (
                      <p className="text-sm text-slate-400">{selectedPatient.name_bn}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedPatient.phone}</span>
                      {selectedPatient.email && (
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedPatient.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#070b13] rounded-xl p-3.5 border border-slate-800/60">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Gender</p>
                    <p className="text-sm font-semibold text-white mt-0.5 capitalize">{selectedPatient.gender || "—"}</p>
                  </div>
                  <div className="bg-[#070b13] rounded-xl p-3.5 border border-slate-800/60">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Date of Birth</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{formatDate(selectedPatient.date_of_birth)}</p>
                  </div>
                  <div className="bg-[#070b13] rounded-xl p-3.5 border border-slate-800/60">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Appointments</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectedPatient.appointment_count}</p>
                  </div>
                  <div className="bg-[#070b13] rounded-xl p-3.5 border border-slate-800/60">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Language</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectedPatient.preferred_language}</p>
                  </div>
                </div>

                {selectedPatient.address && (
                  <div className="bg-[#070b13] rounded-xl p-3.5 border border-slate-800/60 mb-6">
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">Address</p>
                    <p className="text-sm text-slate-300 mt-0.5">{selectedPatient.address}</p>
                  </div>
                )}

                <div className="border-t border-slate-800 pt-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Quick Actions</p>
                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all"
                  >
                    Book Appointment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
