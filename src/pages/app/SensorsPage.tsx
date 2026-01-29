// src/pages/app/SensorsPage.tsx
import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Radio,
  Search,
  MapPin,
  Clock,
  Battery,
  Signal,
  Thermometer,
  Wind,
  Droplets,
  RefreshCw,
  ExternalLink,
  Copy,
  Zap,
  Power,
  AlertTriangle,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  mockWeatherStations,
  mockBalloons,
  mockGroundStations,
  generateObservations,
} from "@/data/mockData";
import { cn } from "@/lib/utils";

type StationStatus = "online" | "offline" | "degraded" | "maintenance";

type WeatherStation = (typeof mockWeatherStations)[number];
type BalloonAsset = (typeof mockBalloons)[number];
type GroundStation = (typeof mockGroundStations)[number];

type SensorBase = { status: StationStatus };

type SensorType = "weather" | "balloon" | "ground";
type StatusFilter = "all" | "online" | "offline" | "degraded" | "maintenance";

type SelectedRow =
  | { kind: "weather"; id: string }
  | { kind: "balloon"; id: string }
  | { kind: "ground"; id: string }
  | null;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

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

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
};

const openInMaps = (lat: number, lng: number) => {
  const url = `https://www.google.com/maps?q=${lat},${lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
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

export default function SensorsPage() {
  const [q, setQ] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all");
  const [selectedType, setSelectedType] = useState<SensorType>("weather");
  const [issuesOnly, setIssuesOnly] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const [selected, setSelected] = useState<SelectedRow>(null);

  const query = useMemo(() => q.trim().toLowerCase(), [q]);

  // We generate “latest obs” once per refresh for realism + perf
  const obsByStationId = useMemo(() => {
    const map = new Map<
      string,
      ReturnType<typeof generateObservations>[number]
    >();
    for (const s of mockWeatherStations) {
      const obs = generateObservations(s.id, 1)[0];
      map.set(s.id, obs);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNonce]);

  const matchesQuery = useCallback(
    (hay: string) => {
      if (!query) return true;
      return hay.toLowerCase().includes(query);
    },
    [query]
  );

  const filteredWeather = useMemo(() => {
    return mockWeatherStations.filter((s) => {
      if (selectedStatus !== "all" && s.status !== selectedStatus) return false;
      if (query) {
        const hay = `${s.name} ${s.id}`;
        if (!matchesQuery(hay)) return false;
      }
      const obs = obsByStationId.get(s.id);
      const hasAnomaly = (obs?.anomalyFlags?.length ?? 0) > 0;
      if (issuesOnly && s.status === "online" && !hasAnomaly) return false;
      return true;
    });
  }, [selectedStatus, query, matchesQuery, issuesOnly, obsByStationId]);

  const filteredBalloons = useMemo(() => {
    return mockBalloons.filter((b) => {
      if (selectedStatus !== "all" && b.status !== selectedStatus) return false;
      if (query) {
        const hay = `${b.name} ${b.id} ${b.payloadType}`;
        if (!matchesQuery(hay)) return false;
      }
      if (issuesOnly && b.status === "online") return false;
      return true;
    });
  }, [selectedStatus, query, matchesQuery, issuesOnly]);

  const filteredGround = useMemo(() => {
    return mockGroundStations.filter((g) => {
      if (selectedStatus !== "all" && g.status !== selectedStatus) return false;
      if (query) {
        const hay = `${g.name} ${g.id}`;
        if (!matchesQuery(hay)) return false;
      }
      if (issuesOnly && g.status === "online") return false;
      return true;
    });
  }, [selectedStatus, query, matchesQuery, issuesOnly]);

  const currentList = useMemo(() => {
    if (selectedType === "weather") return filteredWeather.length;
    if (selectedType === "balloon") return filteredBalloons.length;
    return filteredGround.length;
  }, [
    selectedType,
    filteredWeather.length,
    filteredBalloons.length,
    filteredGround.length,
  ]);

  const totals = useMemo(() => {
    const all =
      selectedType === "weather"
        ? mockWeatherStations
        : selectedType === "balloon"
        ? mockBalloons
        : mockGroundStations;

    const online = all.filter((x: SensorBase) => x.status === "online").length;
    const offline = all.filter(
      (x: SensorBase) => x.status === "offline"
    ).length;
    const degraded = all.filter(
      (x: SensorBase) => x.status === "degraded"
    ).length;
    const maintenance = all.filter(
      (x: SensorBase) => x.status === "maintenance"
    ).length;

    const anomalies =
      selectedType !== "weather"
        ? 0
        : mockWeatherStations.reduce((acc, s) => {
            const obs = obsByStationId.get(s.id);
            return acc + ((obs?.anomalyFlags?.length ?? 0) > 0 ? 1 : 0);
          }, 0);

    // tiny “health score” for demo
    const score = clamp(
      Math.round(
        (online / Math.max(1, all.length)) * 100 - offline * 7 - degraded * 2
      ),
      0,
      100
    );

    return {
      total: all.length,
      online,
      offline,
      degraded,
      maintenance,
      anomalies,
      score,
    };
  }, [selectedType, obsByStationId]);

  const onRefreshAll = useCallback(() => {
    setSyncing(true);
    window.setTimeout(() => {
      setSyncing(false);
      setLastRefreshedAt(new Date().toISOString());
      setRefreshNonce((n) => n + 1);
    }, 650);
  }, []);

  const selectedWeather = useMemo(() => {
    if (!selected || selected.kind !== "weather") return null;
    return mockWeatherStations.find((s) => s.id === selected.id) ?? null;
  }, [selected]);

  const selectedBalloon = useMemo(() => {
    if (!selected || selected.kind !== "balloon") return null;
    return mockBalloons.find((b) => b.id === selected.id) ?? null;
  }, [selected]);

  const selectedGround = useMemo(() => {
    if (!selected || selected.kind !== "ground") return null;
    return mockGroundStations.find((g) => g.id === selected.id) ?? null;
  }, [selected]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Sensors Network
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Monitor weather stations and detection platforms
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onRefreshAll}
              disabled={syncing}
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", syncing && "animate-spin")}
              />
              {syncing ? "Refreshing..." : "Refresh All"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          <StatCard
            title="Assets (type)"
            value={`${currentList}/${totals.total}`}
            icon={Radio}
          />
          <StatCard title="Online" value={totals.online} variant="success" />
          <StatCard title="Offline" value={totals.offline} variant="critical" />
          <StatCard
            title="Degraded"
            value={totals.degraded}
            variant="warning"
          />
          <StatCard
            title="Health"
            value={`${totals.score}%`}
            subtitle={
              selectedType === "weather"
                ? `${totals.anomalies} stations w/ anomalies`
                : "Based on status mix"
            }
            icon={Signal}
            className="col-span-2 sm:col-span-1"
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
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as SensorType)}
        >
          <SelectTrigger className="w-40 md:w-48 bg-surface-1 shrink-0">
            <SelectValue placeholder="Sensor Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weather">Weather Stations</SelectItem>
            <SelectItem value="balloon">Balloon Assets</SelectItem>
            <SelectItem value="ground">Ground Stations</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={(v) => setSelectedStatus(v as StatusFilter)}
        >
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
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

        {lastRefreshedAt && (
          <Badge variant="secondary" className="text-xs shrink-0">
            Updated: {formatTimeAgo(lastRefreshedAt)}
          </Badge>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6">
          {/* WEATHER */}
          {selectedType === "weather" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredWeather.map((station: WeatherStation) => {
                const obs = obsByStationId.get(station.id);
                const anomalies = obs?.anomalyFlags?.length ?? 0;

                return (
                  <Link
                    key={station.id}
                    to={`/app/sensors/${station.id}`}
                    onClick={(e) => {
                      // keep navigation, but also allow “details” via right-click/open
                      // If you want only Sheet, remove Link and use button.
                      // (Opinion: Link is great for deep page; Sheet is great for quick triage.)
                    }}
                    className={cn(
                      "rounded-xl border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]",
                      station.status === "offline" && "border-critical/30",
                      station.status === "degraded" && "border-warning/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg",
                            station.status === "online" && "bg-success/20",
                            station.status === "offline" && "bg-critical/20",
                            station.status === "degraded" && "bg-warning/20"
                          )}
                        >
                          <Radio
                            className={cn(
                              "h-4 w-4 md:h-5 md:w-5",
                              station.status === "online" && "text-success",
                              station.status === "offline" && "text-critical",
                              station.status === "degraded" && "text-warning"
                            )}
                          />
                        </div>

                        <div>
                          <h3 className="text-sm md:text-base font-semibold">
                            {station.name}
                          </h3>
                          <p className="text-[10px] md:text-xs text-muted-foreground font-mono">
                            {station.id.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge
                          variant={
                            station.status === "online"
                              ? "success"
                              : station.status === "offline"
                              ? "critical"
                              : "warning"
                          }
                        >
                          {station.status.toUpperCase()}
                        </StatusBadge>

                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            setSelected({ kind: "weather", id: station.id });
                          }}
                          className="h-8 w-8"
                          title="Quick details"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-muted-foreground mb-3 md:mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(station.lastSeen)}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 font-medium",
                          station.batteryLevel > 50
                            ? "text-success"
                            : station.batteryLevel > 20
                            ? "text-warning"
                            : "text-critical"
                        )}
                      >
                        <Battery className="h-3 w-3" />
                        {station.batteryLevel}%
                      </span>
                    </div>

                    <Progress
                      value={clamp(station.batteryLevel, 0, 100)}
                      className="h-2 mb-3"
                    />

                    <div className="grid grid-cols-4 gap-1.5 md:gap-2">
                      <div className="rounded-lg bg-surface-1 p-1.5 md:p-2 text-center">
                        <Thermometer className="h-3 w-3 mx-auto text-muted-foreground mb-0.5 md:mb-1" />
                        <p className="text-xs md:text-sm font-semibold">
                          {obs ? `${obs.temperature.toFixed(0)}°` : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-1 p-1.5 md:p-2 text-center">
                        <Droplets className="h-3 w-3 mx-auto text-muted-foreground mb-0.5 md:mb-1" />
                        <p className="text-xs md:text-sm font-semibold">
                          {obs ? `${obs.relativeHumidity.toFixed(0)}%` : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-1 p-1.5 md:p-2 text-center">
                        <Wind className="h-3 w-3 mx-auto text-muted-foreground mb-0.5 md:mb-1" />
                        <p className="text-xs md:text-sm font-semibold">
                          {obs ? obs.windSpeed.toFixed(0) : "—"}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-1 p-1.5 md:p-2 text-center">
                        <Signal className="h-3 w-3 mx-auto text-muted-foreground mb-0.5 md:mb-1" />
                        <p className="text-xs md:text-sm font-semibold">
                          {obs ? `${obs.windDirection}°` : "—"}
                        </p>
                      </div>
                    </div>

                    {anomalies > 0 && (
                      <div className="mt-2 md:mt-3 flex items-center gap-2">
                        <StatusBadge variant="warning" className="text-[10px]">
                          {anomalies} anomal{anomalies > 1 ? "ies" : "y"}
                        </StatusBadge>
                      </div>
                    )}
                  </Link>
                );
              })}

              {filteredWeather.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center md:col-span-2">
                  <p className="font-medium">No stations match your filters</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try clearing search or changing status.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* BALLOONS */}
          {selectedType === "balloon" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredBalloons.map((b: BalloonAsset) => {
                const lat = b.location?.coordinates?.[1];
                const lng = b.location?.coordinates?.[0];

                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelected({ kind: "balloon", id: b.id })}
                    className={cn(
                      "text-left rounded-xl border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]",
                      b.status === "offline" && "border-critical/30",
                      b.status === "degraded" && "border-warning/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg",
                            b.status === "online" && "bg-success/20",
                            b.status === "offline" && "bg-critical/20",
                            b.status === "degraded" && "bg-warning/20"
                          )}
                        >
                          <Signal
                            className={cn(
                              "h-4 w-4 md:h-5 md:w-5",
                              b.status === "online" && "text-success",
                              b.status === "offline" && "text-critical",
                              b.status === "degraded" && "text-warning"
                            )}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-semibold">
                            {b.name}
                          </h3>
                          <p className="text-[10px] md:text-xs text-muted-foreground font-mono">
                            {b.id.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        variant={
                          b.status === "online"
                            ? "success"
                            : b.status === "offline"
                            ? "critical"
                            : "warning"
                        }
                      >
                        {b.status.toUpperCase()}
                      </StatusBadge>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(b.lastSeen)}
                      </span>

                      {typeof lat === "number" && typeof lng === "number" && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lat.toFixed(3)}, {lng.toFixed(3)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-surface-1 p-3 text-center">
                        <p className="text-lg font-bold">
                          {b.coverageRadius}km
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Coverage
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-1 p-3 text-center">
                        <p className="text-lg font-bold capitalize">
                          {b.payloadType}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Payload
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredBalloons.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center md:col-span-2">
                  <p className="font-medium">
                    No balloon assets match your filters
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try clearing search or changing status.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* GROUND */}
          {selectedType === "ground" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredGround.map((g: GroundStation) => {
                const queuePct = clamp(
                  ((g.bufferQueueSize ?? 0) / 100) * 100,
                  0,
                  100
                );

                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelected({ kind: "ground", id: g.id })}
                    className={cn(
                      "text-left rounded-xl border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]",
                      g.status === "offline" && "border-critical/30",
                      g.status === "degraded" && "border-warning/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div
                          className={cn(
                            "flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg",
                            g.status === "online" && "bg-success/20",
                            g.status === "offline" && "bg-critical/20",
                            g.status === "degraded" && "bg-warning/20"
                          )}
                        >
                          <Radio
                            className={cn(
                              "h-4 w-4 md:h-5 md:w-5",
                              g.status === "online" && "text-success",
                              g.status === "offline" && "text-critical",
                              g.status === "degraded" && "text-warning"
                            )}
                          />
                        </div>
                        <div>
                          <h3 className="text-sm md:text-base font-semibold">
                            {g.name}
                          </h3>
                          <p className="text-[10px] md:text-xs text-muted-foreground font-mono">
                            {g.id.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      <StatusBadge
                        variant={
                          g.status === "online"
                            ? "success"
                            : g.status === "offline"
                            ? "critical"
                            : "warning"
                        }
                      >
                        {g.status.toUpperCase()}
                      </StatusBadge>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4 text-[10px] md:text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(g.lastSync)}
                      </span>
                    </div>

                    <div className="rounded-lg bg-surface-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Buffer Queue
                        </span>
                        <span className="text-sm font-medium">
                          {g.bufferQueueSize} msgs
                        </span>
                      </div>
                      <Progress value={queuePct} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-2">
                        {g.bufferQueueSize < 20
                          ? "Normal operation"
                          : g.bufferQueueSize < 60
                          ? "Queue building up"
                          : "Queue critical (backpressure)"}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredGround.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center md:col-span-2">
                  <p className="font-medium">
                    No ground stations match your filters
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Try clearing search or changing status.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Details Sheet */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-[92vw] sm:w-[440px] p-0 bg-card"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="text-left">Sensor Details</SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-64px)]">
            <div className="p-4 space-y-4">
              {/* WEATHER DETAILS */}
              {selectedWeather && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{selectedWeather.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedWeather.id.toUpperCase()}
                      </p>
                    </div>
                    <StatusBadge
                      variant={
                        selectedWeather.status === "online"
                          ? "success"
                          : selectedWeather.status === "offline"
                          ? "critical"
                          : "warning"
                      }
                    >
                      {selectedWeather.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last seen</span>
                      <span>{formatTimeAgo(selectedWeather.lastSeen)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Battery</span>
                      <span className="font-medium">
                        {selectedWeather.batteryLevel}%
                      </span>
                    </div>
                    <Progress
                      value={clamp(selectedWeather.batteryLevel, 0, 100)}
                      className="h-2"
                    />
                  </div>

                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Latest Readings
                    </p>
                    {(() => {
                      const obs = obsByStationId.get(selectedWeather.id);
                      if (!obs)
                        return (
                          <p className="text-sm text-muted-foreground">
                            No data.
                          </p>
                        );
                      return (
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="text-sm text-muted-foreground">
                              Temp
                            </p>
                            <p className="text-lg font-bold">
                              {obs.temperature.toFixed(1)}°
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="text-sm text-muted-foreground">
                              Humidity
                            </p>
                            <p className="text-lg font-bold">
                              {obs.relativeHumidity.toFixed(0)}%
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="text-sm text-muted-foreground">
                              Wind
                            </p>
                            <p className="text-lg font-bold">
                              {obs.windSpeed.toFixed(0)}
                            </p>
                          </div>
                          <div className="rounded-lg bg-surface-1 p-3">
                            <p className="text-sm text-muted-foreground">
                              Direction
                            </p>
                            <p className="text-lg font-bold">
                              {obs.windDirection}°
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(selectedWeather.id.toUpperCase())
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadJson(`weather-${selectedWeather.id}.json`, {
                          station: selectedWeather,
                          latestObs:
                            obsByStationId.get(selectedWeather.id) ?? null,
                          exportedAt: new Date().toISOString(),
                        })
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        void copyToClipboard(
                          `PING ${selectedWeather.id.toUpperCase()} OK`
                        )
                      }
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Ping
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() =>
                        void copyToClipboard(
                          `RESTART ${selectedWeather.id.toUpperCase()} requested`
                        )
                      }
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                  </div>
                </>
              )}

              {/* BALLOON DETAILS */}
              {selectedBalloon && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{selectedBalloon.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedBalloon.id.toUpperCase()}
                      </p>
                    </div>
                    <StatusBadge
                      variant={
                        selectedBalloon.status === "online"
                          ? "success"
                          : selectedBalloon.status === "offline"
                          ? "critical"
                          : "warning"
                      }
                    >
                      {selectedBalloon.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
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
                        copyToClipboard(selectedBalloon.id.toUpperCase())
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const lat = selectedBalloon.location?.coordinates?.[1];
                        const lng = selectedBalloon.location?.coordinates?.[0];
                        if (typeof lat === "number" && typeof lng === "number")
                          openInMaps(lat, lng);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open map
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        void copyToClipboard(
                          `PING ${selectedBalloon.id.toUpperCase()} OK`
                        )
                      }
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Ping
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() =>
                        void copyToClipboard(
                          `RESTART ${selectedBalloon.id.toUpperCase()} requested`
                        )
                      }
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                  </div>
                </>
              )}

              {/* GROUND DETAILS */}
              {selectedGround && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{selectedGround.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {selectedGround.id.toUpperCase()}
                      </p>
                    </div>
                    <StatusBadge
                      variant={
                        selectedGround.status === "online"
                          ? "success"
                          : selectedGround.status === "offline"
                          ? "critical"
                          : "warning"
                      }
                    >
                      {selectedGround.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last sync</span>
                      <span>{formatTimeAgo(selectedGround.lastSync)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Buffer queue
                      </span>
                      <span className="font-medium">
                        {selectedGround.bufferQueueSize} msgs
                      </span>
                    </div>
                    <Progress
                      value={clamp(
                        ((selectedGround.bufferQueueSize ?? 0) / 100) * 100,
                        0,
                        100
                      )}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(selectedGround.id.toUpperCase())
                      }
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        downloadJson(`ground-${selectedGround.id}.json`, {
                          gateway: selectedGround,
                          exportedAt: new Date().toISOString(),
                        })
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={() =>
                        void copyToClipboard(
                          `PING ${selectedGround.id.toUpperCase()} OK`
                        )
                      }
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Ping
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={() =>
                        void copyToClipboard(
                          `RESTART ${selectedGround.id.toUpperCase()} requested`
                        )
                      }
                    >
                      <Power className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                  </div>
                </>
              )}

              {!selectedWeather && !selectedBalloon && !selectedGround && (
                <div className="p-6 text-center">
                  <p className="font-medium">No selection</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pick an item to see details.
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
