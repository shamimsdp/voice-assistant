"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, Save, Eye, Loader2, AlertCircle, ExternalLink, Check } from "lucide-react";
import { useClinicWebsite, useUpdateWebsite } from "@/lib/api-hooks";

const weekdays = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday"];

export default function WebsiteBuilderPage() {
  const { data: site, isLoading, error } = useClinicWebsite();
  const updateWebsite = useUpdateWebsite();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    custom_domain: "",
    theme_color: "#10b981",
    hero_title: "",
    hero_title_bn: "",
    hero_subtitle: "",
    hero_subtitle_bn: "",
    about_text: "",
    about_text_bn: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    address_bn: "",
    services_heading: "",
    services_heading_bn: "",
    doctors_heading: "",
    doctors_heading_bn: "",
    show_doctors: true,
    show_services: true,
    show_appointment_button: true,
    footer_text: "",
    footer_text_bn: "",
    is_published: false,
    working_hours: {} as Record<string, { open: string; close: string }>,
  });

  useEffect(() => {
    if (site) {
      setForm({
        custom_domain: site.custom_domain ?? "",
        theme_color: site.theme_color,
        hero_title: site.hero_title ?? "",
        hero_title_bn: site.hero_title_bn ?? "",
        hero_subtitle: site.hero_subtitle ?? "",
        hero_subtitle_bn: site.hero_subtitle_bn ?? "",
        about_text: site.about_text ?? "",
        about_text_bn: site.about_text_bn ?? "",
        contact_phone: site.contact_phone ?? "",
        contact_email: site.contact_email ?? "",
        address: site.address ?? "",
        address_bn: site.address_bn ?? "",
        services_heading: site.services_heading ?? "",
        services_heading_bn: site.services_heading_bn ?? "",
        doctors_heading: site.doctors_heading ?? "",
        doctors_heading_bn: site.doctors_heading_bn ?? "",
        show_doctors: site.show_doctors,
        show_services: site.show_services,
        show_appointment_button: site.show_appointment_button,
        footer_text: site.footer_text ?? "",
        footer_text_bn: site.footer_text_bn ?? "",
        is_published: site.is_published,
        working_hours: (site.working_hours as Record<string, { open: string; close: string }>) ?? {},
      });
    }
  }, [site]);

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    try {
      await updateWebsite.mutateAsync({
        ...form,
        custom_domain: form.custom_domain || null,
        hero_title: form.hero_title || null,
        hero_title_bn: form.hero_title_bn || null,
        hero_subtitle: form.hero_subtitle || null,
        hero_subtitle_bn: form.hero_subtitle_bn || null,
        about_text: form.about_text || null,
        about_text_bn: form.about_text_bn || null,
        contact_phone: form.contact_phone || null,
        contact_email: form.contact_email || null,
        address: form.address || null,
        address_bn: form.address_bn || null,
        services_heading: form.services_heading || null,
        services_heading_bn: form.services_heading_bn || null,
        doctors_heading: form.doctors_heading || null,
        doctors_heading_bn: form.doctors_heading_bn || null,
        footer_text: form.footer_text || null,
        footer_text_bn: form.footer_text_bn || null,
        working_hours: Object.keys(form.working_hours).length > 0 ? form.working_hours : null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // error handled by mutation
    }
  };

  const updateHour = (day: string, field: "open" | "close", value: string) => {
    const hours = { ...form.working_hours };
    if (!hours[day]) hours[day] = { open: "09:00", close: "17:00" };
    hours[day] = { ...hours[day], [field]: value };
    set("working_hours", hours);
  };

  const toggleDay = (day: string) => {
    const hours = { ...form.working_hours };
    if (hours[day]) {
      delete hours[day];
    } else {
      hours[day] = { open: "09:00", close: "17:00" };
    }
    set("working_hours", hours);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
        <p className="text-sm text-slate-400">Failed to load website config</p>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto flex flex-col gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Globe className="w-6 h-6 text-emerald-400" />
            Website Builder
          </h1>
          <p className="text-sm text-slate-400 mt-1">Customize your clinic&apos;s public website</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Check className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
          <button
            onClick={() => window.open(`/clinic/${site?.clinic_id}`, "_blank")}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 transition-colors border border-slate-700/60"
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={handleSave}
            disabled={updateWebsite.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 text-[#070b13] hover:bg-emerald-400 transition-all disabled:opacity-50"
          >
            {updateWebsite.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <Section title="Hero Section" subtitle="The main banner area of your clinic website">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input label="Hero Title (EN)" value={form.hero_title} onChange={(v) => set("hero_title", v)} placeholder="Welcome to Our Clinic" />
          <Input label="Hero Title (BN)" value={form.hero_title_bn} onChange={(v) => set("hero_title_bn", v)} placeholder="আমাদের ক্লিনিকে স্বাগতম" />
          <Textarea label="Hero Subtitle (EN)" value={form.hero_subtitle} onChange={(v) => set("hero_subtitle", v)} placeholder="Providing quality healthcare..." className="lg:col-span-2" />
          <Textarea label="Hero Subtitle (BN)" value={form.hero_subtitle_bn} onChange={(v) => set("hero_subtitle_bn", v)} placeholder="মানসম্পন্ন স্বাস্থ্যসেবা প্রদান..." className="lg:col-span-2" />
        </div>
      </Section>

      {/* About Section */}
      <Section title="About Section" subtitle="Information about your clinic">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Textarea label="About Text (EN)" value={form.about_text} onChange={(v) => set("about_text", v)} placeholder="Tell patients about your clinic..." className="lg:col-span-2" />
          <Textarea label="About Text (BN)" value={form.about_text_bn} onChange={(v) => set("about_text_bn", v)} placeholder="আপনার ক্লিনিক সম্পর্কে বলুন..." className="lg:col-span-2" />
        </div>
      </Section>

      {/* Contact Section */}
      <Section title="Contact Information" subtitle="How patients can reach you">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input label="Phone" value={form.contact_phone} onChange={(v) => set("contact_phone", v)} placeholder="+880 1XXX-XXXXXX" />
          <Input label="Email" value={form.contact_email} onChange={(v) => set("contact_email", v)} placeholder="clinic@example.com" />
          <Input label="Address (EN)" value={form.address} onChange={(v) => set("address", v)} placeholder="12/A, Gulshan Avenue, Dhaka" className="lg:col-span-2" />
          <Input label="Address (BN)" value={form.address_bn} onChange={(v) => set("address_bn", v)} placeholder="১২/এ, গুলশান এভিনিউ, ঢাকা" className="lg:col-span-2" />
          <Input label="Custom Domain" value={form.custom_domain} onChange={(v) => set("custom_domain", v)} placeholder="clinic.example.com" />
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Theme Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.theme_color}
                onChange={(e) => set("theme_color", e.target.value)}
                className="w-10 h-10 rounded-xl border border-slate-800 bg-[#070b13] cursor-pointer"
              />
              <span className="text-xs text-slate-500 font-mono">{form.theme_color}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Working Hours */}
      <Section title="Working Hours" subtitle="Set your clinic's weekly schedule">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {weekdays.map((day) => (
            <div
              key={day}
              className={`bg-[#080d1a] border rounded-xl p-3 transition-all ${form.working_hours[day] ? "border-slate-700/60" : "border-slate-800/40 opacity-50"}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 capitalize">{day}</span>
                <button
                  onClick={() => toggleDay(day)}
                  className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${form.working_hours[day] ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800/60 text-slate-500"}`}
                >
                  {form.working_hours[day] ? "Open" : "Closed"}
                </button>
              </div>
              {form.working_hours[day] && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={form.working_hours[day].open}
                    onChange={(e) => updateHour(day, "open", e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-xs text-slate-500">to</span>
                  <input
                    type="time"
                    value={form.working_hours[day].close}
                    onChange={(e) => updateHour(day, "close", e.target.value)}
                    className="flex-1 px-2 py-1 rounded-lg bg-[#070b13] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Section Headings */}
      <Section title="Section Headings" subtitle="Customize section titles on your website">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Input label="Services Heading (EN)" value={form.services_heading} onChange={(v) => set("services_heading", v)} placeholder="Our Services" />
          <Input label="Services Heading (BN)" value={form.services_heading_bn} onChange={(v) => set("services_heading_bn", v)} placeholder="আমাদের সেবা" />
          <Input label="Doctors Heading (EN)" value={form.doctors_heading} onChange={(v) => set("doctors_heading", v)} placeholder="Meet Our Doctors" />
          <Input label="Doctors Heading (BN)" value={form.doctors_heading_bn} onChange={(v) => set("doctors_heading_bn", v)} placeholder="আমাদের ডাক্তার" />
          <Textarea label="Footer Text (EN)" value={form.footer_text} onChange={(v) => set("footer_text", v)} placeholder="© 2026 Clinic Name. All rights reserved." />
          <Textarea label="Footer Text (BN)" value={form.footer_text_bn} onChange={(v) => set("footer_text_bn", v)} placeholder="© ২০২৬ ক্লিনিকের নাম। সর্বস্বত্ব সংরক্ষিত।" />
        </div>
      </Section>

      {/* Visibility Toggles */}
      <Section title="Visibility" subtitle="Control which sections appear">
        <div className="flex flex-wrap gap-4">
          <Toggle label="Show Doctors Section" checked={form.show_doctors} onChange={(v) => set("show_doctors", v)} />
          <Toggle label="Show Services Section" checked={form.show_services} onChange={(v) => set("show_services", v)} />
          <Toggle label="Show Book Appointment Button" checked={form.show_appointment_button} onChange={(v) => set("show_appointment_button", v)} />
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-xs text-slate-400">Published</span>
            <button
              onClick={() => set("is_published", !form.is_published)}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.is_published ? "bg-emerald-500" : "bg-slate-700"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.is_published ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>
      </Section>
    </motion.div>
  );
}

// ─── Reusable Sub-Components ──────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0a1120] border border-slate-800/60 rounded-2xl p-6">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, className = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#070b13] border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors resize-y"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-700 bg-[#070b13] text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0"
      />
      <span className="text-xs text-slate-300 font-medium">{label}</span>
    </label>
  );
}
