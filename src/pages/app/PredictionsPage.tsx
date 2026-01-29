// src/pages/app/PredictionsPage.tsx
import { useMemo, useState, useCallback } from "react";
import {
  BarChart3,
  Play,
  Search,
  Filter,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Download,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";
import type { PredictionRun } from "@/types";

type RunStatus = PredictionRun["status"];
type StatusFilter = "all" | RunStatus;
type ScopeFilter = "all" | PredictionRun["scope"];
type ModelId = "risk_nowcast" | "spread_forecast" | "impact_assessment";

const formatTimeAgo = (iso?: string) => {
  if (!iso) return "—";
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

const statusBadgeVariant = (status: RunStatus) => {
  if (status === "completed") return "success";
  if (status === "failed") return "critical";
  if (status === "pending") return "neutral";
  return "warning"; // running
};

const StatusIcon = ({ status }: { status: RunStatus }) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-success" />;
    case "running":
      return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
    case "pending":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    case "failed":
      return <AlertTriangle className="h-4 w-4 text-critical" />;
    default:
      return null;
  }
};

export default function PredictionsPage() {
  const {
    incidents,
    predictionRuns,
    spreadEnvelopes,
    impactSummary,
    runPrediction,
  } = useDemoStore();

  // filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

  // create run sheet
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(
    incidents[0]?.id ?? ""
  );
  const [selectedModel, setSelectedModel] =
    useState<ModelId>("spread_forecast");
  const [creating, setCreating] = useState(false);

  // results sheet
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const query = useMemo(() => q.trim().toLowerCase(), [q]);

  const runsFiltered = useMemo(() => {
    return predictionRuns.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (scopeFilter !== "all" && r.scope !== scopeFilter) return false;

      if (query) {
        const incidentName =
          incidents.find((i) => i.id === r.incidentId)?.name ?? "";
        const hay =
          `${r.id} ${r.modelVersion} ${r.scope} ${r.status} ${incidentName}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [predictionRuns, statusFilter, scopeFilter, query, incidents]);

  const stats = useMemo(() => {
    const total = predictionRuns.length;
    const completed = predictionRuns.filter(
      (r) => r.status === "completed"
    ).length;
    const failed = predictionRuns.filter((r) => r.status === "failed").length;
    const running = predictionRuns.filter((r) => r.status === "running").length;

    // demo-ish “today”: last 24h
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const today = predictionRuns.filter(
      (r) => new Date(r.createdAt).getTime() >= since
    ).length;

    // “high risk areas”: infer from impact summary if it matches latest run
    const highRiskAreas =
      impactSummary && impactSummary.wuiExposureScore > 70 ? 2 : 1;

    return { total, completed, failed, running, today, highRiskAreas };
  }, [predictionRuns, impactSummary]);

  const selectedRun = useMemo(() => {
    if (!selectedRunId) return null;
    return predictionRuns.find((r) => r.id === selectedRunId) ?? null;
  }, [selectedRunId, predictionRuns]);

  const selectedIncident = useMemo(() => {
    if (!selectedRun?.incidentId) return null;
    return incidents.find((i) => i.id === selectedRun.incidentId) ?? null;
  }, [selectedRun, incidents]);

  const runEnvelopes = useMemo(() => {
    if (!selectedRun) return [];
    return spreadEnvelopes
      .filter((e) => e.runId === selectedRun.id)
      .sort((a, b) => a.tPlusHours - b.tPlusHours);
  }, [spreadEnvelopes, selectedRun]);

  const runImpact = useMemo(() => {
    // tu store trae un impactSummary “current”; lo mostramos solo si coincide con el runId
    if (!selectedRun) return null;
    if (!impactSummary) return null;
    return impactSummary.runId === selectedRun.id ? impactSummary : null;
  }, [impactSummary, selectedRun]);

  const openCreate = () => {
    setSelectedIncidentId(incidents[0]?.id ?? "");
    setSelectedModel("spread_forecast");
    setCreateOpen(true);
  };

  const onCreateRun = useCallback(() => {
    if (!selectedIncidentId) return;
    setCreating(true);

    // demo: corremos prediction real (spread + impact en store)
    const newRunId = runPrediction(selectedIncidentId);

    // opcional: “model type” solo lo usamos para etiqueta/UX (el store corre todo)
    // si luego quieres separar por modelo, aquí decides qué función llamar

    window.setTimeout(() => {
      setCreating(false);
      setCreateOpen(false);
      setSelectedRunId(newRunId);
    }, 450);
  }, [selectedIncidentId, runPrediction]);

  const onExportRun = useCallback(
    (runId: string) => {
      const run = predictionRuns.find((r) => r.id === runId);
      if (!run) return;

      const incident = incidents.find((i) => i.id === run.incidentId) ?? null;
      const envelopes = spreadEnvelopes.filter((e) => e.runId === runId);
      const impact = impactSummary?.runId === runId ? impactSummary : null;

      downloadJson(`prediction-${runId}.json`, {
        run,
        incident,
        spreadEnvelopes: envelopes,
        impactSummary: impact,
        exportedAt: new Date().toISOString(),
      });
    },
    [predictionRuns, incidents, spreadEnvelopes, impactSummary]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              AI Predictions
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Risk nowcasts, spread forecasts, and impact assessments
            </p>
          </div>

          <Button className="w-full sm:w-auto" onClick={openCreate}>
            <Play className="h-4 w-4 mr-2" />
            New Prediction Run
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Predictions (24h)"
            value={stats.today}
            icon={BarChart3}
          />
          <StatCard
            title="Runs Health"
            value={`${stats.completed}/${stats.total}`}
            subtitle={`${stats.running} running • ${stats.failed} failed`}
          />
          <StatCard
            title="Model Version"
            value={predictionRuns[0]?.modelVersion ?? "v2.0.0"}
            subtitle="Latest used"
            icon={TrendingUp}
          />
          <StatCard
            title="High Risk Areas"
            value={stats.highRiskAreas}
            variant="critical"
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
            placeholder="Search..."
            className="pl-9 bg-surface-1"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={scopeFilter}
          onValueChange={(value) => setScopeFilter(value as ScopeFilter)}
        >
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Scope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Scopes</SelectItem>
            <SelectItem value="incident">Incident</SelectItem>
            <SelectItem value="region">Region</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Prediction Models */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Prediction Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Risk Nowcast */}
              <button
                type="button"
                onClick={() => {
                  setSelectedModel("risk_nowcast");
                  openCreate();
                }}
                className="rounded-xl border border-border bg-card p-5 hover:bg-card/80 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Risk Nowcast</h3>
                    <p className="text-xs text-muted-foreground">
                      Current fire risk assessment
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Evaluates real-time fire risk based on weather, fuel
                  conditions, and historical patterns.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">~2 min</Badge>
                  <span className="text-sm text-muted-foreground inline-flex items-center">
                    Run <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </button>

              {/* Spread Forecast */}
              <button
                type="button"
                onClick={() => {
                  setSelectedModel("spread_forecast");
                  openCreate();
                }}
                className="rounded-xl border border-border bg-card p-5 hover:bg-card/80 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-critical/20">
                    <BarChart3 className="h-5 w-5 text-critical" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Spread Forecast</h3>
                    <p className="text-xs text-muted-foreground">
                      Fire progression modeling
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Projects fire spread envelopes for 1–6 hours with probability
                  bands.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">~5 min</Badge>
                  <span className="text-sm text-muted-foreground inline-flex items-center">
                    Run <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </button>

              {/* Impact */}
              <button
                type="button"
                onClick={() => {
                  setSelectedModel("impact_assessment");
                  openCreate();
                }}
                className="rounded-xl border border-border bg-card p-5 hover:bg-card/80 cursor-pointer transition-colors text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/20">
                    <AlertTriangle className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Impact Assessment</h3>
                    <p className="text-xs text-muted-foreground">
                      Assets & exposure analysis
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Identifies at-risk assets, roads, and populations within
                  forecast envelopes.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">~3 min</Badge>
                  <span className="text-sm text-muted-foreground inline-flex items-center">
                    Run <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Runs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Prediction Runs</h2>
              <Badge variant="secondary" className="text-xs">
                Showing {runsFiltered.length}/{predictionRuns.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {runsFiltered.map((run) => {
                const incident = incidents.find((i) => i.id === run.incidentId);
                const envelopesCount = spreadEnvelopes.filter(
                  (e) => e.runId === run.id
                ).length;
                const hasImpact = impactSummary?.runId === run.id;

                return (
                  <div
                    key={run.id}
                    className="rounded-xl border border-border bg-card p-4 md:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
                        <StatusIcon status={run.status} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold">
                            {run.scope === "incident"
                              ? "Incident Analysis"
                              : "Regional Assessment"}
                          </h3>

                          <StatusBadge variant={statusBadgeVariant(run.status)}>
                            {run.status.toUpperCase()}
                          </StatusBadge>

                          <Badge
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {run.modelVersion}
                          </Badge>

                          <Badge
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {run.id.toUpperCase()}
                          </Badge>
                        </div>

                        {incident && (
                          <p className="text-sm text-muted-foreground mb-2">
                            For incident:{" "}
                            <span className="text-foreground font-medium">
                              {incident.name}
                            </span>
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(run.completedAt || run.createdAt)}
                          </span>

                          {run.status === "completed" && (
                            <>
                              <span>{envelopesCount} spread envelopes</span>
                              <span>
                                {hasImpact
                                  ? `${impactSummary.assetsAtRiskCount} assets at risk`
                                  : "Impact pending"}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onExportRun(run.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedRunId(run.id)}
                        >
                          View Results
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {runsFiltered.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
                  <p className="font-medium">No runs match your filters</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try clearing search or switching status/scope.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Create Run Sheet */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent
          side="right"
          className="w-[92vw] sm:w-[420px] p-0 bg-card"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="text-left">New Prediction Run</SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Model
              </p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    ["risk_nowcast", "Risk Nowcast"],
                    ["spread_forecast", "Spread Forecast"],
                    ["impact_assessment", "Impact Assessment"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    size="sm"
                    variant={selectedModel === id ? "default" : "outline"}
                    onClick={() => setSelectedModel(id)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Demo note: the store runs a combined pipeline (spread + impact).
                This selector is for UX only.
              </p>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Incident
              </p>

              <div className="space-y-2">
                {incidents.slice(0, 6).map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setSelectedIncidentId(i.id)}
                    className={cn(
                      "w-full text-left rounded-lg border border-border p-3 hover:bg-surface-1 transition-colors",
                      selectedIncidentId === i.id && "bg-surface-1"
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
                onClick={onCreateRun}
                disabled={!selectedIncidentId || creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Results Sheet */}
      <Sheet
        open={!!selectedRunId}
        onOpenChange={(o) => !o && setSelectedRunId(null)}
      >
        <SheetContent
          side="right"
          className="w-[92vw] sm:w-[460px] p-0 bg-card"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="text-left">Prediction Results</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="p-4 space-y-4">
              {selectedRun ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {selectedRun.scope === "incident"
                          ? "Incident Analysis"
                          : "Regional Assessment"}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedRun.id.toUpperCase()} •{" "}
                        {selectedRun.modelVersion}
                      </p>
                      {selectedIncident && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Incident:{" "}
                          <span className="text-foreground font-medium">
                            {selectedIncident.name}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={statusBadgeVariant(selectedRun.status)}
                      >
                        {selectedRun.status.toUpperCase()}
                      </StatusBadge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExportRun(selectedRun.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span>{formatTimeAgo(selectedRun.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Completed</span>
                      <span>{formatTimeAgo(selectedRun.completedAt)}</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Spread Envelopes
                    </p>

                    {runEnvelopes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No envelopes generated for this run.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {runEnvelopes.map((e) => (
                          <div
                            key={e.id}
                            className="rounded-lg border border-border bg-surface-1 p-3 flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium">T+{e.tPlusHours}h</p>
                              <p className="text-xs text-muted-foreground capitalize">
                                Probability: {e.probabilityBand}
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Polygon
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Impact Summary
                    </p>

                    {runImpact ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-surface-1 p-3 text-center">
                            <p className="text-lg font-bold">
                              {runImpact.assetsAtRiskCount}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Assets
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3 text-center">
                            <p className="text-lg font-bold">
                              {runImpact.roadsThreatenedCount}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Roads
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3 text-center">
                            <p className="text-lg font-bold">
                              {runImpact.wuiExposureScore}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              WUI Score
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {runImpact.narrativeDrivers.map((d, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg bg-surface-1 p-3 text-sm"
                            >
                              {d}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Impact summary not available for this run (demo store
                        keeps only the latest summary).
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center">
                  <p className="font-medium">Run not found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    It may have been removed from the demo store.
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
