"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  PhoneCall,
  BarChart3,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Activity,
  UserCheck,
  Bot,
  Briefcase,
  Users,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Appointments", href: "/appointments", icon: CalendarDays },
    { name: "Call Logs", href: "/calls", icon: PhoneCall },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Patients", href: "/patients", icon: Users },
    { name: "Services", href: "/services", icon: Briefcase },
    { name: "AI Agents", href: "/agents", icon: Bot },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    // Perform mock logout
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-[#070b13] text-slate-100 overflow-hidden font-sans">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-[#0a1120] border-r border-slate-800/60 p-4 shrink-0 justify-between">
        <div className="flex flex-col gap-8">
          {/* Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-[#070b13] shadow-md shadow-emerald-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-tight">Shasthya Seba AI</h1>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">Admin Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-300"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="flex flex-col gap-4 border-t border-slate-800/60 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Dr. S. Rahman</p>
              <p className="text-[10px] text-slate-500 truncate">Square Hospital, Dhaka</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-[#070b13]/80 backdrop-blur-sm">
          <aside className="w-64 bg-[#0a1120] border-r border-slate-800 p-4 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-[#070b13]">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="font-bold text-sm text-white">Shasthya Seba AI</h1>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-1.5">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                      }`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col gap-4 border-t border-slate-800 pt-4">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Dr. S. Rahman</p>
                  <p className="text-[10px] text-slate-500">Square Hospital, Dhaka</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Logout
              </button>
            </div>
          </aside>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-[#0a1120] border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-xs font-semibold text-slate-300">AI Voice Assistant Agent Active</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#0e172a] border border-slate-800 px-3 py-1.5 rounded-lg">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400">Dhaka Region Call Stream Active</span>
            </div>
            <div className="text-xs font-semibold text-slate-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#070b13]">
          {children}
        </main>
      </div>
    </div>
  );
}
