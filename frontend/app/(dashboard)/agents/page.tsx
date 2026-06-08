"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Plus,
  Edit3,
  Power,
  PowerOff,
  AlertCircle,
  Loader2,
  X,
  CheckCircle,
  Sparkles,
  Search,
  ChevronRight,
  FileText,
  MessageSquare,
} from "lucide-react";
import { api } from "@/lib/api";

interface Agent {
  id: string;
  name: string;
  voice: string;
  tone: string;
  greeting_message: string | null;
  system_prompt: string | null;
  is_active: boolean;
  is_predefined: boolean;
  service_ids: string[];
}

interface Service {
  id: string;
  name: string;
  category: string | null;
}

const TONES = ["professional", "friendly", "casual", "empathetic"];
const VOICES = ["Clara", "Warm", "Serious", "Gentle", "Professional"];

const defaultForm = {
  name: "",
  voice: "Clara",
  tone: "professional",
  greeting_message: "",
  system_prompt: "",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentsData, servicesData] = await Promise.all([
        api.get<Agent[]>("/api/agents"),
        api.get<Service[]>("/api/services"),
      ]);
      setAgents(agentsData);
      setServices(servicesData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleAgent = async (agent: Agent) => {
    try {
      await api.patch(`/api/agents/${agent.id}/toggle`);
      setAgents((prev) =>
        prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a))
      );
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const agent = await api.post<Agent>("/api/agents", form);
      if (selectedServices.length > 0) {
        await api.post(`/api/agents/${agent.id}/services`, { service_ids: selectedServices });
      }
      setShowCreate(false);
      setForm(defaultForm);
      setSelectedServices([]);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAgent) return;
    setSaving(true);
    try {
      await api.put(`/api/agents/${editAgent.id}`, form);
      await api.post(`/api/agents/${editAgent.id}/services`, { service_ids: selectedServices });
      setShowEdit(false);
      setEditAgent(null);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setForm({
      name: agent.name,
      voice: agent.voice,
      tone: agent.tone,
      greeting_message: agent.greeting_message || "",
      system_prompt: agent.system_prompt || "",
    });
    setSelectedServices(agent.service_ids);
    setShowEdit(true);
  };

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Agents</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your AI voice agents and assign services</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setForm(defaultForm); setSelectedServices([]); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Agent
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-2.5 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="relative mb-5 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text" placeholder="Search agents..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0a1120] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-emerald-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No agents found</p>
          <p className="text-xs mt-1">Create your first AI agent to start taking calls</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-[#0a1120] border rounded-2xl p-5 transition-all group ${
                agent.is_active
                  ? "border-emerald-500/30 shadow-sm shadow-emerald-500/5"
                  : "border-slate-800/80 hover:border-slate-700/80"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    agent.is_active
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-500"
                  }`}>
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                      {agent.name}
                      {agent.is_predefined && <Sparkles className="w-3 h-3 text-amber-400" />}
                    </h3>
                    <span className="text-[10px] text-slate-500 capitalize">{agent.tone} · {agent.voice}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleAgent(agent)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    agent.is_active
                      ? "text-emerald-400 hover:bg-emerald-500/10"
                      : "text-slate-500 hover:bg-slate-800"
                  }`}
                  title={agent.is_active ? "Deactivate" : "Activate"}
                >
                  {agent.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-3">
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {agent.service_ids.length} services
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                  agent.is_active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-slate-800 text-slate-500"
                }`}>
                  {agent.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              {agent.greeting_message && (
                <p className="text-[11px] text-slate-400 italic line-clamp-2 mb-3">
                  "{agent.greeting_message}"
                </p>
              )}

              <button
                onClick={() => openEdit(agent)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-emerald-400 bg-[#070b13] border border-slate-800 hover:border-emerald-500/30 transition-all"
              >
                <Edit3 className="w-3 h-3" /> Edit Agent
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleCreate}
              className="w-full max-w-2xl bg-[#0a1120] border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-emerald-400" /> Create AI Agent
                </h2>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Agent Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="e.g. Front Desk Receptionist" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Voice</label>
                    <select value={form.voice} onChange={(e) => setForm({ ...form, voice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                      {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Tone / Personality</label>
                    <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                      {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Greeting Message</label>
                  <textarea value={form.greeting_message} onChange={(e) => setForm({ ...form, greeting_message: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                    placeholder="Hello! Welcome to our clinic. How can I help you today?" />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">System Prompt</label>
                  <textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none font-mono text-[12px]"
                    placeholder="You are a friendly front desk receptionist. Greet patients warmly, collect their information, check availability, and book appointments." />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Assigned Services</label>
                  {services.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No services available. Create services first.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {services.map((s) => (
                        <label key={s.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                            selectedServices.includes(s.id)
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-[#070b13] border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}>
                          <input type="checkbox" checked={selectedServices.includes(s.id)}
                            onChange={() => setSelectedServices((prev) =>
                              prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            )}
                            className="sr-only" />
                          <CheckCircle className={`w-3.5 h-3.5 ${selectedServices.includes(s.id) ? "text-emerald-400" : "text-slate-600"}`} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.name.trim()}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Create Agent"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Agent Modal */}
      <AnimatePresence>
        {showEdit && editAgent && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleUpdate}
              className="w-full max-w-2xl bg-[#0a1120] border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-400" /> Edit Agent
                </h2>
                <button type="button" onClick={() => { setShowEdit(false); setEditAgent(null); }}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Agent Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    placeholder="Agent name" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Voice</label>
                    <select value={form.voice} onChange={(e) => setForm({ ...form, voice: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                      {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Tone</label>
                    <select value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50">
                      {TONES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Greeting Message</label>
                  <textarea value={form.greeting_message} onChange={(e) => setForm({ ...form, greeting_message: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none" />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">System Prompt</label>
                  <textarea value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none font-mono text-[12px]" />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Assigned Services</label>
                  {services.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No services available.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {services.map((s) => (
                        <label key={s.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                            selectedServices.includes(s.id)
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-[#070b13] border-slate-800 text-slate-400 hover:border-slate-700"
                          }`}>
                          <input type="checkbox" checked={selectedServices.includes(s.id)}
                            onChange={() => setSelectedServices((prev) =>
                              prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                            )}
                            className="sr-only" />
                          <CheckCircle className={`w-3.5 h-3.5 ${selectedServices.includes(s.id) ? "text-emerald-400" : "text-slate-600"}`} />
                          {s.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowEdit(false); setEditAgent(null); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Save Changes"}
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
