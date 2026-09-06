import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SWRProvider } from "@/lib/swr-provider";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://nst-prep-portal-by-pranay-student-p.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PlacePrep — NST Interview Intelligence Portal",
    template: "%s · PlacePrep",
  },
  description:
    "India's first structured, data-driven interview preparation portal built exclusively for NST students. Company-specific roadmaps, real interview questions and progress analytics.",
  keywords: [
    "placement preparation", "interview questions", "NST placement",
    "company roadmap", "DSA practice", "campus placements", "PlacePrep",
  ],
  applicationName: "PlacePrep",
  authors: [{ name: "NST PlacePrep" }],
  creator: "NST",
  // Public surface is indexable; authed app routes are blocked via robots.ts
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "PlacePrep",
    locale: "en_IN",
    url: SITE_URL,
    title: "PlacePrep — Crack your placement, the structured way.",
    description:
      "Company-specific prep roadmaps, real interview questions tagged by round, XP-driven practice and progress analytics — exclusively for NST students.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PlacePrep — NST Interview Intelligence Portal",
    description:
      "Company-specific roadmaps · real interview questions · progress analytics. Built exclusively for NST students.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon",
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // allow pinch-zoom for accessibility; blocks un-zoomable-viewport warnings
  themeColor: "#1d4ed8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
        <SWRProvider>{children}</SWRProvider>
      </body>
    </html>
  );
}
