"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Stethoscope,
  Phone,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Calendar,
  MessageSquare,
  ArrowRight,
  ChevronRight,
  Play,
  Volume2,
  PhoneCall,
  Smartphone,
  Activity,
  Award
} from "lucide-react";

interface SimulatedTurn {
  speaker: "AI" | "Patient";
  text: string;
}

export default function LandingPage() {
  const [demoActive, setDemoActive] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoConversation, setDemoConversation] = useState<SimulatedTurn[]>([
    { speaker: "AI", text: "আসসালামু আলাইকুম! শাশ্থ্য সেবা এআই-তে স্বাগতম। কীভাবে সাহায্য করতে পারি?" }
  ]);

  const dialogOptions = [
    {
      label: "Book Gynaecology Slot (Dr. Laila Bilkis)",
      patientText: "হ্যালো, গাইনোকোলজিস্ট ডক্টর লায়লা বিলকিসের সিরিয়াল পাওয়া যাবে?",
      aiResponse: "জ্বী অবশ্যই! ডক্টর লায়লা বিলকিস আজ সকাল ১১:৪৫ মিনিটে ফাঁকা আছেন। এই সময়ে কি বুক করে দেবো?"
    },
    {
      label: "Confirm Time Slot",
      patientText: "হ্যাঁ, ১১:৪৫ এর সময়টাই আমার জন্য ভালো হবে।",
      aiResponse: "ঠিক আছে, আমি ফারহানা ইয়াসমিন নামে আজ ১১:৪৫ মিনিটে সিরিয়াল বুক করেছি। আপনার মোবাইলে বিকাশ পেমেন্টের লিংক পাঠিয়েছি, অনুগ্রহ করে ডিপোজিট ফি সম্পন্ন করুন।"
    },
    {
      label: "Ask for Hospital Location",
      patientText: "আপনাদের চেম্বারটি ঢাকাতে ঠিক কোন জায়গায়?",
      aiResponse: "আমাদের ক্লিনিকটি পান্থপথ সিগন্যাল পার হয়ে স্কয়ার হাসপাতালের ঠিক বিপরীত পাশে অবস্থিত। আপনি যেকোনো দিন সকাল ৯টা থেকে রাত ৮টার মধ্যে আসতে পারেন।"
    }
  ];

  const handleUserDialog = (optionIdx: number) => {
    const selected = dialogOptions[optionIdx];
    
    // Add patient response
    const patientTurn: SimulatedTurn = { speaker: "Patient", text: selected.patientText };
    setDemoConversation(prev => [...prev, patientTurn]);
    
    setDemoStep(optionIdx + 1);

    // AI response simulation delay
    setTimeout(() => {
      const aiTurn: SimulatedTurn = { speaker: "AI", text: selected.aiResponse };
      setDemoConversation(prev => [...prev, aiTurn]);
    }, 1500);
  };

  const resetDemo = () => {
    setDemoStep(0);
    setDemoConversation([
      { speaker: "AI", text: "আসসালামু আলাইকুম! শাশ্থ্য সেবা এআই-তে স্বাগতম। কীভাবে সাহায্য করতে পারি?" }
    ]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col font-sans relative overflow-hidden"
    >
      
      {/* Decorative colored lights backdrop */}
      <motion.div
        animate={{ scale: [1, 1.05, 1], opacity: [0.05, 0.08, 0.05] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.07, 0.05] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[120px] pointer-events-none"
      />

      {/* Top Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="h-20 max-w-7xl w-full mx-auto px-6 flex items-center justify-between z-10"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#070b13] shadow-md shadow-emerald-500/20">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">Shasthya Seba AI</span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#0a1120] hover:bg-slate-800/80 border border-slate-800 rounded-xl transition-all"
          >
            Clinic Login Portal
          </Link>
          <button
            onClick={() => setDemoActive(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl transition-all shadow-md shadow-emerald-500/5"
          >
            Try Live Demo
          </button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.main
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center gap-12 z-10"
      >
        
        {/* Left Side: Hero Info */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex-1 flex flex-col gap-6 text-left"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 uppercase tracking-wider w-fit"
          >
            <Sparkles className="w-3 h-3" />
            Empowering Bangladeshi Clinics
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1]"
          >
            Automate Clinic Appointments with <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Bangla AI Voice Agents</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="text-sm md:text-base text-slate-400 leading-relaxed max-w-xl"
          >
            A production-ready voice assistant that handles incoming patient calls in Bangla, English, or Banglish. Integrates with Twilio streams, automates doctor slots, and collects deposit payments via bKash gateway.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="flex flex-wrap items-center gap-4 mt-2"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link
                href="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-[#070b13] hover:from-emerald-400 hover:to-teal-400 shadow-lg shadow-emerald-500/10 transition-all"
              >
                Enter Clinic Portal
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setDemoActive(true);
                const element = document.getElementById("demo-box");
                if (element) element.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white bg-[#0a1120] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              Try Assistant Demo
            </motion.button>
          </motion.div>

          {/* Key Quick Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-6 mt-4"
          >
            {[{ label: "bn-BD", sub: "Localized STT/TTS" }, { label: "৳ bKash", sub: "Sandbox Enabled" }, { label: "Friday Guard", sub: "Jumma Prayer Filter" }].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="flex flex-col"
              >
                <span className="text-lg font-bold text-white">{item.label}</span>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">{item.sub}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right Side: Demo Box Simulator */}
        <motion.div
          id="demo-box"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="w-full lg:w-[480px] shrink-0 bg-[#0a1120] border border-slate-800/60 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl relative"
        >
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm text-white">Interactive Voice AI Sandbox</h3>
            </div>
            {demoActive && (
              <button
                onClick={resetDemo}
                className="text-[10px] font-bold text-slate-400 hover:text-white bg-slate-800 border border-slate-700 px-2 py-0.5 rounded"
              >
                Reset Demo
              </button>
            )}
          </div>

          {!demoActive ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center animate-bounce">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-200">Interactive Phone Call Simulator</h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-normal">
                  Experience how the AI receptionist dialogues with patients, booking schedules, and responding in Bangla.
                </p>
              </div>
              <button
                onClick={() => setDemoActive(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Simulate Call
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-4 min-h-[300px]">
              
              {/* Dialogue Transcript Window */}
              <div className="flex-1 max-h-[220px] overflow-y-auto bg-[#070b13] border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 scrollbar-thin">
                {demoConversation.map((line, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${
                      line.speaker === "AI" ? "self-start" : "self-end flex-row-reverse"
                    } animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold ${
                      line.speaker === "AI" ? "bg-emerald-500 text-[#070b13]" : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}>
                      {line.speaker === "AI" ? "AI" : "P"}
                    </div>
                    <div className={`rounded-xl px-3 py-1.5 text-xs leading-relaxed ${
                      line.speaker === "AI"
                        ? "bg-emerald-500/10 text-slate-200 border border-emerald-500/15"
                        : "bg-slate-800/70 text-slate-200 border border-slate-700/60"
                    }`}>
                      <p>{line.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action selections (canned speech) */}
              <div className="flex flex-col gap-2 mt-auto border-t border-slate-800/80 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Patient Response Options</span>
                
                {demoStep === 0 && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleUserDialog(0)}
                      className="text-left w-full px-3 py-2 bg-[#080d1a] border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between"
                    >
                      <span>{dialogOptions[0].label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleUserDialog(2)}
                      className="text-left w-full px-3 py-2 bg-[#080d1a] border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between"
                    >
                      <span>Ask clinic location details</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                )}

                {demoStep === 1 && (
                  <button
                    onClick={() => handleUserDialog(1)}
                    className="text-left w-full px-3 py-2 bg-[#080d1a] border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between"
                  >
                    <span>{dialogOptions[1].label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                )}

                {demoStep >= 2 && (
                  <div className="text-center py-4">
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-semibold">
                      Demo Flow Completed Successfully
                    </span>
                    <button
                      onClick={resetDemo}
                      className="block mx-auto mt-3 text-[10px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Run simulator again
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </motion.div>

      </motion.main>

      {/* Feature section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-[#0a1120] border-t border-slate-800/80 py-16 px-6 z-10"
      >
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center max-w-xl mx-auto flex flex-col gap-2"
          >
            <h2 className="text-2xl font-bold text-white">Full-Featured Localization Stack</h2>
            <p className="text-xs md:text-sm text-slate-400">Everything needed to deploy AI medical assistants under Bangladeshi clinic structures.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: MessageSquare, title: "Multilingual Speech", desc: "Seamless translation loops across Bangla, English, and local Banglish structures.", color: "emerald" },
              { icon: CreditCard, title: "bKash Integration", desc: "Automated deposit token validation linked with local carrier billing.", color: "pink" },
              { icon: Calendar, title: "Jumma Guards", desc: "Bypasses call booking registrations during standard Friday prayer blocks.", color: "blue" },
              { icon: Smartphone, title: "Unicode SMS", desc: "Sends automated booking alerts over local carrier SMS gateways in Bangla script.", color: "amber" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-[#070b13] border border-slate-800/70 p-5 rounded-2xl flex flex-col gap-3"
              >
                <div className={`w-9 h-9 rounded-xl bg-${feature.color}-500/10 border border-${feature.color}-500/20 flex items-center justify-center text-${feature.color}-400`}>
                  <feature.icon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">{feature.title}</h3>
                <p className="text-xs text-slate-500 leading-normal">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="border-t border-slate-800/80 bg-[#070b13] py-8 text-center text-slate-600 text-xs"
      >
        <p>© {new Date().getFullYear()} Shasthya Seba AI. Built for premium clinic workflows in Bangladesh.</p>
      </motion.footer>

    </motion.div>
  );
}
