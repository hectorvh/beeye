import { 
  Network, 
  Radio, 
  Signal,
  Clock,
  MapPin,
  Server,
  Database,
  RefreshCw,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockGroundStations, mockBalloons } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function NetworksPage() {
  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Network Infrastructure</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Ground stations, gateways, and balloon assets
            </p>
          </div>
          <Button variant="outline" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All
          </Button>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Ground Stations"
            value={mockGroundStations.length}
            icon={Server}
            variant="success"
          />
          <StatCard
            title="Balloon Assets"
            value={mockBalloons.length}
            icon={Signal}
          />
          <StatCard
            title="Total Coverage"
            value="~2,500 km²"
            subtitle="Active monitoring area"
          />
          <StatCard
            title="Data Throughput"
            value="1.2 GB/h"
            subtitle="Average ingestion rate"
            icon={Activity}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Ground Stations */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Server className="h-5 w-5 text-muted-foreground" />
              Ground Station Gateways
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {mockGroundStations.map((gateway) => (
                <div
                  key={gateway.id}
                  className="rounded-xl border border-border bg-card p-4 md:p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        gateway.status === "online" ? "bg-success/20" : "bg-critical/20"
                      )}>
                        <Network className={cn(
                          "h-6 w-6",
                          gateway.status === "online" ? "text-success" : "text-critical"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{gateway.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {gateway.id.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      variant={gateway.status === "online" ? "success" : "critical"}
                    >
                      {gateway.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {gateway.location.coordinates[1].toFixed(3)}, {gateway.location.coordinates[0].toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last sync: {formatTimeAgo(gateway.lastSync)}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-surface-1 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Buffer Queue
                      </span>
                      <span className="text-sm font-medium">{gateway.bufferQueueSize} messages</span>
                    </div>
                    <Progress value={(gateway.bufferQueueSize / 100) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {gateway.bufferQueueSize < 20 ? "Normal operation" : "Queue building up"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balloon Assets */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Signal className="h-5 w-5 text-muted-foreground" />
              Balloon Detection Assets
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {mockBalloons.map((balloon) => (
                <div
                  key={balloon.id}
                  className="rounded-xl border border-border bg-card p-4 md:p-5"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        balloon.status === "online" ? "bg-success/20" : "bg-critical/20"
                      )}>
                        <Radio className={cn(
                          "h-6 w-6",
                          balloon.status === "online" ? "text-success" : "text-critical"
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{balloon.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {balloon.id.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      variant={balloon.status === "online" ? "success" : "critical"}
                    >
                      {balloon.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {balloon.location.coordinates[1].toFixed(3)}, {balloon.location.coordinates[0].toFixed(3)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Last seen: {formatTimeAgo(balloon.lastSeen)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-surface-1 p-3 text-center">
                      <p className="text-lg font-bold">{balloon.coverageRadius}km</p>
                      <p className="text-xs text-muted-foreground">Coverage Radius</p>
                    </div>
                    <div className="rounded-lg bg-surface-1 p-3 text-center">
                      <p className="text-lg font-bold capitalize">{balloon.payloadType}</p>
                      <p className="text-xs text-muted-foreground">Payload Type</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
