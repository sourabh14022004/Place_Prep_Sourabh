import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PlacePrep — Admin Console",
    template: "%s · PlacePrep Admin",
  },
  description:
    "NST PlacePrep Admin Console — manage students, faculty, questions, companies and portal feature controls.",
  applicationName: "PlacePrep Admin",
  // CRITICAL: admin surface must NEVER be indexed
  robots: { index: false, follow: false, nocache: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900" suppressHydrationWarning>
        <Toaster position="top-right" richColors closeButton />
        {children}
      </body>
    </html>
  );
}
