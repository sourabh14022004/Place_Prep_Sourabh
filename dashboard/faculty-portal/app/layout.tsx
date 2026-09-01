import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { FacultyProvider } from "@/lib/context/FacultyContext";

export const metadata: Metadata = {
  title: {
    default: "PlacePrep — Faculty Portal",
    template: "%s · PlacePrep Faculty",
  },
  description:
    "NST PlacePrep Faculty Portal — mentor students through doubts, sessions and curriculum intelligence.",
  applicationName: "PlacePrep Faculty",
  // Internal authed app — never index
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
  themeColor: "#312e81",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 h-full" suppressHydrationWarning>
        <FacultyProvider>
          <Toaster position="top-right" richColors closeButton />
          {children}
        </FacultyProvider>
      </body>
    </html>
  );
}
