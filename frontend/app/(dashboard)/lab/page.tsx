"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  FlaskConical,
  FileText,
  Radio,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  DollarSign,
  Clock,
  Loader2,
} from "lucide-react";

interface LabTest {
  id: string;
  name: string;
  category: string;
  specimen: string;
  fee: number;
  turnaroundHours: number;
  prep: string;
}

interface LabOrder {
  id: string;
  orderNumber: string;
  patient: string;
  doctor: string;
  status: string;
  priority: string;
  tests: string[];
  totalFee: number;
  orderedAt: string;
  results: LabResult[];
}

interface LabResult {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  refRange: string;
  isAbnormal: boolean;
}

interface ImagingStudy {
  id: string;
  studyType: string;
  bodyPart: string;
  patient: string;
  doctor: string;
  status: string;
  fee: number;
  reason: string;
}

const CATEGORIES = ["All", "blood", "urine", "stool", "cardiology", "microbiology", "pathology", "other"];

const MOCK_TESTS: LabTest[] = [
  { id: "t1", name: "CBC (Complete Blood Count)", category: "blood", specimen: "blood", fee: 350, turnaroundHours: 4, prep: "No special preparation needed" },
  { id: "t2", name: "Fasting Blood Sugar", category: "blood", specimen: "blood", fee: 150, turnaroundHours: 2, prep: "8-12 hours fasting required" },
  { id: "t3", name: "Lipid Profile", category: "blood", specimen: "blood", fee: 500, turnaroundHours: 6, prep: "10-12 hours fasting required" },
  { id: "t4", name: "Serum Creatinine", category: "blood", specimen: "blood", fee: 200, turnaroundHours: 4, prep: "No special preparation needed" },
  { id: "t5", name: "Urine R/E", category: "urine", specimen: "urine", fee: 200, turnaroundHours: 3, prep: "Clean catch mid-stream sample" },
  { id: "t6", name: "Urine Culture & Sensitivity", category: "urine", specimen: "urine", fee: 500, turnaroundHours: 72, prep: "Clean catch mid-stream sample" },
  { id: "t7", name: "Stool R/E", category: "stool", specimen: "stool", fee: 250, turnaroundHours: 24, prep: "Collect in sterile container" },
  { id: "t8", name: "ECG (12 Lead)", category: "cardiology", specimen: "blood", fee: 400, turnaroundHours: 1, prep: "No special preparation needed" },
  { id: "t9", name: "Blood Culture", category: "microbiology", specimen: "blood", fee: 800, turnaroundHours: 120, prep: "Sterile collection technique" },
  { id: "t10", name: "TSH (Thyroid)", category: "blood", specimen: "blood", fee: 350, turnaroundHours: 6, prep: "No special preparation needed" },
];

const MOCK_ORDERS: LabOrder[] = [
  { id: "o1", orderNumber: "LAB-2026-0001", patient: "Imran Khan", doctor: "Dr. Shah Alam", status: "completed", priority: "routine", tests: ["CBC", "Fasting Blood Sugar", "Lipid Profile"], totalFee: 1000, orderedAt: "2026-06-04", results: [
    { id: "r1", parameter: "Hemoglobin", value: "14.2", unit: "g/dL", refRange: "13.5-17.5", isAbnormal: false },
    { id: "r2", parameter: "WBC Count", value: "8,500", unit: "/μL", refRange: "4,500-11,000", isAbnormal: false },
    { id: "r3", parameter: "Fasting Glucose", value: "142", unit: "mg/dL", refRange: "70-110", isAbnormal: true },
  ]},
  { id: "o2", orderNumber: "LAB-2026-0002", patient: "Farhana Yasmin", doctor: "Dr. Laila Bilkis", status: "in_progress", priority: "urgent", tests: ["Urine R/E", "Urine C/S"], totalFee: 700, orderedAt: "2026-06-06", results: [] },
  { id: "o3", orderNumber: "LAB-2026-0003", patient: "Tariqul Islam", doctor: "Dr. M. Rahman", status: "ordered", priority: "routine", tests: ["Serum Creatinine", "ECG"], totalFee: 600, orderedAt: "2026-06-07", results: [] },
  { id: "o4", orderNumber: "LAB-2026-0004", patient: "Nusrat Jahan", doctor: "Dr. Laila Bilkis", status: "abnormal", priority: "routine", tests: ["TSH", "CBC"], totalFee: 700, orderedAt: "2026-06-03", results: [
    { id: "r4", parameter: "TSH", value: "8.5", unit: "mIU/L", refRange: "0.4-4.0", isAbnormal: true },
  ]},
];

