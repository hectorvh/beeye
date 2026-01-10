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
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and respond to fire detection alerts
            </p>
          </div>
          <Button>
            <Filter className="h-4 w-4 mr-2" />
            Export Alerts
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
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

      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-border bg-card/50 px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-surface-1"
          />
        </div>
        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className="w-40 bg-surface-1">
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
          <SelectTrigger className="w-40 bg-surface-1">
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
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Alert List */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border bg-card p-4 transition-all hover:bg-card/80 cursor-pointer",
                alert.severity === "critical" && "border-critical/30",
                alert.severity === "high" && "border-warning/30",
              )}
            >
              <div className="flex items-start gap-4">
                {/* Severity indicator */}
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-lg",
                  alert.severity === "critical" && "bg-critical/20",
                  alert.severity === "high" && "bg-warning/20",
                  alert.severity === "medium" && "bg-warning/10",
                  alert.severity === "low" && "bg-muted",
                )}>
                  <AlertTriangle className={cn(
                    "h-6 w-6",
                    alert.severity === "critical" && "text-critical",
                    alert.severity === "high" && "text-warning",
                    alert.severity === "medium" && "text-warning/70",
                    alert.severity === "low" && "text-muted-foreground",
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
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
                    <span className="text-xs text-muted-foreground font-mono">
                      {alert.id.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium mb-2">{alert.topDrivers[0]}</p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {alert.location.coordinates[1].toFixed(4)}, {alert.location.coordinates[0].toFixed(4)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(alert.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      Confidence: <strong className="text-foreground">{alert.confidence}%</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {alert.sources.map((source) => (
                      <Badge key={source} variant="outline" className="text-[10px] capitalize">
                        {source.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {alert.status === "new" && (
                    <Button size="sm" variant="outline">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                  {(alert.status === "acknowledged" || alert.status === "new") && (
                    <Button size="sm">
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
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
