import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SessionWrapper from "@/components/layout/SessionWrapper";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  keywords: ["Ashraya", "NGO India", "Ashraya Connect", "education NGO", "women empowerment", "anna seva"],
  robots: { index: true, follow: true },
  icons: {
    icon:  SITE.icon,
    apple: "/icons/apple-touch-icon.png",
  },
  openGraph: {
    type:     "website",
    locale:   "en_IN",
    url:      SITE.url,
    siteName: SITE.name,
    images:   [{ url: SITE.logo, alt: SITE.name }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    images:      [SITE.logo],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SessionWrapper>
          {children}
          <Toaster />
        </SessionWrapper>
      </body>
    </html>
  );
}