const MOCK_IMAGING: ImagingStudy[] = [
  { id: "i1", studyType: "X-Ray", bodyPart: "Chest PA", patient: "Imran Khan", doctor: "Dr. Shah Alam", status: "completed", fee: 600, reason: "Persistent cough, rule out pneumonia" },
  { id: "i2", studyType: "Ultrasound", bodyPart: "Whole Abdomen", patient: "Farhana Yasmin", doctor: "Dr. Laila Bilkis", status: "scheduled", fee: 1500, reason: "Lower abdominal pain" },
  { id: "i3", studyType: "MRI", bodyPart: "Lumbar Spine", patient: "Tariqul Islam", doctor: "Dr. M. Rahman", status: "ordered", fee: 5000, reason: "Chronic lower back pain" },
  { id: "i4", studyType: "X-Ray", bodyPart: "Right Ankle", patient: "Kazi Arif", doctor: "Dr. M. Rahman", status: "completed", fee: 500, reason: "Post-accident evaluation" },
];

type Tab = "tests" | "orders" | "imaging";

function statusBadge(status: string): string {
  const c: Record<string, string> = {
    ordered: "bg-slate-800 text-slate-400 border border-slate-700/50",
    specimen_collected: "bg-blue-500/10 text-blue-400 border border-blue-500/25",
    in_progress: "bg-amber-500/10 text-amber-400 border border-amber-500/25",
    completed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25",
    cancelled: "bg-red-500/10 text-red-400 border border-red-500/25",
    abnormal: "bg-red-500/15 text-red-300 border border-red-500/30",
    scheduled: "bg-blue-500/10 text-blue-400",
  };
  return c[status] || "bg-slate-800 text-slate-400";
}

