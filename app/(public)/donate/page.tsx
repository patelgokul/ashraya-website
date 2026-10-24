import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Landmark, Mail, Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title:       "Donate",
  description: `Support ${SITE.name} through a direct bank transfer.`,
};

const IMPACT = [
  { icon: "🍲", text: "Free meals at our community kitchens" },
  { icon: "📚", text: "Scholarships, books, and stationery for children" },
  { icon: "🐄", text: "Fodder for cows at goshalas in need" },
  { icon: "🧵", text: "Stitching and livelihood training for women" },
  { icon: "🏥", text: "Health camps and yoga sessions" },
  { icon: "👵", text: "Care for the elderly through Aashirvad Seva" },
];

export default function DonatePage() {
  const { bank, contact } = SITE;
  const bankRows = [
    { label: "Account Name",   value: bank.accountName },
    { label: "Account Number", value: bank.accountNo },
    { label: "IFSC Code",      value: bank.ifsc },
    { label: "Bank",           value: bank.bankName },
    { label: "Branch",         value: bank.branch },
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-5">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white mb-3">Make a Donation</h1>
          <p className="text-blue-100 text-lg">
            Your generosity fuels real change. Every rupee reaches the communities that need it most.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" /> Donate by Bank Transfer
              </h2>
              <p className="text-sm text-gray-500 mb-6">Use NEFT, RTGS, IMPS, or your banking app to transfer to:</p>
              <dl className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {bankRows.map((row) => (
                  <div key={row.label} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-4 py-3 bg-white">
                    <dt className="text-sm text-gray-500">{row.label}</dt>
                    <dd className="font-semibold text-gray-900 font-mono tracking-wide select-all">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 bg-orange-50 border border-orange-100 rounded-xl p-4 text-sm text-orange-900">
                After your transfer, please share your name, amount, and transaction ID at{" "}
                <a href={`mailto:${contact.email}`} className="font-semibold underline">{contact.email}</a>{" "}
                so we can thank you and keep you updated.
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">Online payments coming soon</h2>
              <p className="text-sm text-gray-500">
                UPI and card payments will be available here shortly. Until then, bank transfer is the
                fastest way to support us. For any help, reach us below.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <a href={contact.phoneHref} className="inline-flex items-center gap-2 border border-gray-200 hover:border-blue-400 rounded-xl px-4 py-2 text-sm text-gray-700">
                  <Phone className="w-4 h-4 text-blue-600" /> {contact.phoneDisplay}
                </a>
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 border border-gray-200 hover:border-blue-400 rounded-xl px-4 py-2 text-sm text-gray-700">
                  <Mail className="w-4 h-4 text-blue-600" /> {contact.email}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-display font-bold text-gray-900 mb-4">Your Donation Supports</h3>
              <div className="space-y-3">
                {IMPACT.map((item) => (
                  <div key={item.text} className="flex gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <span>{item.icon}</span>
                    <span className="text-blue-900 text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-display font-bold text-gray-900 mb-2">Prefer to give time?</h3>
              <p className="text-sm text-gray-500 mb-4">One hour a day, one day a week, a month, or a year — every bit counts.</p>
              <Link href="/volunteer" className="block text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm">
                Become a Volunteer
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
