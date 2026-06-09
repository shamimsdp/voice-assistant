"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  Package,
  AlertTriangle,
  DollarSign,
  Layers,
  FlaskConical,
  Activity,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  Wrench,
} from "lucide-react";

interface InventoryItem {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unitPrice: number;
  sellingPrice: number;
  batch: string;
  expiryDate: string;
  manufacturer: string;
  requiresRx: boolean;
}

interface StockTxn {
  id: string;
  itemName: string;
  type: string;
  quantity: number;
  unitPrice: number;
  date: string;
  notes: string;
}

interface Supply {
  id: string;
  name: string;
  type: string;
  unit: string;
  currentStock: number;
  minStock: number;
  unitPrice: number;
}

interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  serialNumber: string;
  status: string;
  purchaseDate: string;
  warrantyExpiry: string;
}

const CATEGORIES = ["All", "tablet", "capsule", "syrup", "injection", "cream", "drop", "inhaler", "supplement", "other"];

const MOCK_ITEMS: InventoryItem[] = [
  { id: "i1", name: "Napa Extra", genericName: "Paracetamol 500mg", brand: "Beximco", category: "tablet", unit: "strip", currentStock: 45, minStock: 20, maxStock: 100, unitPrice: 15, sellingPrice: 25, batch: "BXC-2401", expiryDate: "2027-06-15", manufacturer: "Beximco Pharma", requiresRx: false },
  { id: "i2", name: "Ace 75mg", genericName: "Aspirin 75mg", brand: "Square", category: "tablet", unit: "strip", currentStock: 12, minStock: 20, maxStock: 80, unitPrice: 8, sellingPrice: 15, batch: "SQ-2403", expiryDate: "2026-12-20", manufacturer: "Square Pharma", requiresRx: false },
  { id: "i3", name: "Atorvastatin 20mg", genericName: "Atorvastatin", brand: "Incepta", category: "tablet", unit: "strip", currentStock: 0, minStock: 15, maxStock: 60, unitPrice: 25, sellingPrice: 40, batch: "ICP-2309", expiryDate: "2026-09-10", manufacturer: "Incepta Pharma", requiresRx: true },
  { id: "i4", name: "Metformin 500mg", genericName: "Metformin HCl", brand: "Aristopharma", category: "tablet", unit: "strip", currentStock: 8, minStock: 25, maxStock: 90, unitPrice: 12, sellingPrice: 20, batch: "AR-2402", expiryDate: "2027-03-05", manufacturer: "Aristopharma", requiresRx: true },
  { id: "i5", name: "Amoxicillin 250mg", genericName: "Amoxicillin", brand: "Square", category: "capsule", unit: "strip", currentStock: 30, minStock: 15, maxStock: 70, unitPrice: 18, sellingPrice: 30, batch: "SQ-2411", expiryDate: "2026-08-22", manufacturer: "Square Pharma", requiresRx: true },
  { id: "i6", name: "Omeprazole 20mg", genericName: "Omeprazole", brand: "Healthcare", category: "capsule", unit: "strip", currentStock: 22, minStock: 15, maxStock: 50, unitPrice: 10, sellingPrice: 18, batch: "HCL-2308", expiryDate: "2026-11-15", manufacturer: "Healthcare Pharma", requiresRx: false },
  { id: "i7", name: "Zinc Syrup", genericName: "Zinc Sulfate", brand: "ACI", category: "syrup", unit: "bottle", currentStock: 3, minStock: 10, maxStock: 40, unitPrice: 55, sellingPrice: 85, batch: "ACI-2405", expiryDate: "2026-07-30", manufacturer: "ACI Pharma", requiresRx: false },
  { id: "i8", name: "ORS Solution", genericName: "Oral Rehydration Salt", brand: "Popular", category: "other", unit: "packet", currentStock: 60, minStock: 30, maxStock: 200, unitPrice: 5, sellingPrice: 10, batch: "POP-2401", expiryDate: "2027-01-01", manufacturer: "Popular Pharma", requiresRx: false },
  { id: "i9", name: "Insulin Mixtard 30/70", genericName: "Insulin", brand: "Novo Nordisk", category: "injection", unit: "vial", currentStock: 15, minStock: 10, maxStock: 30, unitPrice: 350, sellingPrice: 450, batch: "NN-2307", expiryDate: "2026-06-20", manufacturer: "Novo Nordisk", requiresRx: true },
  { id: "i10", name: "Salbutamol Inhaler", genericName: "Salbutamol", brand: "GSK", category: "inhaler", unit: "piece", currentStock: 7, minStock: 5, maxStock: 20, unitPrice: 180, sellingPrice: 250, batch: "GSK-2403", expiryDate: "2027-05-10", manufacturer: "GlaxoSmithKline", requiresRx: true },
];

