"use client";

import React, { useState, useMemo } from "react";
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
  DollarSign,
  Clock,
  Loader2,
} from "lucide-react";
import {
  useLabTests,
  useLabOrders,
  useLabResults,
  usePlaceLabOrder,
  useImaging,
  usePatients,
  useDoctors,
} from "@/lib/api-hooks";

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
  const [orderPatient, setOrderPatient] = useState("");
  const [orderDoctor, setOrderDoctor] = useState("");
  const [orderPriority, setOrderPriority] = useState("routine");
  const [orderNotes, setOrderNotes] = useState("");

  const showMsg = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); };

  const { data: labTests, isLoading: testsLoading, error: testsError } = useLabTests(
    categoryFilter === "All" ? undefined : categoryFilter
  );
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useLabOrders();
  const { data: orderResults, isLoading: resultsLoading } = useLabResults(expandedOrder);
  const { data: imagingStudies, isLoading: imagingLoading, error: imagingError } = useImaging();
  const placeOrder = usePlaceLabOrder();

  const patientMap = useMemo(() => new Map(patients?.map(p => [p.id, p.name || p.phone]) || []), [patients]);
  const doctorMap = useMemo(() => new Map(doctors?.map(d => [d.id, d.name]) || []), [doctors]);

  const categories = useMemo(() => {
    if (!labTests) return ["All"];
    const cats = [...new Set(labTests.map(t => t.category))].sort();
    return ["All", ...cats];
  }, [labTests]);

  const filteredTests = useMemo(() => {
    if (!labTests) return [];
    return labTests.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
  }, [labTests, search]);

  const handlePlaceOrder = () => {
    if (!orderPatient || !orderDoctor || selectedTests.length === 0) return;
    placeOrder.mutate(
      { patient_id: orderPatient, doctor_id: orderDoctor, priority: orderPriority, test_ids: selectedTests, clinical_notes: orderNotes || null },
      {
        onSuccess: () => {
          showMsg("Lab order placed successfully");
          setShowOrderModal(false);
          setSelectedTests([]);
          setOrderPatient("");
          setOrderDoctor("");
          setOrderPriority("routine");
          setOrderNotes("");
        },
        onError: () => showMsg("Failed to place order"),
      }
    );
  };

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
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg whitespace-nowrap capitalize transition-all ${categoryFilter === c ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300 border border-slate-800/60"}`}>{c}</button>
              ))}
            </div>
          </div>

          {testsLoading ? (
            <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : testsError ? (
            <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-red-800/60 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-400">Failed to load tests</p>
            </div>
          ) : filteredTests.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
              <FlaskConical className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No tests found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTests.map(t => (
                <div key={t.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-white">{t.name}</p>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md capitalize mt-1 inline-block">{t.category}</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400">৳{t.fee}</p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><FlaskConical className="w-3 h-3" />{t.specimen_type}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{t.turnaround_hours}h turnaround</span>
                  </div>
                  {t.preparation_instructions && <p className="text-[10px] text-slate-500 mt-2 italic">{t.preparation_instructions}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── ORDERS ── */}
      {activeTab === "orders" && (
        <>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : ordersError ? (
            <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-red-800/60 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-400">Failed to load orders</p>
            </div>
          ) : !orders || orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
              <FileText className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500 mb-4">No lab orders yet</p>
              <button onClick={() => setShowOrderModal(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl transition-colors">
                <Plus className="w-4 h-4" /> Place Order
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map(o => {
                const isExpanded = expandedOrder === o.id;
                const results = isExpanded ? orderResults : undefined;
                const resLoading = isExpanded && resultsLoading;
                return (
                  <div key={o.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
                    <button onClick={() => setExpandedOrder(isExpanded ? null : o.id)} className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                          <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{o.order_number}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400">{patientMap.get(o.patient_id) || o.patient_id.slice(0, 8)}</span>
                            <span className="text-slate-700">·</span>
                            <span className="text-[10px] text-slate-400">{doctorMap.get(o.doctor_id) || o.doctor_id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${statusBadge(o.status)}`}>{o.status.replace("_", " ")}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 border-t border-slate-800/60">
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                            <p className="text-[10px] text-slate-500">Order Date</p>
                            <p className="text-xs font-semibold text-white">{o.ordered_at ? new Date(o.ordered_at).toLocaleDateString() : "—"}</p>
                          </div>
                          <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                            <p className="text-[10px] text-slate-500">Priority</p>
                            <p className={`text-xs font-semibold capitalize ${o.priority === "urgent" ? "text-red-400" : "text-white"}`}>{o.priority}</p>
                          </div>
                          <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                            <p className="text-[10px] text-slate-500">Total Fee</p>
                            <p className="text-xs font-semibold text-emerald-400">৳{o.total_fee}</p>
                          </div>
                          <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60">
                            <p className="text-[10px] text-slate-500">Paid</p>
                            <p className={`text-xs font-semibold ${o.is_paid ? "text-emerald-400" : "text-amber-400"}`}>{o.is_paid ? "Yes" : "No"}</p>
                          </div>
                        </div>

                        {o.clinical_notes && (
                          <div className="bg-[#070b13] rounded-lg px-3 py-2 border border-slate-800/60 mb-4">
                            <p className="text-[10px] text-slate-500 mb-1">Clinical Notes</p>
                            <p className="text-xs text-slate-300">{o.clinical_notes}</p>
                          </div>
                        )}

                        {resLoading && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 bg-[#070b13] rounded-lg px-4 py-3 border border-slate-800/60">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading results...
                          </div>
                        )}

                        {!resLoading && results && results.length > 0 && (
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
                                  {results.map(r => (
                                    <tr key={r.id}>
                                      <td className="py-2 pr-4 text-xs text-white">{r.parameter_name}</td>
                                      <td className={`py-2 pr-4 text-xs font-bold ${r.is_abnormal ? "text-red-400" : "text-emerald-400"}`}>{r.result_value}</td>
                                      <td className="py-2 pr-4 text-xs text-slate-400">{r.unit || "—"}</td>
                                      <td className="py-2 pr-4 text-xs text-slate-400">{r.reference_range || "—"}</td>
                                      <td className="py-2 pr-4"><span className={`text-[10px] px-1.5 py-0.5 rounded-md ${r.is_abnormal ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>{r.is_abnormal ? "Abnormal" : "Normal"}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {!resLoading && (!results || results.length === 0) && (
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
        </>
      )}

      {/* ── IMAGING ── */}
      {activeTab === "imaging" && (
        <>
          {imagingLoading ? (
            <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : imagingError ? (
            <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-red-800/60 rounded-2xl">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-sm text-red-400">Failed to load imaging studies</p>
            </div>
          ) : !imagingStudies || imagingStudies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
              <Radio className="w-10 h-10 text-slate-700 mb-3" />
              <p className="text-sm text-slate-500">No imaging studies found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {imagingStudies.map(i => (
                <div key={i.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        <Radio className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{i.study_type} — {i.body_part}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{i.ordered_at ? new Date(i.ordered_at).toLocaleDateString() : "—"}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${statusBadge(i.status)}`}>{i.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <p className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Fee: ৳{i.fee}</p>
                    {i.clinical_reason && <p className="truncate max-w-[60%]">{i.clinical_reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Place Order Modal ── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-lg p-6 mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Place Lab Order</h3>
              <button onClick={() => { setShowOrderModal(false); setSelectedTests([]); setOrderPatient(""); setOrderDoctor(""); setOrderNotes(""); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Patient</label>
                <select value={orderPatient} onChange={e => setOrderPatient(e.target.value)} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                  <option value="">Select patient</option>
                  {(patients || []).map(p => <option key={p.id} value={p.id}>{p.name || p.phone}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Doctor</label>
                  <select value={orderDoctor} onChange={e => setOrderDoctor(e.target.value)} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="">Select doctor</option>
                    {(doctors || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Priority</label>
                  <select value={orderPriority} onChange={e => setOrderPriority(e.target.value)} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Select Tests</label>
                <div className="flex flex-col gap-1.5 bg-[#070b13] border border-slate-800 rounded-xl p-3 max-h-48 overflow-y-auto">
                  {(labTests || []).map(t => {
                    const isSel = selectedTests.includes(t.id);
                    return (
                      <label key={t.id} className="flex items-center gap-2.5 cursor-pointer px-2 py-1.5 rounded-lg hover:bg-slate-800/40 transition-colors">
                        <input type="checkbox" checked={isSel} onChange={() => setSelectedTests(prev => isSel ? prev.filter(id => id !== t.id) : [...prev, t.id])} className="accent-emerald-500 w-3.5 h-3.5" />
                        <span className="text-xs text-white flex-1">{t.name}</span>
                        <span className="text-[10px] text-slate-500">৳{t.fee}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Clinical Notes</label>
                <textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} rows={3} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" placeholder="Any clinical notes or diagnosis code..." />
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={placeOrder.isPending || !orderPatient || !orderDoctor || selectedTests.length === 0}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#070b13] font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {placeOrder.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Place Order ({selectedTests.length} test{selectedTests.length !== 1 ? "s" : ""})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
