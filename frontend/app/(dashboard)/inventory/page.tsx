"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  X,
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  FlaskConical,
  FileText,
  Wrench,
  Loader2,
} from "lucide-react";
import {
  useInventorySummary,
  useInventorySearch,
  useCreateInventoryItem,
  useUpdateStock,
  useInventoryTransactions,
  useSupplies,
  useEquipment,
} from "@/lib/api-hooks";
import type {
  InventoryItem as ApiInventoryItem,
  InventoryTransaction,
  Supply,
  Equipment,
} from "@/lib/api-hooks";

const CATEGORIES = ["All", "tablet", "capsule", "syrup", "injection", "cream", "drop", "inhaler", "supplement", "other"];

const emptyItemForm = { name: "", genericName: "", category: "tablet", unit: "strip", currentStock: 0, minStock: 10, unitPrice: 0, sellingPrice: 0, batch: "", expiryDate: "", requiresRx: false };
const emptyTxnForm = { itemId: "", quantity: 1, unitPrice: 0, transactionType: "purchase", notes: "" };

function alertColor(level: string): string {
  if (level === "out_of_stock") return "text-red-400";
  if (level === "critical") return "text-red-400";
  if (level === "low") return "text-amber-400";
  return "text-emerald-400";
}

function alertBg(level: string): string {
  if (level === "out_of_stock") return "bg-red-500/10 border-red-500/25";
  if (level === "critical") return "bg-red-500/5 border-red-500/15";
  if (level === "low") return "bg-amber-500/5 border-amber-500/15";
  return "bg-emerald-500/5 border-emerald-500/10";
}

function alertLabel(level: string): string {
  if (level === "out_of_stock") return "Out of Stock";
  if (level === "critical") return "Critical";
  if (level === "low") return "Low";
  return "Normal";
}

