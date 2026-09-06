import { Compass, LayoutDashboard, GraduationCap, Users, Bell } from "lucide-react";

const sections = [
  {
    icon: Compass,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Navigation & Layout",
    description: "The portal is divided into two main areas: the Sidebar (on the left) and the Main Content Area (on the right).",
    bullets: [
      { bold: "Sidebar:", text: "Navigate between Overview, Students, Faculty, and Manage Faculty sections." },
      { bold: "Top Header:", text: "Quick access to notifications, settings, and this help guide." },
    ],
  },
  {
    icon: LayoutDashboard,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Dashboard Overview",
    description: "The Overview page provides a high-level summary of the placement platform's daily activity.",
    bullets: [
      { bold: "KPI Metrics:", text: "View quick stats like Students on Roadmap, Doubts Raised, and Sessions Booked." },
      { bold: "Live Monitor:", text: "Shows active users and server load in real-time." },
      { bold: "Charts:", text: "Visual representations of placement rates and session volume over time." },
    ],
  },
  {
    icon: GraduationCap,
    color: "text-amber-600",
    bg: "bg-amber-50",
    title: "Managing Students",
    description: "The Students section allows you to view and track individual student progress.",
    bullets: [
      { bold: "Search & Filter:", text: "Quickly locate students by name, batch, or placement status." },
      { bold: "Data Table:", text: "View progress bars for roadmap completion, doubts raised, and placement status." },
      { bold: "Detailed View:", text: "Click 'View' on any row to see in-depth information about a student." },
    ],
  },
  {
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50",
    title: "Faculty & Mentors",
    description: "Manage teaching staff and external mentors through the Faculty and Manage Faculty sections.",
    bullets: [
      { bold: "Performance Analytics:", text: "See engagement and satisfaction metrics across departments." },
      { bold: "Manage Faculty:", text: "Add new faculty, edit details, or remove from the system." },
    ],
  },
  {
    icon: Bell,
    color: "text-red-500",
    bg: "bg-red-50",
    title: "Notifications & Alerts",
    description: "Stay updated with real-time events on the platform using the Notifications system.",
    bullets: [
      { bold: "Bell Icon:", text: "Click the bell icon in the top header to view all your alerts." },
      { bold: "Unread Indicator:", text: "A red dot indicates unread notifications." },
      { bold: "Mark as Read:", text: "Click the checkmark or use 'Mark all as read' to clear your inbox." },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Portal Help Guide</h1>
        <p className="text-sm text-gray-500 max-w-2xl">
          Welcome to the PlacePrep Admin Portal! This guide will help you navigate and use all available features.
        </p>
      </div>

      {/* Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sections.map((section) => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${section.bg} flex items-center justify-center`}>
                <section.icon className={`w-5 h-5 ${section.color}`} />
              </div>
              <h2 className="text-base font-semibold text-gray-900">{section.title}</h2>
            </div>
            <p className="text-sm text-gray-500 mb-3">{section.description}</p>
            <ul className="space-y-2">
              {section.bullets.map((b) => (
                <li key={b.bold} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-gray-300 mt-1">•</span>
                  <span>
                    <strong className="text-gray-700">{b.bold}</strong> {b.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
