"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Phone, KeyRound, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function PatientLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const requestOtp = async () => {
    if (!/^01[3-9]\d{8}$/.test(phone)) { setError("Enter a valid BD phone number (01XXXXXXXXX)"); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      const res = await fetch(`${API}/api/patient-portal/request-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setMessage(data.message || "OTP sent");
      setStep("otp");
    } catch { setError("Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length < 4) { setError("Enter the OTP code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/api/patient-portal/verify-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || "Invalid OTP"); }
      const data = await res.json();
      localStorage.setItem("patient_token", data.access_token);
      localStorage.setItem("patient_data", JSON.stringify(data.patient));
      router.push("/patient/portal");
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-8 shadow-xl">
          {/* Brand */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#070b13]">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white">Shasthya Seba AI</h1>
              <p className="text-[10px] text-emerald-400 font-medium">Patient Portal</p>
            </div>
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-2">Welcome</h2>
          <p className="text-sm text-slate-400 text-center mb-6">Log in to view your appointments and bills</p>

          {message && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-400">{message}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {step === "phone" ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && requestOtp()}
                  />
                </div>
              </div>
              <button
                onClick={requestOtp}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Send OTP
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">OTP Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter OTP"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                  />
                </div>
              </div>
              <button
                onClick={verifyOtp}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Verify & Login
              </button>
              <button
                onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors text-center"
              >
                Change phone number
              </button>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800/60 text-center">
            <Link href="/login" className="text-xs text-slate-500 hover:text-emerald-400 transition-colors">
              Staff login →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
