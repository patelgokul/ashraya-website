import type { Metadata } from "next";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="font-display text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
      <p className="text-gray-400 text-sm mb-8">Last updated: October 2026</p>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-600">
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
          <p>By accessing or using the website of {SITE.name}, you agree to be bound by these terms and conditions.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">2. Use of Website</h2>
          <p>This website is provided for informational purposes and to facilitate donations and volunteer registrations. You agree not to misuse the website or its content.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">3. Donations</h2>
          <p>All donations are voluntary and non-refundable except as described in our Cancellation &amp; Refund Policy.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">4. Intellectual Property</h2>
          <p>All content on this website, including text, images, logos, and graphics, is the property of {SITE.name} and protected by applicable intellectual property laws.</p>
        </section>
        <section>
          <h2 className="font-display text-xl font-bold text-gray-900">5. Contact</h2>
          <p>For queries regarding these terms, contact {SITE.contact.email} or {SITE.contact.phoneDisplay}.</p>
        </section>
      </div>
    </div>
  );
}
