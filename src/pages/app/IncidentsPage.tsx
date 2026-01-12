import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Flame, 
  Plus, 
  Search, 
  Filter,
  MapPin,
  Clock,
  Users,
  AlertTriangle,
  ArrowRight,
  MoreHorizontal,
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
import { mockIncidents } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function IncidentsPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");

  const filteredIncidents = mockIncidents.filter((incident) => {
    if (selectedStatus !== "all" && incident.status !== selectedStatus) return false;
    if (selectedPriority !== "all" && incident.priority !== selectedPriority) return false;
    return true;
  });

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
      case "extinguished": return "success";
      default: return "neutral";
    }
  };

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "critical": return "critical";
      case "high": return "warning";
      case "medium": return "info";
      default: return "neutral";
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Incidents</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Track and manage active wildfire incidents
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create Incident
          </Button>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Active Incidents"
            value={mockIncidents.filter(i => !["extinguished", "false_alarm"].includes(i.status)).length}
            icon={Flame}
            variant="warning"
          />
          <StatCard
            title="Critical Priority"
            value={mockIncidents.filter(i => i.priority === "critical").length}
            subtitle="Requires immediate attention"
            variant="critical"
          />
          <StatCard
            title="Confirmed Fires"
            value={mockIncidents.filter(i => i.status === "confirmed").length}
          />
          <StatCard
            title="Linked Alerts"
            value={mockIncidents.reduce((acc, i) => acc + i.alertIds.length, 0)}
          />
        </div>
      </div>

      {/* Filters - scrollable on mobile */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9 bg-surface-1"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="suspected">Suspected</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="contained">Contained</SelectItem>
            <SelectItem value="controlled">Controlled</SelectItem>
            <SelectItem value="extinguished">Extinguished</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedPriority} onValueChange={setSelectedPriority}>
          <SelectTrigger className="w-32 md:w-40 bg-surface-1 shrink-0">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incident List */}
      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {filteredIncidents.map((incident) => (
            <Link
              key={incident.id}
              to={`/app/incidents/${incident.id}`}
              className={cn(
                "block rounded-xl border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]",
                incident.priority === "critical" && "border-critical/30",
                incident.priority === "high" && "border-warning/30",
              )}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Icon */}
                <div className={cn(
                  "flex h-10 w-10 md:h-14 md:w-14 items-center justify-center rounded-xl shrink-0",
                  incident.priority === "critical" && "bg-critical/20",
                  incident.priority === "high" && "bg-warning/20",
                  incident.priority === "medium" && "bg-info/20",
                  incident.priority === "low" && "bg-muted",
                )}>
                  <Flame className={cn(
                    "h-5 w-5 md:h-7 md:w-7",
                    incident.priority === "critical" && "text-critical",
                    incident.priority === "high" && "text-warning",
                    incident.priority === "medium" && "text-info",
                    incident.priority === "low" && "text-muted-foreground",
                  )} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-base md:text-lg font-semibold">{incident.name}</h3>
                    <StatusBadge variant={getStatusVariant(incident.status)}>
                      {incident.status.replace("_", " ").toUpperCase()}
                    </StatusBadge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm text-muted-foreground mb-2 md:mb-3">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      {formatTimeAgo(incident.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
                      {incident.alertIds.length} alert{incident.alertIds.length !== 1 ? 's' : ''}
                    </span>
                    <span className="hidden sm:flex items-center gap-1">
                      <strong className="text-foreground">{incident.confidence}%</strong> confidence
                    </span>
                  </div>

                  {/* Quick actions - hidden on mobile */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Predictions
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Perimeter
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
