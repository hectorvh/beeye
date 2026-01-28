import type {
  Alert,
  Incident,
  WeatherStation,
  WeatherObservation,
  GroundStationGateway,
  BalloonAsset,
  BalloonDetectionEvent,
  DroneAsset,
  UavMission,
  PredictionRun,
  SpreadEnvelope,
  ImpactSummary,
} from "@/types";

// Helper to generate random coordinates in SW Turkey (Muğla/Antalya/İzmir region)
const randomTurkeyCoords = () => ({
  lat: 36.5 + Math.random() * 2.5, // 36.5 to 39.0 (SW Turkey)
  lng: 27.0 + Math.random() * 5.5, // 27.0 to 32.5 (SW Turkey)
});

// Mock Alerts - Turkey locations
export const mockAlerts: Alert[] = [
  {
    id: "alert-001",
    location: { type: "Point", coordinates: [28.27, 36.85] }, // Marmaris, Muğla
    severity: "critical",
    confidence: 92,
    status: "new",
    sources: ["satellite", "balloon"],
    topDrivers: ["High smoke density", "Thermal anomaly +45°C", "Low humidity 12%"],
    recommendedAction: "Immediate aerial verification recommended",
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "alert-002",
    location: { type: "Point", coordinates: [31.44, 36.78] }, // Manavgat, Antalya
    severity: "high",
    confidence: 78,
    status: "acknowledged",
    sources: ["weather_station", "ai_prediction"],
    topDrivers: ["Rapid temperature rise", "Wind shift detected", "FWI above threshold"],
    recommendedAction: "Ground verification within 30 minutes",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    acknowledgedBy: "user-001",
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "alert-003",
    location: { type: "Point", coordinates: [29.12, 36.62] }, // Fethiye, Muğla
    severity: "medium",
    confidence: 65,
    status: "verifying",
    sources: ["ground_report"],
    topDrivers: ["Smoke report from observer", "Moderate wind conditions"],
    recommendedAction: "Monitor and dispatch if confirmed",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    incidentId: "incident-001",
  },
  {
    id: "alert-004",
    location: { type: "Point", coordinates: [27.84, 37.84] }, // Aydın
    severity: "low",
    confidence: 45,
    status: "new",
    sources: ["ai_prediction"],
    topDrivers: ["Elevated fire weather conditions", "Historical fire area"],
    recommendedAction: "Passive monitoring recommended",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: "alert-005",
    location: { type: "Point", coordinates: [27.14, 38.42] }, // İzmir
    severity: "high",
    confidence: 85,
    status: "escalated",
    sources: ["satellite", "uav"],
    topDrivers: ["Active fire growth", "Urban-wildland interface", "High population density"],
    recommendedAction: "Immediate response required",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    incidentId: "incident-002",
  },
];

