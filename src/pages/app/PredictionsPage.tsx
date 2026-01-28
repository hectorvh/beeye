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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockPredictionRuns, mockIncidents, mockImpactSummary, mockSpreadEnvelopes } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function PredictionsPage() {
  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getIncident = (incidentId?: string) => mockIncidents.find(i => i.id === incidentId);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4 text-success" />;
      case "running": return <Loader2 className="h-4 w-4 text-warning animate-spin" />;
      case "pending": return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "failed": return <AlertTriangle className="h-4 w-4 text-critical" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">AI Predictions</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Risk nowcasts, spread forecasts, and impact assessments
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Play className="h-4 w-4 mr-2" />
            New Prediction Run
          </Button>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Predictions Today"
            value={mockPredictionRuns.length + 3}
            icon={BarChart3}
          />
          <StatCard
            title="Avg. Processing Time"
            value="4.2m"
            subtitle="For spread forecasts"
          />
          <StatCard
            title="Model Version"
            value="v2.3.1"
            subtitle="Latest release"
            icon={TrendingUp}
          />
          <StatCard
            title="High Risk Areas"
            value={2}
            variant="critical"
          />
        </div>
      </div>

      {/* Filters - scrollable on mobile */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search predictions..."
            className="pl-9 bg-surface-1"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Available Models */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Prediction Models</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="rounded-xl border border-border bg-card p-5 hover:bg-card/80 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
                    <TrendingUp className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Risk Nowcast</h3>
                    <p className="text-xs text-muted-foreground">Current fire risk assessment</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Evaluates real-time fire risk based on weather, fuel conditions, and historical patterns.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">~2 min</Badge>
                  <Button size="sm" variant="ghost">
                    Run
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 hover:bg-card/80 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-critical/20">
                    <BarChart3 className="h-5 w-5 text-critical" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Spread Forecast</h3>
                    <p className="text-xs text-muted-foreground">Fire progression modeling</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Projects fire spread envelopes for 1-6 hours with probability bands.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">~5 min</Badge>
                  <Button size="sm" variant="ghost">
                    Run
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 hover:bg-card/80 cursor-pointer transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/20">
                    <AlertTriangle className="h-5 w-5 text-info" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Impact Assessment</h3>
                    <p className="text-xs text-muted-foreground">Assets & exposure analysis</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Identifies at-risk assets, roads, and populations within forecast envelopes.
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">~3 min</Badge>
                  <Button size="sm" variant="ghost">
                    Run
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Runs */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Prediction Runs</h2>
            <div className="space-y-3">
              {mockPredictionRuns.map((run) => {
                const incident = getIncident(run.incidentId);
                return (
                  <div
                    key={run.id}
                    className="rounded-xl border border-border bg-card p-4 md:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
                        {getStatusIcon(run.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {run.scope === "incident" ? "Incident Analysis" : "Regional Assessment"}
                          </h3>
                          <StatusBadge
                            variant={run.status === "completed" ? "success" : run.status === "failed" ? "critical" : "warning"}
                          >
                            {run.status.toUpperCase()}
                          </StatusBadge>
                          <Badge variant="outline" className="text-xs font-mono">
                            {run.modelVersion}
                          </Badge>
                        </div>
                        
                        {incident && (
                          <p className="text-sm text-muted-foreground mb-2">
                            For incident: <span className="text-foreground font-medium">{incident.name}</span>
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(run.completedAt || run.createdAt)}
                          </span>
                          {run.status === "completed" && (
                            <>
                              <span>
                                {mockSpreadEnvelopes.filter(e => e.runId === run.id).length} spread envelopes
                              </span>
                              <span>
                                {mockImpactSummary.assetsAtRiskCount} assets at risk
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button size="sm" variant="ghost">
                          View Results
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
