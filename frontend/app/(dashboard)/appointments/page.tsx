"use client";

import React, { useState, useMemo } from "react";
import {
  CalendarDays,
  Search,
  Plus,
  Filter,
  Send,
  CreditCard,
  X,
  Sparkles,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useSendReminder,
} from "@/lib/api-hooks";
import type { Appointment as ApiAppointment } from "@/lib/api-hooks";

const appointmentSchema = z.object({
  patientName: z.string().min(1, "Name is required").max(100),
  phone: z
    .string()
    .min(11, "Must be at least 11 digits")
    .regex(/^01[3-9]\d{8}$/, "Invalid BD phone number (e.g. 01711223344)"),
  doctorName: z.string().min(1, "Select a doctor"),
  date: z.string().min(1, "Select a date"),
  time: z.string().min(1, "Select a time slot"),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface DisplayAppointment {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: string;
  smsStatus: string;
  amount: number;
}

const apiStatusToDisplay: Record<string, string> = {
  pending: "Pending Payment",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Cancelled",
};

const displayStatusToApi: Record<string, string> = {
  "Pending Payment": "confirmed",
  Confirmed: "completed",
  Completed: "cancelled",
  Cancelled: "confirmed",
};

const displayStatusToFilter: Record<string, string | undefined> = {
  All: undefined,
  Completed: "completed",
  Confirmed: "confirmed",
  "Pending Payment": "pending",
  Cancelled: "cancelled",
};

const displayStatusCycle: Record<string, string> = {
  "Pending Payment": "confirmed",
  Confirmed: "completed",
  Completed: "cancelled",
  Cancelled: "confirmed",
};

const doctorsList = [
  { id: "doc-1", name: "Dr. Shah Alam", dept: "Cardiology" },
  { id: "doc-2", name: "Dr. Laila Bilkis", dept: "Gynaecology" },
  { id: "doc-3", name: "Dr. M. Rahman", dept: "Orthopedics" },
];

const doctorById = Object.fromEntries(doctorsList.map((d) => [d.id, d]));
const doctorByName = Object.fromEntries(doctorsList.map((d) => [d.name, d]));

const patientNames: Record<string, { name: string; phone: string }> = {
  "pat-1": { name: "Imran Khan", phone: "01711223344" },
  "pat-2": { name: "Farhana Yasmin", phone: "01988776655" },
  "pat-3": { name: "Tariqul Islam", phone: "01522334455" },
  "pat-4": { name: "Nusrat Jahan", phone: "01844556677" },
  "pat-5": { name: "Abul Kalam", phone: "01311223344" },
  "pat-6": { name: "Kazi Arif", phone: "01755667788" },
  "pat-7": { name: "Sabina Yeasmin", phone: "01622334455" },
};

function formatScheduledAt(isoStr: string): { date: string; time: string } {
  const d = new Date(isoStr);
  const date = d.toISOString().split("T")[0];
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return { date, time: `${hours.toString().padStart(2, "0")}:${minutes} ${ampm}` };
}

function toDisplay(api: ApiAppointment): DisplayAppointment {
  const { date, time } = formatScheduledAt(api.scheduled_at);
  const doc = api.doctor_id ? doctorById[api.doctor_id] : undefined;
  const patient = api.patient_id ? patientNames[api.patient_id] : undefined;
  return {
    id: api.id,
    patientName: patient?.name ?? "Unknown Patient",
    phone: patient?.phone ?? "\u2014",
    doctorName: doc?.name ?? "Unknown Doctor",
    department: doc?.dept ?? "General",
    date,
    time,
    status: apiStatusToDisplay[api.status] ?? api.status,
    smsStatus: api.reminder_sent ? "Sent" : "Not Sent",
    amount: api.advance_amount || api.consultation_fee || 0,
  };
}

function toTime24h(time12: string): string {
  const [_, hourStr, minStr, ampm] = time12.match(/^(\d+):(\d+)\s*(AM|PM)$/i) ?? [];
  let h = parseInt(hourStr, 10);
  if (ampm.toUpperCase() === "PM" && h !== 12) h += 12;
  if (ampm.toUpperCase() === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${minStr}:00`;
}

export default function AppointmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

  const apiFilterStatus = displayStatusToFilter[statusFilter];
  const apiFilterDoctorId =
    doctorFilter !== "All" ? doctorByName[doctorFilter]?.id : undefined;

  const { data: apiAppointments, isLoading, error } = useAppointments({
    status: apiFilterStatus,
    doctor_id: apiFilterDoctorId,
  });

  const createMutation = useCreateAppointment();
  const updateMutation = useUpdateAppointment();
  const sendReminder = useSendReminder();

  const appointments = useMemo<DisplayAppointment[]>(
    () => (apiAppointments ?? []).map(toDisplay),
    [apiAppointments],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorName: "Dr. Shah Alam",
      date: new Date().toISOString().split("T")[0],
      time: "10:00 AM",
    },
  });

  const filteredAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        const matchesSearch =
          apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          apt.phone.includes(searchTerm);
        return matchesSearch;
      }),
    [appointments, searchTerm],
  );

  const onSubmit = (data: AppointmentFormData) => {
    const selectedDoc = doctorsList.find((d) => d.name === data.doctorName);
    if (!selectedDoc) return;
    createMutation.mutate(
      {
        doctor_id: selectedDoc.id,
        patient_name: data.patientName,
        patient_phone: data.phone,
        scheduled_at: `${data.date}T${toTime24h(data.time)}`,
        advance_amount: 500,
      },
      {
        onSuccess: () => {
          setShowAddModal(false);
          reset();
        },
      },
    );
  };

  const toggleStatus = (id: string, currentDisplayStatus: string) => {
    const nextApiStatus = displayStatusCycle[currentDisplayStatus];
    if (!nextApiStatus) return;
    updateMutation.mutate({ id, data: { status: nextApiStatus } });
  };

  const triggerSMS = (id: string) => {
    sendReminder.mutate(id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-slate-800 text-slate-400 border border-slate-700/50";
      case "Confirmed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
      case "Pending Payment":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
      case "Cancelled":
        return "bg-red-500/10 text-red-400 border border-red-500/25";
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Appointments
          </h2>
          <p className="text-sm text-slate-400">
            View, search, and manage patient bookings and bKash transaction states.
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            reset();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md shadow-emerald-500/5 hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          Book Appointment
        </button>
      </div>

      <div className="bg-[#0a1120] border border-slate-800/60 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient name, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-[#070b13] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Doctor:</span>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              <option value="All" className="bg-[#0a1120]">
                All Doctors
              </option>
              {doctorsList.map((doc) => (
                <option key={doc.name} value={doc.name} className="bg-[#0a1120]">
                  {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#070b13] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <CreditCard className="w-3.5 h-3.5 text-slate-500" />
            <span>Payment:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none font-medium cursor-pointer"
            >
              <option value="All" className="bg-[#0a1120]">
                All Statuses
              </option>
              <option value="Completed" className="bg-[#0a1120]">
                Completed
              </option>
              <option value="Confirmed" className="bg-[#0a1120]">
                Confirmed
              </option>
              <option value="Pending Payment" className="bg-[#0a1120]">
                Pending Payment
              </option>
              <option value="Cancelled" className="bg-[#0a1120]">
                Cancelled
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 animate-pulse"
              >
                <div className="h-3 w-20 rounded bg-slate-800" />
                <div className="h-3 w-32 rounded bg-slate-800" />
                <div className="h-3 w-36 rounded bg-slate-800" />
                <div className="h-3 w-28 rounded bg-slate-800" />
                <div className="h-3 w-16 rounded bg-slate-800" />
                <div className="h-5 w-24 rounded-full bg-slate-800" />
                <div className="h-3 w-16 rounded bg-slate-800" />
                <div className="h-3 w-16 rounded bg-slate-800 ml-auto" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="font-semibold text-red-400">Failed to load appointments</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {error instanceof Error ? error.message : "An unexpected error occurred"}
              </p>
            </div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-[#0d172b]/50">
                  <th className="py-4 px-6">ID</th>
                  <th className="py-4 px-6">Patient</th>
                  <th className="py-4 px-6">Doctor & Department</th>
                  <th className="py-4 px-6">Schedule Date & Time</th>
                  <th className="py-4 px-6">Deposit Fee</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">SMS Notif</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {filteredAppointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 font-semibold">
                      {apt.id.slice(0, 8)}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {apt.patientName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {apt.phone}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">
                          {apt.doctorName}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium mt-0.5">
                          {apt.department}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-300">
                          {apt.date}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {apt.time}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold font-mono text-slate-200">
                      {apt.amount > 0 ? `\u09F3${apt.amount}` : "\u2014"}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(apt.id, apt.status)}
                        className={`px-2 py-0.5 rounded-full font-medium text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadge(apt.status)}`}
                        title="Click to cycle status"
                      >
                        {apt.status}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          apt.smsStatus === "Sent"
                            ? "bg-slate-800 text-slate-400 border border-slate-700/50"
                            : apt.smsStatus === "Failed"
                              ? "bg-red-500/10 text-red-400 border border-red-500/25"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                        }`}
                      >
                        {apt.smsStatus}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {apt.smsStatus === "Not Sent" && (
                          <button
                            onClick={() => triggerSMS(apt.id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                            title="Send SMS notification manually"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleStatus(apt.id, apt.status)}
                          className="px-2 py-1 rounded-md text-[10px] font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors"
                        >
                          Cycle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-500">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-300">
                No appointments found
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Try altering your search text or selections.
              </p>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                New Appointment Book
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Patient Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tariqul Islam"
                  {...register("patientName")}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
                {errors.patientName && (
                  <span className="text-[10px] text-red-400 font-medium">
                    {errors.patientName.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Phone Number (Bangladeshi)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 01711223344"
                  {...register("phone")}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
                {errors.phone && (
                  <span className="text-[10px] text-red-400 font-medium">
                    {errors.phone.message}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Doctor Specialist
                </label>
                <select
                  {...register("doctorName")}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {doctorsList.map((doc) => (
                    <option key={doc.name} value={doc.name} className="bg-[#0a1120]">
                      {doc.name} ({doc.dept})
                    </option>
                  ))}
                </select>
                {errors.doctorName && (
                  <span className="text-[10px] text-red-400 font-medium">
                    {errors.doctorName.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Date
                  </label>
                  <input
                    type="date"
                    {...register("date")}
                    className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  />
                  {errors.date && (
                    <span className="text-[10px] text-red-400 font-medium">
                      {errors.date.message}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Time Slot
                  </label>
                  <select
                    {...register("time")}
                    className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                  </select>
                  {errors.time && (
                    <span className="text-[10px] text-red-400 font-medium">
                      {errors.time.message}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal bg-slate-900/60 p-2.5 border border-slate-800/80 rounded-lg">
                * Note: Manual appointments are default saved as{" "}
                <span className="text-amber-400 font-semibold">
                  Pending Payment
                </span>
                . The patient will be sent a SMS containing the bKash payment portal
                link.
              </p>

              <div className="flex gap-3 justify-end border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#070b13] border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md shadow-emerald-500/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Booking"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
