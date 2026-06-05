"use client";

import React, { useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Clock,
  Sparkles,
  Smartphone,
  Globe,
  Sliders,
  Check,
  AlertTriangle,
  Info,
  Calendar,
  Lock,
  Stethoscope
} from "lucide-react";

export default function SettingsPage() {
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings states
  const [clinicName, setClinicName] = useState("Square Hospital, Dhaka");
  const [voiceTone, setVoiceTone] = useState("Polite & Supportive (নম্র ও সাহায্যকারী)");
  const [enableJummaGuard, setEnableJummaGuard] = useState(true);
  const [enableHolidaysGuard, setEnableHolidaysGuard] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState("SSL Wireless Bangladesh");
  const [apiKey, setApiKey] = useState("••••••••••••••••••••••••••••••••");

  const [doctors, setDoctors] = useState([
    { id: 1, name: "Dr. Shah Alam", specialty: "Cardiology", slots: "15 min", active: true },
    { id: 2, name: "Dr. Laila Bilkis", specialty: "Gynaecology", slots: "20 min", active: true },
    { id: 3, name: "Dr. M. Rahman", specialty: "Orthopedics", slots: "15 min", active: true },
  ]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const toggleDoctor = (id: number) => {
    setDoctors(prev =>
      prev.map(doc => {
        if (doc.id === id) return { ...doc, active: !doc.active };
        return doc;
      })
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">System Settings</h2>
          <p className="text-sm text-slate-400">Configure clinic schedules, voice assistant prompts, and Bangladesh-specific integrations.</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md shadow-emerald-500/5"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4" />
              Settings Saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Form settings */}
        <div className="md:col-span-2 flex flex-col gap-6">
          
          {/* Section 1: Clinic profile */}
          <div className="bg-[#0a1120] border border-slate-800/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-emerald-400">
              <Stethoscope className="w-4 h-4" />
              Clinic Info
            </h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hospital/Clinic Name</label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Section 2: Localization Guards (Jumma & Holiday) */}
          <div className="bg-[#0a1120] border border-slate-800/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider text-emerald-400">
                Bangladesh Localization Guards
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-normal">
              Configure regional compliance blocks to automatically reject booking calls during holy hours or national public holidays.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              {/* Jumma Guard */}
              <div className="flex items-center justify-between gap-4 p-3 bg-[#070b13] border border-slate-800/60 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-white">Jumma Prayer Block (শুক্রবার জুমা)</span>
                  <span className="text-[10px] text-slate-500">Restricts call bookings on Friday 12:00 PM - 2:00 PM</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableJummaGuard}
                  onChange={(e) => setEnableJummaGuard(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 bg-[#070b13] border-slate-800 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {/* Public Holiday Guard */}
              <div className="flex items-center justify-between gap-4 p-3 bg-[#070b13] border border-slate-800/60 rounded-xl">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-white">Bangladesh Public Holidays Guard</span>
                  <span className="text-[10px] text-slate-500">Eid, Puja, Victory Day, Independence Day</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableHolidaysGuard}
                  onChange={(e) => setEnableHolidaysGuard(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 bg-[#070b13] border-slate-800 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section 3: SMS Gateway Integrations */}
          <div className="bg-[#0a1120] border border-slate-800/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-emerald-400">
              <Smartphone className="w-4 h-4" />
              Local SMS Gateway Provider
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Gateway</label>
                <select
                  value={selectedGateway}
                  onChange={(e) => setSelectedGateway(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="SSL Wireless Bangladesh">SSL Wireless Bangladesh</option>
                  <option value="Infozillion BD">Infozillion BD</option>
                  <option value="Twilio Global SMS">Twilio Global SMS</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gateway Auth Token</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right 1 Col: Voice Agent config & Doctor slots */}
        <div className="flex flex-col gap-6">
          
          {/* Section 4: Voice Agent Tone parameters */}
          <div className="bg-[#0a1120] border border-slate-800/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-emerald-400">
              <Sliders className="w-4 h-4" />
              AI Voice Prompt Tuning
            </h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Receptionist Persona</label>
                <select
                  value={voiceTone}
                  onChange={(e) => setVoiceTone(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="Polite & Supportive (নম্র ও সাহায্যকারী)">Polite & Supportive (নম্র ও সাহায্যকারী)</option>
                  <option value="Clinical & Efficient (ক্লিনিকাল ও দ্রুত)">Clinical & Efficient (ক্লিনিকাল ও দ্রুত)</option>
                  <option value="Formal Academic (আনুষ্ঠানিক ও গুরুগম্ভীর)">Formal Academic (আনুষ্ঠানিক ও গুরুগম্ভীর)</option>
                </select>
              </div>

              <div className="bg-[#070b13] border border-slate-800/50 p-2.5 rounded-xl text-[10px] text-slate-500 flex gap-2 leading-relaxed">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Modifying this updates the Gemini system instruction prompts with custom Bangla greeting templates.</span>
              </div>
            </div>
          </div>

          {/* Section 5: Doctor Active shift switches */}
          <div className="bg-[#0a1120] border border-slate-800/60 p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider text-emerald-400">
              <Calendar className="w-4 h-4" />
              Active Doctors Shift
            </h3>

            <div className="flex flex-col gap-3">
              {doctors.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-2.5 bg-[#070b13] border border-slate-800/60 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-white">{doc.name}</span>
                    <span className="text-[10px] text-slate-500">{doc.specialty} • {doc.slots}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleDoctor(doc.id)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${
                      doc.active ? "bg-emerald-500" : "bg-slate-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-[#0a1120] shadow-sm transform transition-transform duration-200 ${
                        doc.active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
