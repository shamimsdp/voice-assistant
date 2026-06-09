"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  User,
  Plus,
  X,
  CheckCircle2,
  Ban,
  AlertCircle,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  useDoctors,
  useWeeklySchedule,
  useCreateSchedule,
  useTimeOffRequests,
  useCreateTimeOff,
  useApproveTimeOff,
  useAppointments,
} from "@/lib/api-hooks";

// ── Types ─────────────────────────────────────────────────────────────────────
interface DoctorDisplay {
  id: string;
  name: string;
  nameBn: string;
  specialty: string;
  isActive: boolean;
}

interface ScheduleEntryDisplay {
  id: string;
  doctorId: string;
  doctorName: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  maxPatients: number;
  room: string;
}

interface AppointmentDisplay {
  id: string;
  patientName: string;
  phone: string;
  doctorName: string;
  time: string;
  status: string;
  fee: number;
  dateKey: string;
}

interface TimeOffEntryDisplay {
  id: string;
  doctorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

// ── Schemas ────────────────────────────────────────────────────────────────────
const appointmentSchema = z.object({
  patientName: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(11).regex(/^01[3-9]\d{8}$/, "Invalid BD phone number"),
  doctorId: z.string().min(1, "Select a doctor"),
  time: z.string().min(1, "Select a time slot"),
});

const timeOffSchema = z.object({
  doctorId: z.string().min(1, "Select a doctor"),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  reason: z.string().min(1, "Reason is required"),
});

const scheduleSchema = z.object({
  doctorId: z.string().min(1, "Select a doctor"),
  dayOfWeek: z.string().min(1, "Select day"),
  shiftType: z.string().min(1, "Select shift type"),
  startTime: z.string().min(1, "Start time required"),
  endTime: z.string().min(1, "End time required"),
  maxPatients: z.string().min(1),
  room: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;
type TimeOffForm = z.infer<typeof timeOffSchema>;
type ScheduleForm = z.infer<typeof scheduleSchema>;

// ── Helpers ────────────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_SHORTCODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const SHIFT_LABELS: Record<string, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  full_day: "Full Day",
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseTimeFromIso(isoStr: string): string {
  const parts = isoStr.split("T")[1]?.split(":");
  if (!parts || parts.length < 2) return "";
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return "bg-slate-800 text-slate-400 border border-slate-700/50";
    case "Confirmed":
      return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
    case "Pending Payment":
      return "bg-amber-500/10 text-amber-400 border border-amber-500/25";
    case "Cancelled":
      return "bg-red-500/10 text-red-400 border border-red-500/25";
    default:
      return "bg-slate-800 text-slate-400 border border-slate-700/50";
  }
}

function getTimeOffBadge(status: string) {
  switch (status) {
    case "Approved":
      return "bg-emerald-500/10 text-emerald-400";
    case "Pending":
      return "bg-amber-500/10 text-amber-400";
    case "Rejected":
      return "bg-red-500/10 text-red-400";
    default:
      return "bg-slate-800 text-slate-400";
  }
}

function sanitizeStatus(s: string): string {
  const map: Record<string, string> = {
    confirmed: "Confirmed",
    completed: "Completed",
    pending_payment: "Pending Payment",
    cancelled: "Cancelled",
    no_show: "No Show",
  };
  return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SchedulePage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "timeoff" | "add">("calendar");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDayAppointments, setSelectedDayAppointments] = useState<AppointmentDisplay[]>([]);
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<ScheduleEntryDisplay[]>([]);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const aptForm = useForm<AppointmentForm>({ resolver: zodResolver(appointmentSchema) });
  const toForm = useForm<TimeOffForm>({ resolver: zodResolver(timeOffSchema) });
  const schForm = useForm<ScheduleForm>({ resolver: zodResolver(scheduleSchema) });

  // ── API Hooks ──────────────────────────────────────────────────────────────
  const {
    data: doctorsData,
    isLoading: doctorsLoading,
    error: doctorsError,
  } = useDoctors();
  const {
    data: scheduleData,
    isLoading: scheduleLoading,
  } = useWeeklySchedule();
  const {
    data: timeOffData,
    isLoading: timeOffLoading,
    error: timeOffError,
  } = useTimeOffRequests();
  const {
    data: appointmentsData,
    isLoading: aptsLoading,
  } = useAppointments();
  const createSchedule = useCreateSchedule();
  const createTimeOff = useCreateTimeOff();
  const approveTimeOff = useApproveTimeOff();

  // ── Derived Data ───────────────────────────────────────────────────────────
  const DOCTORS: DoctorDisplay[] = useMemo(
    () =>
      (doctorsData || []).map((d) => ({
        id: d.id,
        name: d.name,
        nameBn: d.name_bn || "",
        specialty: d.specialty || "",
        isActive: d.is_active ?? true,
      })),
    [doctorsData],
  );

  const getScheduleForDate = useMemo(() => {
    const schedule = scheduleData?.schedule;
    return (dateKey: string): ScheduleEntryDisplay[] => {
      if (!schedule) return [];
      const date = new Date(dateKey + "T12:00:00");
      const dayCode = DAY_SHORTCODES[date.getDay()];
      const entries = schedule[dayCode] || [];
      return entries.map((s) => ({
        id: s.id,
        doctorId: s.doctor_id,
        doctorName: DOCTORS.find((d) => d.id === s.doctor_id)?.name || "",
        shiftType: s.shift_type,
        startTime: s.start_time.slice(0, 5),
        endTime: s.end_time.slice(0, 5),
        maxPatients: s.max_patients,
        room: s.room_number || "",
      }));
    };
  }, [scheduleData, DOCTORS]);

  const APPOINTMENTS: AppointmentDisplay[] = useMemo(
    () =>
      (appointmentsData || []).map((a) => ({
        id: a.id,
        patientName: a.patient_id.slice(0, 8),
        phone: "",
        doctorName: DOCTORS.find((d) => d.id === a.doctor_id)?.name || "",
        time: parseTimeFromIso(a.scheduled_at),
        status: sanitizeStatus(a.status),
        fee: a.consultation_fee,
        dateKey: a.scheduled_at?.split("T")[0] || "",
      })),
    [appointmentsData, DOCTORS],
  );

  const TIME_OFF: TimeOffEntryDisplay[] = useMemo(
    () =>
      (timeOffData || []).map((t) => ({
        id: t.id,
        doctorName: DOCTORS.find((d) => d.id === t.doctor_id)?.name || "",
        startDate: t.start_date,
        endDate: t.end_date,
        reason: t.reason || "",
        status: t.status.charAt(0).toUpperCase() + t.status.slice(1).toLowerCase(),
      })),
    [timeOffData, DOCTORS],
  );

  // ── Loading / Error states ─────────────────────────────────────────────────
  const isLoading = doctorsLoading || scheduleLoading || aptsLoading || timeOffLoading;
  const fetchError = doctorsError || timeOffError;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-48 bg-slate-800 rounded-lg" />
        <div className="h-4 w-64 bg-slate-800 rounded-lg" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 bg-slate-800 rounded-xl" />
          <div className="h-10 w-40 bg-slate-800 rounded-xl" />
        </div>
        <div className="h-10 w-40 bg-slate-800 rounded-xl" />
        <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="h-5 w-8 bg-slate-800 rounded" />
            <div className="h-6 w-48 bg-slate-800 rounded" />
            <div className="h-5 w-8 bg-slate-800 rounded" />
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="h-4 bg-slate-800 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-[72px] bg-slate-800/60 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-7xl mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Failed to load schedule</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Something went wrong while fetching schedule data. Please try again later.
        </p>
      </div>
    );
  }

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else setCurrentMonth((m) => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else setCurrentMonth((m) => m + 1);
    setSelectedDate(null);
  }

  function handleDayClick(day: number) {
    const key = formatDateKey(currentYear, currentMonth, day);
    setSelectedDate(key);
    setSelectedDayAppointments(APPOINTMENTS.filter((a) => a.dateKey === key));
    setSelectedDaySchedules(getScheduleForDate(key));
    setActiveTab("calendar");
  }

  function showFeedback(msg: string) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  }

  const onAppointmentSubmit = (data: AppointmentForm) => {
    const doc = DOCTORS.find((d) => d.id === data.doctorId);
    showFeedback(`Appointment booked for ${data.patientName} with ${doc?.name}`);
    setShowAppointmentModal(false);
    aptForm.reset();
  };

  const onTimeOffSubmit = (data: TimeOffForm) => {
    createTimeOff.mutate({
      doctor_id: data.doctorId,
      start_date: data.startDate,
      end_date: data.endDate,
      reason: data.reason,
    });
    const doc = DOCTORS.find((d) => d.id === data.doctorId);
    showFeedback(`Time-off request submitted for ${doc?.name}`);
    setShowTimeOffModal(false);
    toForm.reset();
  };

  const onScheduleSubmit = (data: ScheduleForm) => {
    createSchedule.mutate({
      doctor_id: data.doctorId,
      day: data.dayOfWeek,
      shift_type: data.shiftType,
      start_time: data.startTime,
      end_time: data.endTime,
      max_patients: parseInt(data.maxPatients, 10),
      room_number: data.room || undefined,
    });
    const doc = DOCTORS.find((d) => d.id === data.doctorId);
    showFeedback(`Schedule created for ${doc?.name} — ${SHIFT_LABELS[data.shiftType] || data.shiftType}`);
    setShowScheduleModal(false);
    schForm.reset();
  };

  const handleApproveTimeOff = (id: string) => {
    approveTimeOff.mutate({ id, approved: true });
    showFeedback("Time-off request approved");
  };

  const handleRejectTimeOff = (id: string) => {
    approveTimeOff.mutate({ id, approved: false });
    showFeedback("Time-off request rejected");
  };

  const isToday = (day: number) => {
    const d = new Date();
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === day;
  };

  const isFriday = (day: number) => {
    return new Date(currentYear, currentMonth, day).getDay() === 5;
  };

  // Calendar cells
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Schedule</h2>
          <p className="text-sm text-slate-400">Manage doctor schedules, appointments, and time-off requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setShowScheduleModal(true);
              setActiveTab("add");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Schedule
          </button>
          <button
            onClick={() => setShowTimeOffModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700/50 transition-colors"
          >
            <Clock className="w-4 h-4" /> Request Time Off
          </button>
        </div>
      </div>

      {/* Action Feedback Toast */}
      {actionFeedback && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/5 text-sm font-medium animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {actionFeedback}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#0a1120] border border-slate-800/60 rounded-xl p-1 w-fit">
        {[
          { key: "calendar", label: "Calendar" },
          { key: "timeoff", label: "Time Off" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === t.key
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className={`${selectedDate ? "xl:col-span-2" : "xl:col-span-3"}`}>
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-bold text-white">{monthName}</span>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} />;
                const dateKey = formatDateKey(currentYear, currentMonth, day);
                const isSel = selectedDate === dateKey;
                const dayAppts = APPOINTMENTS.filter((a) => a.dateKey === dateKey);
                const daySchedules = getScheduleForDate(dateKey);
                const isFri = isFriday(day);
                const confCount = dayAppts.filter((a) => a.status !== "Cancelled").length;

                return (
                  <button
                    key={dateKey}
                    onClick={() => handleDayClick(day)}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-sm transition-all min-h-[72px] border ${
                      isSel
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : isToday(day)
                        ? "bg-emerald-500/5 border-emerald-500/10 text-white"
                        : isFri
                        ? "bg-amber-500/5 border-transparent text-slate-400"
                        : "bg-transparent border-transparent text-slate-400 hover:bg-slate-800/40"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold ${isToday(day) ? "text-emerald-400" : ""} ${
                        isFri ? "text-amber-400" : ""
                      }`}
                    >
                      {day}
                    </span>
                    {isFri && <span className="text-[8px] text-amber-500/60 font-medium leading-none">Jummah</span>}
                    {confCount > 0 && (
                      <span className={`text-[10px] font-semibold ${isSel ? "text-emerald-300" : "text-emerald-400"}`}>
                        {confCount} apt
                      </span>
                    )}
                    {daySchedules.length > 0 && !isFri && (
                      <div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
                        {daySchedules.slice(0, 2).map((s) => (
                          <span
                            key={s.id}
                            className="w-1.5 h-1.5 rounded-full bg-blue-400/60"
                            title={s.doctorName}
                          />
                        ))}
                        {daySchedules.length > 2 && (
                          <span className="text-[8px] text-blue-400/60">+{daySchedules.length - 2}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400/60" />
                <span className="text-[10px] text-slate-500">Appointment slot</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400/60" />
                <span className="text-[10px] text-slate-500">Doctor on duty</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400/60" />
                <span className="text-[10px] text-slate-500">Jummah (closed 12-2PM)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Day Detail Panel */}
        {selectedDate && (
          <div className="xl:col-span-1">
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {new Date(selectedDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedDaySchedules.length} doctors on duty</p>
                </div>
                <button
                  onClick={() => {
                    setShowAppointmentModal(true);
                    aptForm.setValue("time", "10:00 AM");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-[#070b13] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Book
                </button>
              </div>

              {/* Doctors on duty */}
              {selectedDaySchedules.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Doctors On Duty
                  </h4>
                  <div className="flex flex-col gap-2">
                    {selectedDaySchedules.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between bg-[#070b13] rounded-lg p-2.5 border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                            <User className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{s.doctorName}</p>
                            <p className="text-[10px] text-slate-500">
                              {s.startTime}–{s.endTime} · {SHIFT_LABELS[s.shiftType] || s.shiftType} · Room {s.room}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-md">
                          {s.maxPatients} slots
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Appointments for this day */}
              {selectedDayAppointments.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Appointments</h4>
                  <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto">
                    {selectedDayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-[#070b13] rounded-lg p-2.5 border border-slate-800/60"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-white">{apt.patientName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${getStatusBadge(apt.status)}`}
                          >
                            {apt.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {apt.time}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {apt.doctorName}
                            </span>
                          </div>
                          <span className="text-[11px] font-semibold text-slate-300">৳{apt.fee}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDaySchedules.length === 0 && selectedDayAppointments.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarDays className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-sm text-slate-500">No schedules or appointments for this day.</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    + Add Schedule
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Time Off Tab Panel */}
        {activeTab === "timeoff" && (
          <div className="xl:col-span-3">
            <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-5">
              <h3 className="text-base font-bold text-white mb-4">Time-Off Requests</h3>

              {TIME_OFF.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Clock className="w-10 h-10 text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500">No time-off requests found.</p>
                  <button
                    onClick={() => setShowTimeOffModal(true)}
                    className="mt-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    + Request Time Off
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {TIME_OFF.map((to) => (
                    <div
                      key={to.id}
                      className="flex items-center justify-between bg-[#070b13] rounded-xl p-4 border border-slate-800/60"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                          <Clock className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{to.doctorName}</p>
                          <p className="text-xs text-slate-500">
                            {to.startDate} → {to.endDate}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{to.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded-md font-semibold ${getTimeOffBadge(to.status)}`}>
                          {to.status}
                        </span>
                        {to.status === "Pending" && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleApproveTimeOff(to.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectTimeOff(to.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Reject"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Book Appointment Modal ── */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-md p-6 mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Book Appointment</h3>
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={aptForm.handleSubmit(onAppointmentSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Patient Name</label>
                <input
                  {...aptForm.register("patientName")}
                  placeholder="e.g. Imran Khan"
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
                {aptForm.formState.errors.patientName && (
                  <p className="text-[10px] text-red-400 mt-1">{aptForm.formState.errors.patientName.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Phone</label>
                <input
                  {...aptForm.register("phone")}
                  placeholder="01711223344"
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
                {aptForm.formState.errors.phone && (
                  <p className="text-[10px] text-red-400 mt-1">{aptForm.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Doctor</label>
                <select
                  {...aptForm.register("doctorId")}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  <option value="">Select doctor</option>
                  {DOCTORS.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.specialty}
                    </option>
                  ))}
                </select>
                {aptForm.formState.errors.doctorId && (
                  <p className="text-[10px] text-red-400 mt-1">{aptForm.formState.errors.doctorId.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Time</label>
                <select
                  {...aptForm.register("time")}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  {[
                    "09:00 AM",
                    "09:30 AM",
                    "10:00 AM",
                    "10:30 AM",
                    "11:00 AM",
                    "11:30 AM",
                    "12:00 PM",
                    "12:30 PM",
                    "02:00 PM",
                    "02:30 PM",
                    "03:00 PM",
                    "03:30 PM",
                    "04:00 PM",
                    "05:00 PM",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-bold text-sm rounded-xl transition-colors"
              >
                Book Appointment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Request Time Off Modal ── */}
      {showTimeOffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-md p-6 mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Request Time Off</h3>
              <button
                onClick={() => setShowTimeOffModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={toForm.handleSubmit(onTimeOffSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Doctor</label>
                <select
                  {...toForm.register("doctorId")}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  <option value="">Select doctor</option>
                  {DOCTORS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Start Date</label>
                  <input
                    type="date"
                    {...toForm.register("startDate")}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">End Date</label>
                  <input
                    type="date"
                    {...toForm.register("endDate")}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Reason</label>
                <input
                  {...toForm.register("reason")}
                  placeholder="e.g. Annual leave, Personal"
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-[#070b13] font-bold text-sm rounded-xl transition-colors"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Schedule Modal ── */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070b13]/80 backdrop-blur-sm">
          <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl w-full max-w-md p-6 mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Doctor Schedule</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={schForm.handleSubmit(onScheduleSubmit)} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Doctor</label>
                <select
                  {...schForm.register("doctorId")}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  <option value="">Select doctor</option>
                  {DOCTORS.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Day of Week</label>
                <select
                  {...schForm.register("dayOfWeek")}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                >
                  <option value="">Select day</option>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Sat"].map((d) => (
                    <option key={d} value={d.toLowerCase()}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Shift Type</label>
                  <select
                    {...schForm.register("shiftType")}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                  >
                    <option value="">Select shift</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="full_day">Full Day</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Room</label>
                  <input
                    {...schForm.register("room")}
                    placeholder="e.g. 201"
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Start Time</label>
                  <input
                    type="time"
                    {...schForm.register("startTime")}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">End Time</label>
                  <input
                    type="time"
                    {...schForm.register("endTime")}
                    className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Max Patients</label>
                <input
                  type="number"
                  {...schForm.register("maxPatients")}
                  defaultValue={20}
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-[#070b13] font-bold text-sm rounded-xl transition-colors"
              >
                Create Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
