// src/store/demoStore.tsx
import React, { createContext, useContext, useMemo, useState } from "react";
import type {
  Alert,
  Incident,
  DroneAsset,
  UavMission,
  PredictionRun,
  SpreadEnvelope,
  ImpactSummary,
} from "@/types";
import {
  mockAlerts,
  mockIncidents,
  mockDrones,
  mockMissions,
  mockPredictionRuns,
  mockSpreadEnvelopes,
  mockImpactSummary,
} from "@/data/mockData";

type DemoUser = {
  id: string;
  name: string;
  email: string;
  role: "incident_commander" | "operator" | "analyst" | "responder" | "admin";
  status: "active" | "inactive";
};

type AuditLog = {
  id: string;
  timeISO: string;
  action: string;
  user: string;
  target: string;
  detail?: string;
};

type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  status: "active" | "revoked";
  createdAt: string;
  lastUsedAt?: string;
};

type SystemSettings = {
  notificationsEnabled: boolean;
  defaultRegion: string;
  dataRetentionDays: number;
};

type DemoState = {
  alerts: Alert[];
  incidents: Incident[];
  drones: DroneAsset[];
  missions: UavMission[];
  predictionRuns: PredictionRun[];
  spreadEnvelopes: SpreadEnvelope[];
  impactSummary: ImpactSummary;

  users: DemoUser[];
  auditLogs: AuditLog[];
  apiKeys: ApiKey[];
  settings: SystemSettings;

  me: { id: string; name: string; role: string };
};

type DemoActions = {
  // Alerts
  acknowledgeAlert: (alertId: string) => void;
  dismissAlert: (alertId: string, reason?: string) => void;
  resolveAlert: (alertId: string) => void;
  createIncidentFromAlert: (alertId: string) => string | null;
  linkAlertToIncident: (alertId: string, incidentId: string) => void;

  // Incidents
  createIncident: (name: string, priority?: Incident["priority"]) => string;
  updateIncidentStatus: (
    incidentId: string,
    status: Incident["status"]
  ) => void;

  // Predictions
  runPrediction: (incidentId: string) => string;

  // Missions
  createMission: (droneId: string, type: UavMission["type"]) => string;
  startMission: (missionId: string) => void;
  abortMission: (missionId: string) => void;
  markMissionCompleted: (missionId: string) => void;

  // Admin
  addUser: (u: Omit<DemoUser, "id">) => void;
  toggleUserStatus: (userId: string) => void;
  generateApiKey: (label?: string) => void;
  revokeApiKey: (keyId: string) => void;
  toggleNotifications: () => void;
  setRetentionDays: (days: number) => void;
};

type DemoContextValue = DemoState & DemoActions;

const DemoContext = createContext<DemoContextValue | null>(null);

const nowISO = () => new Date().toISOString();

const formatTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const randInt = (min: number, max: number) =>
  Math.floor(min + Math.random() * (max - min + 1));