export default function LabPage() {
  const [activeTab, setActiveTab] = useState<Tab>("tests");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const showMsg = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); };

  const filteredTests = MOCK_TESTS.filter(t => {
    const match = t.name.toLowerCase().includes(search.toLowerCase());
    const cat = categoryFilter === "All" || t.category === categoryFilter;
    return match && cat;
  });

  return (
    <div className="max-w-7xl mx-auto">
      {feedback && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {feedback}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Lab & Diagnostics</h2>
          <p className="text-sm text-slate-400">Manage lab tests, orders, results, and imaging studies.</p>
        </div>
        {activeTab === "orders" && (
          <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> Place Order
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-[#0a1120] border border-slate-800/60 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: "tests" as Tab, label: "Test Catalog", icon: FlaskConical },
          { key: "orders" as Tab, label: "Orders", icon: FileText },
          { key: "imaging" as Tab, label: "Imaging", icon: Radio },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === t.key ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 border border-transparent"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── TEST CATALOG ── */}
      {activeTab === "tests" && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tests..." className="w-full bg-[#0a1120] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div className="flex overflow-x-auto gap-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg whitespace-nowrap capitalize transition-all ${categoryFilter === c ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300 border border-slate-800/60"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTests.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
                <FlaskConical className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No tests found</p>
              </div>
            ) : (
              filteredTests.map(t => (
                <div key={t.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md capitalize mt-1 inline-block">{t.category}</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">৳{t.fee}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" />{t.specimen}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.turnaroundHours}h turnaround</span>
                  </div>
                  {t.prep && <p className="text-[10px] text-slate-500 mt-2 italic">{t.prep}</p>}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── ORDERS ── */}
      {activeTab === "orders" && (
        <div className="flex flex-col gap-4">
          {MOCK_ORDERS.map(o => {
            const isExpanded = expandedOrder === o.id;
            return (
              <div key={o.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
                <button onClick={() => setExpandedOrder(isExpanded ? null : o.id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{o.orderNumber}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{o.patient}</span>
                        <span className="text-slate-700">·</span>
                        <span className="text-[10px] text-slate-400">{o.doctor}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${statusBadge(o.status)}`}>{o.status.replace("_", " ")}</span>
                    <span className="text-xs text-slate-500">{o.tests.length} tests</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-800/60">
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                      <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                        <p className="text-[10px] text-slate-500">Order Date</p>
                        <p className="text-xs font-semibold text-white">{o.orderedAt}</p>
                      </div>
                      <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                        <p className="text-[10px] text-slate-500">Priority</p>
                        <p className={`text-xs font-semibold capitalize ${o.priority === "urgent" ? "text-red-400" : "text-white"}`}>{o.priority}</p>
                      </div>
                      <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                        <p className="text-[10px] text-slate-500">Total Fee</p>
                        <p className="text-xs font-semibold text-emerald-400">৳{o.totalFee}</p>
                      </div>
                      <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                        <p className="text-[10px] text-slate-500">Tests</p>
                        <p className="text-xs font-semibold text-white">{o.tests.join(", ")}</p>
                      </div>
                    </div>

                    {o.results.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Results</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-800/60">
                                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Parameter</th>
                                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Result</th>
                                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Unit</th>
                                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Ref Range</th>
                                <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pb-2 pr-4">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {o.results.map(r => (
                                <tr key={r.id}>
                                  <td className="py-2 pr-4 text-xs text-white">{r.parameter}</td>
                                  <td className={`py-2 pr-4 text-xs font-bold ${r.isAbnormal ? "text-red-400" : "text-emerald-400"}`}>{r.value}</td>
                                  <td className="py-2 pr-4 text-xs text-slate-400">{r.unit}</td>
                                  <td className="py-2 pr-4 text-xs text-slate-400">{r.refRange}</td>
                                  <td className="py-2 pr-4"><span className={`text-[10px] px-1.5 py-0.5 rounded-md ${r.isAbnormal ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>{r.isAbnormal ? "Abnormal" : "Normal"}</span></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {o.results.length === 0 && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#070b13] rounded-lg px-4 py-3 border border-slate-800/60">
                        <Clock className="w-3.5 h-3.5" /> Results pending — status: <span className={`font-semibold capitalize ${statusBadge(o.status)} px-1.5 py-0.5 rounded`}>{o.status.replace("_", " ")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── IMAGING ── */}
      {activeTab === "imaging" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_IMAGING.map(i => (
            <div key={i.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Radio className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{i.studyType} — {i.bodyPart}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{i.patient} · {i.doctor}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${statusBadge(i.status)}`}>{i.status}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <p className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Fee: ৳{i.fee}</p>
                <p>{i.reason}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Place Order Modal ── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-lg p-6 mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Place Lab Order</h3>
              <button onClick={() => setShowOrderModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Patient</label>
                <select className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                  <option value="">Select patient</option>
                  {["Imran Khan", "Farhana Yasmin", "Tariqul Islam", "Nusrat Jahan"].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Doctor</label>
                  <select className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="">Select doctor</option>
                    {["Dr. Shah Alam", "Dr. Laila Bilkis", "Dr. M. Rahman"].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Priority</label>
                  <select className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Tests</label>
                <div className="flex flex-col gap-1.5 bg-[#070b13] border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {MOCK_TESTS.map(t => {
                    const isSel = selectedTests.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors">
                        <input type="checkbox" checked={isSel} onChange={() => {
                          setSelectedTests(prev => isSel ? prev.filter(id => id !== t.id) : [...prev, t.id]);
                        }} className="accent-emerald-500 w-3.5 h-3.5" />
                        <span className="text-xs text-white flex-1">{t.name}</span>
                        <span className="text-[10px] text-slate-500">৳{t.fee}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Clinical Notes</label>
                <textarea rows={3} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" placeholder="Any clinical notes or diagnosis code..." />
              </div>
              <button onClick={() => { showMsg("Lab order placed successfully"); setShowOrderModal(false); setSelectedTests([]); }} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-bold text-sm rounded-xl transition-colors">
                Place Order ({selectedTests.length} test{selectedTests.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
