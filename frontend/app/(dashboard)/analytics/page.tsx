"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Zap,
  Users,
  Calendar,
  Smartphone,
  ChevronDown,
  Smile,
  AlertCircle
} from "lucide-react";

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState("Last 7 Days");

  const voiceLatency = [
    { name: "Speech-To-Text (bn-BD)", latency: "185ms", status: "Optimal" },
    { name: "Gemini 2.0 Flash (LLM)", latency: "320ms", status: "Optimal" },
    { name: "Text-To-Speech (Neural2)", latency: "210ms", status: "Optimal" },
    { name: "Network Overhead", latency: "65ms", status: "Optimal" },
  ];

  const callVolumeData = [
    { day: "Mon", calls: 145, bookings: 18 },
    { day: "Tue", calls: 168, bookings: 22 },
    { day: "Wed", calls: 189, bookings: 25 },
    { day: "Thu", calls: 172, bookings: 20 },
    { day: "Fri", calls: 210, bookings: 31 }, // Friday peak
    { day: "Sat", calls: 130, bookings: 12 },
    { day: "Sun", calls: 122, bookings: 15 },
  ];

  const peakHours = [
    { hour: "9 AM - 11 AM", load: "High", percent: 85 },
    { hour: "11 AM - 1 PM", load: "Peak", percent: 100 },
    { hour: "1 PM - 3 PM", load: "Low", percent: 25 },
    { hour: "3 PM - 5 PM", load: "Medium", percent: 60 },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Analytics & Latency Metrics</h2>
          <p className="text-sm text-slate-400">Track voice assistant call performance, STT/TTS latency buffers, and appointment conversions.</p>
        </div>
        
        {/* Timeframe Select */}
        <div className="flex items-center gap-2 bg-[#0a1120] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-transparent focus:outline-none font-medium cursor-pointer"
          >
            <option value="Today" className="bg-[#0a1120]">Today</option>
            <option value="Last 7 Days" className="bg-[#0a1120]">Last 7 Days</option>
            <option value="Last 30 Days" className="bg-[#0a1120]">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Latency & Hardware Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Pipeline Latency Breakdown */}
        <div className="lg:col-span-2 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              AI Voice Pipeline Latency
            </h3>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">
              Total E2E: 680ms
            </span>
          </div>

          <div className="flex flex-col gap-4">
            {voiceLatency.map((item, idx) => (
              <div key={idx} className="bg-[#070b13] border border-slate-800/70 rounded-xl p-3.5 flex items-center justify-between gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-white">{item.name}</span>
                  <span className="text-[10px] text-slate-500">Google Cloud API Sandbox Endpoint</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg">
                    {item.latency}
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-medium">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Language & Sentiment Distribution */}
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-emerald-400" />
              Sentiment Analysis
            </h3>
          </div>

          {/* Sentiment Progress Bars */}
          <div className="flex flex-col gap-4 py-2">
            {/* Positive */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Positive Intent</span>
                <span className="text-emerald-400 font-bold font-mono">72%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "72%" }}></div>
              </div>
            </div>

            {/* Neutral */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Neutral Info Queries</span>
                <span className="text-amber-400 font-bold font-mono">22%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: "22%" }}></div>
              </div>
            </div>

            {/* Negative */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">Payment Retry/Failures</span>
                <span className="text-red-400 font-bold font-mono">6%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: "6%" }}></div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-auto flex flex-col gap-2">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Primary Language:</span>
              <span className="text-white font-semibold">Bangla (84%)</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Secondary Language:</span>
              <span className="text-white font-semibold">Banglish / English (16%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Call & Booking Conversion charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 3: Call & Booking Volume trends (Span 2) */}
        <div className="lg:col-span-2 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Call Volume vs. Bookings
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-semibold">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
                <span className="text-slate-400">Calls Handled</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-teal-400"></span>
                <span className="text-slate-400">Appointments Booked</span>
              </div>
            </div>
          </div>

          {/* Simple Custom Bar Chart in HTML/CSS */}
          <div className="flex-1 flex items-end justify-between h-48 pt-4 px-2">
            {callVolumeData.map((data, idx) => {
              const callHeightPercent = (data.calls / 220) * 100;
              const bookingHeightPercent = (data.bookings / 40) * 100;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    {/* Calls Bar */}
                    <div
                      className="w-4 rounded-t bg-emerald-500/80 hover:bg-emerald-400 transition-all duration-300 relative"
                      style={{ height: `${callHeightPercent}%` }}
                      title={`${data.calls} calls`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.calls}
                      </span>
                    </div>
                    {/* Bookings Bar */}
                    <div
                      className="w-4 rounded-t bg-teal-400/80 hover:bg-teal-300 transition-all duration-300 relative"
                      style={{ height: `${bookingHeightPercent}%` }}
                      title={`${data.bookings} bookings`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-white px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {data.bookings}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 font-mono mt-1">{data.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Peak Hours Load Heatmap */}
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Peak Booking Load
            </h3>
          </div>

          <div className="flex flex-col gap-4 py-1">
            {peakHours.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">{item.hour}</span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      item.load === "Peak"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : item.load === "High"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : item.load === "Medium"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-slate-800 text-slate-400 border border-slate-700/50"
                    }`}
                  >
                    {item.load}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.load === "Peak"
                        ? "bg-red-500"
                        : item.load === "High"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-auto">
            <p className="text-[10px] text-slate-500 leading-relaxed flex gap-2">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
              * Suggestion: Standard Friday afternoon is a high load. Make sure to whitelist Dr. Shah Alam's assistant queue lines.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
