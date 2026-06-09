"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Phone,
  CheckCircle2,
  TrendingUp,
  Play,
  Clock,
  Smile,
  CreditCard,
  User,
  Smartphone,
} from "lucide-react";
import { useAnalyticsSummary } from "@/lib/api-hooks";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const statCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.1, duration: 0.3 },
  }),
};

export default function DashboardPage() {
  const [activeCall, setActiveCall] = useState(false);
  const [callState, setCallState] = useState<"Ringing" | "Connected" | "Completed" | "Idle">("Idle");
  const [callTranscript, setCallTranscript] = useState<SimulatedTranscript[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { data: analytics, isLoading, error } = useAnalyticsSummary();

  const [appointments] = useState<Appointment[]>([
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

  useEffect(() => {
    if (activeCall) {
      setCallState("Ringing");
      setCallDuration(0);
      setCallTranscript([]);

      const ringTimeout = setTimeout(() => {
        setCallState("Connected");

        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);

        script.forEach((line, index) => {
          setTimeout(() => {
            setCallTranscript(prev => [...prev, line]);
          }, (index + 1) * 5500);
        });

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
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Clinic Overview</h2>
          <p className="text-sm text-slate-400">Real-time status of your hospital's AI receptionist agent and bookings.</p>
        </div>
        <motion.button
          whileHover={activeCall ? {} : { scale: 1.03 }}
          whileTap={activeCall ? {} : { scale: 0.97 }}
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
        </motion.button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {error && !isLoading && (
          <div className="col-span-full bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400">
            Failed to load analytics data. Please try again later.
          </div>
        )}
        {[
          { label: "Today's Bookings", value: analytics ? String(analytics.total_appointments) : "—", change: "+18% from yesterday", icon: Calendar, color: "emerald" },
          { label: "Total Calls today", value: analytics ? String(analytics.total_calls) : "—", change: "+8% peak volume", icon: Phone, color: "teal" },
          { label: "AI Success Rate", value: analytics ? `${analytics.booking_rate_pct.toFixed(1)}%` : "—%", change: "91% patient satisfaction", icon: Smile, color: "blue" },
          { label: "bKash Revenue", value: analytics ? `৳ ${analytics.total_revenue_bdt.toLocaleString("en-US")}` : "৳ —", change: "100% deposit rate", icon: CreditCard, color: "pink" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={statCardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="bg-[#0a1120] border border-slate-800/70 p-5 rounded-2xl flex items-center justify-between shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <span className="text-2xl font-bold text-white">
                {isLoading ? (
                  <span className="inline-block w-20 h-8 rounded bg-slate-800 animate-pulse" />
                ) : (
                  stat.value
                )}
              </span>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-emerald-400 font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>{stat.change}</span>
              </div>
            </div>
            <div className={`p-3.5 rounded-xl bg-${stat.color}-500/10 text-${stat.color}-400 border border-${stat.color}-500/10`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-5 min-h-[480px] shadow-sm">
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

          <AnimatePresence mode="wait">
            {activeCall ? (
              <motion.div
                key="active-call"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col gap-4"
              >
                {callState === "Ringing" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5"
                    >
                      <Phone className="w-7 h-7" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-white">Simulated Incoming Call</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Patient Number: +880 1522 334455</p>
                    </div>
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold mt-2"
                    >
                      Connecting Stream...
                    </motion.span>
                  </motion.div>
                )}

                {callState === "Connected" && (
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      variants={containerVariants}
                      className="flex-1 overflow-y-auto max-h-[300px] border border-slate-800/80 bg-[#070b13]/60 rounded-xl p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                    >
                      <AnimatePresence>
                        {callTranscript.map((line, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: line.speaker === "AI" ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`flex gap-3 max-w-[85%] ${
                              line.speaker === "AI" ? "self-start" : "self-end flex-row-reverse"
                            }`}
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
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {callTranscript.length < script.length && (
                        <div className="flex items-center gap-2 text-slate-500 text-xs px-2 py-1">
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                            className="w-1.5 h-1.5 rounded-full bg-slate-600"
                          />
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-slate-600"
                          />
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}
                            className="w-1.5 h-1.5 rounded-full bg-slate-600"
                          />
                          <span className="ml-1 text-[10px]">Listening for speech...</span>
                        </div>
                      )}
                    </motion.div>

                    <div className="bg-[#0e172a] border border-slate-800/80 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Audio Stream</span>
                      </div>
                      <div className="flex items-end gap-1 h-5 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((bar) => {
                          const heights = ["h-2", "h-4", "h-1", "h-5", "h-3", "h-4", "h-2", "h-5", "h-3", "h-1", "h-4", "h-2", "h-3", "h-5", "h-2", "h-4"];
                          return (
                            <motion.span
                              key={bar}
                              animate={{ height: ["h-2", "h-4", "h-1", "h-5", "h-3"] }}
                              transition={{ repeat: Infinity, duration: 1.5, delay: bar * 0.1 }}
                              className={`w-0.5 rounded-full bg-gradient-to-t from-emerald-500 to-teal-400 ${heights[bar % heights.length]}`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">bn-BD [Neural2]</span>
                    </div>
                  </div>
                )}

                {callState === "Completed" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-20"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5"
                    >
                      <CheckCircle2 className="w-7 h-7" />
                    </motion.div>
                    <div>
                      <h4 className="font-semibold text-white">Call Completed Successfully</h4>
                      <p className="text-xs text-slate-400 mt-0.5">Appointment scheduled & bKash request dispatched.</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded mt-2">
                      Intent: Appointment Booked
                    </span>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center gap-4 text-center border-2 border-dashed border-slate-800/70 rounded-xl p-8 bg-[#070b13]/30"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center text-slate-500 border border-slate-700/50">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-300">No Active Calls</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Click "Simulate Incoming Call" at the top right to start a mock dialogue session showing Bangla STT and AI response loop.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white">Appointment Queue</h3>
            <span className="text-xs text-slate-400 font-mono">Today</span>
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[380px] pr-1">
            <AnimatePresence>
              {appointments.map((apt, idx) => (
                <motion.div
                  key={apt.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 2 }}
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
