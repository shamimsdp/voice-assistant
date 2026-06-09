"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LifeBuoy, Plus, X, Loader2, AlertCircle, Inbox, MessageSquare, CheckCircle, ArrowUpRight, UserCheck } from "lucide-react";
import { useSupportTickets, useSupportTicket, useCreateTicket, useUpdateTicket, useAddTicketComment } from "@/lib/api-hooks";

const priorityColors: Record<string, string> = {
  low: "text-slate-400 bg-slate-500/10 border-slate-500/25",
  medium: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  high: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  critical: "text-red-400 bg-red-500/10 border-red-500/25",
};

const statusColors: Record<string, string> = {
  open: "text-blue-400 bg-blue-500/10 border-blue-500/25",
  in_progress: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  resolved: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
  closed: "text-slate-500 bg-slate-500/10 border-slate-500/25",
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: tickets, isLoading, error } = useSupportTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: selectedTicket } = useSupportTicket(selectedId ?? "");
  const createTicket = useCreateTicket();
  const updateTicket = useUpdateTicket();
  const addComment = useAddTicketComment();

  const [form, setForm] = useState({ subject: "", description: "", category: "", priority: "medium" });

  const handleCreate = async () => {
    if (!form.subject.trim()) return;
    await createTicket.mutateAsync({
      subject: form.subject,
      description: form.description || null,
      category: form.category || null,
      priority: form.priority,
    });
    setForm({ subject: "", description: "", category: "", priority: "medium" });
    setShowCreate(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await updateTicket.mutateAsync({ id, data: { status } });
  };

  const handleComment = async () => {
    if (!commentText.trim() || !selectedId) return;
    await addComment.mutateAsync({ id: selectedId, body: commentText });
    setCommentText("");
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <LifeBuoy className="w-6 h-6 text-emerald-400" />
            Support Tickets
          </h1>
          <p className="text-sm text-slate-400 mt-1">Internal ticketing system for clinic staff</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Ticket List */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          )}
          {error && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
              <p className="text-sm text-slate-400">Failed to load tickets</p>
            </div>
          )}
          {!isLoading && !error && (!tickets || tickets.length === 0) && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-sm text-slate-400 font-medium">No tickets</p>
              <p className="text-xs text-slate-500 mt-1">Create a ticket to get started</p>
            </div>
          )}
          {!isLoading && !error && tickets && tickets.length > 0 && (
            <motion.div
              className="flex flex-col gap-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
            >
              {tickets.map((t) => (
                <motion.button
                  key={t.id}
                  variants={itemVariants}
                  onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
                  className={`text-left bg-[#0a1120] border rounded-2xl p-4 transition-all hover:border-slate-700/60 ${selectedId === t.id ? "border-emerald-500/30" : "border-slate-800/60"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${priorityColors[t.priority] ?? ""}`}>
                          {t.priority}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${statusColors[t.status] ?? ""}`}>
                          {t.status.replace("_", " ")}
                        </span>
                        {t.category && (
                          <span className="text-[9px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{t.category}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-white truncate">{t.subject}</p>
                      {t.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{t.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedTicket && (
            <motion.div
              key={selectedTicket.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-[420px] shrink-0 bg-[#0a1120] border border-slate-800/60 rounded-2xl flex flex-col max-h-[calc(100vh-12rem)]"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800/60">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-white">{selectedTicket.subject}</h3>
                  <button onClick={() => setSelectedId(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${priorityColors[selectedTicket.priority] ?? ""}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${statusColors[selectedTicket.status] ?? ""}`}>
                    {selectedTicket.status.replace("_", " ")}
                  </span>
                  {selectedTicket.category && (
                    <span className="text-[9px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">{selectedTicket.category}</span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedTicket.description && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-1">Description</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{selectedTicket.description}</p>
                  </div>
                )}

                {/* Comments */}
                <div>
                  <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Comments ({selectedTicket.comments?.length ?? 0})
                  </p>
                  {(selectedTicket.comments ?? []).length === 0 && (
                    <p className="text-[10px] text-slate-500">No comments yet</p>
                  )}
                  {(selectedTicket.comments ?? []).map((c) => (
                    <div key={c.id} className="bg-[#080d1a] rounded-xl p-3 mb-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <UserCheck className="w-3 h-3 text-slate-500" />
                        <span className="text-[9px] text-slate-500">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-300">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-slate-800/60 space-y-3">
                {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
                  <div className="flex items-center gap-2">
                    {selectedTicket.status === "open" && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, "in_progress")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                        Start Progress
                      </button>
                    )}
                    {selectedTicket.status === "in_progress" && (
                      <button
                        onClick={() => handleStatusChange(selectedTicket.id, "resolved")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" />
                        Resolve
                      </button>
                    )}
                    <button
                      onClick={() => handleStatusChange(selectedTicket.id, "closed")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim() || addComment.isPending}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-semibold text-white">Create Ticket</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Subject *</label>
                  <input
                    type="text"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Brief description of the issue"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed description of the issue..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                      <option value="">General</option>
                      <option value="technical">Technical</option>
                      <option value="billing">Billing</option>
                      <option value="staff">Staff</option>
                      <option value="patient">Patient</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!form.subject.trim() || createTicket.isPending}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {createTicket.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Create Ticket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
