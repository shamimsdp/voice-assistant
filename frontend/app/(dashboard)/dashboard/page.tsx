"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Phone,
  CheckCircle2,
  TrendingUp,
  Play,
  Pause,
  AlertCircle,
  Clock,
  ChevronRight,
  Smile,
  MessageSquare,
  Smartphone,
  CreditCard,
  User
} from "lucide-react";

// Types
interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  time: string;
  status: "Completed" | "Pending Payment" | "Confirmed" | "Cancelled";
  amount: number;
}

interface SimulatedTranscript {
  speaker: "Patient" | "AI";
  text: string;
  time: string;
}

export default function DashboardPage() {
  const [activeCall, setActiveCall] = useState(false);
  const [callState, setCallState] = useState<"Ringing" | "Connected" | "Completed" | "Idle">("Idle");
  const [callTranscript, setCallTranscript] = useState<SimulatedTranscript[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "APT001", patientName: "Imran Khan", phone: "01711223344", doctorName: "Dr. Shah Alam (Cardiology)", time: "09:30 AM", status: "Completed", amount: 500 },
    { id: "APT002", patientName: "Farhana Yasmin", phone: "01988776655", doctorName: "Dr. Laila Bilkis (Gynaecology)", time: "10:15 AM", status: "Confirmed", amount: 500 },
    { id: "APT003", patientName: "Tariqul Islam", phone: "01522334455", doctorName: "Dr. M. Rahman (Orthopedics)", time: "11:00 AM", status: "Pending Payment", amount: 500 },
    { id: "APT004", patientName: "Nusrat Jahan", phone: "01844556677", doctorName: "Dr. Laila Bilkis (Gynaecology)", time: "11:45 AM", status: "Confirmed", amount: 500 },
    { id: "APT005", patientName: "Abul Kalam", phone: "01311223344", doctorName: "Dr. Shah Alam (Cardiology)", time: "12:30 PM", status: "Cancelled", amount: 0 },
  ]);

  const script: SimulatedTranscript[] = [
    { speaker: "AI", text: "আসসালামু আলাইকুম! শাশ্থ্য সেবা এআই-তে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?", time: "0:02" },
    { speaker: "Patient", text: "ওয়া আলাইকুম আসসালাম। আমি কার্ডিওলজি ডাক্তার শাহ আলমের একটা অ্যাপয়েন্টমেন্ট বুক করতে চাইছিলাম।", time: "0:08" },
    { speaker: "AI", text: "অবশ্যই, আমি আপনাকে সাহায্য করছি। ডক্টর শাহ আলম আজ সকাল ১১:৩০ এবং দুপুর ১২:৩০ মিনিটে ফাঁকা আছেন। আপনার জন্য কোন সময়টি সুবিধাজনক হবে?", time: "0:15" },
    { speaker: "Patient", text: "আজ সকাল ১১:৩০ টার সময়টা দিন আমাকে।", time: "0:20" },
    { speaker: "AI", text: "ঠিক আছে, আমি আজ সকাল ১১:৩০ এ ডক্টর শাহ আলমের সাথে একটি স্লট সিলেক্ট করেছি। অনুগ্রহ করে আপনার পুরো নাম ও মোবাইল নম্বরটি বলুন।", time: "0:28" },
    { speaker: "Patient", text: "আমার নাম তারিকুল ইসলাম, মোবাইল নম্বর ০১৫২২৩৩৪৪৫৫।", time: "0:34" },
    { speaker: "AI", text: "ধন্যবাদ জনাব তারিকুল ইসলাম। বুকিং কনফার্ম করার জন্য আপনার মোবাইলে একটি bKash পেমেন্ট লিংক এসএমএস করে পাঠিয়েছি। পেমেন্ট সম্পন্ন হলে আপনার বুকিংটি চূড়ান্ত হবে।", time: "0:43" },
    { speaker: "Patient", text: "জি, আমি এখনই পেমেন্ট করে দিচ্ছি। ধন্যবাদ আপনাকে।", time: "0:47" },
    { speaker: "AI", text: "আপনাকেও ধন্যবাদ। সুস্থ থাকুন, আল্লাহ হাফেজ।", time: "0:51" },
  ];

  // Call simulation trigger
  useEffect(() => {
    if (activeCall) {
      setCallState("Ringing");
      setCallDuration(0);
      setCallTranscript([]);
      
      const ringTimeout = setTimeout(() => {
        setCallState("Connected");
        
        // Start duration counter
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        // Populate transcripts successively
        script.forEach((line, index) => {
          setTimeout(() => {
            setCallTranscript(prev => [...prev, line]);
            // Auto add to appointments if it's the confirm step
            if (index === 6) {
              // Add Tariqul Islam to queue as Pending Payment
            }
          }, (index + 1) * 5500);
        });

        // End Call after script finishes
        setTimeout(() => {
          setCallState("Completed");
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            setCallState("Idle");
            setActiveCall(false);
          }, 3000);
        }, script.length * 5600);

      }, 2500);

      return () => {
        clearTimeout(ringTimeout);
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [activeCall]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusStyle = (status: Appointment["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-slate-800/80 text-slate-400 border border-slate-700/50";
      case "Confirmed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "Pending Payment":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse";
      case "Cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/25";
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto">
      {/* Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Clinic Overview</h2>
          <p className="text-sm text-slate-400">Real-time status of your hospital's AI receptionist agent and bookings.</p>
        </div>
        <button
          onClick={() => setActiveCall(true)}
          disabled={activeCall}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md ${
            activeCall
              ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070b13] hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/10"
          }`}
        >
          <Play className="w-4 h-4" />
          {activeCall ? "Simulation Running..." : "Simulate Incoming Call"}
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Stat 1 */}
        <div className="bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Today's Bookings</span>
            <span className="text-2xl font-bold text-white">24</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+18% from yesterday</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Calls today</span>
            <span className="text-2xl font-bold text-white">187</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+8% peak volume</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/10">
            <Phone className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">AI Success Rate</span>
            <span className="text-2xl font-bold text-white">94.2%</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>91% patient satisfaction</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
            <Smile className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">bKash Revenue</span>
            <span className="text-2xl font-bold text-white">৳ 12,000</span>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>100% deposit rate</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/10">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Live Monitor & Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Call Monitor (Span 2) */}
        <div className="lg:col-span-2 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-5 min-h-[480px] shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {activeCall && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${activeCall ? "bg-red-500" : "bg-slate-600"}`}></span>
              </span>
              <h3 className="font-bold text-base text-white">Live Call Monitor</h3>
            </div>
            {activeCall && (
              <div className="flex items-center gap-3">
                <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-md font-medium">
                  {callState}
                </span>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1 bg-slate-800/50 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" />
                  {formatDuration(callDuration)}
                </span>
              </div>
            )}
          </div>

          {/* Interactive Simulation Console */}
          {activeCall ? (
            <div className="flex-1 flex flex-col gap-4">
              {/* Ringing State */}
              {callState === "Ringing" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-bounce text-emerald-400 shadow-lg shadow-emerald-500/5">
                    <Phone className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Simulated Incoming Call</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Patient Number: +880 1522 334455</p>
                  </div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest animate-pulse font-semibold mt-2">Connecting Stream...</span>
                </div>
              )}

              {/* Connected / Dialogue State */}
              {callState === "Connected" && (
                <div className="flex-1 flex flex-col justify-between gap-4">
                  {/* Transcript box */}
                  <div className="flex-1 overflow-y-auto max-h-[300px] border border-slate-800/80 bg-[#070b13]/60 rounded-xl p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    {callTranscript.map((line, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-3 max-w-[85%] ${
                          line.speaker === "AI" ? "self-start" : "self-end flex-row-reverse"
                        } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      >
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-semibold ${
                          line.speaker === "AI" 
                            ? "bg-emerald-500 text-[#070b13]" 
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}>
                          {line.speaker === "AI" ? "AI" : "P"}
                        </div>
                        <div className={`rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                          line.speaker === "AI"
                            ? "bg-emerald-500/10 text-slate-200 border border-emerald-500/15"
                            : "bg-slate-800/70 text-slate-200 border border-slate-700/60"
                        }`}>
                          <p className="font-medium text-[10px] mb-0.5 text-slate-400">{line.speaker} • {line.time}</p>
                          <p>{line.text}</p>
                        </div>
                      </div>
                    ))}
                    {callTranscript.length < script.length && (
                      <div className="flex items-center gap-2 text-slate-500 text-xs px-2 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse delay-75"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse delay-150"></span>
                        <span className="ml-1 text-[10px]">Listening for speech...</span>
                      </div>
                    )}
                  </div>

                  {/* Audio Wave Visualizer representation */}
                  <div className="bg-[#0e172a] border border-slate-800/80 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Audio Stream</span>
                    </div>
                    {/* Visual waves */}
                    <div className="flex items-end gap-1 h-5 overflow-hidden">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((bar) => {
                        const heights = ["h-2", "h-4", "h-1", "h-5", "h-3", "h-4", "h-2", "h-5", "h-3", "h-1", "h-4", "h-2", "h-3", "h-5", "h-2", "h-4"];
                        return (
                          <span
                            key={bar}
                            className={`w-0.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-400 animate-pulse ${
                              heights[bar % heights.length]
                            }`}
                          ></span>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">bn-BD [Neural2]</span>
                  </div>
                </div>
              )}

              {/* Completed State */}
              {callState === "Completed" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">Call Completed Successfully</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Appointment scheduled & bKash request dispatched.</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded mt-2">
                    Intent: Appointment Booked
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center border-2 border-dashed border-slate-800/70 rounded-xl p-8 bg-[#070b13]/30">
              <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/50">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-300">No Active Calls</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Click "Simulate Incoming Call" at the top right to start a mock dialogue session showing Bangla STT and AI response loop.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Today's Queue Sidebar */}
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Appointment Queue</h3>
            <span className="text-xs text-slate-400 font-mono">Today</span>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[380px] pr-1">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-[#080d1a] border border-slate-800/60 rounded-xl p-3.5 flex flex-col gap-2 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-white truncate">{apt.patientName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700/50">
                    {apt.time}
                  </span>
                </div>

                <div className="flex flex-col gap-1 border-t border-slate-800/50 pt-2 text-[11px] text-slate-400">
                  <p className="truncate">Doctor: <span className="text-slate-300 font-medium">{apt.doctorName}</span></p>
                  <p>Phone: <span className="text-slate-300 font-mono">{apt.phone}</span></p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusStyle(apt.status)}`}>
                    {apt.status}
                  </span>
                  {apt.amount > 0 && (
                    <span className="text-[10px] text-slate-300 font-bold font-mono">
                      ৳{apt.amount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
