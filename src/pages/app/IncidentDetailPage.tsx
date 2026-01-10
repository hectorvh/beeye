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
  MoreHorizontal,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockIncidents, mockAlerts, mockPredictionRuns, mockSpreadEnvelopes, mockImpactSummary } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function IncidentDetailPage() {
  const { id } = useParams();
  const incident = mockIncidents.find(i => i.id === id);
  const linkedAlerts = mockAlerts.filter(a => incident?.alertIds.includes(a.id));
  const prediction = mockPredictionRuns.find(p => p.incidentId === id);

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Incident Not Found</h2>
          <p className="text-muted-foreground mb-4">The incident you're looking for doesn't exist.</p>
          <Link to="/app/incidents">
            <Button>Back to Incidents</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "confirmed": return "critical";
      case "suspected": return "warning";
      case "contained": return "info";
      case "controlled": return "success";
      default: return "neutral";
    }
  };

  // Timeline events (mock)
  const timelineEvents = [
    { time: "2m ago", action: "Perimeter updated", actor: "System", type: "update" },
    { time: "15m ago", action: "Prediction run completed", actor: "AI Model v2.3.1", type: "prediction" },
    { time: "32m ago", action: "Alert linked", actor: "Operator Smith", type: "alert" },
    { time: "1h ago", action: "Incident confirmed", actor: "Commander Johnson", type: "status" },
    { time: "2h ago", action: "Incident created", actor: "System", type: "create" },
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{incident.name}</h1>
              <StatusBadge variant={getStatusVariant(incident.status)}>
                {incident.status.replace("_", " ").toUpperCase()}
              </StatusBadge>
              <Badge variant="outline" className="font-mono text-xs">
                {incident.id.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {incident.location.coordinates[1].toFixed(4)}, {incident.location.coordinates[0].toFixed(4)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                Started {formatTimeAgo(incident.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Incident Commander: {incident.commanderId ? "Johnson" : "Unassigned"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Evidence Pack
            </Button>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Run Prediction
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            title="Confidence"
            value={`${incident.confidence}%`}
            variant={incident.confidence > 80 ? "critical" : "warning"}
          />
          <StatCard
            title="Linked Alerts"
            value={incident.alertIds.length}
            icon={AlertTriangle}
          />
          <StatCard
            title="Assets at Risk"
            value={mockImpactSummary.assetsAtRiskCount}
            icon={Shield}
            variant="warning"
          />
          <StatCard
            title="Roads Threatened"
            value={mockImpactSummary.roadsThreatenedCount}
            icon={TrendingUp}
          />
          <StatCard
            title="WUI Exposure"
            value={mockImpactSummary.wuiExposureScore}
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
          <TabsContent value="overview" className="p-6 space-y-6 m-0">
            <div className="grid grid-cols-2 gap-6">
              {/* Linked Alerts */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Linked Alerts</h3>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    Link Alert
                  </Button>
                </div>
                <div className="space-y-3">
                  {linkedAlerts.length > 0 ? linkedAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-1">
                      <AlertTriangle className={cn(
                        "h-5 w-5",
                        alert.severity === "critical" && "text-critical",
                        alert.severity === "high" && "text-warning",
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{alert.topDrivers[0]}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(alert.createdAt)} • {alert.confidence}% confidence
                        </p>
                      </div>
                      <StatusBadge variant={alert.severity === "critical" ? "critical" : "warning"}>
                        {alert.severity}
                      </StatusBadge>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground">No alerts linked to this incident.</p>
                  )}
                </div>
              </div>

              {/* Latest Prediction */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Latest Prediction</h3>
                  <Button size="sm" variant="outline">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                </div>
                {prediction ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <StatusBadge variant="success">
                        {prediction.status.toUpperCase()}
                      </StatusBadge>
                      <span className="text-xs text-muted-foreground">
                        Model {prediction.modelVersion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(prediction.completedAt || prediction.createdAt)}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Spread Envelopes
                      </p>
                      <div className="flex gap-2">
                        {mockSpreadEnvelopes.map((env) => (
                          <Badge key={env.id} variant="outline">
                            T+{env.tPlusHours}h ({env.probabilityBand})
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Key Drivers
                      </p>
                      <ul className="space-y-1.5">
                        {mockImpactSummary.narrativeDrivers.slice(0, 2).map((driver, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-warning">•</span>
                            {driver}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No predictions run yet.</p>
                )}
              </div>
            </div>

            {/* Impact Summary */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Impact Assessment</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-warning">{mockImpactSummary.assetsAtRiskCount}</p>
                  <p className="text-sm text-muted-foreground">Assets at Risk</p>
                </div>
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-critical">{mockImpactSummary.roadsThreatenedCount}</p>
                  <p className="text-sm text-muted-foreground">Roads Threatened</p>
                </div>
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-warning">{mockImpactSummary.wuiExposureScore}</p>
                  <p className="text-sm text-muted-foreground">WUI Exposure Score</p>
                </div>
                <div className="rounded-lg bg-surface-1 p-4">
                  <p className="text-3xl font-bold text-info">6h</p>
                  <p className="text-sm text-muted-foreground">Forecast Horizon</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Narrative Drivers
                </p>
                <ul className="space-y-2">
                  {mockImpactSummary.narrativeDrivers.map((driver, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
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

          <TabsContent value="timeline" className="p-6 m-0">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold">Incident Timeline</h3>
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Event
                </Button>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-6">
                  {timelineEvents.map((event, i) => (
                    <div key={i} className="relative flex items-start gap-4 pl-10">
                      <div className={cn(
                        "absolute left-2.5 w-3 h-3 rounded-full border-2 bg-card",
                        event.type === "status" && "border-success",
                        event.type === "alert" && "border-warning",
                        event.type === "prediction" && "border-info",
                        event.type === "update" && "border-muted-foreground",
                        event.type === "create" && "border-primary",
                      )} />
                      <div className="flex-1 rounded-lg bg-surface-1 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{event.action}</p>
                          <span className="text-xs text-muted-foreground">{event.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">By {event.actor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="predictions" className="p-6 m-0">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Prediction History</h3>
              <p className="text-muted-foreground mb-4">View all prediction runs for this incident</p>
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Run New Prediction
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="perimeters" className="p-6 m-0">
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Perimeter History</h3>
              <p className="text-muted-foreground mb-4">Track perimeter changes over time</p>
              <Button variant="outline">View on Map</Button>
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="p-6 m-0">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Evidence Pack</h3>
              <p className="text-muted-foreground mb-4">Collect and export evidence for this incident</p>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Generate Evidence Pack
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="p-6 m-0">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Task Management</h3>
              <p className="text-muted-foreground mb-4">Assign and track tasks for response teams</p>
              <Button>
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
