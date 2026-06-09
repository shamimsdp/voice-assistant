"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Calendar, Phone, Mail, MapPin, Clock, Stethoscope, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

interface PublicWebsiteData {
  clinic_name?: string;
  clinic_name_bn?: string;
  theme_color: string;
  hero_title: string | null;
  hero_title_bn: string | null;
  hero_subtitle: string | null;
  hero_subtitle_bn: string | null;
  about_text: string | null;
  about_text_bn: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  address_bn: string | null;
  working_hours: Record<string, { open: string; close: string }> | null;
  services_heading: string | null;
  services_heading_bn: string | null;
  doctors_heading: string | null;
  doctors_heading_bn: string | null;
  show_doctors: boolean;
  show_services: boolean;
  show_appointment_button: boolean;
  footer_text: string | null;
  footer_text_bn: string | null;
  doctors?: Array<{ id: string; name: string; name_bn: string | null; specialty: string | null; qualification: string | null; consultation_fee: number }>;
  services?: Array<{ id: string; name: string; name_bn: string | null; description: string | null; category: string; price: number | null; duration_min: number | null }>;
}

export default function ClinicPublicPage() {
  const params = useParams();
  const clinicId = params.clinic_id as string;

  const [data, setData] = useState<PublicWebsiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clinicId) return;
    api.get(`/api/website/public/${clinicId}`)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [clinicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#10b981" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-6">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-800 mb-2">Page Not Found</h1>
        <p className="text-sm text-gray-500">This clinic website is not available or has not been published yet.</p>
      </div>
    );
  }

  const accent = data.theme_color || "#10b981";
  const hoursEntries = data.working_hours ? Object.entries(data.working_hours) : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ backgroundColor: `${accent}08` }}>
        <div className="max-w-5xl mx-auto px-6 py-20 md:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {data.hero_title || data.clinic_name || "Our Clinic"}
            </h1>
            {data.hero_title_bn && (
              <p className="text-lg text-gray-600 mb-4">{data.hero_title_bn}</p>
            )}
            {(data.hero_subtitle || data.hero_subtitle_bn) && (
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                {data.hero_subtitle || data.hero_subtitle_bn}
              </p>
            )}
            {data.show_appointment_button && (
              <Link
                href={`/login?clinic=${clinicId}`}
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg hover:opacity-90 transition-all"
                style={{ backgroundColor: accent }}
              >
                <Calendar className="w-4 h-4" />
                Book an Appointment
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      {/* About */}
      {(data.about_text || data.about_text_bn) && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">About Us</h2>
            {data.about_text && <p className="text-gray-600 leading-relaxed">{data.about_text}</p>}
            {data.about_text_bn && <p className="text-gray-500 leading-relaxed mt-3">{data.about_text_bn}</p>}
          </motion.div>
        </section>
      )}

      {/* Contact */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.contact_phone && (
              <div className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                  <Phone className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Phone</p>
                  <p className="text-sm font-semibold text-gray-800">{data.contact_phone}</p>
                </div>
              </div>
            )}
            {data.contact_email && (
              <div className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                  <Mail className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Email</p>
                  <p className="text-sm font-semibold text-gray-800">{data.contact_email}</p>
                </div>
              </div>
            )}
            {(data.address || data.address_bn) && (
              <div className="flex items-center gap-3 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                  <MapPin className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Address</p>
                  <p className="text-sm font-semibold text-gray-800">{data.address || data.address_bn}</p>
                </div>
              </div>
            )}
          </div>

          {hoursEntries.length > 0 && (
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4" style={{ color: accent }} />
                <h3 className="text-sm font-bold text-gray-800">Working Hours</h3>
              </div>
              <div className="flex flex-col gap-2">
                {hoursEntries.map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize font-medium">{day}</span>
                    <span className="text-gray-800">{hours.open} - {hours.close}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Services */}
      {data.show_services && data.services && data.services.length > 0 && (
        <section className="max-w-4xl mx-auto px-6 py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
              {data.services_heading || "Our Services"}
            </h2>
            {data.services_heading_bn && <p className="text-center text-gray-500 mb-6">{data.services_heading_bn}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.services.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: `${accent}15` }}>
                    <Stethoscope className="w-4 h-4" style={{ color: accent }} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-800">{s.name_bn || s.name}</h3>
                  {s.description && <p className="text-xs text-gray-500 mt-1">{s.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    {s.price != null && <span className="text-sm font-bold" style={{ color: accent }}>৳{s.price}</span>}
                    {s.duration_min && <span className="text-[10px] text-gray-400">{s.duration_min} min</span>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Doctors */}
      {data.show_doctors && data.doctors && data.doctors.length > 0 && (
        <section className="bg-gray-50 border-y border-gray-200">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
                {data.doctors_heading || "Meet Our Doctors"}
              </h2>
              {data.doctors_heading_bn && <p className="text-center text-gray-500 mb-6">{data.doctors_heading_bn}</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.doctors.map((d) => (
                  <div key={d.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                    <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                      <Stethoscope className="w-7 h-7" style={{ color: accent }} />
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">{d.name_bn || d.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{d.specialty}</p>
                    {d.qualification && <p className="text-[10px] text-gray-400 mt-1">{d.qualification}</p>}
                    <p className="text-sm font-bold mt-2" style={{ color: accent }}>৳{d.consultation_fee}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-10 text-center" style={{ backgroundColor: `${accent}05` }}>
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-sm text-gray-600">{data.footer_text || data.footer_text_bn || `© ${new Date().getFullYear()} ${data.clinic_name || "Clinic"}. All rights reserved.`}</p>
        </div>
      </footer>
    </div>
  );
}
