"use client";
import Image from "next/image";
import Link          from "next/link";
import { useState }  from "react";
import {
  Phone, Mail,
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  CheckCircle, MapPin,
} from "lucide-react";
import { SITE } from "@/lib/site";

const QUICK_LINKS = [
  { label: "About Us",          href: "/about" },
  { label: "Our Team",          href: "/team" },
  { label: "ASHRAYA Verticals", href: "/verticals" },
  { label: "Our Projects",      href: "/projects" },
  { label: "Vision & Mission",  href: "/vision-mission" },
  { label: "Impact",            href: "/impact" },
  { label: "Gallery",           href: "/gallery" },
];

const GET_INVOLVED = [
  { label: "Donate",             href: "/donate" },
  { label: "Become a Volunteer", href: "/volunteer" },
  { label: "Partner with Us",    href: "/contact" },
  { label: "Contact Us",         href: "/contact" },
];

const SOCIAL_LINKS = [
  { icon: Facebook,  href: SITE.social.facebook,  label: "Facebook" },
  { icon: Twitter,   href: SITE.social.twitter,   label: "X (Twitter)" },
  { icon: Instagram, href: SITE.social.instagram, label: "Instagram" },
  { icon: Linkedin,  href: SITE.social.linkedin,  label: "LinkedIn" },
  { icon: Youtube,   href: SITE.social.youtube,   label: "YouTube" },
];

const LEGAL = [
  { label: "Privacy Policy",              href: "/privacy-policy" },
  { label: "Terms & Conditions",          href: "/terms-and-conditions" },
  { label: "Cancellation & Refund Policy",href: "/refund-policy" },
  { label: "Shipping & Delivery Policy",  href: "/shipping-policy" },
];

function NewsletterMini() {
  const [email,      setEmail]      = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [loading,    setLoading]    = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/subscribers", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, source: "footer" }),
      });
      setSubscribed(true);
    } finally {
      setLoading(false);
    }
  }

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-blue-400 text-xs">
        <CheckCircle className="w-4 h-4" />
        Subscribed! Thank you.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email" required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 bg-gray-700 text-white text-xs px-3 py-2 rounded-lg placeholder:text-gray-500 border border-gray-600 focus:outline-none focus:border-blue-500"
      />
      <button
        type="submit" disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
      >
        {loading ? "..." : "Join"}
      </button>
    </form>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div>
            <Link href="/" className="inline-block bg-white rounded-xl px-3 py-2 mb-4">
              <Image
                src={SITE.logo}
                alt={`${SITE.name} logo`}
                width={120}
                height={64}
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed mb-4 text-gray-500">
              {SITE.name} — {SITE.motto}.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <span>{SITE.contact.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <a href={SITE.contact.phoneHref} className="hover:text-white transition-colors">{SITE.contact.phoneDisplay}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                <a href={`mailto:${SITE.contact.email}`} className="hover:text-white transition-colors text-xs">
                  {SITE.contact.email}
                </a>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-8 h-8 bg-gray-800 hover:bg-orange-500 rounded-lg flex items-center justify-center transition-colors">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white hover:pl-1 transition-all duration-200">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get Involved */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Get Involved</h4>
            <ul className="space-y-2">
              {GET_INVOLVED.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white hover:pl-1 transition-all duration-200">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal + Newsletter */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-2 mb-6">
              {LEGAL.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm hover:text-white hover:pl-1 transition-all duration-200">{l.label}</Link>
                </li>
              ))}
            </ul>
            <div className="bg-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-2">Subscribe for impact updates</p>
              <NewsletterMini />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <p>{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
