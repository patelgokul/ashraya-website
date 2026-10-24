"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Mail, MapPin, Clock, CheckCircle } from "lucide-react";
import { SITE } from "@/lib/site";

const contactSchema = z.object({
  name: z.string().min(2, "Name required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject required"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type FormData = z.infer<typeof contactSchema>;

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setSubmitted(true); reset(); }
  }

  const contactInfo = [
    { icon: Phone, label: "Phone", value: SITE.contact.phoneDisplay, href: SITE.contact.phoneHref },
    { icon: Mail, label: "Email", value: SITE.contact.email, href: `mailto:${SITE.contact.email}` },
    { icon: MapPin, label: "Office", value: SITE.contact.address },
    { icon: Clock, label: "Hours", value: SITE.contact.hours },
  ];

  return (
    <div>
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 py-16 px-4 text-center">
        <h1 className="font-display text-4xl font-bold text-white mb-3">Get in Touch</h1>
        <p className="text-gray-300 max-w-xl mx-auto">
          Questions, partnerships, donations, or just want to say hello — we would love to hear from you.
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Info */}
          <div className="space-y-4">
            {contactInfo.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">{label}</div>
                  {href ? (
                    <a href={href} className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors">{value}</a>
                  ) : (
                    <p className="text-sm font-medium text-gray-800">{value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Map placeholder */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl h-48 flex items-center justify-center border border-gray-100">
              <div className="text-center">
                <div className="text-4xl mb-2">🗺️</div>
                <p className="text-sm text-gray-500 font-medium">{SITE.contact.address}</p>
                <p className="text-xs text-gray-400">27 locations across 13 states and UTs</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <CheckCircle className="w-16 h-16 text-blue-500 mb-5" />
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Message Sent!</h2>
                <p className="text-gray-500">We will get back to you within 24–48 hours.</p>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-gray-900 mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                      <input {...register("name")} placeholder="Your name" className="w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none" />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                      <input {...register("email")} type="email" placeholder="your@email.com" className="w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none" />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input {...register("phone")} placeholder="Mobile number" className="w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject *</label>
                      <input {...register("subject")} placeholder="Subject" className="w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none" />
                      {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Message *</label>
                    <textarea {...register("message")} rows={5} placeholder="Write your message here..."
                      className="w-full border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
                    {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>}
                  </div>
                  <button type="submit" disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors">
                    {isSubmitting ? "Sending..." : "Send Message →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
