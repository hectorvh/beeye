// src/pages/app/NetworksPage.tsx
import { useMemo, useState, useCallback } from "react";
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
  Search,
  ExternalLink,
  Copy,
  Zap,
  Power,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { mockGroundStations, mockBalloons } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { BalloonAsset, GroundStationGateway, SensorStatus } from "@/types";

type RowKind = "gateway" | "balloon";
type SelectedRow =
  | { kind: "gateway"; id: string }
  | { kind: "balloon"; id: string }
  | null;

type StatusFilter = "all" | SensorStatus;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

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

const toLatLngText = (p: { coordinates: [number, number] }) =>
  `${p.coordinates[1].toFixed(5)}, ${p.coordinates[0].toFixed(5)}`;

const openInMaps = (lat: number, lng: number) => {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // fallback
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

export default function NetworksPage() {
  // demo UX knobs
  const STALE_AFTER_MIN = 12;

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [issuesOnly, setIssuesOnly] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const [selected, setSelected] = useState<SelectedRow>(null);

  const gateways = useMemo(
    () => mockGroundStations as GroundStationGateway[],
    []
  );
  const balloons = useMemo(() => mockBalloons as BalloonAsset[], []);

  const derivedGatewayStatus = useCallback(
    (g: GroundStationGateway): SensorStatus => {
      const minutes = (Date.now() - new Date(g.lastSync).getTime()) / 60000;
      if (g.status === "offline") return "offline";
      if (minutes > STALE_AFTER_MIN) return "degraded";
      return g.status;
    },
    []
  );

  const derivedBalloonStatus = useCallback((b: BalloonAsset): SensorStatus => {
    const minutes = (Date.now() - new Date(b.lastSeen).getTime()) / 60000;
    if (b.status === "offline") return "offline";
    if (minutes > STALE_AFTER_MIN) return "degraded";
    return b.status;
  }, []);

  const query = useMemo(() => q.trim().toLowerCase(), [q]);

  const filteredGateways = useMemo(() => {
    return gateways.filter((g) => {
      const ds = derivedGatewayStatus(g);
      if (query) {
        const hay = `${g.name} ${g.id}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (statusFilter !== "all" && ds !== statusFilter) return false;
      if (issuesOnly && ds === "online") return false;
      return true;
    });
  }, [gateways, query, statusFilter, issuesOnly, derivedGatewayStatus]);

  const filteredBalloons = useMemo(() => {
    return balloons.filter((b) => {
      const ds = derivedBalloonStatus(b);
      if (query) {
        const hay = `${b.name} ${b.id}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (statusFilter !== "all" && ds !== statusFilter) return false;
      if (issuesOnly && ds === "online") return false;
      return true;
    });
  }, [balloons, query, statusFilter, issuesOnly, derivedBalloonStatus]);

  const stats = useMemo(() => {
    const all = [
      ...gateways.map((g) => derivedGatewayStatus(g)),
      ...balloons.map((b) => derivedBalloonStatus(b)),
    ];
    const online = all.filter((s) => s === "online").length;
    const degraded = all.filter((s) => s === "degraded").length;
    const offline = all.filter((s) => s === "offline").length;
    const maintenance = all.filter((s) => s === "maintenance").length;

    const avgQueue =
      gateways.length === 0
        ? 0
        : Math.round(
            gateways.reduce((acc, g) => acc + (g.bufferQueueSize ?? 0), 0) /
              gateways.length
          );

    // simple health score for demo
    const score = clamp(
      Math.round(
        (online / Math.max(1, all.length)) * 100 - offline * 6 - degraded * 2
      ),
      0,
      100
    );

    return { online, degraded, offline, maintenance, avgQueue, score };
  }, [gateways, balloons, derivedGatewayStatus, derivedBalloonStatus]);
  const onSyncAll = () => {
    setSyncing(true);
    // demo: simulate sync latency
    window.setTimeout(() => {
      setSyncing(false);
      setLastSyncedAt(new Date().toISOString());
    }, 900);
  };

  const selectedGateway = useMemo(() => {
    if (!selected || selected.kind !== "gateway") return null;
    return gateways.find((g) => g.id === selected.id) ?? null;
  }, [selected, gateways]);

  const selectedBalloon = useMemo(() => {
    if (!selected || selected.kind !== "balloon") return null;
    return balloons.find((b) => b.id === selected.id) ?? null;
  }, [selected, balloons]);

  const renderStatusBadge = (status: SensorStatus) => {
    const variant =
      status === "online"
        ? "success"
        : status === "degraded"
        ? "warning"
        : status === "maintenance"
        ? "neutral"
        : "critical";

    return <StatusBadge variant={variant}>{status.toUpperCase()}</StatusBadge>;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Network Infrastructure
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Ground stations, gateways, and balloon assets
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onSyncAll}
              disabled={syncing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", syncing && "animate-spin")}
              />
              {syncing ? "Syncing..." : "Sync All"}
            </Button>
          </div>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Ground Stations"
            value={gateways.length}
            icon={Server}
            variant="success"
          />
          <StatCard
            title="Balloon Assets"
            value={balloons.length}
            icon={Signal}
          />
          <StatCard
            title="Network Health"
            value={`${stats.score}%`}
            subtitle={`${stats.online} online • ${stats.degraded} degraded • ${stats.offline} offline`}
            icon={Activity}
          />
          <StatCard
            title="Avg Buffer Queue"
            value={`${stats.avgQueue} msgs`}
            subtitle="Gateways average"
            icon={Database}
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
            placeholder="Search by name or ID..."
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
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant={issuesOnly ? "default" : "outline"}
          onClick={() => setIssuesOnly((p) => !p)}
          className="shrink-0"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Issues only
        </Button>

        {lastSyncedAt && (
          <Badge variant="secondary" className="text-xs shrink-0">
            Last sync: {formatTimeAgo(lastSyncedAt)}
          </Badge>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Ground Stations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Server className="h-5 w-5 text-muted-foreground" />
                Ground Station Gateways
              </h2>
              <Badge variant="secondary" className="text-xs">
                Showing {filteredGateways.length}/{gateways.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredGateways.map((gateway) => {
                const ds = derivedGatewayStatus(gateway);
                const queuePct = clamp(
                  (gateway.bufferQueueSize / 100) * 100,
                  0,
                  100
                );
                const queueTone =
                  gateway.bufferQueueSize < 20
                    ? "Normal operation"
                    : gateway.bufferQueueSize < 60
                    ? "Queue building up"
                    : "Queue critical (backpressure)";

                return (
                  <button
                    key={gateway.id}
                    type="button"
                    onClick={() =>
                      setSelected({ kind: "gateway", id: gateway.id })
                    }
                    className={cn(
                      "text-left rounded-xl border border-border bg-card p-4 md:p-5",
                      "hover:bg-surface-1 transition-colors"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            ds === "online"
                              ? "bg-success/20"
                              : ds === "degraded"
                              ? "bg-warning/20"
                              : ds === "maintenance"
                              ? "bg-muted/30"
                              : "bg-critical/20"
                          )}
                        >
                          <Network
                            className={cn(
                              "h-6 w-6",
                              ds === "online"
                                ? "text-success"
                                : ds === "degraded"
                                ? "text-warning"
                                : ds === "maintenance"
                                ? "text-muted-foreground"
                                : "text-critical"
                            )}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{gateway.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            {gateway.id.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStatusBadge(ds)}
                        {ds !== gateway.status && (
                          <Badge variant="outline" className="text-[10px]">
                            STALE
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {gateway.location.coordinates[1].toFixed(3)},{" "}
                          {gateway.location.coordinates[0].toFixed(3)}
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
                        <span className="text-sm font-medium">
                          {gateway.bufferQueueSize} messages
                        </span>
                      </div>

                      <Progress value={queuePct} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {queueTone}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balloon Assets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Signal className="h-5 w-5 text-muted-foreground" />
                Balloon Detection Assets
              </h2>
              <Badge variant="secondary" className="text-xs">
                Showing {filteredBalloons.length}/{balloons.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredBalloons.map((balloon) => {
                const ds = derivedBalloonStatus(balloon);

                return (
                  <button
                    key={balloon.id}
                    type="button"
                    onClick={() =>
                      setSelected({ kind: "balloon", id: balloon.id })
                    }
                    className={cn(
                      "text-left rounded-xl border border-border bg-card p-4 md:p-5",
                      "hover:bg-surface-1 transition-colors"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            ds === "online"
                              ? "bg-success/20"
                              : ds === "degraded"
                              ? "bg-warning/20"
                              : ds === "maintenance"
                              ? "bg-muted/30"
                              : "bg-critical/20"
                          )}
                        >
                          <Radio
                            className={cn(
                              "h-6 w-6",
                              ds === "online"
                                ? "text-success"
                                : ds === "degraded"
                                ? "text-warning"
                                : ds === "maintenance"
                                ? "text-muted-foreground"
                                : "text-critical"
                            )}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{balloon.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">
                            {balloon.id.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {renderStatusBadge(ds)}
                        {ds !== balloon.status && (
                          <Badge variant="outline" className="text-[10px]">
                            STALE
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {balloon.location.coordinates[1].toFixed(3)},{" "}
                          {balloon.location.coordinates[0].toFixed(3)}
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
                        <p className="text-lg font-bold">
                          {balloon.coverageRadius}km
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Coverage Radius
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-1 p-3 text-center">
                        <p className="text-lg font-bold capitalize">
                          {balloon.payloadType}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Payload Type
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-[92vw] sm:w-[420px] p-0 bg-card"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="text-left">
              {selected?.kind === "gateway"
                ? "Gateway Details"
                : "Balloon Details"}
            </SheetTitle>
          </SheetHeader>

          <div className="p-4 space-y-4">
            {selectedGateway && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{selectedGateway.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedGateway.id.toUpperCase()}
                    </p>
                  </div>
                  {renderStatusBadge(derivedGatewayStatus(selectedGateway))}
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-mono">
                      {toLatLngText(selectedGateway.location)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last sync</span>
                    <span>{formatTimeAgo(selectedGateway.lastSync)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Buffer queue</span>
                    <span className="font-medium">
                      {selectedGateway.bufferQueueSize} msgs
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(toLatLngText(selectedGateway.location))
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy coords
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      openInMaps(
                        selectedGateway.location.coordinates[1],
                        selectedGateway.location.coordinates[0]
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open map
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      // demo action
                      void copyToClipboard(
                        `PING ${selectedGateway.id.toUpperCase()} OK`
                      );
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Ping
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      // demo action
                      void copyToClipboard(
                        `RESTART ${selectedGateway.id.toUpperCase()} requested`
                      );
                    }}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                </div>
              </>
            )}

            {selectedBalloon && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{selectedBalloon.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedBalloon.id.toUpperCase()}
                    </p>
                  </div>
                  {renderStatusBadge(derivedBalloonStatus(selectedBalloon))}
                </div>

                <div className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-mono">
                      {toLatLngText(selectedBalloon.location)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last seen</span>
                    <span>{formatTimeAgo(selectedBalloon.lastSeen)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Coverage</span>
                    <span className="font-medium">
                      {selectedBalloon.coverageRadius} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Payload</span>
                    <span className="font-medium capitalize">
                      {selectedBalloon.payloadType}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(toLatLngText(selectedBalloon.location))
                    }
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy coords
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      openInMaps(
                        selectedBalloon.location.coordinates[1],
                        selectedBalloon.location.coordinates[0]
                      )
                    }
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open map
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      void copyToClipboard(
                        `PING ${selectedBalloon.id.toUpperCase()} OK`
                      );
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Ping
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      void copyToClipboard(
                        `RESTART ${selectedBalloon.id.toUpperCase()} requested`
                      );
                    }}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Restart
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