const makeId = (prefix: string) =>
  `${prefix}-${String(Math.random()).slice(2, 8)}-${Date.now()
    .toString()
    .slice(-4)}`;

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

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [drones] = useState<DroneAsset[]>(mockDrones);
  const [missions, setMissions] = useState<UavMission[]>(mockMissions);

  const [predictionRuns, setPredictionRuns] =
    useState<PredictionRun[]>(mockPredictionRuns);
  const [spreadEnvelopes, setSpreadEnvelopes] =
    useState<SpreadEnvelope[]>(mockSpreadEnvelopes);
  const [impactSummary, setImpactSummary] =
    useState<ImpactSummary>(mockImpactSummary);

  const [users, setUsers] = useState<DemoUser[]>([
    {
      id: "user-001",
      name: "Operator Smith",
      email: "smith@beeye.io",
      role: "operator",
      status: "active",
    },
    {
      id: "user-002",
      name: "Commander Johnson",
      email: "johnson@beeye.io",
      role: "incident_commander",
      status: "active",
    },
    {
      id: "user-003",
      name: "Analyst Chen",
      email: "chen@beeye.io",
      role: "analyst",
      status: "active",
    },
    {
      id: "user-004",
      name: "Responder Williams",
      email: "williams@beeye.io",
      role: "responder",
      status: "inactive",
    },
    {
      id: "user-999",
      name: "Admin",
      email: "admin@beeye.io",
      role: "admin",
      status: "active",
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: "log-001",
      timeISO: nowISO(),
      action: "System boot",
      user: "System",
      target: "Cluster",
      detail: "All services healthy",
    },
    {
      id: "log-002",
      timeISO: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      action: "Alert acknowledged",
      user: "Operator Smith",
      target: "ALERT-002",
    },
    {
      id: "log-003",
      timeISO: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      action: "Mission started",
      user: "System",
      target: "MISSION-002",
    },
  ]);

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "api-001",
      label: "Partner Integration",
      prefix: "bk_live_",
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: "api-002",
      label: "Mobile App",
      prefix: "bk_live_",
      status: "active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
    {
      id: "api-003",
      label: "Old Key",
      prefix: "bk_live_",
      status: "revoked",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    },
  ]);

  const [settings, setSettings] = useState<SystemSettings>({
    notificationsEnabled: true,
    defaultRegion: "TR-SW",
    dataRetentionDays: 30,
  });

  const me = useMemo(
    () => ({ id: "user-999", name: "Admin", role: "admin" }),
    []
  );

  const pushLog = (entry: Omit<AuditLog, "id" | "timeISO">) => {
    setAuditLogs((prev) => [
      { id: makeId("log"), timeISO: nowISO(), ...entry },
      ...prev,
    ]);
  };

  // ---------- Actions ----------
  const acknowledgeAlert: DemoActions["acknowledgeAlert"] = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: "acknowledged",
              acknowledgedBy: me.id,
              acknowledgedAt: nowISO(),
              updatedAt: nowISO(),
            }
          : a
      )
    );
    pushLog({
      action: "Alert acknowledged",
      user: me.name,
      target: alertId.toUpperCase(),
    });
  };

  const dismissAlert: DemoActions["dismissAlert"] = (alertId, reason) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              status: "dismissed",
              updatedAt: nowISO(),
              recommendedAction: reason
                ? `Dismissed: ${reason}`
                : a.recommendedAction,
            }
          : a
      )
    );
    pushLog({
      action: "Alert dismissed",
      user: me.name,
      target: alertId.toUpperCase(),
      detail: reason,
    });
  };

  const resolveAlert: DemoActions["resolveAlert"] = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, status: "resolved", updatedAt: nowISO() } : a
      )
    );
    pushLog({
      action: "Alert resolved",
      user: me.name,
      target: alertId.toUpperCase(),
    });
  };

  const createIncident = (
    name: string,
    priority: Incident["priority"] = "high"
  ) => {
    const id = makeId("incident");
    const newIncident: Incident = {
      id,
      name,
      status: "suspected",
      priority,
      confidence: randInt(65, 92),
      location: {
        type: "Point",
        coordinates: [27 + Math.random() * 5, 36.5 + Math.random() * 2.5],
      },
      alertIds: [],
      createdAt: nowISO(),
      updatedAt: nowISO(),
      commanderId: "user-002",
    };
    setIncidents((prev) => [newIncident, ...prev]);
    pushLog({
      action: "Incident created",
      user: me.name,
      target: id.toUpperCase(),
      detail: name,
    });
    return id;
  };

  const createIncidentFromAlert: DemoActions["createIncidentFromAlert"] = (
    alertId
  ) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (!alert) return null;

    const id = makeId("incident");
    const newIncident: Incident = {
      id,
      name: `Incident from ${alertId.toUpperCase()}`,
      status: "suspected",
      priority:
        alert.severity === "critical"
          ? "critical"
          : alert.severity === "high"
          ? "high"
          : "medium",
      confidence: Math.min(99, Math.max(55, alert.confidence + randInt(-5, 8))),
      location: alert.location,
      alertIds: [alertId],
      createdAt: nowISO(),
      updatedAt: nowISO(),
      commanderId: "user-002",
    };

    setIncidents((prev) => [newIncident, ...prev]);

    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: "escalated", incidentId: id, updatedAt: nowISO() }
          : a
      )
    );

    pushLog({
      action: "Incident created from alert",
      user: me.name,
      target: id.toUpperCase(),
      detail: `${alertId.toUpperCase()} linked`,
    });

    return id;
  };

  const linkAlertToIncident: DemoActions["linkAlertToIncident"] = (
    alertId,
    incidentId
  ) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId
          ? {
              ...i,
              alertIds: Array.from(new Set([...(i.alertIds || []), alertId])),
              updatedAt: nowISO(),
            }
          : i
      )
    );
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, incidentId, status: "verifying", updatedAt: nowISO() }
          : a
      )
    );
    pushLog({
      action: "Alert linked",
      user: me.name,
      target: `${alertId.toUpperCase()} → ${incidentId.toUpperCase()}`,
    });
  };

  const updateIncidentStatus: DemoActions["updateIncidentStatus"] = (
    incidentId,
    status
  ) => {
    setIncidents((prev) =>
      prev.map((i) =>
        i.id === incidentId ? { ...i, status, updatedAt: nowISO() } : i
      )
    );
    pushLog({
      action: "Incident status updated",
      user: me.name,
      target: incidentId.toUpperCase(),
      detail: status,
    });
  };

  const runPrediction: DemoActions["runPrediction"] = (incidentId) => {
    const runId = makeId("pred");
    const modelVersion = `v2.${randInt(3, 6)}.${randInt(0, 9)}`;

    const run: PredictionRun = {
      id: runId,
      scope: "incident",
      incidentId,
      modelVersion,
      status: "completed",
      createdAt: nowISO(),
      completedAt: new Date(Date.now() + 1000 * 4).toISOString(),
    };

    setPredictionRuns((prev) => [run, ...prev]);

    const env1: SpreadEnvelope = {
      id: makeId("spread"),
      runId,
      tPlusHours: 1,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [27.1 + Math.random() * 2, 36.6 + Math.random() * 1.2],
            [27.2 + Math.random() * 2, 36.6 + Math.random() * 1.2],
            [27.2 + Math.random() * 2, 36.5 + Math.random() * 1.2],
            [27.1 + Math.random() * 2, 36.5 + Math.random() * 1.2],
            [27.1 + Math.random() * 2, 36.6 + Math.random() * 1.2],
          ],
        ],
      },
      probabilityBand: "likely",
    };

    const env2: SpreadEnvelope = {
      id: makeId("spread"),
      runId,
      tPlusHours: 3,
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [27.0 + Math.random() * 2.2, 36.7 + Math.random() * 1.4],
            [27.3 + Math.random() * 2.2, 36.7 + Math.random() * 1.4],
            [27.3 + Math.random() * 2.2, 36.4 + Math.random() * 1.4],
            [27.0 + Math.random() * 2.2, 36.4 + Math.random() * 1.4],
            [27.0 + Math.random() * 2.2, 36.7 + Math.random() * 1.4],
          ],
        ],
      },
      probabilityBand: "possible",
    };

    setSpreadEnvelopes((prev) => [env1, env2, ...prev]);

    setImpactSummary((prev) => ({
      ...prev,
      id: makeId("impact"),
      runId,
      assetsAtRiskCount: randInt(12, 85),
      roadsThreatenedCount: randInt(0, 7),
      wuiExposureScore: randInt(35, 92),
      narrativeDrivers: [
        "Wind shift expected in ~2 hours could accelerate spread",
        "WUI exposure increases if humidity drops below 15%",
        "Road access constrained in 2 segments (potential choke points)",
        "Water sources: 1–3 viable points within 5–8km",
      ],
    }));

    pushLog({
      action: "Prediction run completed",
      user: "AI Model",
      target: runId.toUpperCase(),
      detail: `${modelVersion} for ${incidentId.toUpperCase()}`,
    });
    return runId;
  };

  const createMission: DemoActions["createMission"] = (droneId, type) => {
    const id = makeId("mission");
    const mission: UavMission = {
      id,
      droneId,
      status: "planned",
      type,
      aoi: {
        type: "Polygon",
        coordinates: [
          [
            [27.1 + Math.random() * 2, 36.7 + Math.random() * 1.2],
            [27.18 + Math.random() * 2, 36.7 + Math.random() * 1.2],
            [27.18 + Math.random() * 2, 36.62 + Math.random() * 1.2],
            [27.1 + Math.random() * 2, 36.62 + Math.random() * 1.2],
            [27.1 + Math.random() * 2, 36.7 + Math.random() * 1.2],
          ],
        ],
      },
      assignedTo: me.id,
      createdAt: nowISO(),
    };
    setMissions((prev) => [mission, ...prev]);
    pushLog({
      action: "Mission created",
      user: me.name,
      target: id.toUpperCase(),
      detail: `${type} / ${droneId}`,
    });
    return id;
  };

  const startMission: DemoActions["startMission"] = (missionId) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? { ...m, status: "in_progress", startTime: nowISO() }
          : m
      )
    );
    pushLog({
      action: "Mission started",
      user: "System",
      target: missionId.toUpperCase(),
    });
  };

  const abortMission: DemoActions["abortMission"] = (missionId) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId ? { ...m, status: "aborted", endTime: nowISO() } : m
      )
    );
    pushLog({
      action: "Mission aborted",
      user: me.name,
      target: missionId.toUpperCase(),
    });
  };

  const markMissionCompleted: DemoActions["markMissionCompleted"] = (
    missionId
  ) => {
    setMissions((prev) =>
      prev.map((m) =>
        m.id === missionId
          ? { ...m, status: "completed", endTime: nowISO() }
          : m
      )
    );
    pushLog({
      action: "Mission completed",
      user: "System",
      target: missionId.toUpperCase(),
    });
  };

  const addUser: DemoActions["addUser"] = (u) => {
    const id = makeId("user");
    setUsers((prev) => [{ id, ...u }, ...prev]);
    pushLog({
      action: "User added",
      user: me.name,
      target: id.toUpperCase(),
      detail: u.email,
    });
  };

  const toggleUserStatus: DemoActions["toggleUserStatus"] = (userId) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === "active" ? "inactive" : "active" }
          : u
      )
    );
    pushLog({
      action: "User status toggled",
      user: me.name,
      target: userId.toUpperCase(),
    });
  };

  const generateApiKey: DemoActions["generateApiKey"] = (label = "New Key") => {
    const id = makeId("api");
    setApiKeys((prev) => [
      {
        id,
        label,
        prefix: "bk_live_",
        status: "active",
        createdAt: nowISO(),
        lastUsedAt: undefined,
      },
      ...prev,
    ]);
    pushLog({
      action: "API key generated",
      user: me.name,
      target: id.toUpperCase(),
      detail: label,
    });
    // demo: descarga el valor "secreto" una sola vez
    downloadJson(`${id}-secret.json`, {
      id,
      secret: `bk_live_${makeId("sk")}${makeId("sk")}`,
    });
  };

  const revokeApiKey: DemoActions["revokeApiKey"] = (keyId) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" } : k))
    );
    pushLog({
      action: "API key revoked",
      user: me.name,
      target: keyId.toUpperCase(),
    });
  };

  const toggleNotifications: DemoActions["toggleNotifications"] = () => {
    setSettings((prev) => ({
      ...prev,
      notificationsEnabled: !prev.notificationsEnabled,
    }));
    pushLog({
      action: "Notifications toggled",
      user: me.name,
      target: "SETTINGS",
      detail: "notificationsEnabled",
    });
  };

  const setRetentionDays: DemoActions["setRetentionDays"] = (days) => {
    setSettings((prev) => ({
      ...prev,
      dataRetentionDays: Math.max(1, Math.min(365, days)),
    }));
    pushLog({
      action: "Retention updated",
      user: me.name,
      target: "SETTINGS",
      detail: `dataRetentionDays=${days}`,
    });
  };

  const value: DemoContextValue = {
    alerts,
    incidents,
    drones,
    missions,
    predictionRuns,
    spreadEnvelopes,
    impactSummary,

    users,
    auditLogs,
    apiKeys,
    settings,
    me,

    acknowledgeAlert,
    dismissAlert,
    resolveAlert,
    createIncidentFromAlert,
    linkAlertToIncident,

    createIncident,
    updateIncidentStatus,

    runPrediction,

    createMission,
    startMission,
    abortMission,
    markMissionCompleted,

    addUser,
    toggleUserStatus,
    generateApiKey,
    revokeApiKey,
    toggleNotifications,
    setRetentionDays,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoContext);
  if (!ctx)
    throw new Error("useDemoStore must be used inside <DemoProvider />");
  return ctx;
}

export const demoUtils = { formatTimeAgo };
