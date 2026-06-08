"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  X,
  User,
  Phone,
  Stethoscope,
  Clock,
  DollarSign,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  nameBn: string;
  specialty: string;
  specialtyBn: string;
  qualification: string;
  phone: string;
  consultationFee: number;
  slotDuration: number;
  isActive: boolean;
}

const defaultDoctors: Doctor[] = [
  { id: "d1", name: "Dr. Shah Alam", nameBn: "ডা. শাহ আলম", specialty: "Cardiology", specialtyBn: "কার্ডিওলজি", qualification: "MBBS, MD (Cardiology)", phone: "01711111111", consultationFee: 800, slotDuration: 20, isActive: true },
  { id: "d2", name: "Dr. Laila Bilkis", nameBn: "ডা. লায়লা বিলকিস", specialty: "Gynaecology", specialtyBn: "গাইনোকোলজি", qualification: "MBBS, FCPS (OBGYN)", phone: "01722222222", consultationFee: 600, slotDuration: 25, isActive: true },
  { id: "d3", name: "Dr. M. Rahman", nameBn: "ডা. এম. রহমান", specialty: "Orthopedics", specialtyBn: "অর্থোপেডিক্স", qualification: "MBBS, MS (Ortho)", phone: "01733333333", consultationFee: 700, slotDuration: 20, isActive: true },
  { id: "d4", name: "Dr. Farzana Huq", nameBn: "ডা. ফারজানা হক", specialty: "Medicine", specialtyBn: "মেডিসিন", qualification: "MBBS, MD (Medicine)", phone: "01744444444", consultationFee: 500, slotDuration: 15, isActive: true },
  { id: "d5", name: "Dr. Kamal Uddin", nameBn: "ডা. কামাল উদ্দিন", specialty: "Pediatrics", specialtyBn: "পেডিয়াট্রিক্স", qualification: "MBBS, DCH", phone: "01755555555", consultationFee: 500, slotDuration: 20, isActive: false },
  { id: "d6", name: "Dr. Ayesha Siddiqua", nameBn: "ডা. আয়েশা সিদ্দিকা", specialty: "Dermatology", specialtyBn: "চর্মরোগ", qualification: "MBBS, DDV", phone: "01766666666", consultationFee: 600, slotDuration: 20, isActive: true },
];

const emptyForm = { name: "", nameBn: "", specialty: "", specialtyBn: "", qualification: "", phone: "", consultationFee: 500, slotDuration: 20 };

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>(defaultDoctors);
  const [search, setSearch] = useState("");
  const [showActive, setShowActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.specialty.toLowerCase().includes(search.toLowerCase());
    const matchesActive = showActive ? d.isActive : !d.isActive;
    return matchesSearch && matchesActive;
  });

  const showMsg = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); };

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (d: Doctor) => {
    setEditingId(d.id);
    setForm({ name: d.name, nameBn: d.nameBn, specialty: d.specialty, specialtyBn: d.specialtyBn, qualification: d.qualification, phone: d.phone, consultationFee: d.consultationFee, slotDuration: d.slotDuration });
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setTimeout(() => {
      if (editingId) {
        setDoctors(prev => prev.map(d => d.id === editingId ? { ...d, ...form } : d));
        showMsg(`Updated ${form.name}`);
      } else {
        const newDoc: Doctor = { id: `d${Date.now()}`, ...form, isActive: true };
        setDoctors(prev => [newDoc, ...prev]);
        showMsg(`Added ${form.name}`);
      }
      setShowModal(false);
      setSaving(false);
    }, 300);
  };

  const toggleActive = (id: string) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
    const doc = doctors.find(d => d.id === id);
    showMsg(doc ? `${doc.name} ${doc.isActive ? "deactivated" : "activated"}` : "");
  };

  return (
    <div className="max-w-6xl mx-auto">
      {feedback && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {feedback}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Doctors</h2>
          <p className="text-sm text-slate-400">Manage clinic doctors, specialties, and consultation fees.</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Add Doctor
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or specialty..." className="w-full bg-[#0a1120] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors" />
        </div>
        <div className="flex items-center gap-1 bg-[#0a1120] border border-slate-800/60 rounded-xl p-1">
          <button onClick={() => setShowActive(true)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${showActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 border border-transparent hover:text-slate-200"}`}>Active</button>
          <button onClick={() => setShowActive(false)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${!showActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 border border-transparent hover:text-slate-200"}`}>Inactive</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-[#0a1120] border border-slate-800/60 rounded-2xl">
          <Stethoscope className="w-12 h-12 text-slate-700 mb-3" />
          <p className="text-sm text-slate-500">No doctors found.</p>
          <button onClick={openAdd} className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">+ Add Doctor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} onClick={() => openEdit(d)} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <User className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{d.name}</p>
                    <p className="text-xs text-slate-500">{d.nameBn}</p>
                  </div>
                </div>
                <button onClick={e => { e.stopPropagation(); toggleActive(d.id); }} className={`p-1.5 rounded-lg transition-colors ${d.isActive ? "text-emerald-400 hover:bg-emerald-500/10" : "text-slate-600 hover:bg-slate-800"}`} title={d.isActive ? "Deactivate" : "Activate"}>
                  {d.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5 text-slate-500" />{d.specialty}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5 text-slate-500" />৳{d.consultationFee}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-500" />{d.slotDuration}min</span>
              </div>

              {d.qualification && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
                  <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                  <span>{d.qualification}</span>
                </div>
              )}

              {d.phone && (
                <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{d.phone}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-lg p-6 mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">{editingId ? "Edit Doctor" : "Add Doctor"}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Name (English)</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Dr. Shah Alam" className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Name (বাংলা)</label>
                  <input value={form.nameBn} onChange={e => setForm(f => ({ ...f, nameBn: e.target.value }))} placeholder="ডা. শাহ আলম" className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Specialty</label>
                  <input value={form.specialty} onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))} placeholder="Cardiology" className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Specialty (বাংলা)</label>
                  <input value={form.specialtyBn} onChange={e => setForm(f => ({ ...f, specialtyBn: e.target.value }))} placeholder="কার্ডিওলজি" className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Qualification</label>
                <input value={form.qualification} onChange={e => setForm(f => ({ ...f, qualification: e.target.value }))} placeholder="MBBS, MD (Cardiology)" className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Phone</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01711111111" className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Fee (৳)</label>
                  <input type="number" value={form.consultationFee} onChange={e => setForm(f => ({ ...f, consultationFee: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Slot (min)</label>
                  <input type="number" value={form.slotDuration} onChange={e => setForm(f => ({ ...f, slotDuration: parseInt(e.target.value) || 20 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40" />
                </div>
              </div>
              <button type="submit" disabled={saving} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[#070b13] font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? "Update Doctor" : "Add Doctor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