const MOCK_TXNS: StockTxn[] = [
  { id: "t1", itemName: "Napa Extra", type: "purchase", quantity: 50, unitPrice: 15, date: "2026-06-05", notes: "Monthly restock" },
  { id: "t2", itemName: "Ace 75mg", type: "sale", quantity: -5, unitPrice: 15, date: "2026-06-04", notes: "Dispensed to patient" },
  { id: "t3", itemName: "Metformin 500mg", type: "adjustment", quantity: -2, unitPrice: 12, date: "2026-06-03", notes: "Damaged in storage" },
  { id: "t4", itemName: "Zinc Syrup", type: "sale", quantity: -3, unitPrice: 85, date: "2026-06-02", notes: "Dispensed" },
  { id: "t5", itemName: "Napa Extra", type: "sale", quantity: -8, unitPrice: 25, date: "2026-06-01", notes: "Dispensed" },
  { id: "t6", itemName: "Atorvastatin 20mg", type: "purchase", quantity: 30, unitPrice: 25, date: "2026-05-28", notes: "Restock" },
];

const MOCK_SUPPLIES: Supply[] = [
  { id: "s1", name: "Surgical Gloves (Box)", type: "ppe", unit: "box", currentStock: 25, minStock: 10, unitPrice: 350 },
  { id: "s2", name: "Face Masks (Box)", type: "ppe", unit: "box", currentStock: 8, minStock: 15, unitPrice: 200 },
  { id: "s3", name: "Syringe 5ml", type: "disposable", unit: "piece", currentStock: 200, minStock: 50, unitPrice: 5 },
  { id: "s4", name: "Cotton Roll", type: "cleaning", unit: "roll", currentStock: 15, minStock: 10, unitPrice: 45 },
  { id: "s5", name: "Bandage (Roll)", type: "disposable", unit: "roll", currentStock: 40, minStock: 20, unitPrice: 25 },
];

const MOCK_EQUIPMENT: Equipment[] = [
  { id: "e1", name: "ECG Machine", type: "diagnostic", model: "GE MAC 2000", serialNumber: "GE-23841", status: "operational", purchaseDate: "2024-03-15", warrantyExpiry: "2027-03-15" },
  { id: "e2", name: "BP Monitor", type: "diagnostic", model: "Omron HEM-7120", serialNumber: "OM-55412", status: "operational", purchaseDate: "2024-06-01", warrantyExpiry: "2026-06-01" },
  { id: "e3", name: "Centrifuge Machine", type: "lab", model: "Remi R-8C", serialNumber: "RM-12987", status: "maintenance", purchaseDate: "2023-09-10", warrantyExpiry: "2025-09-10" },
  { id: "e4", name: "Autoclave", type: "sterilization", model: "Tomy SX-500", serialNumber: "TY-33210", status: "operational", purchaseDate: "2024-01-20", warrantyExpiry: "2027-01-20" },
];

const emptyItemForm = { name: "", genericName: "", brand: "", category: "tablet", unit: "strip", currentStock: 0, minStock: 10, maxStock: 100, unitPrice: 0, sellingPrice: 0, batch: "", expiryDate: "", manufacturer: "", requiresRx: false };
const emptyTxnForm = { itemId: "", quantity: 1, unitPrice: 0, transactionType: "purchase", notes: "" };

function alertColor(item: InventoryItem): string {
  if (item.currentStock <= 0) return "text-red-400";
  if (item.currentStock <= item.minStock * 0.25) return "text-red-400";
  if (item.currentStock <= item.minStock) return "text-amber-400";
  return "text-emerald-400";
}

function alertBg(item: InventoryItem): string {
  if (item.currentStock <= 0) return "bg-red-500/10 border-red-500/25";
  if (item.currentStock <= item.minStock * 0.25) return "bg-red-500/5 border-red-500/15";
  if (item.currentStock <= item.minStock) return "bg-amber-500/5 border-amber-500/15";
  return "bg-emerald-500/5 border-emerald-500/10";
}

