import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "PlacePrep — NST Interview Intelligence Portal",
  description: "India's first structured, data-driven interview preparation portal built for NST students.",
};

const AUTH_PORTAL_URL =
  process.env.NEXT_PUBLIC_AUTH_PORTAL_URL || "https://place-prep-sourabh-mocha.vercel.app";
const IS_SATELLITE = process.env.NEXT_PUBLIC_CLERK_IS_SATELLITE === "true";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ClerkProvider
          isSatellite={IS_SATELLITE}
          signInUrl={IS_SATELLITE ? `${AUTH_PORTAL_URL}/login` : undefined}
          afterSignOutUrl={IS_SATELLITE ? `${AUTH_PORTAL_URL}/login` : "/login"}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

