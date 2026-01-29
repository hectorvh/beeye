// src/pages/app/AdminPage.tsx
import {
  Users,
  Shield,
  Key,
  Database,
  Activity,
  Bell,
  Globe,
  Server,
  Download,
  RefreshCcw,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useDemoStore } from "@/store/demoStore";
import { cn } from "@/lib/utils";

type Role =
  | "admin"
  | "operator"
  | "analyst"
  | "responder"
  | "incident_commander";

const ROLE_VALUES: readonly Role[] = [
  "admin",
  "operator",
  "analyst",
  "responder",
  "incident_commander",
] as const;

function asRole(
  value: string | null | undefined,
  fallback: Role = "operator"
): Role {
  const v = (value || "").trim().toLowerCase();
  return (ROLE_VALUES as readonly string[]).includes(v)
    ? (v as Role)
    : fallback;
}

function clampNumber(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
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

export default function AdminPage() {
  const {
    users,
    auditLogs,
    apiKeys,
    settings,
    addUser,
    toggleUserStatus,
    generateApiKey,
    revokeApiKey,
    toggleNotifications,
    setRetentionDays,
  } = useDemoStore();

  const activeUsers = users.filter((u) => u.status === "active").length;
  const activeKeys = apiKeys.filter((k) => k.status === "active").length;

  const onAddUser = () => {
    const name = window.prompt("Name (e.g., Jane Doe)");
    if (!name) return;

    const email = window.prompt("Email");
    if (!email) return;

    const roleRaw = window.prompt(
      "Role: admin / operator / analyst / responder / incident_commander",
      "operator"
    );

    const role = asRole(roleRaw, "operator");
    addUser({ name, email, role, status: "active" });
  };

  const onGenerateKey = () => {
    const label = window.prompt("API key label", "New Integration");
    generateApiKey(label || "New Integration");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card p-4 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Administration
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              System settings, user management, and audit logs
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadJson("admin-export.json", {
                  users,
                  apiKeys,
                  settings,
                  auditLogs,
                })
              }
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="Active Users" value={activeUsers} icon={Users} />
          <StatCard
            title="API Keys"
            value={apiKeys.length}
            subtitle={`${activeKeys} active, ${
              apiKeys.length - activeKeys
            } revoked`}
            icon={Key}
          />
          <StatCard
            title="System Health"
            value="98.5%"
            variant="success"
            icon={Activity}
            subtitle={
              settings.notificationsEnabled
                ? "Notifications ON"
                : "Notifications OFF"
            }
          />
          <StatCard
            title="Audit Events (24h)"
            value={Math.min(999, auditLogs.length)}
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
          {/* USERS */}
          <TabsContent value="users" className="p-4 md:p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">User Management</h2>
              <Button size="sm" onClick={onAddUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Name</div>
                <div>Email</div>
                <div>Role</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-5 gap-4 p-4 border-b border-border last:border-0 items-center"
                >
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {user.email}
                  </div>
                  <div>
                    <Badge variant="outline" className="capitalize text-xs">
                      {user.role.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <Badge
                      variant={
                        user.status === "active" ? "secondary" : "outline"
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleUserStatus(user.id)}
                    >
                      Toggle
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* API KEYS */}
          <TabsContent value="api" className="p-4 md:p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">API Keys</h2>
              <Button size="sm" onClick={onGenerateKey}>
                <Key className="h-4 w-4 mr-2" />
                Generate Key
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-5 gap-4 p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Label</div>
                <div>Status</div>
                <div>Prefix</div>
                <div>Created</div>
                <div>Actions</div>
              </div>

              {apiKeys.map((k) => (
                <div
                  key={k.id}
                  className="grid grid-cols-5 gap-4 p-4 border-b border-border last:border-0 items-center"
                >
                  <div className="font-medium">{k.label}</div>
                  <div>
                    <Badge
                      variant={k.status === "active" ? "secondary" : "outline"}
                    >
                      {k.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {k.prefix}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(k.createdAt).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadJson(`${k.id}.json`, k)}
                    >
                      Export
                    </Button>
                    {k.status === "active" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-critical"
                        onClick={() => revokeApiKey(k.id)}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" disabled>
                        Revoked
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* AUDIT */}
          <TabsContent value="audit" className="p-4 md:p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Audit Log</h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadJson("audit-log.json", auditLogs)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-4 gap-4 p-4 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <div>Time</div>
                <div>Action</div>
                <div>User</div>
                <div>Target</div>
              </div>

              {auditLogs.slice(0, 200).map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-4 gap-4 p-4 border-b border-border last:border-0 items-center text-sm"
                >
                  <div className="text-muted-foreground">
                    {new Date(log.timeISO).toLocaleString()}
                  </div>
                  <div className="font-medium">
                    {log.action}
                    {log.detail ? (
                      <span className="text-muted-foreground">
                        {" "}
                        — {log.detail}
                      </span>
                    ) : null}
                  </div>
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

          {/* SETTINGS */}
          <TabsContent value="settings" className="p-4 md:p-6 m-0">
            <h2 className="text-lg font-semibold mb-4">System Settings</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Notifications</h3>
                  <Badge
                    className={cn(
                      "ml-auto",
                      settings.notificationsEnabled
                        ? "bg-success/20 text-success"
                        : "bg-muted"
                    )}
                    variant="secondary"
                  >
                    {settings.notificationsEnabled ? "ON" : "OFF"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure alert thresholds and notification channels.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleNotifications}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Toggle
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Integrations</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage external service connections and webhooks.
                </p>
                <Button size="sm" variant="outline" onClick={onGenerateKey}>
                  <Key className="h-4 w-4 mr-2" />
                  Generate key
                </Button>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Data Retention</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Set data retention policies and archival rules.
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    defaultValue={settings.dataRetentionDays}
                    onBlur={(e) => {
                      const n = clampNumber(Number(e.target.value), 1, 365);
                      setRetentionDays(n);
                    }}
                  />
                  <Badge variant="outline">days</Badge>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 md:p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">System Health</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor system performance and resource usage.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    window.alert("Demo: Health dashboard placeholder")
                  }
                >
                  View Dashboard
                </Button>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
