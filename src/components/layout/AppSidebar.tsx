import { Link, useLocation } from "react-router-dom";
import {
  Map,
  AlertTriangle,
  Flame,
  Radio,
  Network,
  Plane,
  FileText,
  Settings,
  Activity,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Live Map", href: "/app/map", icon: Map },
  { name: "Alerts", href: "/app/alerts", icon: AlertTriangle },
  { name: "Incidents", href: "/app/incidents", icon: Flame },
  { name: "Predictions", href: "/app/predictions", icon: BarChart3 },
  { name: "Sensors", href: "/app/sensors", icon: Radio },
  { name: "Networks", href: "/app/networks", icon: Network },
  { name: "Flights", href: "/app/flights", icon: Plane },
  { name: "Reports", href: "/app/reports", icon: FileText },
];

const adminNav = [
  { name: "Admin", href: "/app/admin", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center">
          <img src="/logo3.png" alt="BeEye Logo" className="h-9 w-9" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground tracking-tight">BeEye</span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Wildfire Protection
          </span>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mx-4 mt-4 rounded-lg bg-surface-2 p-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
          </span>
          <span className="text-xs font-medium text-success">System Operational</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Active Alerts: 3</span>
          <span>Incidents: 2</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Operations
        </div>
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/app/map" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.name}
              {item.name === "Alerts" && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-critical text-[10px] font-bold text-critical-foreground">
                  3
                </span>
              )}
            </Link>
          );
        })}

        <div className="my-4 border-t border-sidebar-border" />

        <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Administration
        </div>
        {adminNav.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold text-foreground">
            IC
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">Incident Commander</span>
            <span className="text-xs text-muted-foreground">Operator Access</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
