import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Flame,
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  BarChart3,
  FileText,
  Play,
  Download,
  Plus,
  TrendingUp,
  Shield,
  Zap,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useDemoStore, demoUtils } from "@/store/demoStore";

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

export default function IncidentDetailPage() {
  const { id } = useParams();
  const {
    incidents,
    alerts,
    predictionRuns,
    spreadEnvelopes,
    impactSummary,
    runPrediction,
    updateIncidentStatus,
    linkAlertToIncident,
  } = useDemoStore();

  const incident = incidents.find((i) => i.id === id);

  const linkedAlerts = useMemo(() => {
    if (!incident) return [];
    return alerts.filter((a) => (incident.alertIds || []).includes(a.id));
  }, [incident, alerts]);

  const incidentRuns = useMemo(() => {
    if (!id) return [];
    return predictionRuns.filter((p) => p.incidentId === id);
  }, [predictionRuns, id]);

  const latestRun = incidentRuns[0];

  const runEnvelopes = useMemo(() => {
    if (!latestRun) return [];
    return spreadEnvelopes.filter((e) => e.runId === latestRun.id);
  }, [spreadEnvelopes, latestRun]);

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Incident Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The incident you're looking for doesn't exist.
          </p>
          <Link to="/app/incidents">
            <Button>Back to Incidents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "critical";
      case "suspected":
        return "warning";
      case "contained":
        return "info";
      case "controlled":
      case "extinguished":
        return "success";
      default:
        return "neutral";
    }
  };

  const timelineEvents = [
    {
      time: "2m ago",
      action: "Perimeter updated",
      actor: "System",
      type: "update",
    },
    {
      time: "15m ago",
      action: "Prediction run completed",
      actor: "AI Model",
      type: "prediction",
    },
    {
      time: "32m ago",
      action: "Alert linked",
      actor: "Operator",
      type: "alert",
    },
    {
      time: "1h ago",
      action: "Incident confirmed",
      actor: "Commander",
      type: "status",
    },
    {
      time: "2h ago",
      action: "Incident created",
      actor: "System",
      type: "create",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/app/incidents">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">
                {incident.name}
              </h1>
              <StatusBadge variant={getStatusVariant(incident.status)}>
                {incident.status.replace("_", " ").toUpperCase()}
              </StatusBadge>
              <Badge variant="outline" className="font-mono text-xs">
                {incident.id.toUpperCase()}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {incident.location.coordinates[1].toFixed(4)},{" "}
                {incident.location.coordinates[0].toFixed(4)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Started {demoUtils.formatTimeAgo(incident.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Incident Commander:{" "}
                {incident.commanderId ? "Johnson" : "Unassigned"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadJson(`${incident.id}-evidence.json`, {
                  incident,
                  linkedAlerts,
                  latestRun,
                  runEnvelopes,
                  impactSummary,
                })
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export Evidence Pack
            </Button>

            <Button onClick={() => runPrediction(incident.id)}>
              <Play className="h-4 w-4 mr-2" />
              Run Prediction
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            title="Confidence"
            value={`${incident.confidence}%`}
            variant={incident.confidence > 80 ? "critical" : "warning"}
          />
          <StatCard
            title="Linked Alerts"
            value={(incident.alertIds || []).length}
            icon={AlertTriangle}
          />
          <StatCard
            title="Assets at Risk"
            value={impactSummary.assetsAtRiskCount}
            icon={Shield}
            variant="warning"
          />
          <StatCard
            title="Roads Threatened"
            value={impactSummary.roadsThreatenedCount}
            icon={TrendingUp}
          />
          <StatCard
            title="WUI Exposure"
            value={impactSummary.wuiExposureScore}
            subtitle="Score out of 100"
            icon={Zap}
            variant="critical"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-6 bg-card/50 border-b border-border rounded-none h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="perimeters">Perimeters</TabsTrigger>
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* OVERVIEW */}
          <TabsContent value="overview" className="p-6 space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Linked Alerts */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Linked Alerts</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const alertId = window.prompt(
                        "Alert id to link (e.g. alert-001)"
                      );
                      if (!alertId) return;
                      linkAlertToIncident(alertId, incident.id);
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Link Alert
                  </Button>
                </div>

                <div className="space-y-3">
                  {linkedAlerts.length > 0 ? (
                    linkedAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-surface-1"
                      >
                        <AlertTriangle
                          className={cn(
                            "h-5 w-5",
                            alert.severity === "critical" && "text-critical",
                            alert.severity === "high" && "text-warning"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {alert.topDrivers?.[0] || "No drivers"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {demoUtils.formatTimeAgo(alert.createdAt)} •{" "}
                            {alert.confidence}% confidence
                          </p>
                        </div>
                        <StatusBadge
                          variant={
                            alert.severity === "critical"
                              ? "critical"
                              : "warning"
                          }
                        >
                          {alert.severity}
                        </StatusBadge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No alerts linked to this incident.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateIncidentStatus(incident.id, "confirmed")
                    }
                  >
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateIncidentStatus(incident.id, "contained")
                    }
                  >
                    Contain
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateIncidentStatus(incident.id, "controlled")
                    }
                  >
                    Control
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      updateIncidentStatus(incident.id, "extinguished")
                    }
                  >
                    Extinguish
                  </Button>
                </div>
              </div>

              {/* Latest Prediction */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Latest Prediction</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runPrediction(incident.id)}
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Run New
                  </Button>
                </div>

                {latestRun ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 flex-wrap">
                      <StatusBadge variant="success">
                        {latestRun.status.toUpperCase()}
                      </StatusBadge>
                      <span className="text-xs text-muted-foreground">
                        Model {latestRun.modelVersion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {demoUtils.formatTimeAgo(
                          latestRun.completedAt || latestRun.createdAt
                        )}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          downloadJson(`${latestRun.id}.json`, latestRun)
                        }
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Spread Envelopes
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {runEnvelopes.length ? (
                          runEnvelopes.map((env) => (
                            <Badge key={env.id} variant="outline">
                              T+{env.tPlusHours}h ({env.probabilityBand})
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">No envelopes</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Key Drivers
                      </p>
                      <ul className="space-y-1.5">
                        {impactSummary.narrativeDrivers
                          .slice(0, 2)
                          .map((driver, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-warning">•</span>
                              {driver}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No predictions run yet.
                  </p>
                )}
              </div>
            </div>

            {/* Impact Summary */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Impact Assessment</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-warning">
                    {impactSummary.assetsAtRiskCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Assets at Risk
                  </p>
                </div>
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-critical">
                    {impactSummary.roadsThreatenedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Roads Threatened
                  </p>
                </div>
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-warning">
                    {impactSummary.wuiExposureScore}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    WUI Exposure Score
                  </p>
                </div>
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-info">6h</p>
                  <p className="text-sm text-muted-foreground">
                    Forecast Horizon
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Narrative Drivers
                </p>
                <ul className="space-y-2">
                  {impactSummary.narrativeDrivers.map((driver, i) => (
                    <li
                      key={i}
                      className="text-sm text-muted-foreground flex items-start gap-2"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs font-medium flex-shrink-0">
                        {i + 1}
                      </span>
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </TabsContent>

          {/* TIMELINE */}
          <TabsContent value="timeline" className="p-6 m-0">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Incident Timeline</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.alert("Demo: Add event placeholder")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Event
                </Button>
              </div>

              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {timelineEvents.map((event, i) => (
                    <div
                      key={i}
                      className="relative flex items-start gap-4 pl-10"
                    >
                      <div
                        className={cn(
                          "absolute left-2.5 w-3 h-3 rounded-full border-2 bg-card",
                          event.type === "status" && "border-success",
                          event.type === "alert" && "border-warning",
                          event.type === "prediction" && "border-info",
                          event.type === "update" && "border-muted-foreground",
                          event.type === "create" && "border-primary"
                        )}
                      />
                      <div className="flex-1 rounded-lg bg-surface-1 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{event.action}</p>
                          <span className="text-xs text-muted-foreground">
                            {event.time}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          By {event.actor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PREDICTIONS */}
          <TabsContent value="predictions" className="p-6 m-0">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Prediction History</h3>
                <Button onClick={() => runPrediction(incident.id)}>
                  <Play className="h-4 w-4 mr-2" />
                  Run New Prediction
                </Button>
              </div>

              {incidentRuns.length ? (
                <div className="space-y-3">
                  {incidentRuns.map((run) => (
                    <div
                      key={run.id}
                      className="rounded-lg bg-surface-1 p-3 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {run.id.toUpperCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {run.modelVersion} •{" "}
                          {demoUtils.formatTimeAgo(
                            run.completedAt || run.createdAt
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{run.status}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadJson(`${run.id}.json`, run)}
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No predictions yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Run a prediction to see spread envelopes and impact.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* PERIMETERS */}
          <TabsContent value="perimeters" className="p-6 m-0">
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Perimeter History</h3>
              <p className="text-muted-foreground mb-4">
                Track perimeter changes over time
              </p>
              <Button
                variant="outline"
                onClick={() => window.alert("Demo: map perimeters placeholder")}
              >
                View on Map
              </Button>
            </div>
          </TabsContent>

          {/* EVIDENCE */}
          <TabsContent value="evidence" className="p-6 m-0">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Evidence Pack</h3>
              <p className="text-muted-foreground mb-4">
                Collect and export evidence for this incident
              </p>
              <Button
                onClick={() =>
                  downloadJson(`${incident.id}-evidence.json`, {
                    incident,
                    alerts: linkedAlerts,
                    latestRun,
                    envelopes: runEnvelopes,
                    impactSummary,
                  })
                }
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Evidence Pack
              </Button>
            </div>
          </TabsContent>

          {/* TASKS */}
          <TabsContent value="tasks" className="p-6 m-0">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground mb-4">
                Assign and track tasks for response teams
              </p>
              <Button onClick={() => window.alert("Demo: tasks placeholder")}>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
