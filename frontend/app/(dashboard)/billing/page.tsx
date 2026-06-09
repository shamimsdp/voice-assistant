"use client";

import React, { useState, useMemo } from "react";
import {
  DollarSign,
  FileText,
  Plus,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  Landmark,
  TrendingUp,
} from "lucide-react";
import {
  useInvoices,
  useCreateInvoice,
  useInsuranceClaims,
  useCreateInsuranceClaim,
  useSubmitClaim,
  usePaymentHistory,
  usePatients,
} from "@/lib/api-hooks";
import type { Invoice, InsuranceClaim, PaymentHistoryEntry } from "@/lib/api-hooks";

const INSURANCE_PROVIDERS = [
  { value: "pragoti_life", label: "Pragoti Life" },
  { value: "metlife_bd", label: "MetLife BD" },
  { value: "delta_life", label: "Delta Life" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

const INVOICE_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/25",
  sent: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  overdue: "bg-red-500/10 text-red-400 border-red-500/25",
  cancelled: "bg-amber-500/10 text-amber-400 border-amber-500/25",
};

const CLAIM_STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/25",
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  rejected: "bg-red-500/10 text-red-400 border-red-500/25",
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  partial: "bg-blue-500/10 text-blue-400 border-blue-500/25",
  unpaid: "bg-amber-500/10 text-amber-400 border-amber-500/25",
  initiated: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
  refunded: "bg-red-500/10 text-red-400 border-red-500/25",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function formatCurrency(amount: number) {
  return `৳${amount.toLocaleString()}`;
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "payments" | "claims">("invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedInvId, setExpandedInvId] = useState<string | null>(null);
  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [showCreateClaim, setShowCreateClaim] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "success" | "error" }>({ show: false, message: "", type: "success" });

  const [newInvoice, setNewInvoice] = useState({
    patient_id: "",
    line_items: [{ description: "Consultation fee", amount: 0 }],
    tax_pct: 0,
    discount: 0,
    notes: "",
  });

  const [newClaim, setNewClaim] = useState({
    patient_id: "",
    provider: "general",
    policy_number: "",
    claim_amount: 0,
    diagnosis_code: "",
    treatment_code: "",
    notes: "",
  });

  const statusParam = statusFilter !== "all" ? statusFilter : undefined;
  const { data: invoices = [], isLoading: invLoading, error: invError } = useInvoices(statusParam);
  const { data: payments = [], isLoading: pmtLoading } = usePaymentHistory();
  const { data: claims = [], isLoading: claimLoading, error: claimError } = useInsuranceClaims(statusParam);
  const { data: patientsData = [] } = usePatients();

  const createInvoiceMut = useCreateInvoice();
  const createClaimMut = useCreateInsuranceClaim();
  const submitClaimMut = useSubmitClaim();
  const [mutError, setMutError] = useState("");

  const error = (invError as Error)?.message || (claimError as Error)?.message || mutError;

  const patientNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    patientsData.forEach((p: any) => { map[p.id] = p.name || p.phone; });
    return map;
  }, [patientsData]);

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  }

  async function handleCreateInvoice() {
    if (!newInvoice.patient_id) { showToast("Select a patient", "error"); return; }
    if (newInvoice.line_items.some((li) => li.amount <= 0)) { showToast("All line items must have an amount", "error"); return; }
    setMutError("");
    try {
      await createInvoiceMut.mutateAsync({
        appointment_id: newInvoice.patient_id,
        line_items: newInvoice.line_items,
        tax_pct: newInvoice.tax_pct,
        discount: newInvoice.discount,
      });
      setShowCreateInvoice(false);
      setNewInvoice({ patient_id: "", line_items: [{ description: "Consultation fee", amount: 0 }], tax_pct: 0, discount: 0, notes: "" });
      showToast("Invoice created");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  async function handleCreateClaim() {
    if (!newClaim.patient_id || !newClaim.policy_number || newClaim.claim_amount <= 0) {
      showToast("Fill in all required fields", "error");
      return;
    }
    setMutError("");
    try {
      await createClaimMut.mutateAsync({
        appointment_id: newClaim.patient_id,
        patient_id: newClaim.patient_id,
        provider: newClaim.provider,
        policy_number: newClaim.policy_number,
        claim_amount: newClaim.claim_amount,
        diagnosis_code: newClaim.diagnosis_code || undefined,
        treatment_code: newClaim.treatment_code || undefined,
        notes: newClaim.notes || undefined,
      });
      setShowCreateClaim(false);
      setNewClaim({ patient_id: "", provider: "general", policy_number: "", claim_amount: 0, diagnosis_code: "", treatment_code: "", notes: "" });
      showToast("Claim created");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  async function handleSubmitClaim(claimId: string) {
    setMutError("");
    try {
      await submitClaimMut.mutateAsync(claimId);
      showToast("Claim submitted to insurer");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  }

  function addLineItem() {
    setNewInvoice({ ...newInvoice, line_items: [...newInvoice.line_items, { description: "", amount: 0 }] });
  }

  function updateLineItem(idx: number, field: "description" | "amount", value: string | number) {
    const items = [...newInvoice.line_items];
    items[idx] = { ...items[idx], [field]: value };
    setNewInvoice({ ...newInvoice, line_items: items });
  }

  function removeLineItem(idx: number) {
    if (newInvoice.line_items.length <= 1) return;
    setNewInvoice({ ...newInvoice, line_items: newInvoice.line_items.filter((_, i) => i !== idx) });
  }

  const summary = {
    total_invoices: invoices.length,
    paid_invoices: invoices.filter((i) => i.status === "paid").length,
    overdue_invoices: invoices.filter((i) => i.status === "overdue").length,
    total_revenue: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0),
    pending_amount: invoices.filter((i) => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.total, 0),
    claims_pending: claims.filter((c) => c.status === "draft" || c.status === "submitted").length,
  };

  const filteredInvoices = (invoices as Invoice[]).filter((inv) => {
    const m = inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) ?? true;
    const s = statusFilter === "all" || inv.status === statusFilter;
    return m && s;
  });

  const filteredClaims = (claims as InsuranceClaim[]).filter((c) => {
    const m = c.provider?.toLowerCase().includes(search.toLowerCase()) ?? true;
    const s = statusFilter === "all" || c.status === statusFilter;
    return m && s;
  });

  const isLoading = activeTab === "invoices" ? invLoading : activeTab === "payments" ? pmtLoading : claimLoading;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Payments</h1>
          <p className="text-sm text-slate-400 mt-1">Invoices, payment history, and insurance claims</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "invoices" && (
            <button
              onClick={() => setShowCreateInvoice(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-semibold transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              New Invoice
            </button>
          )}
          {activeTab === "claims" && (
            <button
              onClick={() => setShowCreateClaim(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-semibold transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              New Claim
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/5 border border-red-500/20 px-4 py-2.5 rounded-xl">
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Total Invoices</p>
              <p className="text-2xl font-bold text-white mt-1">{summary.total_invoices}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Paid</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.paid_invoices}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{summary.overdue_invoices}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Revenue</p>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.total_revenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 font-medium">Claims Active</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{summary.claims_pending}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-[#0a1120] border border-slate-800/60 rounded-2xl p-1 w-fit">
        {[
          { key: "invoices", label: "Invoices", icon: Receipt },
          { key: "payments", label: "Payments", icon: DollarSign },
          { key: "claims", label: "Insurance Claims", icon: Landmark },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key as typeof activeTab); setSearch(""); setStatusFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── INVOICES TAB ─── */}
      {activeTab === "invoices" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search invoices..."
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
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {invLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-48 bg-slate-800 rounded" />
                    <div className="h-3 w-32 bg-slate-800 rounded mt-2" />
                  </div>
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                </div>
              </div>
            ))
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">No invoices found</p>
            </div>
          ) : (
            filteredInvoices.map((inv: Invoice) => (
              <div key={inv.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpandedInvId(expandedInvId === inv.id ? null : inv.id)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#070b13] border border-slate-800 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-white">{inv.invoice_number}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${INVOICE_STATUS_STYLES[inv.status]}`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{formatDate(inv.issued_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-sm font-semibold text-white">{formatCurrency(inv.total)}</p>
                    {expandedInvId === inv.id ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                  </div>
                </button>

                {expandedInvId === inv.id && (
                  <div className="border-t border-slate-800/60 px-5 py-4 bg-[#080d1a]/50">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      Issued: {formatDate(inv.issued_at)}
                    </div>
                    <div className="mt-3 px-3.5 py-3 rounded-xl bg-[#070b13] border border-slate-800">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total</span>
                        <span className="font-semibold text-white">{formatCurrency(inv.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── PAYMENTS TAB ─── */}
      {activeTab === "payments" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search payments..."
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
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="unpaid">Unpaid</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {pmtLoading ? (
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden animate-pulse">
              <div className="p-5 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-800 rounded" />
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0d172b]/50 border-b border-slate-800/60">
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Fee</th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Paid</th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trx ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {(payments as PaymentHistoryEntry[]).filter((p) => {
                      const m = p.patient_name?.toLowerCase().includes(search.toLowerCase()) ?? true;
                      const s = statusFilter === "all" || p.payment_status === statusFilter;
                      return m && s;
                    }).map((pmt, i) => (
                      <tr key={`${pmt.appointment_id}-${i}`} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-5 py-4 text-sm text-slate-200">{pmt.patient_name}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{pmt.patient_phone}</td>
                        <td className="px-5 py-4 text-sm text-slate-400">{formatDate(pmt.scheduled_at)}</td>
                        <td className="px-5 py-4 text-sm text-slate-200 text-right">{formatCurrency(pmt.consultation_fee)}</td>
                        <td className="px-5 py-4 text-sm text-slate-200 text-right">{pmt.advance_amount > 0 ? formatCurrency(pmt.advance_amount) : "—"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${PAYMENT_STATUS_STYLES[pmt.payment_status]}`}>
                            {pmt.payment_status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm font-mono text-slate-400">{pmt.bkash_trx_id || "—"}</td>
                      </tr>
                    ))}
                    {(payments as PaymentHistoryEntry[]).length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-sm text-slate-500">No payment records found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── INSURANCE CLAIMS TAB ─── */}
      {activeTab === "claims" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search claims..."
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
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {claimLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5 animate-pulse">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-800" />
                    <div>
                      <div className="h-4 w-32 bg-slate-800 rounded" />
                      <div className="h-3 w-24 bg-slate-800 rounded mt-1" />
                    </div>
                  </div>
                  <div className="h-4 w-16 bg-slate-800 rounded" />
                </div>
              </div>
            ))
          ) : filteredClaims.length === 0 ? (
            <div className="text-center py-16">
              <Landmark className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 text-sm">No insurance claims found</p>
            </div>
          ) : (
            filteredClaims.map((claim: InsuranceClaim) => (
              <div key={claim.id} className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#070b13] border border-slate-800 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-white">{INSURANCE_PROVIDERS.find((p) => p.value === claim.provider)?.label || claim.provider}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${CLAIM_STATUS_STYLES[claim.status]}`}>
                          {claim.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">{claim.provider}</span>
                        {claim.submitted_at && <span className="text-xs text-slate-500">Submitted: {formatDate(claim.submitted_at)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{formatCurrency(claim.claim_amount)}</p>
                  </div>
                </div>

                {claim.status === "draft" && (
                  <div className="mt-4">
                    <button
                      onClick={() => handleSubmitClaim(claim.id)}
                      disabled={submitClaimMut.isPending}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-semibold transition-colors disabled:bg-slate-700 disabled:text-slate-500"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Submit to Insurer
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── CREATE INVOICE MODAL ─── */}
      {showCreateInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">New Invoice</h2>
              <button onClick={() => setShowCreateInvoice(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient *</label>
                <select
                  value={newInvoice.patient_id}
                  onChange={(e) => setNewInvoice({ ...newInvoice, patient_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="">Select patient...</option>
                  {patientsData.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name || p.phone} ({p.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-400">Line Items *</label>
                  <button
                    onClick={addLineItem}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    + Add item
                  </button>
                </div>
                {newInvoice.line_items.map((li, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLineItem(idx, "description", e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      min={0}
                      value={li.amount}
                      onChange={(e) => updateLineItem(idx, "amount", parseInt(e.target.value) || 0)}
                      className="w-28 px-3.5 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                    {newInvoice.line_items.length > 1 && (
                      <button
                        onClick={() => removeLineItem(idx)}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Tax (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newInvoice.tax_pct}
                    onChange={(e) => setNewInvoice({ ...newInvoice, tax_pct: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Discount (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={newInvoice.discount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, discount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes</label>
                <textarea
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  placeholder="Optional notes..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none"
                />
              </div>

              {/* Invoice Preview */}
              {newInvoice.line_items.some((li) => li.amount > 0) && (
                <div className="px-3.5 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-slate-400 mb-1">
                    Subtotal: {formatCurrency(newInvoice.line_items.reduce((s, li) => s + li.amount, 0))}
                    {newInvoice.tax_pct > 0 && ` | Tax: ${newInvoice.tax_pct}%`}
                    {newInvoice.discount > 0 && ` | Discount: -${formatCurrency(newInvoice.discount)}`}
                  </p>
                  <p className="text-sm font-bold text-emerald-300">
                    Total: {formatCurrency(
                      newInvoice.line_items.reduce((s, li) => s + li.amount, 0) +
                      Math.round(newInvoice.line_items.reduce((s, li) => s + li.amount, 0) * newInvoice.tax_pct / 100) -
                      newInvoice.discount
                    )}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateInvoice(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                disabled={createInvoiceMut.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors disabled:bg-slate-700 disabled:text-slate-500"
              >
                {createInvoiceMut.isPending ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE CLAIM MODAL ─── */}
      {showCreateClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">New Insurance Claim</h2>
              <button onClick={() => setShowCreateClaim(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Patient *</label>
                <select
                  value={newClaim.patient_id}
                  onChange={(e) => setNewClaim({ ...newClaim, patient_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="">Select patient...</option>
                  {patientsData.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name || p.phone} ({p.phone})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Insurance Provider *</label>
                <select
                  value={newClaim.provider}
                  onChange={(e) => setNewClaim({ ...newClaim, provider: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {INSURANCE_PROVIDERS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Policy Number *</label>
                <input
                  type="text"
                  value={newClaim.policy_number}
                  onChange={(e) => setNewClaim({ ...newClaim, policy_number: e.target.value })}
                  placeholder="e.g. PL-2026-00123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Claim Amount (৳) *</label>
                <input
                  type="number"
                  min={1}
                  value={newClaim.claim_amount}
                  onChange={(e) => setNewClaim({ ...newClaim, claim_amount: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Diagnosis Code</label>
                  <input
                    type="text"
                    value={newClaim.diagnosis_code}
                    onChange={(e) => setNewClaim({ ...newClaim, diagnosis_code: e.target.value })}
                    placeholder="e.g. J45"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Treatment Code</label>
                  <input
                    type="text"
                    value={newClaim.treatment_code}
                    onChange={(e) => setNewClaim({ ...newClaim, treatment_code: e.target.value })}
                    placeholder="e.g. T01"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes</label>
                <textarea
                  value={newClaim.notes}
                  onChange={(e) => setNewClaim({ ...newClaim, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 placeholder-slate-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateClaim(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClaim}
                disabled={createClaimMut.isPending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#070b13] text-sm font-semibold transition-colors disabled:bg-slate-700 disabled:text-slate-500"
              >
                {createClaimMut.isPending ? "Creating..." : "Create Claim"}
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
