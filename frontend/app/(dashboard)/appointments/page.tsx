"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Search,
  Plus,
  Filter,
  Send,
  CreditCard,
  User,
  Phone,
  Clock,
  Sparkles,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  status: "Completed" | "Confirmed" | "Pending Payment" | "Cancelled";
  smsStatus: "Sent" | "Failed" | "Not Sent";
  amount: number;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([
    { id: "APT001", patientName: "Imran Khan", phone: "01711223344", doctorName: "Dr. Shah Alam", department: "Cardiology", date: "2026-06-04", time: "09:30 AM", status: "Completed", smsStatus: "Sent", amount: 500 },
    { id: "APT002", patientName: "Farhana Yasmin", phone: "01988776655", doctorName: "Dr. Laila Bilkis", department: "Gynaecology", date: "2026-06-04", time: "10:15 AM", status: "Confirmed", smsStatus: "Sent", amount: 500 },
    { id: "APT003", patientName: "Tariqul Islam", phone: "01522334455", doctorName: "Dr. M. Rahman", department: "Orthopedics", date: "2026-06-04", time: "11:00 AM", status: "Pending Payment", smsStatus: "Not Sent", amount: 500 },
    { id: "APT004", patientName: "Nusrat Jahan", phone: "01844556677", doctorName: "Dr. Laila Bilkis", department: "Gynaecology", date: "2026-06-04", time: "11:45 AM", status: "Confirmed", smsStatus: "Sent", amount: 500 },
    { id: "APT005", patientName: "Abul Kalam", phone: "01311223344", doctorName: "Dr. Shah Alam", department: "Cardiology", date: "2026-06-04", time: "12:30 PM", status: "Cancelled", smsStatus: "Failed", amount: 0 },
    { id: "APT006", patientName: "Kazi Arif", phone: "01755667788", doctorName: "Dr. M. Rahman", department: "Orthopedics", date: "2026-06-05", time: "02:00 PM", status: "Confirmed", smsStatus: "Sent", amount: 500 },
    { id: "APT007", patientName: "Sabina Yeasmin", phone: "01622334455", doctorName: "Dr. Shah Alam", department: "Cardiology", date: "2026-06-05", time: "03:30 PM", status: "Pending Payment", smsStatus: "Not Sent", amount: 500 },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [doctorFilter, setDoctorFilter] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);

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

  const doctorsList = [
    { name: "Dr. Shah Alam", dept: "Cardiology" },
    { name: "Dr. Laila Bilkis", dept: "Gynaecology" },
    { name: "Dr. M. Rahman", dept: "Orthopedics" },
  ];

  const onSubmit = (data: AppointmentFormData) => {
    const selectedDoc = doctorsList.find((d) => d.name === data.doctorName);
    const created: Appointment = {
      id: `APT00${appointments.length + 1}`,
      patientName: data.patientName,
      phone: data.phone,
      doctorName: data.doctorName,
      department: selectedDoc ? selectedDoc.dept : "General",
      date: data.date,
      time: data.time,
      status: "Pending Payment",
      smsStatus: "Not Sent",
      amount: 500,
    };
    setAppointments([created, ...appointments]);
    setShowAddModal(false);
    reset();
  };

  const toggleStatus = (id: string) => {
    setAppointments(prev =>
      prev.map(apt => {
        if (apt.id === id) {
          const nextStatusMap: Record<Appointment["status"], Appointment["status"]> = {
            "Pending Payment": "Confirmed",
            "Confirmed": "Completed",
            "Completed": "Cancelled",
            "Cancelled": "Pending Payment",
          };
          return { ...apt, status: nextStatusMap[apt.status] };
        }
        return apt;
      })
    );
  };

  const triggerSMS = (id: string) => {
    setAppointments(prev =>
      prev.map(apt => {
        if (apt.id === id) {
          return { ...apt, smsStatus: "Sent" as const };
        }
        return apt;
      })
    );
  };

  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.phone.includes(searchTerm);
    const matchesStatus = statusFilter === "All" || apt.status === statusFilter;
    const matchesDoctor = doctorFilter === "All" || apt.doctorName === doctorFilter;
    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const getStatusBadge = (status: Appointment["status"]) => {
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Appointments</h2>
          <p className="text-sm text-slate-400">View, search, and manage patient bookings and bKash transaction states.</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); reset(); }}
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
              <option value="All" className="bg-[#0a1120]">All Doctors</option>
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
              <option value="All" className="bg-[#0a1120]">All Statuses</option>
              <option value="Completed" className="bg-[#0a1120]">Completed</option>
              <option value="Confirmed" className="bg-[#0a1120]">Confirmed</option>
              <option value="Pending Payment" className="bg-[#0a1120]">Pending Payment</option>
              <option value="Cancelled" className="bg-[#0a1120]">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl overflow-hidden shadow-sm">
        {filteredAppointments.length > 0 ? (
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
                    <td className="py-4 px-6 font-mono text-[11px] text-slate-500 font-semibold">{apt.id}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">{apt.patientName}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{apt.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-200">{apt.doctorName}</span>
                        <span className="text-[10px] text-emerald-400 font-medium mt-0.5">{apt.department}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-300">{apt.date}</span>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5">{apt.time}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-semibold font-mono text-slate-200">
                      {apt.amount > 0 ? `৳${apt.amount}` : "—"}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleStatus(apt.id)}
                        className={`px-2 py-0.5 rounded-full font-medium text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${getStatusBadge(apt.status)}`}
                        title="Click to cycle status (Simulated)"
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
                          onClick={() => toggleStatus(apt.id)}
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
              <p className="font-semibold text-slate-300">No appointments found</p>
              <p className="text-xs text-slate-500 mt-0.5">Try altering your search text or selections.</p>
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
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Patient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tariqul Islam"
                  {...register("patientName")}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
                {errors.patientName && (
                  <span className="text-[10px] text-red-400 font-medium">{errors.patientName.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Phone Number (Bangladeshi)</label>
                <input
                  type="text"
                  placeholder="e.g. 01711223344"
                  {...register("phone")}
                  className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
                {errors.phone && (
                  <span className="text-[10px] text-red-400 font-medium">{errors.phone.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Doctor Specialist</label>
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
                  <span className="text-[10px] text-red-400 font-medium">{errors.doctorName.message}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Date</label>
                  <input
                    type="date"
                    {...register("date")}
                    className="px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                  />
                  {errors.date && (
                    <span className="text-[10px] text-red-400 font-medium">{errors.date.message}</span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time Slot</label>
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
                    <span className="text-[10px] text-red-400 font-medium">{errors.time.message}</span>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-normal bg-slate-900/60 p-2.5 border border-slate-800/80 rounded-lg">
                * Note: Manual appointments are default saved as <span className="text-amber-400 font-semibold">Pending Payment</span>. The patient will be sent a SMS containing the bKash payment portal link.
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] transition-all shadow-md shadow-emerald-500/5"
                >
                  Create Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
