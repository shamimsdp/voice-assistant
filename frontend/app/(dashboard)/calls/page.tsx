"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PhoneCall,
  Search,
  Clock,
  Smile,
  Meh,
  Frown,
  Play,
  Volume2,
  Sparkles,
  Filter,
  AlertCircle
} from "lucide-react";
import { useCallLogs, useCallDetail } from "@/lib/api-hooks";

type Sentiment = "Positive" | "Neutral" | "Negative";

interface LogDisplayItem {
  id: string;
  phone: string;
  timestamp: string;
  duration: string;
  sentiment: Sentiment;
  language: string;
  intent: string;
  summary: string;
  transcript: { speaker: string; role: string; text: string; time: string; timestamp: string }[];
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${time}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function mapLanguage(lang: string | null): string {
  if (!lang) return "Banglish";
  if (lang.startsWith("bn")) return "Bangla";
  if (lang.startsWith("en")) return "English";
  return "Banglish";
}

function getDisplayCaller(phone: string, status: string, booked: boolean): string {
  let s = `Call from ${phone}`;
  if (booked) s += ". Appointment booked.";
  return s;
}

function getSentimentIcon(sentiment: Sentiment) {
  switch (sentiment) {
    case "Positive": return <Smile className="w-4 h-4 text-emerald-400" />;
    case "Neutral": return <Meh className="w-4 h-4 text-amber-400" />;
    case "Negative": return <Frown className="w-4 h-4 text-red-400" />;
  }
}

function getSentimentBadge(sentiment: Sentiment) {
  switch (sentiment) {
    case "Positive": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    case "Neutral": return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    case "Negative": return "bg-red-500/10 text-red-400 border border-red-500/20";
  }
}

function SkeletonCard() {
  return (
    <div className="border p-4 rounded-xl bg-[#080d1a] border-slate-800/80 animate-pulse">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="h-3 w-32 rounded bg-slate-800" />
        <div className="h-3 w-20 rounded bg-slate-800" />
      </div>
      <div className="h-3 w-full rounded bg-slate-800 mb-2" />
      <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-800/50">
        <div className="flex gap-2">
          <div className="h-4 w-16 rounded-full bg-slate-800" />
          <div className="h-4 w-12 rounded bg-slate-800" />
        </div>
        <div className="h-4 w-28 rounded bg-slate-800" />
      </div>
    </div>
  );
}

export default function CallsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState("All");

  const { data: callLogsData, isLoading, error } = useCallLogs(50, 0);
  const { data: callDetailData, isLoading: isDetailLoading } = useCallDetail(selectedCallId);

  const callLogs: LogDisplayItem[] = React.useMemo(() => {
    if (!callLogsData) return [];
    return callLogsData.map((c) => ({
      id: c.id,
      phone: c.caller_phone,
      timestamp: formatTimestamp(c.started_at),
      duration: formatDuration(c.duration_seconds),
      sentiment: "Neutral" as Sentiment,
      language: mapLanguage(c.detected_language),
      intent: c.appointment_booked ? "Appointment Booked" : "General Help",
      summary: getDisplayCaller(c.caller_phone, c.status, c.appointment_booked),
      transcript: [],
    }));
  }, [callLogsData]);

  useEffect(() => {
    if (callLogs.length > 0 && !selectedCallId) {
      setSelectedCallId(callLogs[0].id);
    }
  }, [callLogs, selectedCallId]);

  const selectedCall: LogDisplayItem | null = React.useMemo(() => {
    if (!selectedCallId) return null;
    const base = callLogs.find((c) => c.id === selectedCallId);
    if (!base) return null;
    if (callDetailData) {
      const rawTranscript: unknown[] = callDetailData.transcript || [];
      const transcript = rawTranscript.map((t: any) => ({
        speaker: t.speaker || t.role || "Patient",
        role: t.role || t.speaker || "Patient",
        text: t.text || "",
        time: t.time || t.timestamp || "",
        timestamp: t.timestamp || t.time || "",
      }));
      return {
        ...base,
        phone: callDetailData.caller_phone,
        duration: formatDuration(callDetailData.duration_seconds),
        transcript,
        summary: `Call from ${callDetailData.caller_phone}. Status: ${callDetailData.status}. Duration: ${formatDuration(callDetailData.duration_seconds)}.${callDetailData.appointment_booked ? " Appointment booked." : ""}`,
      };
    }
    return base;
  }, [selectedCallId, callLogs, callDetailData]);

  const filteredLogs = callLogs.filter((log) => {
    const matchesSearch = log.phone.includes(searchTerm) || log.intent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSentiment = sentimentFilter === "All" || log.sentiment === sentimentFilter;
    return matchesSearch && matchesSentiment;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 max-w-7xl mx-auto h-[calc(100vh-8rem)]"
    >
      {/* Title Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="text-2xl font-bold text-white tracking-tight">Call Logs & Transcripts</h2>
        <p className="text-sm text-slate-400">Review patient phone transcripts, conversation sentiments, and extracted intent structures.</p>
      </motion.div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-sm text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Failed to load call logs. Please try again later.</span>
          </motion.div>
        )}
      </AnimatePresence>

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
            {isLoading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <PhoneCall className="w-8 h-8" />
                <p className="text-sm">No call logs found</p>
              </div>
            ) : (
              filteredLogs.map((log, idx) => {
                const isSelected = log.id === selectedCallId;
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
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
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Detailed Transcript Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="w-full lg:w-[480px] bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 flex flex-col gap-4 overflow-hidden"
        >
          {!selectedCall ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
              <PhoneCall className="w-8 h-8" />
              <p className="text-sm">Select a call to view details</p>
            </div>
          ) : (
            <>
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
                  {isDetailLoading ? (
                    <div className="space-y-1.5 animate-pulse">
                      <div className="h-3 w-full rounded bg-slate-800" />
                      <div className="h-3 w-3/4 rounded bg-slate-800" />
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-normal">{selectedCall.summary}</p>
                  )}
                </div>

                {/* Message Bubble list */}
                <div className="flex flex-col gap-3 border-t border-slate-800/80 pt-3">
                  {isDetailLoading ? (
                    <div className="space-y-3 animate-pulse">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="flex gap-3 max-w-[80%] self-start">
                          <div className="w-6 h-6 rounded-lg bg-slate-800 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-24 rounded bg-slate-800" />
                            <div className="h-3 w-full rounded bg-slate-800" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : selectedCall.transcript.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No transcript available for this call.</p>
                  ) : (
                    selectedCall.transcript.map((line, index) => {
                      const speaker = line.speaker || line.role || "Patient";
                      const time = line.time || line.timestamp || "";
                      const isAi = speaker === "AI" || speaker === "ai";
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: isAi ? -15 : 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex gap-3 max-w-[90%] ${
                            isAi ? "self-start" : "self-end flex-row-reverse"
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                            isAi ? "bg-emerald-500 text-[#070b13]" : "bg-slate-800 text-slate-300"
                          }`}>
                            {isAi ? "AI" : "P"}
                          </div>
                          <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                            isAi
                              ? "bg-emerald-500/10 text-slate-200 border border-emerald-500/15"
                              : "bg-slate-800/70 text-slate-200 border border-slate-700/60"
                          }`}>
                            <p className="font-semibold text-[9px] mb-0.5 text-slate-500">{speaker} • {time}</p>
                            <p>{line.text}</p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

              </div>
            </>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}
