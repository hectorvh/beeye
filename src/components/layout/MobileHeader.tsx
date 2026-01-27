import { Bell, Menu, Wifi, WifiOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  Map,
  AlertTriangle,
  Flame,
  Radio,
  Network,
  Plane,
  FileText,
  Settings,
  BarChart3,
  User,
  LogOut,
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
  { name: "Admin", href: "/app/admin", icon: Settings },
];

export function MobileHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline] = useState(true);
  const location = useLocation();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center">
          <img src="/logo4.png" alt="BeEye Logo" className="h-8 w-8" />
        </div>
        <span className="text-base font-bold tracking-tight">BeEye</span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Connection status */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-1">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-success" />
          ) : (
            <WifiOff className="h-4 w-4 text-critical" />
          )}
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[10px] font-bold text-critical-foreground">
                5
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-critical" />
                <span className="font-medium text-sm">New Critical Alert</span>
              </div>
              <span className="text-xs text-muted-foreground">
                High confidence fire detected in Zone A-7
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Menu */}
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center">
                  <img src="/logo4.png" alt="BeEye Logo" className="h-9 w-9" />
                </div>
                <div className="flex flex-col text-left">
                  <SheetTitle>BeEye</SheetTitle>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
                    Wildfire Protection
                  </span>
                </div>
              </div>
            </SheetHeader>
            
            {/* Status */}
            <div className="mx-4 mt-4 rounded-lg bg-surface-2 p-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
                </span>
                <span className="text-xs font-medium text-success">System Operational</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || 
                  (item.href !== "/app/map" && location.pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-surface-2"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                    {item.name === "Alerts" && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-critical text-[10px] font-bold text-critical-foreground">
                        3
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-border p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-sm font-semibold">
                  IC
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Incident Commander</span>
                  <span className="text-xs text-muted-foreground">Operator Access</span>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
