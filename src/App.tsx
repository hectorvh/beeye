import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

// App pages
import MapPage from "./pages/app/MapPage";
import AlertsPage from "./pages/app/AlertsPage";
import IncidentsPage from "./pages/app/IncidentsPage";
import IncidentDetailPage from "./pages/app/IncidentDetailPage";
import SensorsPage from "./pages/app/SensorsPage";
import NetworksPage from "./pages/app/NetworksPage";
import FlightsPage from "./pages/app/FlightsPage";
import PredictionsPage from "./pages/app/PredictionsPage";
import ReportsPage from "./pages/app/ReportsPage";
import AdminPage from "./pages/app/AdminPage";

// Layout
import { AppLayout } from "./components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* App routes with layout */}
          <Route path="/app" element={<AppLayout />}>
            <Route path="map" element={<MapPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="incidents" element={<IncidentsPage />} />
            <Route path="incidents/:id" element={<IncidentDetailPage />} />
            <Route path="predictions" element={<PredictionsPage />} />
            <Route path="sensors" element={<SensorsPage />} />
            <Route path="sensors/:id" element={<SensorsPage />} />
            <Route path="networks" element={<NetworksPage />} />
            <Route path="flights" element={<FlightsPage />} />
            <Route path="flights/:id" element={<FlightsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
