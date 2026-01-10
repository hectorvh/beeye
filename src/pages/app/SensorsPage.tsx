import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Radio, 
  Search, 
  Filter,
  MapPin,
  Clock,
  Battery,
  Signal,
  Thermometer,
  Wind,
  Droplets,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { mockWeatherStations, mockBalloons, generateObservations } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function SensorsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("weather");

  const onlineStations = mockWeatherStations.filter(s => s.status === "online").length;
  const offlineStations = mockWeatherStations.filter(s => s.status === "offline").length;
  const degradedStations = mockWeatherStations.filter(s => s.status === "degraded").length;

  const filteredStations = mockWeatherStations.filter((station) => {
    if (selectedStatus !== "all" && station.status !== selectedStatus) return false;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  // Get latest observation for a station
  const getLatestObs = (stationId: string) => {
    const obs = generateObservations(stationId, 1)[0];
    return obs;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sensors Network</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor weather stations and detection platforms
            </p>
          </div>
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4">
          <StatCard
            title="Total Stations"
            value={mockWeatherStations.length}
            icon={Radio}
          />
          <StatCard
            title="Online"
            value={onlineStations}
            variant="success"
          />
          <StatCard
            title="Offline"
            value={offlineStations}
            variant="critical"
          />
          <StatCard
            title="Degraded"
            value={degradedStations}
            variant="warning"
          />
          <StatCard
            title="Balloon Assets"
            value={mockBalloons.length}
            icon={Signal}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-border bg-card/50 px-6 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sensors..."
            className="pl-9 bg-surface-1"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-44 bg-surface-1">
            <SelectValue placeholder="Sensor Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weather">Weather Stations</SelectItem>
            <SelectItem value="balloon">Balloon Assets</SelectItem>
            <SelectItem value="ground">Ground Stations</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-36 bg-surface-1">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="degraded">Degraded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sensor List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {filteredStations.map((station) => {
              const obs = getLatestObs(station.id);
              return (
                <Link
                  key={station.id}
                  to={`/app/sensors/${station.id}`}
                  className={cn(
                    "rounded-xl border bg-card p-5 transition-all hover:bg-card/80",
                    station.status === "offline" && "border-critical/30",
                    station.status === "degraded" && "border-warning/30",
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        station.status === "online" && "bg-success/20",
                        station.status === "offline" && "bg-critical/20",
                        station.status === "degraded" && "bg-warning/20",
                      )}>
                        <Radio className={cn(
                          "h-5 w-5",
                          station.status === "online" && "text-success",
                          station.status === "offline" && "text-critical",
                          station.status === "degraded" && "text-warning",
                        )} />
                      </div>
                      <div>
                        <h3 className="font-semibold">{station.name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">
                          {station.id.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      variant={
                        station.status === "online" ? "success" :
                        station.status === "offline" ? "critical" : "warning"
                      }
                    >
                      {station.status.toUpperCase()}
                    </StatusBadge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {station.location.coordinates[1].toFixed(3)}, {station.location.coordinates[0].toFixed(3)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(station.lastSeen)}
                    </span>
                  </div>

                  {/* Battery */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Battery className="h-3 w-3" />
                        Battery
                      </span>
                      <span className={cn(
                        "font-medium",
                        station.batteryLevel > 50 ? "text-success" :
                        station.batteryLevel > 20 ? "text-warning" : "text-critical"
                      )}>
                        {station.batteryLevel}%
                      </span>
                    </div>
                    <Progress 
                      value={station.batteryLevel} 
                      className="h-1.5"
                    />
                  </div>

                  {/* Latest readings */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="rounded-lg bg-surface-1 p-2 text-center">
                      <Thermometer className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-semibold">{obs.temperature.toFixed(1)}°</p>
                      <p className="text-[10px] text-muted-foreground">Temp</p>
                    </div>
                    <div className="rounded-lg bg-surface-1 p-2 text-center">
                      <Droplets className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-semibold">{obs.relativeHumidity.toFixed(0)}%</p>
                      <p className="text-[10px] text-muted-foreground">RH</p>
                    </div>
                    <div className="rounded-lg bg-surface-1 p-2 text-center">
                      <Wind className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-semibold">{obs.windSpeed.toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">km/h</p>
                    </div>
                    <div className="rounded-lg bg-surface-1 p-2 text-center">
                      <Signal className="h-3 w-3 mx-auto text-muted-foreground mb-1" />
                      <p className="text-sm font-semibold">{obs.windDirection}°</p>
                      <p className="text-[10px] text-muted-foreground">Dir</p>
                    </div>
                  </div>

                  {obs.anomalyFlags.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <StatusBadge variant="warning" className="text-[10px]">
                        {obs.anomalyFlags.length} anomal{obs.anomalyFlags.length > 1 ? 'ies' : 'y'}
                      </StatusBadge>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
