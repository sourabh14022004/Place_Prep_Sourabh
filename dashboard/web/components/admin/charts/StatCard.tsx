import { LucideIcon } from "lucide-react";

export type StatColor = "blue" | "emerald" | "amber" | "red";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: StatColor;
  sub?: string;
  isLive?: boolean;
}

const colorMap: Record<StatColor, { bg: string; text: string; dot: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

export default function StatCard({ label, value, icon: Icon, color = "blue", sub, isLive }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <div className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-3.5 h-3.5 ${c.text}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value.toLocaleString()}</p>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {isLive && <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />}
          <span className="text-[10px] text-gray-400">{sub}</span>
        </div>
      )}
    </div>
  );
}