type Tab = "items" | "transactions" | "supplies" | "equipment";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [txnForm, setTxnForm] = useState(emptyTxnForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: summaryData, isLoading: summaryLoading } = useInventorySummary();
  const { data: itemsData, isLoading: itemsLoading } = useInventorySearch(search || undefined, categoryFilter !== "All" ? categoryFilter : undefined);
  const { data: txnData, isLoading: txnLoading } = useInventoryTransactions();
  const { data: suppliesData, isLoading: suppliesLoading } = useSupplies();
  const { data: equipmentData, isLoading: equipmentLoading } = useEquipment();

  const createItem = useCreateInventoryItem();
  const updateStock = useUpdateStock();

  const itemNameMap = useMemo(() => {
    if (!itemsData) return {};
    const m: Record<string, string> = {};
    for (const i of itemsData) m[i.id] = i.name;
    return m;
  }, [itemsData]);

  const showMsg = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); };

  const totalItems = summaryData?.total_items ?? 0;
  const lowStock = summaryData
    ? (summaryData.by_alert_level?.out_of_stock ?? 0) + (summaryData.by_alert_level?.critical ?? 0) + (summaryData.by_alert_level?.low ?? 0)
    : 0;
  const totalValue = summaryData?.total_stock_value_bdt ?? 0;
  const categoryCount = summaryData?.items ? new Set(summaryData.items.map(i => i.category)).size : 0;

  const handleAddItem = async () => {
    try {
      await createItem.mutateAsync({
        name: itemForm.name,
        generic_name: itemForm.genericName || undefined,
        category: itemForm.category,
        unit: itemForm.unit,
        current_stock: itemForm.currentStock,
        min_stock: itemForm.minStock,
        unit_price: itemForm.unitPrice,
        selling_price: itemForm.sellingPrice,
        batch_number: itemForm.batch || undefined,
        expiry_date: itemForm.expiryDate || undefined,
        requires_prescription: itemForm.requiresRx,
      });
      showMsg(`Item "${itemForm.name}" added`);
      setShowAddItem(false);
    } catch {
      showMsg("Failed to add item");
    }
  };

  const handleAddStock = async () => {
    try {
      await updateStock.mutateAsync({
        item_id: txnForm.itemId,
        transaction_type: txnForm.transactionType,
        quantity: txnForm.transactionType === "purchase" ? txnForm.quantity : -txnForm.quantity,
        unit_price: txnForm.unitPrice || undefined,
        notes: txnForm.notes || undefined,
      });
      showMsg("Stock transaction recorded");
      setShowAddStock(false);
    } catch {
      showMsg("Failed to record transaction");
    }
  };

  const isMutating = createItem.isPending || updateStock.isPending;

  return (
    <div className="max-w-7xl mx-auto">
      {feedback && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
          {feedback}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Inventory</h2>
          <p className="text-sm text-slate-400">Manage medicines, supplies, and equipment stock.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "items" && (
            <>
              <button onClick={() => { setTxnForm(emptyTxnForm); setShowAddStock(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700/50 transition-colors">
                <Plus className="w-4 h-4" /> Add Stock
              </button>
              <button onClick={() => { setItemForm(emptyItemForm); setShowAddItem(true); }} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl transition-colors">
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-[#0a1120] border border-slate-800/70 rounded-2xl p-4 animate-pulse">
              <div className="h-8 w-20 bg-slate-800 rounded mb-2" />
              <div className="h-3 w-16 bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Items", value: totalItems, icon: Package, color: "text-blue-400" },
            { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: lowStock > 0 ? "text-amber-400" : "text-emerald-400" },
            { label: "Stock Value", value: `৳${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Categories", value: categoryCount, icon: Layers, color: "text-purple-400" },
          ].map(c => (
            <div key={c.label} className="bg-[#0a1120] border border-slate-800/70 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{c.label}</p>
              </div>
              <c.icon className={`w-8 h-8 ${c.color} opacity-60`} />
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-[#0a1120] border border-slate-800/60 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: "items" as Tab, label: "Items", icon: Package },
          { key: "transactions" as Tab, label: "Transactions", icon: FileText },
          { key: "supplies" as Tab, label: "Supplies", icon: FlaskConical },
          { key: "equipment" as Tab, label: "Equipment", icon: Wrench },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === t.key ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 border border-transparent"}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── ITEMS TAB ── */}
      {activeTab === "items" && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, generic, brand..." className="w-full bg-[#0a1120] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40" />
            </div>
            <div className="flex overflow-x-auto gap-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg whitespace-nowrap transition-all capitalize ${categoryFilter === c ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300 border border-slate-800/60"}`}>{c}</button>
              ))}
            </div>
          </div>

          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0d172b]/50">
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Item</th>
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Category</th>
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Stock</th>
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Alert</th>
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Price</th>
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Batch</th>
                      <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {!itemsData || itemsData.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No items found</td></tr>
                    ) : (
                      itemsData.map(i => (
                        <tr key={i.id} className={`hover:bg-slate-800/20 transition-colors ${alertBg(i.alert_level)}`}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-white">{i.name}</p>
                            <p className="text-[10px] text-slate-500">{i.generic_name ?? i.category}</p>
                          </td>
                          <td className="px-4 py-3"><span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md capitalize">{i.category}</span></td>
                          <td className="px-4 py-3">
                            <p className={`text-sm font-bold ${alertColor(i.alert_level)}`}>{i.current_stock}</p>
                            <p className="text-[10px] text-slate-500">{i.unit}</p>
                          </td>
                          <td className="px-4 py-3"><span className={`text-[10px] font-semibold ${alertColor(i.alert_level)}`}>{alertLabel(i.alert_level)}</span></td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-white">৳{i.selling_price}</p>
                            <p className="text-[10px] text-slate-500">Cost: ৳{i.unit_price}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono text-slate-400">{i.batch_number ?? "—"}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{i.expiry_date ?? "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === "transactions" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
          {txnLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0d172b]/50">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Item</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Type</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Qty</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Price</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {!txnData || txnData.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No transactions found</td></tr>
                  ) : (
                    txnData.map(t => (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-4 py-3 text-xs text-slate-400">{t.created_at?.split("T")[0] ?? t.created_at}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-white">{itemNameMap[t.item_id] ?? t.item_id.slice(0, 8)}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize ${
                            t.transaction_type === "purchase" ? "bg-emerald-500/10 text-emerald-400" :
                            t.transaction_type === "sale" ? "bg-blue-500/10 text-blue-400" :
                            "bg-amber-500/10 text-amber-400"
                          }`}>{t.transaction_type}</span>
                        </td>
                        <td className={`px-4 py-3 text-xs font-bold ${t.quantity > 0 ? "text-emerald-400" : "text-red-400"}`}>{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">৳{t.unit_price}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{t.notes ?? "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── SUPPLIES TAB ── */}
      {activeTab === "supplies" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
          {suppliesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            </div>
          ) : !suppliesData || suppliesData.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No supplies found</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {suppliesData.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      <FlaskConical className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{s.supply_type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${s.low_stock ? "text-amber-400" : "text-white"}`}>{s.current_stock}</p>
                      <p className="text-[10px] text-slate-500">{s.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">৳{s.unit_price}</p>
                      <p className="text-[10px] text-slate-500">per {s.unit}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EQUIPMENT TAB ── */}
      {activeTab === "equipment" && (
        equipmentLoading ? (
          <div className="flex items-center justify-center py-16 bg-[#0a1120] border border-slate-800/60 rounded-2xl">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : !equipmentData || equipmentData.length === 0 ? (
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-10 text-center">
            <p className="text-sm text-slate-500">No equipment found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {equipmentData.map(e => (
              <div key={e.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      <Wrench className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{e.name}</p>
                      <p className="text-[10px] text-slate-500">{e.model ?? "—"}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${
                    e.status === "operational" ? "bg-emerald-500/10 text-emerald-400" :
                    e.status === "maintenance" ? "bg-amber-500/10 text-amber-400" :
                    "bg-red-500/10 text-red-400"
                  }`}>{e.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div><span className="text-slate-600">Type:</span> <span className="text-slate-300 capitalize">{e.equipment_type}</span></div>
                  <div><span className="text-slate-600">Serial:</span> <span className="font-mono text-slate-300">{e.serial_number ?? "—"}</span></div>
                  <div><span className="text-slate-600">Purchased:</span> <span className="text-slate-300">{e.purchase_date ?? "—"}</span></div>
                  <div><span className="text-slate-600">Warranty:</span> <span className="text-slate-300">{e.warranty_expiry ?? "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Add Item Modal ── */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-lg p-6 mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Inventory Item</h3>
              <button onClick={() => setShowAddItem(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Name</label>
                  <input value={itemForm.name} onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="Napa Extra" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                  <select value={itemForm.category} onChange={e => setItemForm(f => ({ ...f, category: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Generic Name</label>
                  <input value={itemForm.genericName} onChange={e => setItemForm(f => ({ ...f, genericName: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="Paracetamol 500mg" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                  <input value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="strip / bottle" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Stock</label>
                  <input type="number" value={itemForm.currentStock} onChange={e => setItemForm(f => ({ ...f, currentStock: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Min Stock</label>
                  <input type="number" value={itemForm.minStock} onChange={e => setItemForm(f => ({ ...f, minStock: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit Price</label>
                  <input type="number" value={itemForm.unitPrice} onChange={e => setItemForm(f => ({ ...f, unitPrice: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Selling Price (৳)</label>
                  <input type="number" value={itemForm.sellingPrice} onChange={e => setItemForm(f => ({ ...f, sellingPrice: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Batch #</label>
                  <input value={itemForm.batch} onChange={e => setItemForm(f => ({ ...f, batch: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Expiry Date</label>
                  <input type="date" value={itemForm.expiryDate} onChange={e => setItemForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
                <div className="flex items-end pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={itemForm.requiresRx} onChange={e => setItemForm(f => ({ ...f, requiresRx: e.target.checked }))} className="w-4 h-4 accent-emerald-500" />
                    <span className="text-xs text-slate-400">Requires Prescription</span>
                  </label>
                </div>
              </div>
              <button onClick={handleAddItem} disabled={isMutating || !itemForm.name} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#070b13] font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Stock Modal ── */}
      {showAddStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-md p-6 mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Record Stock Transaction</h3>
              <button onClick={() => setShowAddStock(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Item</label>
                <select value={txnForm.itemId} onChange={e => setTxnForm(f => ({ ...f, itemId: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                  <option value="">Select item</option>
                  {itemsData?.map(i => <option key={i.id} value={i.id}>{i.name} ({i.current_stock} in stock)</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Type</label>
                  <select value={txnForm.transactionType} onChange={e => setTxnForm(f => ({ ...f, transactionType: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white">
                    <option value="purchase">Purchase</option>
                    <option value="sale">Sale</option>
                    <option value="return">Return</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="expired">Expired</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Quantity</label>
                  <input type="number" value={txnForm.quantity} onChange={e => setTxnForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Notes</label>
                <input value={txnForm.notes} onChange={e => setTxnForm(f => ({ ...f, notes: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="e.g. Monthly restock" />
              </div>
              <button onClick={handleAddStock} disabled={isMutating || !txnForm.itemId} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-[#070b13] font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
                {isMutating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Record Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
