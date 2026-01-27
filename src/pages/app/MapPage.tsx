import { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import { 
  Layers, 
  AlertTriangle, 
  Flame, 
  Radio, 
  Plane, 
  Cloud,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ZoomIn,
  ZoomOut,
  Crosshair,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { mockAlerts, mockIncidents, mockWeatherStations, mockMissions } from "@/data/mockData";
import { cn } from "@/lib/utils";
import L from "leaflet";

// Fix for default marker icons in Leaflet with Vite
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";

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

// Custom marker component for alerts
function AlertMarker({ alert, onClick }: { alert: typeof mockAlerts[0]; onClick: () => void }) {
  const getMarkerColor = () => {
    switch (alert.severity) {
      case "critical": return "#ef4444";
      case "high": return "#f59e0b";
      case "medium": return "#f59e0b";
      case "low": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 3px solid ${getMarkerColor()};
      background: ${getMarkerColor()}33;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      ${alert.severity === "critical" ? "animation: pulse 2s infinite;" : ""}
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${getMarkerColor()}" stroke-width="2">
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
      position={[alert.location.coordinates[1], alert.location.coordinates[0]]}
      icon={icon}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div className="p-2">
          <p className="font-semibold">{alert.severity.toUpperCase()} Alert</p>
          <p className="text-sm text-muted-foreground">Confidence: {alert.confidence}%</p>
        </div>
      </Popup>
    </Marker>
  );
}

// Custom marker component for weather stations
function WeatherStationMarker({ station }: { station: typeof mockWeatherStations[0] }) {
  const getMarkerColor = () => {
    switch (station.status) {
      case "online": return "#22c55e";
      case "offline": return "#ef4444";
      case "degraded": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  const icon = L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid ${getMarkerColor()};
      background: ${getMarkerColor()}33;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${getMarkerColor()}" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
      </svg>
    </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <Marker
      position={[station.location.coordinates[1], station.location.coordinates[0]]}
      icon={icon}
    >
      <Popup>
        <div className="p-2">
          <p className="font-semibold">{station.name}</p>
          <p className="text-sm text-muted-foreground">Status: {station.status}</p>
        </div>
      </Popup>
    </Marker>
  );
}

// Map controls component
function MapControls({ map }: { map: LeafletMap | null }) {
  if (!map) return null;

  return (
    <div className="absolute right-3 top-3 md:right-4 md:top-4 flex flex-col gap-2 z-[1000]">
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 md:h-9 md:w-9 bg-card/90 backdrop-blur-sm"
        onClick={() => map.zoomIn()}
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 md:h-9 md:w-9 bg-card/90 backdrop-blur-sm"
        onClick={() => map.zoomOut()}
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="secondary"
        className="h-10 w-10 md:h-9 md:w-9 bg-card/90 backdrop-blur-sm"
        onClick={() => {
          map.locate({ setView: true, maxZoom: 16 });
        }}
      >
        <Crosshair className="h-4 w-4" />
      </Button>
    </div>
  );
}

// Component to access map instance
function MapController({ onMapReady }: { onMapReady: (map: LeafletMap) => void }) {
  const map = useMap();
  useEffect(() => {
    onMapReady(map);
    // Trigger map resize after a short delay to ensure container is rendered
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  return null;
}

// Robust map auto-resize component using ResizeObserver
function MapAutoResize({ 
  map, 
  isLayersOpen, 
  containerRef 
}: { 
  map: LeafletMap | null; 
  isLayersOpen: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  // Store debounce timers in refs to persist across renders
  const resizeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const observerDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Invalidate map size while preserving user view
  const invalidateMapSize = useCallback(() => {
    if (!map) return;
    
    // Preserve current view
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    // Invalidate size
    map.invalidateSize({ animate: false });
    
    // Restore view (only if it changed, to avoid jumpiness)
    requestAnimationFrame(() => {
      if (map && (map.getCenter().distanceTo(center) > 0.0001 || map.getZoom() !== zoom)) {
        map.setView(center, zoom, { animate: false });
      }
    });
  }, [map]);

  // Debounced invalidate for ResizeObserver (50ms debounce)
  const debouncedInvalidate = useCallback(() => {
    if (observerDebounceTimerRef.current) {
      clearTimeout(observerDebounceTimerRef.current);
    }
    observerDebounceTimerRef.current = setTimeout(() => {
      invalidateMapSize();
    }, 50);
  }, [invalidateMapSize]);

  // Handle panel state changes with transition timing
  useEffect(() => {
    if (!map) return;
    
    // Immediate invalidate on next frame
    requestAnimationFrame(() => {
      invalidateMapSize();
    });
    
    // Also invalidate after CSS transition completes (300ms as per our transition duration)
    const transitionTimeout = setTimeout(() => {
      invalidateMapSize();
    }, 350); // Slightly longer than 300ms transition
    
    return () => clearTimeout(transitionTimeout);
  }, [map, isLayersOpen, invalidateMapSize]);

  // ResizeObserver to detect actual DOM size changes
  useEffect(() => {
    if (!map || !containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // Debounce ResizeObserver callbacks
      debouncedInvalidate();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (observerDebounceTimerRef.current) {
        clearTimeout(observerDebounceTimerRef.current);
      }
    };
  }, [map, containerRef, debouncedInvalidate]);

  // Handle window resize and orientation change
  useEffect(() => {
    if (!map) return;
    
    const handleResize = () => {
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current);
      }
      resizeDebounceTimerRef.current = setTimeout(() => {
        invalidateMapSize();
      }, 100);
    };
    
    const handleOrientationChange = () => {
      // Orientation change needs a longer delay for layout to settle
      setTimeout(() => {
        invalidateMapSize();
      }, 200);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current);
      }
    };
  }, [map, invalidateMapSize]);

  return null;
}

export default function MapPage() {
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768; // md breakpoint
    }
    return true; // Default to mobile for SSR
  });

  // Single source of truth for layers panel state (mobile drawer + desktop collapsible)
  const [isLayersOpen, setIsLayersOpen] = useState(() => {
    // On desktop, default to open. On mobile, default to closed.
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768; // md breakpoint
    }
    return false; // Default to closed for SSR
  });
  const [selectedFeature, setSelectedFeature] = useState<typeof mockAlerts[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeValue, setTimeValue] = useState([100]);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // If switching to desktop, open panel. If switching to mobile, close it.
      if (!mobile && !isLayersOpen) {
        setIsLayersOpen(true);
      } else if (mobile && isLayersOpen) {
        setIsLayersOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLayersOpen]);

  const layers = [
    { id: "alerts", label: "Active Alerts", icon: AlertTriangle, count: mockAlerts.length, color: "text-critical" },
    { id: "incidents", label: "Incidents", icon: Flame, count: mockIncidents.length, color: "text-warning" },
    { id: "weather", label: "Weather Stations", icon: Radio, count: mockWeatherStations.length, color: "text-info" },
    { id: "flights", label: "UAV Missions", icon: Plane, count: mockMissions.length, color: "text-success" },
    { id: "satellite", label: "Satellite Imagery", icon: Cloud, count: null, color: "text-muted-foreground" },
  ];

  const [activeLayers, setActiveLayers] = useState<string[]>(["alerts", "incidents", "weather"]);

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(l => l !== layerId)
        : [...prev, layerId]
    );
  };

  // Calculate center from all features
  const getMapCenter = (): [number, number] => {
    if (mockAlerts.length > 0) {
      const firstAlert = mockAlerts[0];
      return [firstAlert.location.coordinates[1], firstAlert.location.coordinates[0]];
    }
    return [36.7783, -119.4179]; // Default to California center
  };

  // Calculate bottom nav height (MobileNav is ~72px with padding + safe area)
  const bottomNavHeight = 72; // Approximate height of bottom nav bar

  return (
    <div 
      className="flex flex-col h-full w-full"
      style={{ 
        "--bottom-nav-height": `${bottomNavHeight}px`
      } as React.CSSProperties & { '--bottom-nav-height': string }}
    >
      {/* Main content area - CSS Grid layout for proper map sizing */}
      <div className={cn(
        "flex-1 min-h-0 relative grid h-full",
        "grid-cols-1",
        "md:transition-[grid-template-columns] md:duration-300",
        isLayersOpen ? "md:grid-cols-[320px_1fr]" : "md:grid-cols-[0_1fr]"
      )}>
        {/* Desktop Layers Panel - Collapsible side panel */}
        <div className={cn(
          "hidden md:block bg-card overflow-hidden min-w-0",
          isLayersOpen ? "w-full border-r border-border" : "w-0 border-r-0"
        )}>
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
                        <span className="flex-1 text-sm font-medium">{layer.label}</span>
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
                        <p className="text-2xl font-bold text-critical">{mockAlerts.filter(a => a.status === 'new').length}</p>
                        <p className="text-xs text-muted-foreground">New Alerts</p>
                      </div>
                      <div className="rounded-lg bg-surface-2 p-3 text-center">
                        <p className="text-2xl font-bold text-warning">{mockIncidents.length}</p>
                        <p className="text-xs text-muted-foreground">Active Incidents</p>
                      </div>
                    </div>
                  </div>

                  {/* Alert list preview */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent Alerts
                    </h4>
                    {mockAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                        onClick={() => setSelectedFeature(alert)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              variant={
                                alert.severity === "critical" ? "critical" :
                                alert.severity === "high" ? "warning" :
                                "neutral"
                              }
                              pulse={alert.severity === "critical"}
                            >
                              {alert.severity.toUpperCase()}
                            </StatusBadge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m ago
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                          {alert.topDrivers[0]}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Map Container - Full width, expands when panel is closed */}
        <div 
          ref={mapContainerRef}
          className="min-h-0 relative bg-surface-1 overflow-hidden w-full h-full"
        >
          <MapContainer
            center={getMapCenter()}
            zoom={8}
            className="h-full w-full z-0"
            style={{ 
              height: "100%", 
              width: "100%",
              position: "relative"
            }}
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController onMapReady={setMap} />
            
            {/* Alert markers */}
            {activeLayers.includes("alerts") && mockAlerts.map((alert) => (
              <AlertMarker
                key={alert.id}
                alert={alert}
                onClick={() => setSelectedFeature(alert)}
              />
            ))}

            {/* Weather station markers */}
            {activeLayers.includes("weather") && mockWeatherStations.map((station) => (
              <WeatherStationMarker key={station.id} station={station} />
            ))}
          </MapContainer>

          {/* Map auto-resize handler - robust resize detection using ResizeObserver */}
          <MapAutoResize map={map} isLayersOpen={isLayersOpen} containerRef={mapContainerRef} />

          {/* Map controls */}
          <MapControls map={map} />

          {/* Overlay Layer - Outside map container to avoid clipping */}
          <div className="absolute inset-4 z-[3000] pointer-events-none">
            {/* Desktop Toggle Button - Show when panel is collapsed */}
            {!isLayersOpen && (
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "hidden md:flex absolute left-4 z-[3500] h-9 w-9 bg-card/90 backdrop-blur-sm shadow-lg pointer-events-auto",
                  "touch-target"
                )}
                style={{ 
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 3.5rem)`, // Above time slider
                  left: `calc(1rem + env(safe-area-inset-left, 0px))`
                }}
                onClick={() => setIsLayersOpen(true)}
                aria-label="Open Map Layers"
              >
                <Layers className="h-4 w-4" />
              </Button>
            )}

            {/* Mobile Toggle Button - Positioned bottom-left to avoid zoom controls, hidden when layers open */}
            {!isLayersOpen && (
              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "absolute left-4 z-[3500] h-11 w-11 min-h-[44px] min-w-[44px] bg-card/95 backdrop-blur-sm shadow-lg",
                  "md:hidden touch-target pointer-events-auto"
                )}
                style={{ 
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 1.5rem)`, // Above time slider
                  left: `calc(1rem + env(safe-area-inset-left, 0px))`
                }}
                onClick={() => setIsLayersOpen(!isLayersOpen)}
                aria-label="Open Map Layers"
              >
                <Layers className="h-5 w-5" />
              </Button>
            )}

            {/* Time slider - Hide on mobile when layers open */}
            {(!isMobile || !isLayersOpen) && (
              <div 
                className="absolute left-1/2 -translate-x-1/2 glass-panel rounded-xl p-3 md:p-4 w-[calc(100%-24px)] max-w-[500px] pointer-events-auto map-overlay-slider"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) - 3.5rem)`,
                }}
              >
                <div className="flex items-center gap-2 md:gap-4">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
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
                    <span className="font-mono text-foreground">Live</span>
                  </div>
                </div>
              </div>
            )}

            {/* Fire Risk Legend - Hide on mobile when layers open */}
            {(!isMobile || !isLayersOpen) && (
              <div 
                className="hidden sm:block absolute glass-panel rounded-xl p-2 md:p-3 pointer-events-auto md:left-4 map-overlay-legend"
                style={{
                  bottom: `calc(var(--bottom-nav-height, ${bottomNavHeight}px) + env(safe-area-inset-bottom, 0px) + 5.5rem)`, // Above slider (slider ~4.5rem + spacing)
                  left: "0.75rem",
                }}
              >
                <p className="text-[10px] md:text-xs font-semibold text-muted-foreground mb-2">Fire Risk</p>
                <div className="flex gap-1">
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-success" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-warning/50" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-warning" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-critical/70" />
                  <div className="w-4 md:w-6 h-2 md:h-3 rounded-sm bg-critical" />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[8px] md:text-[10px] text-muted-foreground">Low</span>
                  <span className="text-[8px] md:text-[10px] text-muted-foreground">Extreme</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sheet Drawer for Map Layers - only render on mobile */}
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
                    <span className="flex-1 text-sm font-medium">{layer.label}</span>
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
                    <p className="text-2xl font-bold text-critical">{mockAlerts.filter(a => a.status === 'new').length}</p>
                    <p className="text-xs text-muted-foreground">New Alerts</p>
                  </div>
                  <div className="rounded-lg bg-surface-2 p-3 text-center">
                    <p className="text-2xl font-bold text-warning">{mockIncidents.length}</p>
                    <p className="text-xs text-muted-foreground">Active Incidents</p>
                  </div>
                </div>
              </div>

              {/* Alert list preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent Alerts
                </h4>
                {mockAlerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-border bg-surface-1 p-3 cursor-pointer hover:bg-surface-2 transition-colors"
                    onClick={() => {
                      setSelectedFeature(alert);
                      setIsLayersOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <StatusBadge
                          variant={
                            alert.severity === "critical" ? "critical" :
                            alert.severity === "high" ? "warning" :
                            "neutral"
                          }
                          pulse={alert.severity === "critical"}
                        >
                          {alert.severity.toUpperCase()}
                        </StatusBadge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 60000)}m ago
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-1">
                      {alert.topDrivers[0]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
        </Sheet>
      )}


      {/* Feature Detail Drawer - Use Sheet for mobile */}
      {selectedFeature && (
        <div className="fixed inset-0 md:absolute md:inset-auto md:right-0 md:top-0 md:bottom-0 md:w-96 bg-card md:border-l border-border animate-slide-in-right z-30">
          <div className="flex h-12 md:h-12 items-center justify-between border-b border-border px-4">
            <h3 className="font-semibold">Alert Details</h3>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedFeature(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Tabs defaultValue="overview" className="h-[calc(100%-48px)]">
            <TabsList className="w-full justify-start px-4 bg-transparent border-b border-border rounded-none h-10">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
              <TabsTrigger value="evidence" className="text-xs">Evidence</TabsTrigger>
              <TabsTrigger value="actions" className="text-xs">Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <StatusBadge
                  variant={
                    selectedFeature.severity === "critical" ? "critical" :
                    selectedFeature.severity === "high" ? "warning" :
                    "neutral"
                  }
                  pulse={selectedFeature.severity === "critical"}
                >
                  {selectedFeature.severity.toUpperCase()}
                </StatusBadge>
                <StatusBadge variant="info" dot={false}>
                  {selectedFeature.status.replace("_", " ").toUpperCase()}
                </StatusBadge>
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
                        selectedFeature.confidence > 80 ? "bg-critical" :
                        selectedFeature.confidence > 60 ? "bg-warning" : "bg-muted"
                      )}
                      style={{ width: `${selectedFeature.confidence}%` }}
                    />
                  </div>
                  <span className="font-mono text-lg font-bold">{selectedFeature.confidence}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Detection Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedFeature.sources.map((source) => (
                    <Badge key={source} variant="outline" className="text-xs capitalize">
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
                  {selectedFeature.topDrivers.map((driver, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-xs font-medium">
                        {i + 1}
                      </span>
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended Action
                </p>
                <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
                  <p className="text-sm">{selectedFeature.recommendedAction}</p>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button className="w-full" variant="default">
                  Acknowledge Alert
                </Button>
                <Button className="w-full" variant="secondary">
                  Create Incident
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="timeline" className="p-4">
              <p className="text-sm text-muted-foreground">Timeline events will appear here.</p>
            </TabsContent>
            <TabsContent value="evidence" className="p-4">
              <p className="text-sm text-muted-foreground">Evidence files and images will appear here.</p>
            </TabsContent>
            <TabsContent value="actions" className="p-4">
              <p className="text-sm text-muted-foreground">Available actions will appear here.</p>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
