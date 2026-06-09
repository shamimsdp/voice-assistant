"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellRing, CheckCheck, Filter, Loader2, AlertCircle, Inbox } from "lucide-react";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/lib/api-hooks";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const typeLabels: Record<string, { label: string; color: string }> = {
  appointment_confirmed: { label: "Appointment Confirmed", color: "text-emerald-400" },
  appointment_cancelled: { label: "Appointment Cancelled", color: "text-red-400" },
  payment_received: { label: "Payment Received", color: "text-emerald-400" },
  new_call: { label: "New Call", color: "text-blue-400" },
  time_off_approved: { label: "Time Off Approved", color: "text-emerald-400" },
  time_off_rejected: { label: "Time Off Rejected", color: "text-red-400" },
  emergency_alert: { label: "Emergency Alert", color: "text-red-400" },
  low_stock_alert: { label: "Low Stock Alert", color: "text-amber-400" },
  no_show_risk: { label: "No-Show Risk", color: "text-amber-400" },
  reminder_sent: { label: "Reminder Sent", color: "text-blue-400" },
  system: { label: "System", color: "text-slate-400" },
};

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("");

  const { data: notifications, isLoading, error } = useNotifications({ unread_only: unreadOnly, limit: 100 });
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const filtered = (notifications ?? []).filter((n) => !typeFilter || n.type === typeFilter);
  const unreadCount = unreadData?.count ?? 0;
  const types = [...new Set((notifications ?? []).map((n) => n.type))];

  return (
    <motion.div
      className="max-w-4xl mx-auto flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="w-6 h-6 text-emerald-400" />
            Notifications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadOnly ? (
            <button
              onClick={() => setUnreadOnly(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors border border-slate-700/60"
            >
              <Bell className="w-3.5 h-3.5" />
              All
            </button>
          ) : (
            <button
              onClick={() => setUnreadOnly(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              Unread ({unreadCount})
            </button>
          )}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors border border-slate-700/60"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      {types.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <button
            onClick={() => setTypeFilter("")}
            className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors border ${!typeFilter ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-700/60"}`}
          >
            All
          </button>
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className={`px-3 py-1 rounded-full text-[10px] font-medium transition-colors border ${typeFilter === t ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-slate-800/40 text-slate-400 border-slate-700/60 hover:bg-slate-700/60"}`}
            >
              {typeLabels[t]?.label ?? t}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
          <p className="text-sm text-slate-400">Failed to load notifications</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-sm text-slate-400 font-medium">No notifications</p>
          <p className="text-xs text-slate-500 mt-1">
            {unreadOnly ? "No unread notifications" : "Notifications will appear here"}
          </p>
        </div>
      )}

      {/* Notification List */}
      {!isLoading && !error && filtered.length > 0 && (
        <motion.div
          className="flex flex-col gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filtered.map((n) => (
            <motion.div
              key={n.id}
              variants={itemVariants}
              className={`bg-[#0a1120] border ${n.is_read ? "border-slate-800/60" : "border-emerald-500/20"} rounded-2xl p-4 transition-all hover:border-slate-700/60`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-800/60 shrink-0 mt-0.5">
                  {n.is_read ? (
                    <Bell className="w-5 h-5 text-slate-500" />
                  ) : (
                    <BellRing className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${typeLabels[n.type]?.color ?? "text-slate-400"}`}>
                      {typeLabels[n.type]?.label ?? n.type}
                    </span>
                    {!n.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                    <span className="ml-auto text-[10px] text-slate-500">
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className={`text-sm ${n.is_read ? "text-slate-400" : "text-white font-medium"}`}>
                    {n.title}
                    {n.title_bn && <span className="text-slate-500 ml-1">({n.title_bn})</span>}
                  </p>
                  {n.body && (
                    <p className="text-xs text-slate-500 mt-1">{n.body}</p>
                  )}
                  <div className="flex items-center gap-3 mt-3">
                    {!n.is_read && (
                      <button
                        onClick={() => markAsRead.mutate(n.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
                      >
                        <CheckCheck className="w-3 h-3" />
                        Mark as read
                      </button>
                    )}
                    {n.link && (
                      <Link
                        href={n.link}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        View details
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
