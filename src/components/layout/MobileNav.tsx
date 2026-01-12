import { Link, useLocation } from "react-router-dom";
import {
  Map,
  AlertTriangle,
  Flame,
  Radio,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Network,
  Plane,
  FileText,
  Settings,
  BarChart3,
  Eye,
  X,
} from "lucide-react";

const mainNav = [
  { name: "Map", href: "/app/map", icon: Map },
  { name: "Alerts", href: "/app/alerts", icon: AlertTriangle, badge: 3 },
  { name: "Incidents", href: "/app/incidents", icon: Flame },
  { name: "Sensors", href: "/app/sensors", icon: Radio },
];

const moreNav = [
  { name: "Live Map", href: "/app/map", icon: Map },
  { name: "Alerts", href: "/app/alerts", icon: AlertTriangle },
  { name: "Incidents", href: "/app/incidents", icon: Flame },
  { name: "Predictions", href: "/app/predictions", icon: BarChart3 },
  { name: "Sensors", href: "/app/sensors", icon: Radio },
  { name: "Networks", href: "/app/networks", icon: Network },
  { name: "Flights", href: "/app/flights", icon: Plane },
  { name: "Reports", href: "/app/reports", icon: FileText },
  { name: "Admin", href: "/app/admin", icon: Settings },
];

export function MobileNav() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {mainNav.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/app/map" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.badge && (
                  <span className="absolute -right-2 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[10px] font-bold text-critical-foreground">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                open ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Eye className="h-5 w-5 text-primary-foreground" />
                </div>
                <SheetTitle className="text-left">BeEye Navigation</SheetTitle>
              </div>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-3 py-4">
              {moreNav.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== "/app/map" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors",
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-1 text-foreground hover:bg-surface-2"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
