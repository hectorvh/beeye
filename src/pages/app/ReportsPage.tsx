import { 
  FileText, 
  Download, 
  Plus,
  Calendar,
  Clock,
  Search,
  Filter,
  BarChart3,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ReportsPage() {
  const mockReports = [
    {
      id: "report-001",
      name: "Fethiye Forest Fire - Incident Report",
      type: "incident",
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      createdBy: "Commander Johnson",
      status: "final",
    },
    {
      id: "report-002",
      name: "Weekly Operations Summary",
      type: "summary",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      createdBy: "System",
      status: "final",
    },
    {
      id: "report-003",
      name: "İzmir Coastal Wildfire - Evidence Pack",
      type: "evidence",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      createdBy: "Operator Smith",
      status: "draft",
    },
  ];

  const formatTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "incident": return <MapPin className="h-4 w-4" />;
      case "summary": return <BarChart3 className="h-4 w-4" />;
      case "evidence": return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Generate and manage incident reports and evidence packs
            </p>
          </div>
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        {/* Stats - responsive grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            title="Reports Generated"
            value={mockReports.length + 12}
            subtitle="This month"
            icon={FileText}
          />
          <StatCard
            title="Evidence Packs"
            value={8}
            subtitle="For active incidents"
          />
          <StatCard
            title="Pending Review"
            value={2}
            variant="warning"
          />
          <StatCard
            title="Avg. Generation Time"
            value="2.3m"
            subtitle="For full reports"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 md:gap-4 border-b border-border bg-card/50 px-4 md:px-6 py-3 overflow-x-auto">
        <div className="relative flex-1 max-w-sm min-w-[180px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search reports..."
            className="pl-9 bg-surface-1"
          />
        </div>
        <Button variant="outline" size="sm" className="shrink-0">
          <Calendar className="h-4 w-4 mr-2" />
          Date Range
        </Button>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 md:p-6 space-y-3 md:space-y-4">
          {mockReports.map((report) => (
            <div
              key={report.id}
              className="rounded-xl border border-border bg-card p-4 md:p-5 transition-all hover:bg-card/80 active:scale-[0.99]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2">
                  {getTypeIcon(report.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold">{report.name}</h3>
                    <Badge variant={report.status === "final" ? "secondary" : "outline"}>
                      {report.status.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {report.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      {report.createdBy}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      {formatTimeAgo(report.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Report Templates */}
          <div className="mt-6 md:mt-8">
            <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="rounded-xl border border-dashed border-border p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors">
                <FileText className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Incident Report</h3>
                <p className="text-sm text-muted-foreground">
                  Comprehensive incident documentation with timeline and actions taken.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-border p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors">
                <BarChart3 className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Operations Summary</h3>
                <p className="text-sm text-muted-foreground">
                  Weekly or daily summary of all operations and alerts.
                </p>
              </div>
              <div className="rounded-xl border border-dashed border-border p-4 md:p-5 hover:border-primary/50 cursor-pointer transition-colors">
                <Download className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="font-semibold mb-1">Evidence Pack</h3>
                <p className="text-sm text-muted-foreground">
                  Exportable bundle of all evidence for an incident.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
