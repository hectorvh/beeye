import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Layers,
  AlertTriangle,
  Flame,
  Radio,
  Plane,
  Cloud,
  ChevronLeft,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Crosshair,
  X,
  CheckCircle2,
  Ban,
  Siren,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";
import { useNavigate } from "react-router-dom";

// Leaflet default marker assets (Vite)
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import type { Alert, Incident } from "@/types";
import type { ComponentType, CSSProperties, RefObject } from "react";

const DefaultIcon = L.icon({
  iconUrl: icon,
  iconRetinaUrl: iconRetina,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

type GeoPoint = { type: "Point"; coordinates: [number, number] };

type WithLocation = { location: GeoPoint };

const toLatLng = (p: WithLocation["location"]): [number, number] => [
  p.coordinates[1],
  p.coordinates[0],
];

type WeatherStation = {
  id: string;
  name: string;
  status: "online" | "offline" | "degraded";
  location: GeoPoint;
};

type LayerId = "alerts" | "incidents" | "weather" | "flights" | "satellite";
type LayerItem = {
  id: LayerId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  count: number | null;
  color: string;
};

const nowMinusMinutes = (min: number) =>
  new Date(Date.now() - min * 60_000).toISOString();

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return "—";
  const diff = Date.now() - new Date(dateString).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const minutes = Math.floor(sec / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// ----- Custom markers -----

function AlertMarker({
  alert,
  onClick,
}: {
  alert: Alert;
  onClick: () => void;
}) {
  const getMarkerColor = () => {
    switch (alert.severity) {
      case "critical":
        return "#ef4444";
      case "high":
        return "#f59e0b";
      case "medium":
        return "#f59e0b";
      case "low":
      default:
        return "#6b7280";
    }
  };

  const color = getMarkerColor();

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid ${color};
      background: ${color}33;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      ${
        alert.severity === "critical"
          ? "animation: pulse-critical 2s infinite;"
          : ""
      }
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });

  return (
    <Marker
      position={toLatLng(alert.location)}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2">
          <p className="font-semibold">
            {String(alert.severity).toUpperCase()} Alert
          </p>
          <p className="text-sm text-muted-foreground">
            Confidence: {alert.confidence}%
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

function WeatherStationMarker({ station }: { station: WeatherStation }) {
  const getMarkerColor = () => {
    switch (station.status) {
      case "online":
        return "#22c55e";
      case "offline":
        return "#ef4444";
      case "degraded":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  const color = getMarkerColor();

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid ${color};
      background: ${color}33;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <Marker position={toLatLng(station.location)} icon={icon}>
      <Popup>
        <div className="p-2">
          <p className="font-semibold">{station.name}</p>
          <p className="text-sm text-muted-foreground">
            Status: {station.status}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

// ----- Controls / map plumbing -----

function MapControls({ map }: { map: LeafletMap | null }) {
  if (!map) return null;
  return null;
}

function MapController({
  onMapReady,
}: {
  onMapReady: (map: LeafletMap) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, onMapReady]);
  return null;
}

function MapAutoResize({
  map,
  isLayersOpen,
  containerRef,
}: {
  map: LeafletMap | null;
  isLayersOpen: boolean;
  containerRef: RefObject<HTMLDivElement>;
}) {
  const resizeDebounceTimerRef = useRef<number | null>(null);
  const observerDebounceTimerRef = useRef<number | null>(null);

  const invalidateMapSize = useCallback(() => {
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    map.invalidateSize({ animate: false });
    requestAnimationFrame(() => {
      if (!map) return;
      const moved = map.getCenter().distanceTo(center) > 0.0001;
      const zoomed = map.getZoom() !== zoom;
      if (moved || zoomed) map.setView(center, zoom, { animate: false });
    });
  }, [map]);

  const debouncedInvalidate = useCallback(() => {
    if (observerDebounceTimerRef.current)
      window.clearTimeout(observerDebounceTimerRef.current);
    observerDebounceTimerRef.current = window.setTimeout(invalidateMapSize, 50);
  }, [invalidateMapSize]);

  useEffect(() => {
    if (!map) return;
    requestAnimationFrame(invalidateMapSize);
    const t = window.setTimeout(invalidateMapSize, 350);
    return () => window.clearTimeout(t);
  }, [map, isLayersOpen, invalidateMapSize]);

  useEffect(() => {
    if (!map || !containerRef.current) return;

    const ro = new ResizeObserver(() => debouncedInvalidate());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      if (observerDebounceTimerRef.current)
        window.clearTimeout(observerDebounceTimerRef.current);
    };
  }, [map, containerRef, debouncedInvalidate]);

  useEffect(() => {
    if (!map) return;

    const onResize = () => {
      if (resizeDebounceTimerRef.current)
        window.clearTimeout(resizeDebounceTimerRef.current);
      resizeDebounceTimerRef.current = window.setTimeout(
        invalidateMapSize,
        100
      );
    };

    const onOrientation = () => window.setTimeout(invalidateMapSize, 200);

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      if (resizeDebounceTimerRef.current)
        window.clearTimeout(resizeDebounceTimerRef.current);
    };
  }, [map, invalidateMapSize]);

  return null;
}
export default function MapPage() {
  const navigate = useNavigate();

  // Demo store
  const {
    alerts,
    incidents,
    // drones, missions, etc. (si luego los quieres en mapa)
    acknowledgeAlert,
    dismissAlert,
    resolveAlert,
    createIncidentFromAlert,
    linkAlertToIncident,
  } = useDemoStore();

  // responsive
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 768 : true
  );

  // panel state
  const [isLayersOpen, setIsLayersOpen] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );

  // tile layer selection (default: satellite)
  const [tileLayerId, setTileLayerId] = useState("satellite");

  // Tile layer definitions
  const tileLayerOptions = useMemo(
    () => [
      {
        id: "osm",
        name: "OpenStreetMap",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      },
      {
        id: "satellite",
        name: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution:
          '&copy; <a href="https://www.arcgis.com/">Esri</a>, DigitalGlobe, Earthstar Geographics',
      },
      {
        id: "topo",
        name: "Topographic",
        url: "https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}",
        attribution: '&copy; <a href="https://www.usgs.gov/">USGS</a>',
      },
      {
        id: "dark",
        name: "Dark Mode",
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    ],
    []
  );

  const currentTileLayer = useMemo(
    () =>
      tileLayerOptions.find((t) => t.id === tileLayerId) || tileLayerOptions[0],
    [tileLayerId, tileLayerOptions]
  );

  // selections
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const selectedAlert = useMemo<Alert | null>(
    () => alerts.find((a) => a.id === selectedAlertId) ?? null,
    [alerts, selectedAlertId]
  );

  // timeline/play
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeValue, setTimeValue] = useState<number[]>([100]); // 0..100

  // leaflet map instance + ref
  const [map, setMap] = useState<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // maintain breakpoints
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile && !isLayersOpen) setIsLayersOpen(true);
      if (mobile && isLayersOpen) setIsLayersOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLayersOpen]);

  // Layers list (visual only for now)
  const layers = useMemo<LayerItem[]>(
    () => [
      {
        id: "alerts",
        label: "Active Alerts",
        icon: AlertTriangle,
        count: alerts.length,
        color: "text-critical",
      },
      {
        id: "incidents",
        label: "Incidents",
        icon: Flame,
        count: incidents.length,
        color: "text-warning",
      },
      {
        id: "weather",
        label: "Weather Stations",
        icon: Radio,
        count: 6,
        color: "text-info",
      },
      {
        id: "flights",
        label: "UAV Missions",
        icon: Plane,
        count: null,
        color: "text-success",
      },
      {
        id: "satellite",
        label: "Satellite Imagery",
        icon: Cloud,
        count: null,
        color: "text-muted-foreground",
      },
    ],
    [alerts.length, incidents.length]
  );

  const [activeLayers, setActiveLayers] = useState<LayerId[]>([
    "alerts",
    "incidents",
    "weather",
  ]);

  const toggleLayer = (layerId: LayerId) => {
    setActiveLayers((prev) =>
      prev.includes(layerId)
        ? prev.filter((l) => l !== layerId)
        : [...prev, layerId]
    );
  };

  // Map center
  const mapCenter = useMemo<[number, number]>(() => {
    if (alerts.length > 0) return toLatLng(alerts[0].location);
    if (incidents.length > 0) return toLatLng(incidents[0].location);
    return [37.0, 28.5];
  }, [alerts, incidents]);

  // When selecting an alert -> flyTo it
  useEffect(() => {
    if (!map || !selectedAlert) return;
    const ll = toLatLng(selectedAlert.location);
    map.flyTo(ll, clamp(map.getZoom(), 9, 13), {
      animate: true,
      duration: 0.7,
    });
  }, [map, selectedAlert]);

  // "Live" timeline behavior
  useEffect(() => {
    if (!isPlaying) return;
    const t = window.setInterval(() => {
      setTimeValue((prev) => {
        const next = prev[0] + 1;
        if (next >= 100) return [100];
        return [next];
      });
    }, 700);
    return () => window.clearInterval(t);
  }, [isPlaying]);

  // bottom nav height (your layout)
  const bottomNavHeight = 72;

  // derive "time label"
  const timeLabel = useMemo(() => {
    // map 0..100 to t-60min .. live
    const pct = timeValue[0] / 100;
    const minutesAgo = Math.round((1 - pct) * 60);
    if (minutesAgo <= 0) return "Live";
    return `T-${minutesAgo}m`;
  }, [timeValue]);
  // ---- Derived UI helpers ----

  const activeSituation = useMemo(() => {
    const newAlerts = alerts.filter((a) => a.status === "new").length;
    const activeIncidents = incidents.filter(
      (i) => i.status !== "extinguished" && i.status !== "false_alarm"
    ).length;
    return { newAlerts, activeIncidents };
  }, [alerts, incidents]);

  const recentAlerts = useMemo(() => {
    const sorted = [...alerts].sort((a, b) => {
      const ta = new Date(a.createdAt ?? nowMinusMinutes(10)).getTime();
      const tb = new Date(b.createdAt ?? nowMinusMinutes(20)).getTime();
      return tb - ta;
    });
    return sorted.slice(0, 3);
  }, [alerts]);

  const selectedAlertIncident = useMemo<Incident | null>(() => {
    if (!selectedAlert?.incidentId) return null;
    return incidents.find((i) => i.id === selectedAlert.incidentId) ?? null;
  }, [incidents, selectedAlert]);

  const closeDetails = () => setSelectedAlertId(null);

  const onAcknowledge = () => {
    if (!selectedAlert) return;
    acknowledgeAlert(selectedAlert.id);
  };

  const onResolve = () => {
    if (!selectedAlert) return;
    resolveAlert(selectedAlert.id);
  };

  const onDismiss = () => {
    if (!selectedAlert) return;
    dismissAlert(selectedAlert.id, "Dismissed by operator");
    closeDetails();
  };

  const onCreateIncident = () => {
    if (!selectedAlert) return;
    const newIncidentId = createIncidentFromAlert(selectedAlert.id);
    if (newIncidentId) {
      // opcional: navega al detalle de incidente si ya tienes esa ruta
      navigate(`/app/incidents/${newIncidentId}`);
    }
  };

  const onLinkToIncident = (incidentId: string) => {
    if (!selectedAlert) return;
    linkAlertToIncident(selectedAlert.id, incidentId);
    navigate(`/app/incidents/${incidentId}`);
  };

  // Simple “fake” weather stations si aún no están en el store (no rompe nada)
  const weatherStations = useMemo<WeatherStation[]>(
    () => [
      {
        id: "wx-01",
        name: "Station A",
        status: "online",
        location: { type: "Point", coordinates: [28.9, 36.9] },
      },
      {
        id: "wx-02",
        name: "Station B",
        status: "degraded",
        location: { type: "Point", coordinates: [29.3, 36.6] },
      },
      {
        id: "wx-03",
        name: "Station C",
        status: "offline",
        location: { type: "Point", coordinates: [28.6, 37.1] },
      },
      {
        id: "wx-04",
        name: "Station D",
        status: "online",
        location: { type: "Point", coordinates: [28.2, 36.7] },
      },
      {
        id: "wx-05",
        name: "Station E",
        status: "online",
        location: { type: "Point", coordinates: [29.1, 37.0] },
      },
      {
        id: "wx-06",
        name: "Station F",
        status: "degraded",
        location: { type: "Point", coordinates: [28.4, 36.5] },
      },
    ],
    []
  );
  return (
    <div
      className="flex flex-col h-full w-full"
      style={
        {
          "--bottom-nav-height": `${bottomNavHeight}px`,
        } as CSSProperties & { "--bottom-nav-height": string }
      }
    >
      {/* Main content area */}
      <div
        className={cn(
          "flex-1 min-h-0 relative grid h-full",
          "grid-cols-1",
          "md:transition-[grid-template-columns] md:duration-300",
          isLayersOpen ? "md:grid-cols-[320px_1fr]" : "md:grid-cols-[0_1fr]"
        )}
      >
        {/* Desktop Layers Panel */}
        <div
          className={cn(
            "hidden md:block bg-card overflow-hidden min-w-0",
            isLayersOpen ? "w-full border-r border-border" : "w-0 border-r-0"
          )}
        >
          {isLayersOpen && (
            <div className="h-full flex flex-col">
              <div className="flex h-12 items-center justify-between border-b border-border px-4">
                <h3 className="font-semibold">Map Layers</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => setIsLayersOpen(false)}
                  aria-label="Collapse Layers Panel"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {/* Layer toggles */}
                  <div className="space-y-2">
                    {layers.map((layer) => (
                      <label
                        key={layer.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                      >
                        <Checkbox
                          checked={activeLayers.includes(layer.id)}
                          onCheckedChange={() => toggleLayer(layer.id)}
                        />
                        <layer.icon className={cn("h-4 w-4", layer.color)} />
                        <span className="flex-1 text-sm font-medium">
                          {layer.label}
                        </span>
                        {layer.count !== null && (
                          <Badge variant="secondary" className="text-xs">
                            {layer.count}
                          </Badge>
                        )}
                      </label>
                    ))}
                  </div>

                  {/* Quick stats */}
                  <div className="rounded-lg border border-border p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Active Situation
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-surface-2 p-3 text-center">
                        <p className="text-2xl font-bold text-critical">
                          {activeSituation.newAlerts}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          New Alerts
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-2 p-3 text-center">
                        <p className="text-2xl font-bold text-warning">
                          {activeSituation.activeIncidents}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Active Incidents
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent alerts */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent Alerts
                    </h4>
                    {recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                        onClick={() => setSelectedAlertId(alert.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              variant={
                                alert.severity === "critical"
                                  ? "critical"
                                  : alert.severity === "high"
                                  ? "warning"
                                  : "neutral"
                              }
                              pulse={alert.severity === "critical"}
                            >
                              {String(alert.severity).toUpperCase()}
                            </StatusBadge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                          {alert.topDrivers?.[0] ?? "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="min-h-0 relative bg-surface-1 overflow-hidden w-full h-full"
        >
          <MapContainer
            center={mapCenter}
            zoom={8}
            className="h-full w-full z-0"
            style={{ height: "100%", width: "100%", position: "relative" }}
            scrollWheelZoom
            zoomControl={false}
          >
            <TileLayer
              key={currentTileLayer.id}
              attribution={currentTileLayer.attribution}
              url={currentTileLayer.url}
            />
            <MapController onMapReady={setMap} />

            {/* Alerts */}
            {activeLayers.includes("alerts") &&
              alerts.map((a) => (
                <AlertMarker
                  key={a.id}
                  alert={a}
                  onClick={() => setSelectedAlertId(a.id)}
                />
              ))}

            {/* Weather stations */}
            {activeLayers.includes("weather") &&
              weatherStations.map((s) => (
                <WeatherStationMarker key={s.id} station={s} />
              ))}
          </MapContainer>

          <MapAutoResize
            map={map}
            isLayersOpen={isLayersOpen}
            containerRef={mapContainerRef}
          />
          <MapControls map={map} />

          {/* Overlay Layer */}
          <div className="absolute inset-4 z-[3000] pointer-events-none">
            {/* Desktop open button when collapsed */}
            {!isLayersOpen && (
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "hidden md:flex absolute left-4 z-[3500] h-9 w-9 bg-card/90 backdrop-blur-sm shadow-lg pointer-events-auto",
                  "touch-target"
                )}
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 3.5rem)`,
                  left: `calc(1rem + env(safe-area-inset-left, 0px))`,
                }}
                onClick={() => setIsLayersOpen(true)}
                aria-label="Open Map Layers"
              >
                <Layers className="h-4 w-4" />
              </Button>
            )}

            {/* Mobile buttons: Layers + Live */}
            {!isLayersOpen && (
              <div
                className="md:hidden absolute z-[3500] flex gap-2 pointer-events-auto"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 3.5rem)`,
                  left: `calc(1rem + env(safe-area-inset-left, 0px))`,
                }}
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] bg-card/95 backdrop-blur-sm shadow-lg touch-target"
                  onClick={() => setIsLayersOpen(true)}
                  aria-label="Open Map Layers"
                >
                  <Layers className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-11 w-11 min-h-[44px] min-w-[44px] bg-card/95 backdrop-blur-sm shadow-lg touch-target"
                  onClick={() => map?.locate({ setView: true, maxZoom: 16 })}
                  aria-label="My Location"
                  title="Live Location"
                >
                  <Crosshair className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Time slider (hide on mobile when layers open) */}
            {(!isMobile || !isLayersOpen) && (
              <div
                className="absolute left-1/2 -translate-x-1/2 glass-panel rounded-xl p-2 md:p-4 w-[calc(100%-32px)] md:w-[calc(100%-24px)] max-w-[520px] pointer-events-auto map-overlay-slider"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + ${
                    isMobile ? "0.25rem" : "0.75rem"
                  })`,
                }}
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setTimeValue([0])}
                    >
                      <SkipBack className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsPlaying((p) => !p)}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setTimeValue([100])}
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <Slider
                      value={timeValue}
                      onValueChange={setTimeValue}
                      max={100}
                      step={1}
                      className="cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <Clock className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                    <span className="font-mono text-foreground">
                      {timeLabel}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Tile Layer Selector */}
            {(!isMobile || !isLayersOpen) && (
              <div
                className="absolute glass-panel rounded-xl p-2 md:p-3 pointer-events-auto md:right-4 map-overlay-legend md:block hidden"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 13rem)`,
                  right: "0.75rem",
                }}
              >
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mb-2">
                  Map Style
                </p>
                <Select value={tileLayerId} onValueChange={setTileLayerId}>
                  <SelectTrigger className="w-32 md:w-36 bg-background/50 border-border text-xs h-8">
                    <SelectValue placeholder="Style" />
                  </SelectTrigger>
                  <SelectContent>
                    {tileLayerOptions.map((option) => (
                      <SelectItem
                        key={option.id}
                        value={option.id}
                        className="text-xs"
                      >
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Map Controls (Zoom + Locate) */}
            {(!isMobile || !isLayersOpen) && (
              <div
                className="absolute glass-panel rounded-xl p-2 md:p-3 pointer-events-auto md:right-4 gap-2 flex-col z-[1000] map-overlay-controls md:flex hidden"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 3rem)`,
                  right: "0.75rem",
                }}
              >
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-card/90"
                  onClick={() => map?.zoomIn()}
                  title="Zoom In"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-card/90"
                  onClick={() => map?.zoomOut()}
                  title="Zoom Out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 bg-card/90"
                  onClick={() => map?.locate({ setView: true, maxZoom: 16 })}
                  title="My Location"
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Fire Risk Legend */}
            {(!isMobile || !isLayersOpen) && (
              <div
                className="absolute glass-panel rounded-xl p-2 md:p-3 pointer-events-auto md:left-4 map-overlay-legend md:block hidden"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 3rem)`,
                  left: "0.75rem",
                }}
              >
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mb-2">
                  Fire Risk
                </p>
                <div className="flex gap-1">
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-success" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-warning/50" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-warning" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-critical/70" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-critical" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] md:text-[10px] text-muted-foreground">
                    Low
                  </span>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground">
                    Extreme
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sheet Drawer for Map Layers */}
      {isMobile && (
        <Sheet open={isLayersOpen} onOpenChange={setIsLayersOpen}>
          <SheetContent
            side="left"
            className="w-[85vw] sm:w-[320px] p-0 bg-card border-r border-border z-[1000]"
          >
            <SheetHeader className="px-4 pt-4 pb-2 border-b border-border">
              <SheetTitle className="text-left">Map Layers</SheetTitle>
            </SheetHeader>

            <ScrollArea className="h-[calc(100vh-64px)]">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  {layers.map((layer) => (
                    <label
                      key={layer.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                    >
                      <Checkbox
                        checked={activeLayers.includes(layer.id)}
                        onCheckedChange={() => toggleLayer(layer.id)}
                      />
                      <layer.icon className={cn("h-4 w-4", layer.color)} />
                      <span className="flex-1 text-sm font-medium">
                        {layer.label}
                      </span>
                      {layer.count !== null && (
                        <Badge variant="secondary" className="text-xs">
                          {layer.count}
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>

                <div className="rounded-lg border border-border p-4 space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Active Situation
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-surface-2 p-3 text-center">
                      <p className="text-2xl font-bold text-critical">
                        {activeSituation.newAlerts}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        New Alerts
                      </p>
                    </div>
                    <div className="rounded-lg bg-surface-2 p-3 text-center">
                      <p className="text-2xl font-bold text-warning">
                        {activeSituation.activeIncidents}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Active Incidents
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Recent Alerts
                  </h4>
                  {recentAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                      onClick={() => {
                        setSelectedAlertId(alert.id);
                        setIsLayersOpen(false);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            variant={
                              alert.severity === "critical"
                                ? "critical"
                                : alert.severity === "high"
                                ? "warning"
                                : "neutral"
                            }
                            pulse={alert.severity === "critical"}
                          >
                            {String(alert.severity).toUpperCase()}
                          </StatusBadge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(alert.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                        {alert.topDrivers?.[0] ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      )}

      {/* Alert Detail Drawer */}
      {selectedAlert && (
        <div className="fixed inset-0 md:absolute md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-[420px] bg-card md:border-l border-border animate-slide-in-right z-30">
          <div className="flex h-12 items-center justify-between border-b border-border px-4">
            <h3 className="font-semibold">Alert Details</h3>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={closeDetails}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="overview" className="h-[calc(100%-48px)]">
            <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border rounded-none h-10">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">
                Timeline
              </TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">
                Actions
              </TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="p-4 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge
                  variant={
                    selectedAlert.severity === "critical"
                      ? "critical"
                      : selectedAlert.severity === "high"
                      ? "warning"
                      : "neutral"
                  }
                  pulse={selectedAlert.severity === "critical"}
                >
                  {String(selectedAlert.severity).toUpperCase()}
                </StatusBadge>

                <StatusBadge variant="info" dot={false}>
                  {String(selectedAlert.status).replace("_", " ").toUpperCase()}
                </StatusBadge>

                {selectedAlertIncident && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() =>
                      navigate(`/app/incidents/${selectedAlertIncident.id}`)
                    }
                  >
                    View Incident
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confidence Score
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-surface-2">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        selectedAlert.confidence > 80
                          ? "bg-critical"
                          : selectedAlert.confidence > 60
                          ? "bg-warning"
                          : "bg-muted"
                      )}
                      style={{ width: `${selectedAlert.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-lg font-bold">
                    {selectedAlert.confidence}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detection Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {(selectedAlert.sources || []).map((source: string) => (
                    <Badge
                      key={source}
                      variant="outline"
                      className="text-xs capitalize"
                    >
                      {source.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Top Drivers
                </p>
                <ul className="space-y-2">
                  {(selectedAlert.topDrivers || []).map(
                    (driver: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                          {i + 1}
                        </span>
                        {driver}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended Action
                </p>
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <p className="text-sm">
                    {selectedAlert.recommendedAction || "—"}
                  </p>
                </div>
              </div>

              <div className="pt-2 text-xs text-muted-foreground">
                Created:{" "}
                <span className="font-mono">
                  {formatTimeAgo(selectedAlert.createdAt)}
                </span>
              </div>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="p-4 space-y-3">
              <div className="rounded-lg border border-border bg-surface-1 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <Siren className="h-4 w-4 text-warning" />
                  <span className="font-medium">Alert created</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {formatTimeAgo(selectedAlert.createdAt)}
                  </span>
                </div>
              </div>

              {selectedAlert.acknowledgedAt && (
                <div className="rounded-lg border border-border bg-surface-1 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <span className="font-medium">Acknowledged</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatTimeAgo(selectedAlert.acknowledgedAt)}
                    </span>
                  </div>
                </div>
              )}

              {selectedAlert.updatedAt && (
                <div className="rounded-lg border border-border bg-surface-1 p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Last update</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatTimeAgo(selectedAlert.updatedAt)}
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Actions */}
            <TabsContent value="actions" className="p-4 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Button
                  className="w-full justify-start"
                  variant="default"
                  onClick={onAcknowledge}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Acknowledge Alert
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="secondary"
                  onClick={onCreateIncident}
                >
                  <Flame className="h-4 w-4 mr-2" />
                  Create Incident from Alert
                </Button>

                {/* Optional: link to an existing incident if you want */}
                {!selectedAlertIncident && incidents.length > 0 && (
                  <div className="mt-2 rounded-lg border border-border p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      Link to existing incident
                    </p>
                    <div className="space-y-2">
                      {incidents.slice(0, 3).map((i) => (
                        <Button
                          key={i.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => onLinkToIncident(i.id)}
                        >
                          {i.name ?? i.id}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={onResolve}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>

                <Button
                  className="w-full justify-start"
                  variant="destructive"
                  onClick={onDismiss}
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Dismiss Alert
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
