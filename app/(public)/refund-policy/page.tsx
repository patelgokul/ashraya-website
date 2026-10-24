import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Cancellation & Refund Policy" };

export default function RefundPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Cancellation & Refund Policy</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: October 2026</p>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">Refund Eligibility</h2>
          <p>Donations made to {SITE.name} are generally non-refundable as they are immediately allocated towards ongoing programs. However, we review refund requests on a case-by-case basis.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">Conditions for Refund</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Duplicate payment made due to a technical error.</li>
            <li>Payment deducted but donation not recorded (please share payment proof).</li>
            <li>Refund request submitted within 7 days of the transaction.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">How to Request a Refund</h2>
          <p>Email us at {SITE.contact.email} with your transaction ID, amount, date, and reason. We will respond within 3 business days. Approved refunds are processed within 7–10 business days.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">Contact</h2>
          <p>Phone: {SITE.contact.phoneDisplay} | Email: {SITE.contact.email}</p>
        </section>
      </div>
    </div>
  );
}
