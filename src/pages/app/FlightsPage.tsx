// src/pages/app/FlightsPage.tsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plane,
  Plus,
  Search,
  Filter,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Upload,
  ArrowRight,
  MoreHorizontal,
  Target,
  FileDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";

type MissionType = "thermal" | "mapping";
const MISSION_TYPES: readonly MissionType[] = ["thermal", "mapping"] as const;

function asMissionType(
  value: string | null | undefined,
  fallback: MissionType = "thermal"
): MissionType {
  const v = (value || "").trim().toLowerCase();
  return (MISSION_TYPES as readonly string[]).includes(v)
    ? (v as MissionType)
    : fallback;
}

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

export default function FlightsPage() {
  const {
    missions,
    drones,
    createMission,
    startMission,
    abortMission,
    markMissionCompleted,
  } = useDemoStore();

  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [q, setQ] = useState("");

  const filteredMissions = useMemo(() => {
    const query = q.trim().toLowerCase();
    return missions.filter((mission) => {
      if (selectedStatus !== "all" && mission.status !== selectedStatus)
        return false;
      if (!query) return true;
      const drone = drones.find((d) => d.id === mission.droneId);
      const hay = [mission.id, mission.status, mission.type, drone?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [missions, drones, selectedStatus, q]);

  const activeMissions = missions.filter(
    (m) => m.status === "in_progress"
  ).length;
  const completedToday = missions.filter(
    (m) => m.status === "completed"
  ).length;

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getDrone = (droneId: string) => drones.find((d) => d.id === droneId);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "in_progress":
        return "warning";
      case "completed":
        return "success";
      case "planned":
        return "info";
      case "aborted":
      case "cancelled":
        return "critical";
      default:
        return "neutral";
    }
  };

  const onCreateMission = () => {
    const online = drones.filter((d) => d.status === "online");
    if (online.length === 0) {
      window.alert("No online drones available.");
      return;
    }

    const droneId =
      window.prompt(`Drone id (e.g. ${online[0].id})`, online[0].id) ||
      online[0].id;

    const typeRaw = window.prompt("Type: thermal / mapping", "thermal");
    const type = asMissionType(typeRaw, "thermal");

    const id = createMission(droneId, type);
    window.alert(`Created ${id}`);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              UAV Flights
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Manage drone missions and process outputs
            </p>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => downloadJson("missions.json", missions)}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="w-full sm:w-auto" onClick={onCreateMission}>
              <Plus className="h-4 w-4 mr-2" />
              Create Mission
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Active Missions"
            value={activeMissions}
            icon={Plane}
            variant="warning"
          />
          <StatCard
            title="Completed Today"
            value={completedToday}
            variant="success"
          />
          <StatCard
            title="Available Drones"
            value={drones.filter((d) => d.status === "online").length}
            subtitle={`of ${drones.length} total`}
          />
          <StatCard title="Flight Hours (24h)" value="4.5h" icon={Clock} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search missions..."
            className="pl-9 bg-surface-1"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="aborted">Aborted</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => window.alert("Demo: More filters placeholder")}
        >
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Mission List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {filteredMissions.map((mission) => {
            const drone = getDrone(mission.droneId);
            const isActive = mission.status === "in_progress";
            const progress = isActive
              ? 65
              : mission.status === "completed"
              ? 100
              : 0;

            return (
              <div
                key={mission.id}
                className={cn(
                  "rounded-xl border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]",
                  isActive && "border-warning/30"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-xl",
                      isActive && "bg-warning/20",
                      mission.status === "completed" && "bg-success/20",
                      mission.status === "planned" && "bg-info/20",
                      ["aborted", "cancelled"].includes(mission.status) &&
                        "bg-critical/20"
                    )}
                  >
                    <Plane
                      className={cn(
                        "h-7 w-7",
                        isActive && "text-warning",
                        mission.status === "completed" && "text-success",
                        mission.status === "planned" && "text-info",
                        ["aborted", "cancelled"].includes(mission.status) &&
                          "text-critical"
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">
                        Mission {mission.id.split("-")[1]}
                      </h3>
                      <StatusBadge variant={getStatusVariant(mission.status)}>
                        {mission.status.replace("_", " ").toUpperCase()}
                      </StatusBadge>
                      <Badge variant="outline" className="capitalize">
                        {mission.type.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Plane className="h-4 w-4" />
                        {drone?.name || "Unknown Drone"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        AOI: {mission.aoi.coordinates[0].length - 1} vertices
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {mission.startTime
                          ? formatTimeAgo(mission.startTime)
                          : "Scheduled"}
                      </span>
                    </div>

                    {isActive && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Mission Progress
                          </span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {mission.status === "completed" && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Orthomosaic Ready
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Thermal Layer
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {Math.floor(1 + Math.random() * 6)} Hotspots Detected
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {mission.status === "planned" && (
                      <Button
                        size="sm"
                        onClick={() => startMission(mission.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}

                    {mission.status === "in_progress" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markMissionCompleted(mission.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Done
                      </Button>
                    )}

                    {mission.status === "completed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          window.alert("Demo: Processing pipeline placeholder")
                        }
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Process
                      </Button>
                    )}

                    <Link to={`/app/flights/${mission.id}`}>
                      <Button size="sm" variant="ghost">
                        Details
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            downloadJson(`${mission.id}.json`, mission)
                          }
                        >
                          <FileDown className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            window.alert("Demo: View on map placeholder")
                          }
                        >
                          View on Map
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {mission.status === "in_progress" && (
                          <DropdownMenuItem
                            className="text-critical"
                            onClick={() => abortMission(mission.id)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Abort Mission
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMissions.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-10">
              No missions match your filters.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
