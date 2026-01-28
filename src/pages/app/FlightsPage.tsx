import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plane, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Upload,
  ArrowRight,
  MoreHorizontal,
  Target,
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
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { mockMissions, mockDrones } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function FlightsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const filteredMissions = mockMissions.filter((mission) => {
    if (selectedStatus !== "all" && mission.status !== selectedStatus) return false;
    return true;
  });

  const activeMissions = mockMissions.filter(m => m.status === "in_progress").length;
  const completedToday = mockMissions.filter(m => m.status === "completed").length;

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getDrone = (droneId: string) => mockDrones.find(d => d.id === droneId);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "in_progress": return "warning";
      case "completed": return "success";
      case "planned": return "info";
      case "aborted": case "cancelled": return "critical";
      default: return "neutral";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">UAV Flights</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Manage drone missions and process outputs
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Mission
          </Button>
        </div>

        {/* Stats - responsive grid */}
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
            value={mockDrones.filter(d => d.status === "online").length}
            subtitle={`of ${mockDrones.length} total`}
          />
          <StatCard
            title="Flight Hours (24h)"
            value="4.5h"
            icon={Clock}
          />
        </div>
      </div>

      {/* Filters - scrollable on mobile */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search missions..."
            className="pl-9 bg-surface-1"
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
        <Button variant="outline" size="sm" className="shrink-0">
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
            const progress = isActive ? 65 : mission.status === "completed" ? 100 : 0;

            return (
              <div
                key={mission.id}
                className={cn(
                  "rounded-xl border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]",
                  isActive && "border-warning/30",
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-xl",
                    isActive && "bg-warning/20",
                    mission.status === "completed" && "bg-success/20",
                    mission.status === "planned" && "bg-info/20",
                    ["aborted", "cancelled"].includes(mission.status) && "bg-critical/20",
                  )}>
                    <Plane className={cn(
                      "h-7 w-7",
                      isActive && "text-warning",
                      mission.status === "completed" && "text-success",
                      mission.status === "planned" && "text-info",
                      ["aborted", "cancelled"].includes(mission.status) && "text-critical",
                    )} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">Mission {mission.id.split("-")[1]}</h3>
                      <StatusBadge variant={getStatusVariant(mission.status)}>
                        {mission.status.replace("_", " ").toUpperCase()}
                      </StatusBadge>
                      <Badge variant="outline" className="capitalize">
                        {mission.type.replace("_", " ")}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
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
                        {mission.startTime ? formatTimeAgo(mission.startTime) : "Scheduled"}
                      </span>
                    </div>

                    {/* Progress bar for active missions */}
                    {isActive && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Mission Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Completed mission outputs */}
                    {mission.status === "completed" && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Orthomosaic Ready
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Thermal Layer
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          3 Hotspots Detected
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {mission.status === "planned" && (
                      <Button size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {mission.status === "completed" && (
                      <Button size="sm" variant="outline">
                        <Upload className="h-4 w-4 mr-1" />
                        Process
                      </Button>
                    )}
                    {isActive && (
                      <Button size="sm" variant="outline">
                        View Live
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
                        <DropdownMenuItem>View on Map</DropdownMenuItem>
                        <DropdownMenuItem>Edit Mission</DropdownMenuItem>
                        <DropdownMenuItem>Clone Mission</DropdownMenuItem>
                        {isActive && (
                          <DropdownMenuItem className="text-critical">
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
        </div>
      </ScrollArea>
    </div>
  );
}
