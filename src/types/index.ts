// Core types for BeEye Wildfire Protection System

export type UserRole = 'admin' | 'incident_commander' | 'operator' | 'responder' | 'analyst' | 'viewer';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'new' | 'acknowledged' | 'verifying' | 'escalated' | 'resolved' | 'dismissed';
export type AlertSource = 'satellite' | 'balloon' | 'weather_station' | 'ground_report' | 'uav' | 'ai_prediction';

export type IncidentStatus = 'suspected' | 'confirmed' | 'contained' | 'controlled' | 'extinguished' | 'false_alarm';
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';

export type SensorStatus = 'online' | 'offline' | 'degraded' | 'maintenance';

export type MissionStatus = 'planned' | 'in_progress' | 'completed' | 'aborted' | 'cancelled';
export type MissionType = 'reconnaissance' | 'mapping' | 'thermal' | 'hotspot_detection' | 'damage_assessment';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

// Alert entity
export interface Alert {
  id: string;
  location: GeoPoint;
  severity: AlertSeverity;
  confidence: number;
  status: AlertStatus;
  sources: AlertSource[];
  topDrivers: string[];
  recommendedAction: string;
  createdAt: string;
  updatedAt: string;
  incidentId?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

// Incident entity
export interface Incident {
  id: string;
  name: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  confidence: number;
  location: GeoPoint;
  perimeterGeometry?: GeoPolygon;
  alertIds: string[];
  commanderId?: string;
  createdAt: string;
  updatedAt: string;
}

// Weather Station entity
export interface WeatherStation {
  id: string;
  name: string;
  location: GeoPoint;
  status: SensorStatus;
  lastSeen: string;
  batteryLevel: number;
  metadata: Record<string, unknown>;
}

export interface WeatherObservation {
  id: string;
  stationId: string;
  timestamp: string;
  windSpeed: number;
  windDirection: number;
  relativeHumidity: number;
  temperature: number;
  pressure: number;
  precipitation: number;
  solarRadiation: number;
  anomalyFlags: string[];
}

// Ground Station Gateway
export interface GroundStationGateway {
  id: string;
  name: string;
  location: GeoPoint;
  status: SensorStatus;
  lastSync: string;
  bufferQueueSize: number;
}

// Balloon Asset
export interface BalloonAsset {
  id: string;
  name: string;
  location: GeoPoint;
  status: SensorStatus;
  payloadType: string;
  coverageRadius: number;
  lastSeen: string;
}

export interface BalloonDetectionEvent {
  id: string;
  balloonId: string;
  timestamp: string;
  smokeProbability: number;
  thermalAnomalyScore: number;
  snapshotUrl?: string;
  location: GeoPoint;
}

// UAV/Drone entities
export interface DroneAsset {
  id: string;
  name: string;
  type: string;
  payload: string;
  status: SensorStatus;
}

export interface UavMission {
  id: string;
  droneId: string;
  status: MissionStatus;
  type: MissionType;
  aoi: GeoPolygon;
  assignedTo: string;
  startTime?: string;
  endTime?: string;
  createdAt: string;
}

export interface UavOutput {
  id: string;
  missionId: string;
  type: 'orthomosaic' | 'thermal' | 'hotspots';
  fileUrl: string;
  derivedLayers?: string[];
  processedAt: string;
}

// Prediction entities
export interface PredictionRun {
  id: string;
  scope: 'incident' | 'region';
  incidentId?: string;
  modelVersion: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
}

export interface RiskNowcastLayer {
  id: string;
  runId: string;
  rasterRef: string;
  summaryStats: {
    highRiskArea: number;
    moderateRiskArea: number;
    lowRiskArea: number;
    peakRiskScore: number;
  };
}

export interface SpreadEnvelope {
  id: string;
  runId: string;
  tPlusHours: number;
  geometry: GeoPolygon;
  probabilityBand: 'likely' | 'possible' | 'outer';
}

export interface ImpactSummary {
  id: string;
  runId: string;
  assetsAtRiskCount: number;
  roadsThreatenedCount: number;
  wuiExposureScore: number;
  narrativeDrivers: string[];
}

// Audit log
export interface AuditLog {
  id: string;
  actorId: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  diff?: Record<string, unknown>;
  reason?: string;
}
