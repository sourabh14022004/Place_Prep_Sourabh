import Navbar from "@/components/admin/layout/Navbar";
import Sidebar from "@/components/admin/layout/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="min-h-screen bg-gray-50 lg:ml-[224px] pt-14 transition-all duration-200">
        <div className="px-4 lg:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
