import { 
  Settings, 
  Users, 
  Shield,
  Key,
  Database,
  Activity,
  Bell,
  Globe,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminPage() {
  const mockUsers = [
    { id: "1", name: "Commander Johnson", email: "johnson@beeye.io", role: "incident_commander", status: "active" },
    { id: "2", name: "Operator Smith", email: "smith@beeye.io", role: "operator", status: "active" },
    { id: "3", name: "Analyst Chen", email: "chen@beeye.io", role: "analyst", status: "active" },
    { id: "4", name: "Responder Williams", email: "williams@beeye.io", role: "responder", status: "inactive" },
  ];

  const mockAuditLogs = [
    { time: "2m ago", action: "Alert acknowledged", user: "Operator Smith", target: "ALERT-001" },
    { time: "15m ago", action: "Incident status updated", user: "Commander Johnson", target: "INC-001" },
    { time: "32m ago", action: "Prediction run started", user: "System", target: "PRED-001" },
    { time: "1h ago", action: "User login", user: "Analyst Chen", target: "Session" },
    { time: "2h ago", action: "API key regenerated", user: "Admin", target: "API-002" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
            <p className="text-sm text-muted-foreground mt-1">
              System settings, user management, and audit logs
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="Active Users"
            value={mockUsers.filter(u => u.status === "active").length}
            icon={Users}
          />
          <StatCard
            title="API Keys"
            value={3}
            subtitle="2 active, 1 revoked"
            icon={Key}
          />
          <StatCard
            title="System Health"
            value="98.5%"
            variant="success"
            icon={Activity}
          />
          <StatCard
            title="Audit Events (24h)"
            value={156}
            icon={Shield}
          />
        </div>
      </div>

      <Tabs defaultValue="users" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-6 bg-card/50 border-b border-border rounded-none h-12">
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="users" className="p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Management</h2>
              <Button size="sm">
                <Users className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {mockUsers.map((user) => (
                <div key={user.id} className="grid grid-cols-5 gap-4 p-4 border-b border-border last:border-0 items-center">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>
                  <div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant={user.status === "active" ? "secondary" : "outline"}>
                      {user.status}
                    </Badge>
                  </div>
                  <div>
                    <Button size="sm" variant="ghost">Edit</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="api" className="p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">API Keys</h2>
              <Button size="sm">
                <Key className="h-4 w-4 mr-2" />
                Generate Key
              </Button>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">API Key Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Generate and manage API keys for external integrations.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="p-6 m-0">
            <h2 className="text-lg font-semibold mb-4">Audit Log</h2>
            <div className="rounded-xl border border-border bg-card">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Time</div>
                <div>Action</div>
                <div>User</div>
                <div>Target</div>
              </div>
              {mockAuditLogs.map((log, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-0 items-center text-sm">
                  <div className="text-muted-foreground">{log.time}</div>
                  <div className="font-medium">{log.action}</div>
                  <div className="text-muted-foreground">{log.user}</div>
                  <div>
                    <Badge variant="outline" className="font-mono text-xs">
                      {log.target}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-6 m-0">
            <h2 className="text-lg font-semibold mb-4">System Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure alert thresholds and notification channels.
                </p>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Integrations</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage external service connections and webhooks.
                </p>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Data Retention</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Set data retention policies and archival rules.
                </p>
                <Button size="sm" variant="outline">Configure</Button>
              </div>
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">System Health</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor system performance and resource usage.
                </p>
                <Button size="sm" variant="outline">View Dashboard</Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
