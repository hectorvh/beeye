import { useState } from "react";
import { 
  AlertTriangle, 
  Filter, 
  Search, 
  ChevronDown,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockAlerts } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function AlertsPage() {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = mockAlerts.filter((alert) => {
    if (selectedSeverity !== "all" && alert.severity !== selectedSeverity) return false;
    if (selectedStatus !== "all" && alert.status !== selectedStatus) return false;
    return true;
  });

  const criticalCount = mockAlerts.filter(a => a.severity === "critical").length;
  const newCount = mockAlerts.filter(a => a.status === "new").length;
  const verifyingCount = mockAlerts.filter(a => a.status === "verifying").length;

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Alerts</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Monitor and respond to fire detection alerts
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Export Alerts
          </Button>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Critical Alerts"
            value={criticalCount}
            icon={AlertTriangle}
            variant="critical"
          />
          <StatCard
            title="New Alerts"
            value={newCount}
            subtitle="Awaiting acknowledgment"
            variant="warning"
          />
          <StatCard
            title="Under Verification"
            value={verifyingCount}
            subtitle="Being investigated"
          />
          <StatCard
            title="Resolved Today"
            value={3}
            subtitle="2 confirmed, 1 dismissed"
            variant="success"
          />
        </div>
      </div>

      {/* Filters - scrollable on mobile */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-surface-1"
          />
        </div>
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="acknowledged">Acknowledged</SelectItem>
            <SelectItem value="verifying">Verifying</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="hidden md:flex">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Alert List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border bg-card p-3 md:p-4 transition-all hover:bg-card/80 cursor-pointer active:scale-[0.99]",
                alert.severity === "critical" && "border-critical/30",
                alert.severity === "high" && "border-warning/30",
              )}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Severity indicator */}
                <div className={cn(
                  "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg shrink-0",
                  alert.severity === "critical" && "bg-critical/20",
                  alert.severity === "high" && "bg-warning/20",
                  alert.severity === "medium" && "bg-warning/10",
                  alert.severity === "low" && "bg-muted",
                )}>
                  <AlertTriangle className={cn(
                    "h-5 w-5 md:h-6 md:w-6",
                    alert.severity === "critical" && "text-critical",
                    alert.severity === "high" && "text-warning",
                    alert.severity === "medium" && "text-warning/70",
                    alert.severity === "low" && "text-muted-foreground",
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge
                      variant={
                        alert.severity === "critical" ? "critical" :
                        alert.severity === "high" ? "warning" :
                        "neutral"
                      }
                      pulse={alert.status === "new" && alert.severity === "critical"}
                    >
                      {alert.severity.toUpperCase()}
                    </StatusBadge>
                    <StatusBadge variant="info" dot={false}>
                      {alert.status.replace("_", " ").toUpperCase()}
                    </StatusBadge>
                    <span className="text-[10px] md:text-xs text-muted-foreground font-mono hidden sm:inline">
                      {alert.id.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-xs md:text-sm font-medium mb-2 line-clamp-2">{alert.topDrivers[0]}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="hidden sm:inline">{alert.location.coordinates[1].toFixed(4)}, </span>
                      <span className="sm:hidden">{alert.location.coordinates[1].toFixed(2)}, </span>
                      {alert.location.coordinates[0].toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(alert.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <strong className="text-foreground">{alert.confidence}%</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2 md:mt-3">
                    {alert.sources.slice(0, 2).map((source) => (
                      <Badge key={source} variant="outline" className="text-[10px] capitalize">
                        {source.replace("_", " ")}
                      </Badge>
                    ))}
                    {alert.sources.length > 2 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{alert.sources.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions - simplified for mobile */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  {alert.status === "new" && (
                    <Button size="sm" variant="outline" className="h-8 text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Acknowledge</span>
                      <span className="sm:hidden">Ack</span>
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View on Map</DropdownMenuItem>
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>Create Incident</DropdownMenuItem>
                      <DropdownMenuItem>Link to Incident</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-critical">
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
