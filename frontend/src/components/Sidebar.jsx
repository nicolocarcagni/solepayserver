import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, FileText, Settings, Zap } from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/invoices", icon: FileText, label: "Invoices" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            <span className="text-lg font-bold text-white tracking-tight">
              SOLEPay
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Admin Dashboard</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <p className="text-[11px] text-slate-600">SOLEPay Server © 2026</p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950">
        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
