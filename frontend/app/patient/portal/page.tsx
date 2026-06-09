"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Receipt, LogOut, User, Stethoscope, Loader2, AlertCircle, Clock, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePatientAppointments, usePatientInvoices } from "@/lib/api-hooks";

const statusColors: Record<string, string> = {
  scheduled: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  confirmed: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  completed: "text-slate-400 bg-slate-500/10 border-slate-500/25",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/25",
  no_show: "text-amber-400 bg-amber-500/10 border-amber-500/25",
};

const invoiceStatusColors: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  pending: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  overdue: "text-red-400 bg-red-500/10 border-red-500/25",
  draft: "text-slate-400 bg-slate-500/10 border-slate-500/25",
};

export default function PatientPortalPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("patient_token");
    const p = localStorage.getItem("patient_data");
    if (!t) { router.push("/patient/login"); return; }
    setToken(t);
    if (p) setPatient(JSON.parse(p));
  }, [router]);

  const { data: appointments, isLoading: loadingApps, error: appsError } = usePatientAppointments(token);
  const { data: invoices, isLoading: loadingInv, error: invError } = usePatientInvoices(token);

  const handleLogout = () => {
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_data");
    router.push("/patient/login");
  };

  if (!token || !patient) return null;

  return (
    <div className="min-h-screen bg-[#070b13]">
      {/* Header */}
      <header className="bg-[#0a1120] border-b border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#070b13]">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-white">Patient Portal</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">
        {/* Patient Info */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{patient.name_bn || patient.name || "Patient"}</h2>
              <p className="text-xs text-slate-400">{patient.phone}</p>
            </div>
          </div>
        </motion.div>

        {/* Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-emerald-400" />
            My Appointments
          </h3>

          {loadingApps && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          )}
          {appsError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-xs text-slate-400">Failed to load appointments</p>
            </div>
          )}
          {!loadingApps && !appsError && (!appointments || appointments.length === 0) && (
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-8 text-center">
              <CalendarDays className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No appointments yet</p>
            </div>
          )}
          {!loadingApps && appointments && appointments.length > 0 && (
            <div className="flex flex-col gap-2">
              {appointments.map((a) => (
                <div key={a.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/60 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{a.doctor_name || "Doctor"}</p>
                      <p className="text-[10px] text-slate-500">{a.doctor_specialty || ""}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.appointment_date && new Date(a.appointment_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        {a.appointment_time && ` at ${a.appointment_time}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${statusColors[a.status] ?? "text-slate-400"}`}>
                      {a.status.replace("_", " ")}
                    </span>
                    {a.fee != null && <span className="text-xs font-bold text-emerald-400">৳{a.fee}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-emerald-400" />
            My Bills
          </h3>

          {loadingInv && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          )}
          {invError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
              <p className="text-xs text-slate-400">Failed to load bills</p>
            </div>
          )}
          {!loadingInv && !invError && (!invoices || invoices.length === 0) && (
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-8 text-center">
              <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No bills yet</p>
            </div>
          )}
          {!loadingInv && invoices && invoices.length > 0 && (
            <div className="flex flex-col gap-2">
              {invoices.map((inv) => (
                <div key={inv.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">{inv.invoice_number}</p>
                    <p className="text-[10px] text-slate-500">
                      {inv.issued_at && new Date(inv.issued_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {inv.due_at && ` · Due ${new Date(inv.due_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${invoiceStatusColors[inv.status] ?? ""}`}>
                      {inv.status}
                    </span>
                    <span className="text-sm font-bold text-emerald-400">৳{inv.total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
