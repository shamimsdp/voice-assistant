"use client";

import React, { useState } from "react";
import {
  PhoneCall,
  Search,
  Clock,
  MessageSquare,
  Smile,
  Meh,
  Frown,
  Play,
  Volume2,
  Calendar,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface CallLog {
  id: string;
  phone: string;
  timestamp: string;
  duration: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  language: "Bangla" | "English" | "Banglish";
  intent: "Appointment Booked" | "Clinic Info Query" | "Doctor Schedule Query" | "Payment Inquiry" | "General Help";
  transcript: { speaker: "Patient" | "AI"; text: string; time: string }[];
  summary: string;
}

export default function CallsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCallId, setSelectedCallId] = useState<string>("CALL001");
  const [sentimentFilter, setSentimentFilter] = useState("All");

  const [callLogs] = useState<CallLog[]>([
    {
      id: "CALL001",
      phone: "+880 1522 334455",
      timestamp: "Today, 11:00 AM",
      duration: "0:51",
      sentiment: "Positive",
      language: "Bangla",
      intent: "Appointment Booked",
      summary: "Patient booked a cardiology appointment with Dr. Shah Alam for today at 11:30 AM. SMS and bKash payment invoice triggered successfully.",
      transcript: [
        { speaker: "AI", text: "আসসালামু আলাইকুম! শাশ্থ্য সেবা এআই-তে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?", time: "0:02" },
        { speaker: "Patient", text: "ওয়া আলাইকুম আসসালাম। আমি কার্ডিওলজি ডাক্তার শাহ আলমের একটা অ্যাপয়েন্টমেন্ট বুক করতে চাইছিলাম।", time: "0:08" },
        { speaker: "AI", text: "অবশ্যই, আমি আপনাকে সাহায্য করছি। ডক্টর শাহ আলম আজ সকাল ১১:৩০ এবং দুপুর ১২:৩০ মিনিটে ফাঁকা আছেন। আপনার জন্য কোন সময়টি সুবিধাজনক হবে?", time: "0:15" },
        { speaker: "Patient", text: "আজ সকাল ১১:৩০ টার সময়টা দিন আমাকে।", time: "0:20" },
        { speaker: "AI", text: "ঠিক আছে, আমি আজ সকাল ১১:৩০ এ ডক্টর শাহ আলমের সাথে একটি স্লট সিলেক্ট করেছি। অনুগ্রহ করে আপনার পুরো নাম ও মোবাইল নম্বরটি বলুন।", time: "0:28" },
        { speaker: "Patient", text: "আমার নাম তারিকুল ইসলাম, মোবাইল নম্বর ০১৫২২৩৩৪৪৫৫।", time: "0:34" },
        { speaker: "AI", text: "ধন্যবাদ জনাব তারিকুল ইসলাম। বুকিং কনফার্ম করার জন্য আপনার মোবাইলে একটি bKash পেমেন্ট লিংক এসএমএস করে পাঠিয়েছি। পেমেন্ট সম্পন্ন হলে আপনার বুকিংটি চূড়ান্ত হবে।", time: "0:43" },
        { speaker: "Patient", text: "জি, আমি এখনই পেমেন্ট করে দিচ্ছি। ধন্যবাদ আপনাকে।", time: "0:47" },
        { speaker: "AI", text: "আপনাকেও ধন্যবাদ। সুস্থ থাকুন, আল্লাহ হাফেজ।", time: "0:51" },
      ],
    },
    {
      id: "CALL002",
      phone: "+880 1711 223344",
      timestamp: "Today, 09:28 AM",
      duration: "0:42",
      sentiment: "Positive",
      language: "Bangla",
      intent: "Appointment Booked",
      summary: "Patient Imran Khan successfully booked cardiology appointment with Dr. Shah Alam at 09:30 AM. Deposit fee of ৳500 fully paid via bKash.",
      transcript: [
        { speaker: "AI", text: "আসসালামু আলাইকুম! শাশ্থ্য সেবা এআই-তে স্বাগতম। কীভাবে সাহায্য করতে পারি?", time: "0:02" },
        { speaker: "Patient", text: "আমি ইমরান খান। ডক্টর শাহ আলমের সাথে আজ ৯:৩০ টার স্লটটি কনফার্ম করতে চাই।", time: "0:10" },
        { speaker: "AI", text: "জ্বী জনাব ইমরান, আমি চেক করে দেখছি। আপনার ৯:৩০ এর অ্যাপয়েন্টমেন্ট কনফার্ম রয়েছে এবং ডিপোজিট পেমেন্টও সফল হয়েছে। আপনি ঠিক সময়ে চেম্বারে চলে আসবেন।", time: "0:22" },
        { speaker: "Patient", text: "অনেক ধন্যবাদ ভাইয়া, ভালো লাগলো আপনার সার্ভিস।", time: "0:32" },
        { speaker: "AI", text: "আপনাকেও ধন্যবাদ। সুস্থ থাকুন, বিদায়।", time: "0:42" },
      ],
    },
    {
      id: "CALL003",
      phone: "+880 1988 776655",
      timestamp: "Today, 08:15 AM",
      duration: "1:05",
      sentiment: "Neutral",
      language: "Banglish",
      intent: "Doctor Schedule Query",
      summary: "Patient Farhana Yasmin queried Dr. Laila Bilkis's schedule. Verified availability and sent slot suggestions via SMS.",
      transcript: [
        { speaker: "AI", text: "আসসালামু আলাইকুম! আমি শাশ্থ্য সেবা এআই। কীভাবে সাহায্য করতে পারি?", time: "0:02" },
        { speaker: "Patient", text: "Hello, Dr. Laila Bilkis-এর schedule-টা একটু বলতে পারবেন? ওনাকে কবে পাওয়া যাবে?", time: "0:12" },
        { speaker: "AI", text: "অবশ্যই। ডক্টর লায়লা বিলকিস আজ সকাল ১০:১৫ এবং ১১:৪৫ মিনিটে রুগী দেখবেন। এছাড়া আগামীকাল দুপুর ২:০০ টাতেও বুক করতে পারেন। আপনার কোন দিনটি লাগবে?", time: "0:28" },
        { speaker: "Patient", text: "আজ সকাল ১০:১৫ মিনিটে একটা স্লট বুক করে দিন।", time: "0:36" },
        { speaker: "AI", text: "ঠিক আছে, ফারহানা নামে আজ ১০:১৫ টার স্লটটি বুক করে দিচ্ছি। অনুগ্রহ করে পেমেন্ট সম্পন্ন করতে আপনার ফোনে পাঠানো লিংকে ক্লিক করুন।", time: "0:52" },
        { speaker: "Patient", text: "Okay, check করছি। Thanks.", time: "1:01" },
        { speaker: "AI", text: "ধন্যবাদ। সুস্থ থাকুন।", time: "1:05" },
      ],
    },
    {
      id: "CALL004",
      phone: "+880 1311 223344",
      timestamp: "Yesterday, 04:30 PM",
      duration: "0:35",
      sentiment: "Negative",
      language: "Bangla",
      intent: "Payment Inquiry",
      summary: "Patient Abul Kalam had complaints about bKash payment gateway failure. The assistant guided him to retry, but call ended with dissatisfaction.",
      transcript: [
        { speaker: "AI", text: "আসসালামু আলাইকুম! কীভাবে আপনাকে সাহায্য করতে পারি?", time: "0:02" },
        { speaker: "Patient", text: "আপনাদের পেমেন্ট লিংক তো কাজ করছে না! বিকাশ অ্যাকাউন্টে ওটিপি কোড আসছে না কেন?", time: "0:12" },
        { speaker: "AI", text: "দুঃখিত ঝামেলার জন্য। অনেক সময় নেটওয়ার্কের কারণে ওটিপি আসতে দেরি হয়। আপনি কি অনুগ্রহ করে একটু পর আবার চেষ্টা করবেন?", time: "0:24" },
        { speaker: "Patient", text: "ধুর! আমি পরে ট্রাই করবানি, এখন আর করতে পারব না।", time: "0:30" },
        { speaker: "AI", text: "দুঃখ প্রকাশ করছি। কোনো সাহায্য লাগলে আবার কল করবেন। খোদা হাফেজ।", time: "0:35" },
      ],
    },
  ]);

  const selectedCall = callLogs.find(call => call.id === selectedCallId) || callLogs[0];

  const getSentimentIcon = (sentiment: CallLog["sentiment"]) => {
    switch (sentiment) {
      case "Positive":
        return <Smile className="w-4 h-4 text-emerald-400" />;
      case "Neutral":
        return <Meh className="w-4 h-4 text-amber-400" />;
      case "Negative":
        return <Frown className="w-4 h-4 text-red-400" />;
    }
  };

  const getSentimentBadge = (sentiment: CallLog["sentiment"]) => {
    switch (sentiment) {
      case "Positive":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Neutral":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Negative":
        return "bg-red-500/10 text-red-400 border border-red-500/20";
    }
  };

  const filteredLogs = callLogs.filter(log => {
    const matchesSearch = log.phone.includes(searchTerm) || log.intent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSentiment = sentimentFilter === "All" || log.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Call Logs & Transcripts</h2>
        <p className="text-sm text-slate-400">Review patient phone transcripts, conversation sentiments, and extracted intent structures.</p>
      </div>

      {/* Split view workspace */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        
        {/* Left Side: Logs List */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 overflow-hidden">
          {/* Filters inside logs list */}
          <div className="flex gap-3 items-center justify-between border-b border-slate-800 pb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search phone, intent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-[#070b13] border border-slate-800 rounded-xl px-2.5 py-1.5 text-[11px] text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Sentiment:</span>
              <select
                value={sentimentFilter}
                onChange={(e) => setSentimentFilter(e.target.value)}
                className="bg-transparent focus:outline-none font-medium cursor-pointer"
              >
                <option value="All" className="bg-[#0a1120]">All</option>
                <option value="Positive" className="bg-[#0a1120]">Positive</option>
                <option value="Neutral" className="bg-[#0a1120]">Neutral</option>
                <option value="Negative" className="bg-[#0a1120]">Negative</option>
              </select>
            </div>
          </div>

          {/* Logs scroll area */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredLogs.map(log => {
              const isSelected = log.id === selectedCallId;
              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedCallId(log.id)}
                  className={`border p-4 rounded-xl flex flex-col gap-2.5 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-slate-800/40 border-emerald-500/30 shadow-md shadow-emerald-500/5"
                      : "bg-[#080d1a] border-slate-800/80 hover:border-slate-700/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <PhoneCall className={`w-3.5 h-3.5 ${isSelected ? "text-emerald-400" : "text-slate-500"}`} />
                      <span className="text-xs font-semibold text-white">{log.phone}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 line-clamp-1">
                    {log.summary}
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getSentimentBadge(log.sentiment)} flex items-center gap-1`}>
                        {getSentimentIcon(log.sentiment)}
                        {log.sentiment}
                      </span>
                      <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded font-medium">
                        {log.language}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {log.intent}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Transcript Panel */}
        <div className="w-full lg:w-[480px] bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden">
          {/* Metadata Card Header */}
          <div className="border-b border-slate-800 pb-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">{selectedCall.id} Detail</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1 bg-[#070b13] border border-slate-800 px-2 py-0.5 rounded-md">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  {selectedCall.duration}
                </span>
              </div>
            </div>
            <h3 className="font-bold text-base text-white">{selectedCall.phone}</h3>
          </div>

          {/* Transcript Dialogue container */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            
            {/* Audio waveform mock */}
            <div className="bg-[#070b13] border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3">
              <button className="p-2 rounded-lg bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-colors">
                <Play className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 flex items-center gap-1 h-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22].map((bar) => {
                  const h = ["h-2", "h-4", "h-1", "h-5", "h-3", "h-4", "h-2", "h-5", "h-3", "h-1"];
                  return (
                    <span
                      key={bar}
                      className={`w-0.5 rounded-full bg-slate-700/80 ${h[bar % h.length]}`}
                    ></span>
                  );
                })}
              </div>
              <Volume2 className="w-4 h-4 text-slate-500" />
            </div>

            {/* AI Summary card */}
            <div className="bg-[#080d1a] border border-slate-800 p-3 rounded-xl flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Synopsis</span>
              </div>
              <p className="text-xs text-slate-300 leading-normal">{selectedCall.summary}</p>
            </div>

            {/* Message Bubble list */}
            <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-3">
              {selectedCall.transcript.map((line, index) => (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[90%] ${
                    line.speaker === "AI" ? "self-start" : "self-end flex-row-reverse"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                    line.speaker === "AI" ? "bg-emerald-500 text-[#070b13]" : "bg-slate-800 text-slate-300"
                  }`}>
                    {line.speaker === "AI" ? "AI" : "P"}
                  </div>
                  <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    line.speaker === "AI"
                      ? "bg-emerald-500/10 text-slate-200 border border-emerald-500/15"
                      : "bg-slate-800/70 text-slate-200 border border-slate-700/60"
                  }`}>
                    <p className="font-semibold text-[9px] mb-0.5 text-slate-500">{line.speaker} • {line.time}</p>
                    <p>{line.text}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
