"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Pill,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { useServices, useCreateService, useUpdateService, useDeleteService } from "@/lib/api-hooks";

const CATEGORIES = [
  "general", "pediatric", "urgent", "dental", "nutrition",
  "mental-health", "dermatology", "women-health", "cardiology",
  "orthopedics", "neurology", "ent", "ophthalmology", "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  general: "General", pediatric: "Pediatric", urgent: "Urgent",
  dental: "Dental", nutrition: "Nutrition", "mental-health": "Mental Health",
  dermatology: "Dermatology", "women-health": "Women's Health",
  cardiology: "Cardiology", orthopedics: "Orthopedics", neurology: "Neurology",
  ent: "ENT", ophthalmology: "Ophthalmology", other: "Other",
};

const defaultForm = { name: "", description: "", duration_min: 30, price: 0, category: "general" };

export default function ServicesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [mutError, setMutError] = useState("");

  const { data: services = [], isLoading, error: queryError } = useServices(categoryFilter || undefined);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  const error = (queryError as Error)?.message || mutError;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setMutError("");
    try {
      if (editingId) {
        await updateService.mutateAsync({ id: editingId, data: form });
      } else {
        await createService.mutateAsync(form);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(defaultForm);
    } catch (e: any) {
      setMutError(e.message);
    }
  };

  const handleEdit = (svc: { id: string; name: string; description: string | null; duration_min: number; price: number; category: string | null }) => {
    setForm({
      name: svc.name,
      description: svc.description || "",
      duration_min: svc.duration_min,
      price: svc.price,
      category: svc.category || "general",
    });
    setEditingId(svc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    setMutError("");
    try {
      await deleteService.mutateAsync(id);
    } catch (e: any) {
      setMutError(e.message);
    }
  };

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your clinic's medical service catalog</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(defaultForm); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-2.5 rounded-xl">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          <button onClick={() => setMutError("")} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text" placeholder="Search services..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0a1120] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[#0a1120] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 animate-pulse">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800" />
                  <div>
                    <div className="h-4 w-28 bg-slate-800 rounded" />
                    <div className="h-3 w-16 bg-slate-800 rounded mt-1" />
                  </div>
                </div>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded mb-3" />
              <div className="h-3 w-20 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">No services found</p>
          <p className="text-xs mt-1">Add your first service to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((svc, i) => (
            <motion.div
              key={svc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-[#0a1120] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Pill className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{svc.name}</h3>
                    {svc.category && (
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">{CATEGORY_LABELS[svc.category] || svc.category}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(svc)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(svc.id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {svc.description && (
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{svc.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{svc.duration_min} min</span>
                <span className="font-semibold text-emerald-400">${svc.price.toFixed(2)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onSubmit={handleSave}
            className="w-full max-w-lg bg-[#0a1120] border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{editingId ? "Edit Service" : "Add Service"}</h2>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Service Name *</label>
                <input
                  required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  placeholder="e.g. General Consultation"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                  placeholder="Brief description of this service"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Duration (min)</label>
                  <input
                    type="number" min={5} step={5}
                    value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: parseInt(e.target.value) || 30 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Price ($)</label>
                  <input
                    type="number" min={0} step={0.01}
                    value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                <select
                  value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={updateService.isPending || createService.isPending || !form.name.trim()}
                className="flex-[2] py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] disabled:bg-slate-800 disabled:text-slate-500 transition-all shadow-md flex items-center justify-center gap-2">
                {(updateService.isPending || createService.isPending) ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingId ? "Update Service" : "Add Service"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
