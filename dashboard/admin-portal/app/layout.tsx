import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "PlacePrep - Admin Portal",
  description: "NST PlacePrep Admin Portal — Manage students, faculty, and placement operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900" suppressHydrationWarning>
        <ClerkProvider afterSignOutUrl="/login">
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
