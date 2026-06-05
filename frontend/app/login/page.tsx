"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Smartphone,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Simulated OTP code that displays as a system notice at the top
  const [simulatedOTP, setSimulatedOTP] = useState("");

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError("Please enter a valid Bangladeshi phone number");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setStep(2);
      // Generate a mock 4-digit OTP code
      const generated = Math.floor(1000 + Math.random() * 9000).toString();
      setSimulatedOTP(generated);
    }, 1200);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== simulatedOTP) {
      setError("Incorrect OTP verification code. Try again.");
      return;
    }
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Route to dashboard
      router.push("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col items-center justify-center p-4 font-sans text-slate-100">
      
      {/* Visual Mock OTP Notification Banner at top */}
      {step === 2 && simulatedOTP && (
        <div className="fixed top-5 max-w-sm w-full bg-[#0a1120] border border-emerald-500/30 p-3.5 rounded-2xl shadow-xl shadow-emerald-500/5 animate-in slide-in-from-top-5 duration-300 z-50">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">SMS Gateway Mock Notif</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Shasthya Seba AI OTP for login is: <span className="font-bold font-mono text-emerald-400 text-sm tracking-widest">{simulatedOTP}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main card */}
      <div className="w-full max-w-md bg-[#0a1120] border border-slate-800/80 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative glass glow backdrops */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#070b13] shadow-lg shadow-emerald-500/25">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Shasthya Seba AI</h1>
            <p className="text-xs text-slate-400 mt-1">Bangladeshi Medical Assistant Management Portal</p>
          </div>
        </div>

        {/* Step 1: Input Phone */}
        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                  +880
                </span>
                <input
                  type="tel"
                  required
                  placeholder="01712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-14 pr-4 py-3 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono tracking-wider"
                />
              </div>
            </div>

            {error && (
              <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md shadow-emerald-500/5"
            >
              {loading ? "Sending Code..." : "Send OTP Verification"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* Step 2: Input OTP */
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Enter 4-Digit OTP Code</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono text-center tracking-[1.5em] text-lg font-bold"
                />
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              </div>
            </div>

            {error && (
              <p className="text-[11px] font-semibold text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md"
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </button>
            </div>
          </form>
        )}

        <div className="border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[10px] text-slate-500 leading-normal flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            Clinic staff phone OTP dashboard access system.
          </p>
        </div>

      </div>
    </div>
  );
}
