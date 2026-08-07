import type { Metadata } from "next";
import "./globals.css";
import { FacultyProvider } from "@/lib/context/FacultyContext";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "PlacePrep - Faculty Portal",
  description: "NST PlacePrep Faculty Portal — Curriculum intelligence and session management.",
};

const AUTH_PORTAL_URL =
  process.env.NEXT_PUBLIC_AUTH_PORTAL_URL || "https://place-prep-sourabh-mocha.vercel.app";
const IS_SATELLITE = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900 h-full" suppressHydrationWarning>
        <ClerkProvider
          isSatellite={IS_SATELLITE}
          signInUrl={IS_SATELLITE ? `${AUTH_PORTAL_URL}/login` : undefined}
          afterSignOutUrl={IS_SATELLITE ? `${AUTH_PORTAL_URL}/login` : "/login"}
        >
          <FacultyProvider>
            {children}
          </FacultyProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
