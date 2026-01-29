import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Filter,
  Search,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Flame,
  Link2,
  FileDown,
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
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(filename: string, data: unknown[]) {
  if (data.length === 0) {
    window.alert("No data to export");
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"'))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? "";
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AlertsPage() {
  const {
    alerts,
    incidents,
    acknowledgeAlert,
    dismissAlert,
    resolveAlert,
    createIncidentFromAlert,
    linkAlertToIncident,
  } = useDemoStore();

  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      if (selectedSeverity !== "all" && alert.severity !== selectedSeverity)
        return false;
      if (selectedStatus !== "all" && alert.status !== selectedStatus)
        return false;

      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;

      const haystack = [
        alert.id,
        alert.topDrivers?.join(" "),
        alert.sources?.join(" "),
        alert.recommendedAction,
        alert.incidentId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [alerts, searchQuery, selectedSeverity, selectedStatus]);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const newCount = alerts.filter((a) => a.status === "new").length;
  const verifyingCount = alerts.filter((a) => a.status === "verifying").length;

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const onCreateIncident = (alertId: string) => {
    const id = createIncidentFromAlert(alertId);
    if (id) window.alert(`Created incident ${id}`);
  };

  const onLinkToIncident = (alertId: string) => {
    if (incidents.length === 0) {
      window.alert("No incidents available to link.");
      return;
    }
    const pick = window.prompt(
      `Enter incident id to link (e.g. ${incidents[0].id})`,
      incidents[0].id
    );
    if (!pick) return;
    linkAlertToIncident(alertId, pick);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Alerts
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Monitor and respond to fire detection alerts
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <FileDown className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => downloadJson("alerts-export.json", { alerts })}
                >
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => downloadCsv("alerts-export.csv", alerts)}
                >
                  Export Alerts (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
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
            value={alerts.filter((a) => a.status === "resolved").length}
            subtitle="Based on demo actions"
            variant="success"
          />
        </div>
      </div>

      {/* Filters */}
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

        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex"
          onClick={() => window.alert("Demo: advanced filters placeholder")}
        >
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
                alert.severity === "high" && "border-warning/30"
              )}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Severity indicator */}
                <div
                  className={cn(
                    "flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-lg shrink-0",
                    alert.severity === "critical" && "bg-critical/20",
                    alert.severity === "high" && "bg-warning/20",
                    alert.severity === "medium" && "bg-warning/10",
                    alert.severity === "low" && "bg-muted"
                  )}
                >
                  <AlertTriangle
                    className={cn(
                      "h-5 w-5 md:h-6 md:w-6",
                      alert.severity === "critical" && "text-critical",
                      alert.severity === "high" && "text-warning",
                      alert.severity === "medium" && "text-warning/70",
                      alert.severity === "low" && "text-muted-foreground"
                    )}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge
                      variant={
                        alert.severity === "critical"
                          ? "critical"
                          : alert.severity === "high"
                          ? "warning"
                          : "neutral"
                      }
                      pulse={
                        alert.status === "new" && alert.severity === "critical"
                      }
                    >
                      {alert.severity.toUpperCase()}
                    </StatusBadge>
                    <StatusBadge variant="info" dot={false}>
                      {alert.status.replace("_", " ").toUpperCase()}
                    </StatusBadge>
                    {alert.incidentId ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-mono"
                      >
                        {alert.incidentId.toUpperCase()}
                      </Badge>
                    ) : null}
                    <span className="text-[10px] md:text-xs text-muted-foreground font-mono hidden sm:inline">
                      {alert.id.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs md:text-sm font-medium mb-2 line-clamp-2">
                    {alert.topDrivers?.[0] || "No drivers"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="hidden sm:inline">
                        {alert.location.coordinates[1].toFixed(4)},{" "}
                      </span>
                      <span className="sm:hidden">
                        {alert.location.coordinates[1].toFixed(2)},{" "}
                      </span>
                      {alert.location.coordinates[0].toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(alert.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <strong className="text-foreground">
                        {alert.confidence}%
                      </strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2 md:mt-3">
                    {(alert.sources || []).slice(0, 2).map((source) => (
                      <Badge
                        key={source}
                        variant="outline"
                        className="text-[10px] capitalize"
                      >
                        {source.replace("_", " ")}
                      </Badge>
                    ))}
                    {(alert.sources || []).length > 2 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{(alert.sources || []).length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                  {alert.status === "new" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Acknowledge</span>
                      <span className="sm:hidden">Ack</span>
                    </Button>
                  )}

                  {alert.status === "acknowledged" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resolve
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          window.alert("Demo: map view placeholder")
                        }
                      >
                        View on Map
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => downloadJson(`${alert.id}.json`, alert)}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export Details
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {!alert.incidentId ? (
                        <>
                          <DropdownMenuItem
                            onClick={() => onCreateIncident(alert.id)}
                          >
                            <Flame className="h-4 w-4 mr-2" />
                            Create Incident
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onLinkToIncident(alert.id)}
                          >
                            <Link2 className="h-4 w-4 mr-2" />
                            Link to Incident
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem
                          onClick={() =>
                            window.alert(`Linked to ${alert.incidentId}`)
                          }
                        >
                          View Linked Incident
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        className="text-critical"
                        onClick={() => {
                          const reason =
                            window.prompt("Dismiss reason (optional)") ||
                            undefined;
                          dismissAlert(alert.id, reason);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Dismiss
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}

          {filteredAlerts.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              No alerts match your filters.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
