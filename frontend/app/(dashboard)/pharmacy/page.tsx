"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  X,
  Pill,
  FileText,
  Package,
  DollarSign,
  ChevronDown,
  ChevronUp,
  User,
  Loader2,
  CheckCircle,
  Truck,
  Clock,
} from "lucide-react";

interface PharmacyOrderItem {
  id: string;
  medicine_name: string;
  dosage: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  is_dispensed: boolean;
}

interface PharmacyOrder {
  id: string;
  order_number: string;
  patient_name: string;
  patient_id: string;
  doctor_name: string;
  items: PharmacyOrderItem[];
  dispense_status: "pending" | "dispensed" | "partially_dispensed" | "cancelled";
  delivery_status: string | null;
  total_amount: number;
  is_paid: boolean;
  delivery_address: string | null;
  delivery_fee: number;
  notes: string | null;
  created_at: string;
}

interface PatientOption {
  id: string;
  name: string;
  phone: string;
}

const MOCK_PATIENTS: PatientOption[] = [
  { id: "p1", name: "Karim Mia", phone: "01712345678" },
  { id: "p2", name: "Fatima Begum", phone: "01898765432" },
  { id: "p3", name: "Rafiq Hasan", phone: "01911223344" },
  { id: "p4", name: "Shahina Akhter", phone: "01655443322" },
  { id: "p5", name: "Jamal Uddin", phone: "01567890123" },
];

const DOCTOR_OPTIONS = [
  { id: "d1", name: "Dr. Aminul Islam" },
  { id: "d2", name: "Dr. Farzana Haque" },
  { id: "d3", name: "Dr. Masud Rana" },
];

const MOCK_ORDERS: PharmacyOrder[] = [
  {
    id: "rx1",
    order_number: "RX-202606-0001",
    patient_name: "Karim Mia",
    patient_id: "p1",
    doctor_name: "Dr. Aminul Islam",
    items: [
      { id: "i1", medicine_name: "Napa Extra", dosage: "500mg", quantity: 30, unit_price: 2, total_price: 60, is_dispensed: true },
      { id: "i2", medicine_name: "Omeprazole", dosage: "20mg", quantity: 14, unit_price: 5, total_price: 70, is_dispensed: true },
    ],
    dispense_status: "dispensed",
    delivery_status: "delivered",
    total_amount: 130,
    is_paid: true,
    delivery_address: "House 12, Road 5, Dhanmondi, Dhaka",
    delivery_fee: 50,
    notes: null,
    created_at: "2026-06-08T10:30:00Z",
  },
  {
    id: "rx2",
    order_number: "RX-202606-0002",
    patient_name: "Fatima Begum",
    patient_id: "p2",
    doctor_name: "Dr. Farzana Haque",
    items: [
      { id: "i3", medicine_name: "Azithromycin", dosage: "500mg", quantity: 6, unit_price: 15, total_price: 90, is_dispensed: true },
    ],
    dispense_status: "dispensed",
    delivery_status: "in_transit",
    total_amount: 90,
    is_paid: false,
    delivery_address: "Flat 3B, Rupayan Center, Gulshan, Dhaka",
    delivery_fee: 0,
    notes: "Take with food",
    created_at: "2026-06-08T14:00:00Z",
  },
  {
    id: "rx3",
    order_number: "RX-202606-0003",
    patient_name: "Rafiq Hasan",
    patient_id: "p3",
    doctor_name: "Dr. Masud Rana",
    items: [
      { id: "i4", medicine_name: "Metformin", dosage: "850mg", quantity: 60, unit_price: 3, total_price: 180, is_dispensed: false },
      { id: "i5", medicine_name: "Gliclazide MR", dosage: "30mg", quantity: 30, unit_price: 8, total_price: 240, is_dispensed: false },
    ],
    dispense_status: "pending",
    delivery_status: null,
    total_amount: 420,
    is_paid: false,
    delivery_address: null,
    delivery_fee: 0,
    notes: "Diabetic patient - urgent",
    created_at: "2026-06-09T09:00:00Z",
  },
  {
    id: "rx4",
    order_number: "RX-202606-0004",
    patient_name: "Shahina Akhter",
    patient_id: "p4",
    doctor_name: "Dr. Aminul Islam",
    items: [
      { id: "i6", medicine_name: "Amoxicillin", dosage: "500mg", quantity: 21, unit_price: 4, total_price: 84, is_dispensed: false },
      { id: "i7", medicine_name: "Paracetamol", dosage: "500mg", quantity: 10, unit_price: 1, total_price: 10, is_dispensed: true },
    ],
    dispense_status: "partially_dispensed",
    delivery_status: null,
    total_amount: 94,
    is_paid: false,
    delivery_address: null,
    delivery_fee: 0,
    notes: null,
    created_at: "2026-06-09T11:30:00Z",
  },
  {
    id: "rx5",
    order_number: "RX-202606-0005",
    patient_name: "Jamal Uddin",
    patient_id: "p5",
    doctor_name: "Dr. Farzana Haque",
    items: [
      { id: "i8", medicine_name: "Losartan", dosage: "50mg", quantity: 30, unit_price: 6, total_price: 180, is_dispensed: false },
    ],
    dispense_status: "pending",
    delivery_status: null,
    total_amount: 180,
    is_paid: false,
    delivery_address: null,
    delivery_fee: 0,
    notes: null,
    created_at: "2026-06-09T13:00:00Z",
  },
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  dispensed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  partially_dispensed: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/25",
};

