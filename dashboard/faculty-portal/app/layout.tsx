import type { Metadata } from "next";
import "./globals.css";
import { FacultyProvider } from "@/lib/context/FacultyContext";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "PlacePrep - Faculty Portal",
  description: "NST PlacePrep Faculty Portal — Curriculum intelligence and session management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 h-full" suppressHydrationWarning>
        <ClerkProvider afterSignOutUrl="/login">
          <FacultyProvider>
            {children}
          </FacultyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
