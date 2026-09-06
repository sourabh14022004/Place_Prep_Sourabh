import Navbar from "@/components/faculty/layout/Navbar";
import { Sidebar } from "@/components/faculty/layout/Sidebar";
import { ShieldOff } from "lucide-react";
import { FacultyProvider } from "@/lib/faculty/context/FacultyContext";
import { cookies } from "next/headers";

const API_URL = process.env.API_URL || "http://localhost:4000";

/**
 * Server-side master-switch enforcement:
 * when the admin turns OFF "Faculty Portal" in Feature Controls, every page
 * of this portal renders a disabled screen instead of the app shell.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Asks the API rather than opening its own Mongo connection. This layout was
  // the last place the web app talked to the database directly; going through
  // the API keeps a single connection pool in one process.
  let portalEnabled = true;
  try {
    const res = await fetch(`${API_URL}/api/faculty/features`, {
      headers: { cookie: (await cookies()).toString() },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      portalEnabled = json?.data?.["faculty.portal"] !== false;
    }
  } catch {
    // Fail-open: if flags can't be loaded (e.g. API blip), don't lock faculty out.
    portalEnabled = true;
  }

  if (!portalEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-5">
            <ShieldOff className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Faculty Portal is currently disabled</h1>
          <p className="text-sm text-gray-500 mb-6">
            An administrator has temporarily turned off the Faculty Portal. All features are
            unavailable until it is re-enabled. Please contact your placement coordinator if you
            believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FacultyProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Sidebar />
        <main className="min-h-screen bg-gray-50 lg:ml-[var(--sidebar-width)] pt-7 transition-all duration-200">
          <div className="px-4 lg:px-6 pb-6">{children}</div>
        </main>
      </div>
    </FacultyProvider>
  );
}
