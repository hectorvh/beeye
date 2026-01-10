import { useState } from "react";
import { 
  Layers, 
  AlertTriangle, 
  Flame, 
  Radio, 
  Plane, 
  Cloud,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Crosshair,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockAlerts, mockIncidents, mockWeatherStations, mockMissions } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function MapPage() {
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<typeof mockAlerts[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeValue, setTimeValue] = useState([100]);

  const layers = [
    { id: "alerts", label: "Active Alerts", icon: AlertTriangle, count: mockAlerts.length, color: "text-critical" },
    { id: "incidents", label: "Incidents", icon: Flame, count: mockIncidents.length, color: "text-warning" },
    { id: "weather", label: "Weather Stations", icon: Radio, count: mockWeatherStations.length, color: "text-info" },
    { id: "flights", label: "UAV Missions", icon: Plane, count: mockMissions.length, color: "text-success" },
    { id: "satellite", label: "Satellite Imagery", icon: Cloud, count: null, color: "text-muted-foreground" },
  ];

  const [activeLayers, setActiveLayers] = useState<string[]>(["alerts", "incidents", "weather"]);

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId]
    );
  };

  return (
    <div className="relative flex h-full">
      {/* Map Container */}
      <div className="flex-1 relative bg-surface-1">
        {/* Placeholder map background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, hsl(var(--background)) 0%, transparent 10%, transparent 90%, hsl(var(--background)) 100%),
              radial-gradient(circle at 30% 40%, hsl(var(--critical) / 0.1) 0%, transparent 40%),
              radial-gradient(circle at 70% 60%, hsl(var(--warning) / 0.1) 0%, transparent 30%),
              linear-gradient(135deg, hsl(222 47% 10%) 0%, hsl(222 47% 15%) 100%)
            `,
          }}
        >
          {/* Map grid overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          />

          {/* Mock map markers */}
          {mockAlerts.filter((_, i) => i < 3).map((alert, i) => (
            <div
              key={alert.id}
              className={cn(
                "absolute cursor-pointer transition-transform hover:scale-110",
                alert.severity === "critical" && "pulse-critical"
              )}
              style={{
                left: `${20 + i * 25}%`,
                top: `${30 + i * 15}%`,
              }}
              onClick={() => setSelectedFeature(alert)}
            >
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2",
                alert.severity === "critical" && "border-critical bg-critical/20",
                alert.severity === "high" && "border-warning bg-warning/20",
                alert.severity === "medium" && "border-warning/70 bg-warning/10",
                alert.severity === "low" && "border-muted bg-muted/20",
              )}>
                <AlertTriangle className={cn(
                  "h-5 w-5",
                  alert.severity === "critical" && "text-critical",
                  alert.severity === "high" && "text-warning",
                  alert.severity === "medium" && "text-warning/70",
                  alert.severity === "low" && "text-muted-foreground",
                )} />
              </div>
            </div>
          ))}

          {/* Weather station markers */}
          {mockWeatherStations.slice(0, 4).map((station, i) => (
            <div
              key={station.id}
              className="absolute cursor-pointer"
              style={{
                left: `${15 + i * 20}%`,
                top: `${50 + (i % 2) * 20}%`,
              }}
            >
              <div className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border",
                station.status === "online" && "border-success bg-success/20",
                station.status === "offline" && "border-critical bg-critical/20",
                station.status === "degraded" && "border-warning bg-warning/20",
              )}>
                <Radio className={cn(
                  "h-3 w-3",
                  station.status === "online" && "text-success",
                  station.status === "offline" && "text-critical",
                  station.status === "degraded" && "text-warning",
                )} />
              </div>
            </div>
          ))}
        </div>

        {/* Map controls */}
        <div className="absolute right-4 top-4 flex flex-col gap-2">
          <Button size="icon" variant="secondary" className="bg-card/90 backdrop-blur-sm">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="bg-card/90 backdrop-blur-sm">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary" className="bg-card/90 backdrop-blur-sm">
            <Crosshair className="h-4 w-4" />
          </Button>
        </div>

        {/* Time slider */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 glass-panel rounded-xl p-4 w-[500px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <Slider
                value={timeValue}
                onValueChange={setTimeValue}
                max={100}
                step={1}
                className="cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-foreground">Live</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute left-4 bottom-4 glass-panel rounded-xl p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Fire Risk</p>
          <div className="flex gap-1">
            <div className="w-6 h-3 rounded-sm bg-success" />
            <div className="w-6 h-3 rounded-sm bg-warning/50" />
            <div className="w-6 h-3 rounded-sm bg-warning" />
            <div className="w-6 h-3 rounded-sm bg-critical/70" />
            <div className="w-6 h-3 rounded-sm bg-critical" />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">Low</span>
            <span className="text-[10px] text-muted-foreground">Extreme</span>
          </div>
        </div>
      </div>

      {/* Layer Panel Toggle */}
      <Button
        size="icon"
        variant="secondary"
        className={cn(
          "absolute top-4 z-10 bg-card/90 backdrop-blur-sm transition-all",
          layerPanelOpen ? "left-[316px]" : "left-4"
        )}
        onClick={() => setLayerPanelOpen(!layerPanelOpen)}
      >
        {layerPanelOpen ? <ChevronLeft className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
      </Button>

      {/* Layer Panel */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-80 bg-card border-r border-border transition-transform duration-300",
        !layerPanelOpen && "-translate-x-full"
      )}>
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h3 className="font-semibold">Map Layers</h3>
        </div>
        <ScrollArea className="h-[calc(100%-48px)]">
          <div className="p-4 space-y-4">
            {/* Layer toggles */}
            <div className="space-y-2">
              {layers.map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                >
                  <Checkbox
                    checked={activeLayers.includes(layer.id)}
                    onCheckedChange={() => toggleLayer(layer.id)}
                  />
                  <layer.icon className={cn("h-4 w-4", layer.color)} />
                  <span className="flex-1 text-sm font-medium">{layer.label}</span>
                  {layer.count !== null && (
                    <Badge variant="secondary" className="text-xs">
                      {layer.count}
                    </Badge>
                  )}
                </label>
              ))}
            </div>

            {/* Quick stats */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Active Situation
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-surface-2 p-3 text-center">
                  <p className="text-2xl font-bold text-critical">{mockAlerts.filter(a => a.status === 'new').length}</p>
                  <p className="text-xs text-muted-foreground">New Alerts</p>
                </div>
                <div className="rounded-lg bg-surface-2 p-3 text-center">
                  <p className="text-2xl font-bold text-warning">{mockIncidents.length}</p>
                  <p className="text-xs text-muted-foreground">Active Incidents</p>
                </div>
              </div>
            </div>

            {/* Alert list preview */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recent Alerts
              </h4>
              {mockAlerts.slice(0, 3).map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                  onClick={() => setSelectedFeature(alert)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        variant={
                          alert.severity === "critical" ? "critical" :
                          alert.severity === "high" ? "warning" :
                          "neutral"
                        }
                        pulse={alert.severity === "critical"}
                      >
                        {alert.severity.toUpperCase()}
                      </StatusBadge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m ago
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                    {alert.topDrivers[0]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Feature Detail Drawer */}
      {selectedFeature && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-card border-l border-border animate-slide-in-right">
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <h3 className="font-semibold">Alert Details</h3>
            <Button size="icon" variant="ghost" onClick={() => setSelectedFeature(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Tabs defaultValue="overview" className="h-[calc(100%-48px)]">
            <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border rounded-none h-10">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge
                  variant={
                    selectedFeature.severity === "critical" ? "critical" :
                    selectedFeature.severity === "high" ? "warning" :
                    "neutral"
                  }
                  pulse={selectedFeature.severity === "critical"}
                >
                  {selectedFeature.severity.toUpperCase()}
                </StatusBadge>
                <StatusBadge variant="info" dot={false}>
                  {selectedFeature.status.replace("_", " ").toUpperCase()}
                </StatusBadge>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confidence Score
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-surface-2">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        selectedFeature.confidence > 80 ? "bg-critical" :
                        selectedFeature.confidence > 60 ? "bg-warning" : "bg-muted"
                      )}
                      style={{ width: `${selectedFeature.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-lg font-bold">{selectedFeature.confidence}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detection Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFeature.sources.map((source) => (
                    <Badge key={source} variant="outline" className="text-xs capitalize">
                      {source.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Drivers
                </p>
                <ul className="space-y-2">
                  {selectedFeature.topDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                        {i + 1}
                      </span>
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended Action
                </p>
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <p className="text-sm">{selectedFeature.recommendedAction}</p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" variant="default">
                  Acknowledge Alert
                </Button>
                <Button className="w-full" variant="secondary">
                  Create Incident
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="timeline" className="p-4">
              <p className="text-sm text-muted-foreground">Timeline events will appear here.</p>
            </TabsContent>
            <TabsContent value="evidence" className="p-4">
              <p className="text-sm text-muted-foreground">Evidence files and images will appear here.</p>
            </TabsContent>
            <TabsContent value="actions" className="p-4">
              <p className="text-sm text-muted-foreground">Available actions will appear here.</p>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