function alertLabel(item: InventoryItem): string {
  if (item.currentStock <= 0) return "Out of Stock";
  if (item.currentStock <= item.minStock * 0.25) return "Critical";
  if (item.currentStock <= item.minStock) return "Low";
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

  const filteredItems = MOCK_ITEMS.filter(i => {
    const match = i.name.toLowerCase().includes(search.toLowerCase()) || i.genericName.toLowerCase().includes(search.toLowerCase()) || (i.brand && i.brand.toLowerCase().includes(search.toLowerCase()));
    const cat = categoryFilter === "All" || i.category === categoryFilter;
    return match && cat;
  });

  const showMsg = (msg: string) => { setFeedback(msg); setTimeout(() => setFeedback(null), 3000); };

  const totalItems = MOCK_ITEMS.length;
  const lowStock = MOCK_ITEMS.filter(i => i.currentStock <= i.minStock).length;
  const totalValue = MOCK_ITEMS.reduce((s, i) => s + i.currentStock * i.unitPrice, 0);

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Items", value: totalItems, icon: Package, color: "text-blue-400" },
          { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: lowStock > 0 ? "text-amber-400" : "text-emerald-400" },
          { label: "Stock Value", value: `৳${totalValue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
          { label: "Categories", value: CATEGORIES.length - 1, icon: Layers, color: "text-purple-400" },
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
                  {filteredItems.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">No items found</td></tr>
                  ) : (
                    filteredItems.map(i => (
                      <tr key={i.id} className={`hover:bg-slate-800/20 transition-colors ${alertBg(i)}`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-white">{i.name}</p>
                          <p className="text-[10px] text-slate-500">{i.genericName} · {i.brand}</p>
                        </td>
                        <td className="px-4 py-3"><span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md capitalize">{i.category}</span></td>
                        <td className="px-4 py-3">
                          <p className={`text-sm font-bold ${alertColor(i)}`}>{i.currentStock}</p>
                          <p className="text-[10px] text-slate-500">{i.unit}</p>
                        </td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-semibold ${alertColor(i)}`}>{alertLabel(i)}</span></td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-white">৳{i.sellingPrice}</p>
                          <p className="text-[10px] text-slate-500">Cost: ৳{i.unitPrice}</p>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-400">{i.batch}</td>
                        <td className="px-4 py-3 text-xs text-slate-400">{i.expiryDate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {activeTab === "transactions" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
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
                {MOCK_TXNS.map(t => (
                  <tr key={t.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-400">{t.date}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-white">{t.itemName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium capitalize ${
                        t.type === "purchase" ? "bg-emerald-500/10 text-emerald-400" :
                        t.type === "sale" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
                      }`}>{t.type}</span>
                    </td>
                    <td className={`px-4 py-3 text-xs font-bold ${t.quantity > 0 ? "text-emerald-400" : "text-red-400"}`}>{t.quantity > 0 ? `+${t.quantity}` : t.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">৳{t.unitPrice}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SUPPLIES TAB ── */}
      {activeTab === "supplies" && (
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
          {MOCK_SUPPLIES.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No supplies found</p>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {MOCK_SUPPLIES.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                      <FlaskConical className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{s.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{s.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${s.currentStock <= s.minStock ? "text-amber-400" : "text-white"}`}>{s.currentStock}</p>
                      <p className="text-[10px] text-slate-500">{s.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">৳{s.unitPrice}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MOCK_EQUIPMENT.map(e => (
            <div key={e.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                    <Wrench className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{e.name}</p>
                    <p className="text-[10px] text-slate-500">{e.model}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize ${
                  e.status === "operational" ? "bg-emerald-500/10 text-emerald-400" :
                  e.status === "maintenance" ? "bg-amber-500/10 text-amber-400" :
                  "bg-red-500/10 text-red-400"
                }`}>{e.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                <div><span className="text-slate-600">Type:</span> <span className="text-slate-300 capitalize">{e.type}</span></div>
                <div><span className="text-slate-600">Serial:</span> <span className="font-mono text-slate-300">{e.serialNumber}</span></div>
                <div><span className="text-slate-600">Purchased:</span> <span className="text-slate-300">{e.purchaseDate}</span></div>
                <div><span className="text-slate-600">Warranty:</span> <span className="text-slate-300">{e.warrantyExpiry}</span></div>
              </div>
            </div>
          ))}
        </div>
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
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Brand</label>
                  <input value={itemForm.brand} onChange={e => setItemForm(f => ({ ...f, brand: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="Beximco" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit</label>
                  <input value={itemForm.unit} onChange={e => setItemForm(f => ({ ...f, unit: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="strip / bottle" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Manufacturer</label>
                  <input value={itemForm.manufacturer} onChange={e => setItemForm(f => ({ ...f, manufacturer: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" placeholder="Square Pharma" />
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
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Max Stock</label>
                  <input type="number" value={itemForm.maxStock} onChange={e => setItemForm(f => ({ ...f, maxStock: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Unit Price (৳)</label>
                  <input type="number" value={itemForm.unitPrice} onChange={e => setItemForm(f => ({ ...f, unitPrice: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Selling Price (৳)</label>
                  <input type="number" value={itemForm.sellingPrice} onChange={e => setItemForm(f => ({ ...f, sellingPrice: parseInt(e.target.value) || 0 }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Batch #</label>
                  <input value={itemForm.batch} onChange={e => setItemForm(f => ({ ...f, batch: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white font-mono" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Expiry Date</label>
                  <input type="date" value={itemForm.expiryDate} onChange={e => setItemForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white" />
                </div>
              </div>
              <button onClick={() => { showMsg(`Item "${itemForm.name}" added`); setShowAddItem(false); }} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-bold text-sm rounded-xl transition-colors">
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
                  {MOCK_ITEMS.map(i => <option key={i.id} value={i.id}>{i.name} ({i.currentStock} in stock)</option>)}
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
              <button onClick={() => { showMsg("Stock transaction recorded"); setShowAddStock(false); }} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-bold text-sm rounded-xl transition-colors">
                Record Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