const DELIVERY_STYLES: Record<string, string> = {
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/25",
  assigned: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  picked_up: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  in_transit: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  failed: "bg-red-500/10 text-red-400 border-red-500/25",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function PharmacyPage() {
  const [orders, setOrders] = useState<PharmacyOrder[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const [newOrder, setNewOrder] = useState({
    patient_id: "",
    doctor_id: "",
    delivery_address: "",
    delivery_fee: 0,
    notes: "",
  });

  const [newItem, setNewItem] = useState({
    medicine_name: "",
    dosage: "",
    quantity: 1,
    unit_price: 0,
  });

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  }

  function handleCreateOrder() {
    if (!newOrder.patient_id) {
      showToast("Please select a patient", "error");
      return;
    }
    const patient = MOCK_PATIENTS.find((p) => p.id === newOrder.patient_id);
    const doctor = DOCTOR_OPTIONS.find((d) => d.id === newOrder.doctor_id);
    const orderCount = orders.length + 1;
    const orderNumber = `RX-202606-${String(orderCount).padStart(4, "0")}`;
    const order: PharmacyOrder = {
      id: `rx${Date.now()}`,
      order_number: orderNumber,
      patient_name: patient?.name || "Unknown",
      patient_id: newOrder.patient_id,
      doctor_name: doctor?.name || "N/A",
      items: [],
      dispense_status: "pending",
      delivery_status: null,
      total_amount: 0,
      is_paid: false,
      delivery_address: newOrder.delivery_address || null,
      delivery_fee: newOrder.delivery_fee,
      notes: newOrder.notes || null,
      created_at: new Date().toISOString(),
    };
    setOrders([order, ...orders]);
    setShowCreateModal(false);
    setNewOrder({ patient_id: "", doctor_id: "", delivery_address: "", delivery_fee: 0, notes: "" });
    setSelectedOrderId(order.id);
    setExpandedId(order.id);
    showToast(`Order ${orderNumber} created`);
  }

  function handleAddItem() {
    if (!selectedOrderId || !newItem.medicine_name) return;
    const item: PharmacyOrderItem = {
      id: `i${Date.now()}`,
      medicine_name: newItem.medicine_name,
      dosage: newItem.dosage,
      quantity: newItem.quantity,
      unit_price: newItem.unit_price,
      total_price: newItem.quantity * newItem.unit_price,
      is_dispensed: false,
    };
    setOrders(
      orders.map((o) => {
        if (o.id === selectedOrderId) {
          const newTotal = o.total_amount + item.total_price;
          return { ...o, items: [...o.items, item], total_amount: newTotal };
        }
        return o;
      })
    );
    setShowAddItemModal(false);
    setNewItem({ medicine_name: "", dosage: "", quantity: 1, unit_price: 0 });
    showToast(`${item.medicine_name} ${item.dosage} x${item.quantity} added to order`);
  }

  function handleDispense(orderId: string) {
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            items: o.items.map((i) => ({ ...i, is_dispensed: true })),
            dispense_status: "dispensed" as const,
          };
        }
        return o;
      })
    );
    showToast("Order dispensed successfully");
  }

  function handleCancelOrder(orderId: string) {
    setOrders(
      orders.map((o) => {
        if (o.id === orderId) {
          return { ...o, dispense_status: "cancelled" as const };
        }
        return o;
      })
    );
    showToast("Order cancelled");
  }

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.patient_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.dispense_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.dispense_status === "pending").length,
    dispensed: orders.filter((o) => o.dispense_status === "dispensed").length,
    revenue: orders.filter((o) => o.is_paid).reduce((s, o) => s + o.total_amount, 0),
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pharmacy</h1>
          <p className="text-sm text-slate-400 mt-1">Manage prescriptions and medicine dispensing</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-semibold transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Orders</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.total}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Pill className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Pending</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{summary.pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Dispensed</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.dispensed}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Revenue (Paid)</p>
              <p className="text-2xl font-bold text-white mt-1">৳{summary.revenue.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by order number or patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="partially_dispensed">Partially Dispensed</option>
          <option value="dispensed">Dispensed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-3">
        {filteredOrders.length === 0 && (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-sm">No pharmacy orders found</p>
          </div>
        )}
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
            {/* Order Header */}
            <button
              onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#070b13] border border-slate-800 flex items-center justify-center shrink-0">
                  <Pill className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-white">{order.order_number}</p>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_STYLES[order.dispense_status] || "bg-slate-500/10 text-slate-400"}`}
                    >
                      {order.dispense_status.replace("_", " ")}
                    </span>
                    {order.delivery_status && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${DELIVERY_STYLES[order.delivery_status] || "bg-slate-500/10 text-slate-400"}`}
                      >
                        {order.delivery_status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <User className="w-3 h-3" />
                      {order.patient_name}
                    </span>
                    <span className="text-xs text-slate-500">{order.doctor_name}</span>
                    {order.is_paid && <span className="text-xs text-emerald-400 font-medium">Paid</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">৳{order.total_amount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500">{order.items.length} item{order.items.length !== 1 ? "s" : ""}</p>
                </div>
                <p className="text-[10px] text-slate-500 w-16 text-right">{formatDate(order.created_at)}</p>
                {expandedId === order.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </div>
            </button>

            {/* Expanded Detail */}
            {expandedId === order.id && (
              <div className="border-t border-slate-800/60 px-5 py-4 bg-[#080d1a]/50">
                {/* Notes */}
                {order.notes && (
                  <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-xs text-amber-300">{order.notes}</p>
                  </div>
                )}

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800/60">
                        <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Medicine</th>
                        <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Dosage</th>
                        <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Qty</th>
                        <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Unit Price</th>
                        <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                        <th className="pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b border-slate-800/30">
                          <td className="py-3 text-sm text-slate-200 font-medium">{item.medicine_name}</td>
                          <td className="py-3 text-sm text-slate-300">{item.dosage}</td>
                          <td className="py-3 text-sm text-slate-300">{item.quantity}</td>
                          <td className="py-3 text-sm text-slate-300">৳{item.unit_price}</td>
                          <td className="py-3 text-sm text-slate-200 font-medium">৳{item.total_price}</td>
                          <td className="py-3">
                            {item.is_dispensed ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                <CheckCircle className="w-3 h-3" />
                                Dispensed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {order.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-sm text-slate-500">No items added yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/60">
                  <div className="flex items-center gap-2">
                    {order.dispense_status === "pending" || order.dispense_status === "partially_dispensed" ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowAddItemModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Item
                        </button>
                        <button
                          onClick={() => handleDispense(order.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-xs font-semibold transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Dispense All
                        </button>
                      </>
                    ) : null}
                    {order.dispense_status === "pending" && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/25 text-xs font-semibold hover:bg-red-500/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    )}
                  </div>
                  {order.delivery_address && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Truck className="w-3.5 h-3.5" />
                      {order.delivery_address}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">New Pharmacy Order</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient *</label>
                <select
                  value={newOrder.patient_id}
                  onChange={(e) => setNewOrder({ ...newOrder, patient_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="">Select patient...</option>
                  {MOCK_PATIENTS.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Doctor</label>
                <select
                  value={newOrder.doctor_id}
                  onChange={(e) => setNewOrder({ ...newOrder, doctor_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="">Select doctor...</option>
                  {DOCTOR_OPTIONS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Delivery Address</label>
                <textarea
                  value={newOrder.delivery_address}
                  onChange={(e) => setNewOrder({ ...newOrder, delivery_address: e.target.value })}
                  placeholder="Optional delivery address..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={newOrder.delivery_fee}
                    onChange={(e) => setNewOrder({ ...newOrder, delivery_fee: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes</label>
                <textarea
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Add Medicine</h2>
              <button onClick={() => setShowAddItemModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Medicine Name *</label>
                <input
                  type="text"
                  value={newItem.medicine_name}
                  onChange={(e) => setNewItem({ ...newItem, medicine_name: e.target.value })}
                  placeholder="e.g. Napa Extra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Dosage</label>
                <input
                  type="text"
                  value={newItem.dosage}
                  onChange={(e) => setNewItem({ ...newItem, dosage: e.target.value })}
                  placeholder="e.g. 500mg"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Unit Price (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={newItem.unit_price}
                    onChange={(e) => setNewItem({ ...newItem, unit_price: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
              {newItem.unit_price > 0 && newItem.quantity > 0 && (
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-emerald-300">
                    Total: ৳{newItem.unit_price * newItem.quantity}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold transition-all ${
            toast.type === "success" ? "bg-emerald-500 text-[#070b13]" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