// Mock Incidents - Turkey locations
export const mockIncidents: Incident[] = [
  {
    id: "incident-001",
    name: "Fethiye Forest Fire",
    status: "confirmed",
    priority: "high",
    confidence: 95,
    location: { type: "Point", coordinates: [29.12, 36.62] }, // Fethiye, Muğla
    perimeterGeometry: {
      type: "Polygon",
      coordinates: [[
        [29.10, 36.64],
        [29.14, 36.64],
        [29.14, 36.60],
        [29.10, 36.60],
        [29.10, 36.64],
      ]],
    },
    alertIds: ["alert-003"],
    commanderId: "user-002",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: "incident-002",
    name: "İzmir Coastal Wildfire",
    status: "suspected",
    priority: "critical",
    confidence: 88,
    location: { type: "Point", coordinates: [27.14, 38.42] }, // İzmir
    alertIds: ["alert-005"],
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

// Mock Weather Stations - Turkey locations
export const mockWeatherStations: WeatherStation[] = Array.from({ length: 10 }, (_, i) => {
  const coords = randomTurkeyCoords();
  return {
    id: `ws-${String(i + 1).padStart(3, "0")}`,
    name: `Weather Station ${String(i + 1).padStart(3, "0")}`,
    location: { type: "Point" as const, coordinates: [coords.lng, coords.lat] },
    status: i === 3 ? "offline" : i === 7 ? "degraded" : "online",
    lastSeen: new Date(Date.now() - Math.random() * 1000 * 60 * 30).toISOString(),
    batteryLevel: Math.floor(60 + Math.random() * 40),
    metadata: { elevation: Math.floor(200 + Math.random() * 1500) },
  };
});

// Mock Ground Stations - Turkey locations
export const mockGroundStations: GroundStationGateway[] = [
  {
    id: "gs-001",
    name: "Antalya Gateway",
    location: { type: "Point", coordinates: [30.71, 36.90] }, // Antalya
    status: "online",
    lastSync: new Date(Date.now() - 1000 * 30).toISOString(),
    bufferQueueSize: 12,
  },
  {
    id: "gs-002",
    name: "Muğla Gateway",
    location: { type: "Point", coordinates: [28.37, 37.22] }, // Muğla
    status: "online",
    lastSync: new Date(Date.now() - 1000 * 45).toISOString(),
    bufferQueueSize: 8,
  },
];

// Mock Balloon Assets - Turkey locations
export const mockBalloons: BalloonAsset[] = [
  {
    id: "balloon-001",
    name: "Sentinel Alpha",
    location: { type: "Point", coordinates: [28.5, 37.0] }, // Muğla region
    status: "online",
    payloadType: "multispectral",
    coverageRadius: 50,
    lastSeen: new Date(Date.now() - 1000 * 60).toISOString(),
  },
];

// Mock Balloon Detection Events - Turkey locations
export const mockBalloonEvents: BalloonDetectionEvent[] = [
  {
    id: "bde-001",
    balloonId: "balloon-001",
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    smokeProbability: 0.89,
    thermalAnomalyScore: 0.76,
    location: { type: "Point", coordinates: [28.48, 36.98] }, // Near Marmaris
  },
];

// Mock Drone Assets
export const mockDrones: DroneAsset[] = [
  {
    id: "drone-001",
    name: "Recon Eagle 1",
    type: "fixed-wing",
    payload: "thermal",
    status: "online",
  },
  {
    id: "drone-002",
    name: "Mapper Hawk 2",
    type: "multirotor",
    payload: "multispectral",
    status: "online",
  },
];

// Mock UAV Missions - Turkey locations
export const mockMissions: UavMission[] = [
  {
    id: "mission-001",
    droneId: "drone-001",
    status: "completed",
    type: "thermal",
    aoi: {
      type: "Polygon",
      coordinates: [[
        [29.10, 36.64],
        [29.14, 36.64],
        [29.14, 36.60],
        [29.10, 36.60],
        [29.10, 36.64],
      ]], // Fethiye area
    },
    assignedTo: "user-003",
    startTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    endTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: "mission-002",
    droneId: "drone-002",
    status: "in_progress",
    type: "mapping",
    aoi: {
      type: "Polygon",
      coordinates: [[
        [27.10, 38.45],
        [27.18, 38.45],
        [27.18, 38.39],
        [27.10, 38.39],
        [27.10, 38.45],
      ]], // İzmir area
    },
    assignedTo: "user-003",
    startTime: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
];

// Mock Prediction Run
export const mockPredictionRuns: PredictionRun[] = [
  {
    id: "pred-001",
    scope: "incident",
    incidentId: "incident-001",
    modelVersion: "v2.3.1",
    status: "completed",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
];

// Mock Spread Envelopes - Turkey locations
export const mockSpreadEnvelopes: SpreadEnvelope[] = [
  {
    id: "spread-001-1h",
    runId: "pred-001",
    tPlusHours: 1,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [29.11, 36.63],
        [29.13, 36.63],
        [29.13, 36.61],
        [29.11, 36.61],
        [29.11, 36.63],
      ]], // Fethiye area
    },
    probabilityBand: "likely",
  },
  {
    id: "spread-001-3h",
    runId: "pred-001",
    tPlusHours: 3,
    geometry: {
      type: "Polygon",
      coordinates: [[
        [29.10, 36.64],
        [29.14, 36.64],
        [29.14, 36.60],
        [29.10, 36.60],
        [29.10, 36.64],
      ]], // Fethiye expanded area
    },
    probabilityBand: "possible",
  },
];

// Mock Impact Summary - Turkey context
export const mockImpactSummary: ImpactSummary = {
  id: "impact-001",
  runId: "pred-001",
  assetsAtRiskCount: 47,
  roadsThreatenedCount: 3,
  wuiExposureScore: 72,
  narrativeDrivers: [
    "Wind shift expected in 2 hours could accelerate eastward spread",
    "3 residential communities within 6-hour forecast envelope",
    "D400 highway closure likely if spread continues",
    "Water source availability: 2 accessible hydrants within 5km",
  ],
};

// Generate mock weather observations
export const generateObservations = (stationId: string, hours: number = 24): WeatherObservation[] => {
  return Array.from({ length: hours }, (_, i) => ({
    id: `obs-${stationId}-${i}`,
    stationId,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * (hours - i)).toISOString(),
    windSpeed: 5 + Math.random() * 25,
    windDirection: Math.floor(Math.random() * 360),
    relativeHumidity: 20 + Math.random() * 60,
    temperature: 18 + Math.random() * 20,
    pressure: 1013 + (Math.random() - 0.5) * 20,
    precipitation: Math.random() > 0.9 ? Math.random() * 5 : 0,
    solarRadiation: Math.sin((i / 24) * Math.PI) * 800,
    anomalyFlags: Math.random() > 0.9 ? ["high_wind", "low_humidity"] : [],
  }));
};
