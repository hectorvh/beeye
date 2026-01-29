// src/pages/app/ReportsPage.tsx
import { useMemo, useState, useCallback } from "react";
import {
  FileText,
  Download,
  Plus,
  Calendar,
  Clock,
  Search,
  Filter,
  BarChart3,
  MapPin,
  Users,
  X,
  ArrowRight,
  Package,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";
import type {
  Incident,
  Alert,
  UavMission,
  PredictionRun,
  AuditLog,
} from "@/types";

type ReportType = "incident" | "summary" | "evidence";
type ReportStatus = "draft" | "final";
type RangeFilter = "24h" | "7d" | "30d" | "all";

type DemoReport = {
  id: string;
  name: string;
  type: ReportType;
  status: ReportStatus;
  createdAt: string;
  createdBy: string;
  // optional links for richer demo flows
  incidentId?: string;
};

const nowISO = () => new Date().toISOString();
const makeId = (prefix: string) =>
  `${prefix}-${String(Math.random()).slice(2, 8)}-${Date.now()
    .toString()
    .slice(-4)}`;

const formatTimeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const getTypeIcon = (type: ReportType) => {
  switch (type) {
    case "incident":
      return <MapPin className="h-4 w-4" />;
    case "summary":
      return <BarChart3 className="h-4 w-4" />;
    case "evidence":
      return <Package className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: ReportType) => {
  switch (type) {
    case "incident":
      return "Incident Report";
    case "summary":
      return "Operations Summary";
    case "evidence":
      return "Evidence Pack";
  }
};

const sinceMs = (range: RangeFilter) => {
  const h = 60 * 60 * 1000;
  if (range === "24h") return Date.now() - 24 * h;
  if (range === "7d") return Date.now() - 7 * 24 * h;
  if (range === "30d") return Date.now() - 30 * 24 * h;
  return 0;
};

export default function ReportsPage() {
  const {
    incidents,
    alerts,
    missions,
    predictionRuns,
    spreadEnvelopes,
    impactSummary,
    auditLogs,
    me,
  } = useDemoStore();

  // local demo reports (kept in page state)
  const [reports, setReports] = useState<DemoReport[]>([
    {
      id: "report-001",
      name: "Fethiye Forest Fire - Incident Report",
      type: "incident",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      createdBy: "Commander Johnson",
      status: "final",
      incidentId: incidents[0]?.id,
    },
    {
      id: "report-002",
      name: "Weekly Operations Summary",
      type: "summary",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      createdBy: "System",
      status: "final",
    },
    {
      id: "report-003",
      name: "İzmir Coastal Wildfire - Evidence Pack",
      type: "evidence",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdBy: "Operator Smith",
      status: "draft",
      incidentId: incidents[1]?.id,
    },
  ]);

  // filters
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ReportType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("30d");

  // sheets
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // create form
  const [createType, setCreateType] = useState<ReportType>("incident");
  const [createIncidentId, setCreateIncidentId] = useState<string>(
    incidents[0]?.id ?? ""
  );
  const [createStatus, setCreateStatus] = useState<ReportStatus>("draft");
  const [creating, setCreating] = useState(false);

  const query = useMemo(() => q.trim().toLowerCase(), [q]);

  const reportsFiltered = useMemo(() => {
    const cutoff = sinceMs(rangeFilter);

    return reports
      .filter((r) => {
        if (cutoff && new Date(r.createdAt).getTime() < cutoff) return false;
        if (typeFilter !== "all" && r.type !== typeFilter) return false;
        if (statusFilter !== "all" && r.status !== statusFilter) return false;

        if (query) {
          const incidentName = r.incidentId
            ? incidents.find((i) => i.id === r.incidentId)?.name ?? ""
            : "";
          const hay =
            `${r.id} ${r.name} ${r.type} ${r.status} ${r.createdBy} ${incidentName}`.toLowerCase();
          if (!hay.includes(query)) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [reports, rangeFilter, typeFilter, statusFilter, query, incidents]);

  const stats = useMemo(() => {
    // month-ish: last 30d
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const monthCount = reports.filter(
      (r) => new Date(r.createdAt).getTime() >= cutoff
    ).length;
    const evidenceCount = reports.filter((r) => r.type === "evidence").length;
    const pendingReview = reports.filter((r) => r.status === "draft").length;

    // demo: generation time estimate depends on type mix (purely cosmetic)
    const avgGen = (() => {
      const base = 90; // seconds
      const weights = reports.map((r) =>
        r.type === "incident" ? 1.4 : r.type === "evidence" ? 1.2 : 1.0
      );
      const w =
        weights.reduce((a, b) => a + b, 0) / Math.max(1, weights.length);
      const sec = Math.round(base * w);
      return `${Math.max(1, Math.round(sec / 60))}.${sec % 60}m`;
    })();

    return { monthCount, evidenceCount, pendingReview, avgGen };
  }, [reports]);

  const selectedReport = useMemo(() => {
    if (!selectedReportId) return null;
    return reports.find((r) => r.id === selectedReportId) ?? null;
  }, [selectedReportId, reports]);

  const reportIncident = useMemo<Incident | null>(() => {
    if (!selectedReport?.incidentId) return null;
    return incidents.find((i) => i.id === selectedReport.incidentId) ?? null;
  }, [selectedReport, incidents]);

  const buildReportBundle = useCallback(
    (r: DemoReport) => {
      // For incident-linked reports: attach incident + related alerts/missions/predictions/audit
      const incident = r.incidentId
        ? incidents.find((i) => i.id === r.incidentId) ?? null
        : null;

      const relatedAlerts: Alert[] = incident
        ? alerts.filter(
            (a) =>
              a.incidentId === incident.id || incident.alertIds.includes(a.id)
          )
        : [];

      const relatedMissions: UavMission[] = incident
        ? missions.filter((m) => {
            // demo heuristic: missions in same rough area not available, so link by "assignedTo"/recentness only
            // If later you store incidentId on mission, swap to that.
            return true;
          })
        : [];

      const relatedRuns: PredictionRun[] = incident
        ? predictionRuns.filter((p) => p.incidentId === incident.id)
        : [];

      const lastRunId = relatedRuns[0]?.id;
      const relatedEnvelopes = lastRunId
        ? spreadEnvelopes.filter((e) => e.runId === lastRunId)
        : [];

      const relatedAudit: AuditLog[] = (
        auditLogs as unknown as AuditLog[]
      ).slice(0, 25);

      // “evidence pack” extra: include pointers to files/urls (mock)
      const evidence =
        r.type === "evidence"
          ? {
              snapshots: relatedAlerts
                .filter((a) => a.sources?.length)
                .slice(0, 5)
                .map((a) => ({
                  alertId: a.id,
                  note: "Snapshot reference (demo)",
                  url: "https://example.com/snapshot.png",
                })),
              chainOfCustody: [
                {
                  at: nowISO(),
                  actor: me.name,
                  action: "Pack generated (demo)",
                },
              ],
            }
          : undefined;

      const summary =
        r.type === "summary"
          ? {
              totals: {
                incidents: incidents.length,
                alerts: alerts.length,
                missions: missions.length,
                predictionRuns: predictionRuns.length,
              },
              highlights: [
                "Top driver: wind shift + low humidity (demo)",
                "Busiest gateway: GATEWAY-002 (demo)",
                "Most at-risk assets cluster near WUI boundary (demo)",
              ],
            }
          : undefined;

      const impact =
        impactSummary && lastRunId && impactSummary.runId === lastRunId
          ? impactSummary
          : null;

      return {
        report: r,
        incident,
        alerts: relatedAlerts,
        missions: relatedMissions.slice(0, 10),
        predictionRuns: relatedRuns,
        spreadEnvelopes: relatedEnvelopes,
        impactSummary: impact,
        evidence,
        summary,
        auditTrail: relatedAudit,
        generatedAt: nowISO(),
      };
    },
    [
      incidents,
      alerts,
      missions,
      predictionRuns,
      spreadEnvelopes,
      impactSummary,
      auditLogs,
      me.name,
    ]
  );

  const onDownloadReport = useCallback(
    (reportId: string) => {
      const r = reports.find((x) => x.id === reportId);
      if (!r) return;
      const bundle = buildReportBundle(r);
      downloadJson(`${r.id}-${r.type}.json`, bundle);
    },
    [reports, buildReportBundle]
  );

  const openCreate = useCallback(
    (type?: ReportType) => {
      setCreateType(type ?? "incident");
      setCreateIncidentId(incidents[0]?.id ?? "");
      setCreateStatus("draft");
      setCreateOpen(true);
    },
    [incidents]
  );

  const onCreateReport = useCallback(() => {
    setCreating(true);

    const incidentName = createIncidentId
      ? incidents.find((i) => i.id === createIncidentId)?.name
      : undefined;

    const name =
      createType === "summary"
        ? "Operations Summary"
        : createType === "evidence"
        ? `${incidentName ?? "Incident"} - Evidence Pack`
        : `${incidentName ?? "Incident"} - Incident Report`;

    const newReport: DemoReport = {
      id: makeId("report"),
      name,
      type: createType,
      status: createStatus,
      createdAt: nowISO(),
      createdBy: me.name ?? "Admin",
      incidentId:
        createType === "summary" ? undefined : createIncidentId || undefined,
    };

    window.setTimeout(() => {
      setReports((prev) => [newReport, ...prev]);
      setCreating(false);
      setCreateOpen(false);
      setSelectedReportId(newReport.id);
    }, 450);
  }, [createType, createStatus, createIncidentId, incidents, me.name]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Reports
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Generate and manage incident reports and evidence packs
            </p>
          </div>

          <Button className="w-full sm:w-auto" onClick={() => openCreate()}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Reports Generated"
            value={stats.monthCount}
            subtitle="Last 30 days"
            icon={FileText}
          />
          <StatCard
            title="Evidence Packs"
            value={stats.evidenceCount}
            subtitle="All time"
          />
          <StatCard
            title="Pending Review"
            value={stats.pendingReview}
            variant="warning"
          />
          <StatCard
            title="Avg. Generation Time"
            value={stats.avgGen}
            subtitle="Estimated"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search reports, incidents, authors..."
            className="pl-9 bg-surface-1"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as "all" | ReportType)}
        >
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="incident">Incident Report</SelectItem>
            <SelectItem value="summary">Operations Summary</SelectItem>
            <SelectItem value="evidence">Evidence Pack</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "all" | ReportStatus)
          }
        >
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="final">Final</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant="secondary" className="text-xs shrink-0">
          Showing {reportsFiltered.length}/{reports.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {reportsFiltered.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2">
                  {getTypeIcon(report.type)}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold">{report.name}</h3>

                    <Badge
                      variant={
                        report.status === "final" ? "secondary" : "outline"
                      }
                    >
                      {report.status.toUpperCase()}
                    </Badge>

                    <Badge variant="outline" className="capitalize">
                      {report.type}
                    </Badge>

                    <Badge variant="secondary" className="text-xs font-mono">
                      {report.id.toUpperCase()}
                    </Badge>

                    {report.incidentId && (
                      <Badge variant="outline" className="text-xs">
                        Linked incident
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {report.createdBy}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatTimeAgo(report.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadReport(report.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedReportId(report.id)}
                  >
                    View
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {reportsFiltered.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <p className="font-medium">No reports match your filters</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try clearing search or switching type/status/date range.
              </p>
            </div>
          )}

          {/* Report Templates */}
          <div className="mt-6 md:mt-8">
            <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => openCreate("incident")}
                className="rounded-xl border border-dashed border-border p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors text-left"
              >
                <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Incident Report</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive incident documentation with timeline and actions
                  taken.
                </p>
              </button>

              <button
                type="button"
                onClick={() => openCreate("summary")}
                className="rounded-xl border border-dashed border-border p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors text-left"
              >
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Operations Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Weekly or daily summary of all operations and alerts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => openCreate("evidence")}
                className="rounded-xl border border-dashed border-border p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors text-left"
              >
                <Package className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Evidence Pack</h3>
                <p className="text-sm text-muted-foreground">
                  Exportable bundle of evidence (alerts, envelopes, logs).
                </p>
              </button>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Create Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          className="w-[92vw] sm:w-[460px] p-0 bg-card"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="text-left">New Report</SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Template
              </p>
              <div className="flex gap-2 flex-wrap">
                {(["incident", "summary", "evidence"] as const).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={createType === t ? "default" : "outline"}
                    onClick={() => setCreateType(t)}
                  >
                    {getTypeLabel(t)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Status
              </p>
              <div className="flex gap-2">
                {(["draft", "final"] as const).map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant={createStatus === s ? "default" : "outline"}
                    onClick={() => setCreateStatus(s)}
                  >
                    {s.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "rounded-lg border border-border p-3",
                createType === "summary" && "opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Incident (optional for summary)
                </p>
                {createType === "summary" && (
                  <Badge variant="secondary" className="text-[10px]">
                    optional
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {incidents.slice(0, 6).map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setCreateIncidentId(i.id)}
                    className={cn(
                      "w-full text-left rounded-lg border border-border p-3 hover:bg-surface-1 transition-colors",
                      createIncidentId === i.id && "bg-surface-1"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{i.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {i.id.toUpperCase()}
                        </p>
                      </div>
                      <StatusBadge
                        variant={
                          i.status === "confirmed"
                            ? "critical"
                            : i.status === "suspected"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {i.status.toUpperCase()}
                      </StatusBadge>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Button
                onClick={onCreateReport}
                disabled={
                  creating || (!createIncidentId && createType !== "summary")
                }
              >
                {creating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Demo behavior: downloads are JSON bundles (incident + alerts +
              predictions + audit). Perfect para enseñar “capabilities” sin
              backend.
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Sheet */}
      <Sheet
        open={!!selectedReportId}
        onOpenChange={(o) => !o && setSelectedReportId(null)}
      >
        <SheetContent
          side="right"
          className="w-[92vw] sm:w-[520px] p-0 bg-card"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="text-left">Report Details</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="p-4 space-y-4">
              {selectedReport ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{selectedReport.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedReport.id.toUpperCase()} •{" "}
                        {selectedReport.type}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created by{" "}
                        <span className="text-foreground font-medium">
                          {selectedReport.createdBy}
                        </span>{" "}
                        • {formatTimeAgo(selectedReport.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selectedReport.status === "final"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {selectedReport.status.toUpperCase()}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadReport(selectedReport.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Template</span>
                      <span className="font-medium">
                        {getTypeLabel(selectedReport.type)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Linked incident
                      </span>
                      <span className="font-mono">
                        {selectedReport.incidentId
                          ? selectedReport.incidentId.toUpperCase()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Included in bundle
                    </p>

                    {(() => {
                      const bundle = buildReportBundle(selectedReport);
                      return (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="font-semibold">
                              {bundle.incident ? 1 : 0}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Incident
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="font-semibold">
                              {bundle.alerts.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Alerts
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="font-semibold">
                              {bundle.predictionRuns.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Prediction runs
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="font-semibold">
                              {bundle.auditTrail.length}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Audit logs
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {reportIncident && (
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Incident snapshot
                      </p>

                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{reportIncident.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Status:{" "}
                            <span className="font-medium">
                              {reportIncident.status}
                            </span>{" "}
                            • Priority:{" "}
                            <span className="font-medium">
                              {reportIncident.priority}
                            </span>
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Confidence {Math.round(reportIncident.confidence)}%
                        </Badge>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-8 text-center">
                  <p className="font-medium">Report not found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    It may have been removed from the demo list.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
