// src/pages/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login - in production this would authenticate with Supabase
    await new Promise((resolve) => setTimeout(resolve, 1000));

    navigate("/app/map");
  };

  const handleDemoLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate("/app/map");
    }, 500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Login form */}
      <div className="flex w-full max-w-lg flex-col justify-center px-8 lg:px-16">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-11 w-11 items-center justify-center">
              <img src="/logo4.png" alt="BeEye Logo" className="h-11 w-11" />
            </div>
            <div>
              <span className="text-2xl font-bold text-foreground tracking-tight">
                BeEye
              </span>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                Wildfire Protection
              </p>
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-muted-foreground">
            Sign in to access the operations center
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="operator@beeye.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-surface-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-surface-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role (Demo)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-surface-1">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="incident_commander">
                  Incident Commander
                </SelectItem>
                <SelectItem value="operator">Operator</SelectItem>
                <SelectItem value="responder">Responder</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <Button variant="outline" onClick={handleDemoLogin} className="w-full">
          <Shield className="h-4 w-4 mr-2" />
          Enter Demo Mode
        </Button>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Protected by enterprise-grade security. Access is monitored and
          logged.
        </p>
      </div>

      {/* Right side - Visual */}
      <div className="hidden flex-1 lg:block relative">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsl(var(--critical) / 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, hsl(var(--warning) / 0.1) 0%, transparent 40%),
              linear-gradient(135deg, hsl(var(--background)) 0%, hsl(222 47% 8%) 100%)
            `,
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `
                linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
            <div className="max-w-lg text-center">
              <div className="mb-8 relative">
                <div className="w-32 h-32 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-warning/30 flex items-center justify-center pulse-warning">
                    <div className="w-16 h-16 rounded-full bg-warning/50 flex items-center justify-center">
                      <img
                        src="/logo4n.png"
                        alt="BeEye Logo"
                        className="w-12 h-12"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-4">
                Wildfire Detection & Response Platform
              </h2>
              <p className="text-muted-foreground mb-8">
                AI-powered monitoring system integrating satellite imagery,
                weather data, drone reconnaissance, and predictive modeling for
                early wildfire detection and response coordination.
              </p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-surface-1/50 p-4">
                  <p className="text-2xl font-bold text-primary">24/7</p>
                  <p className="text-xs text-muted-foreground">Monitoring</p>
                </div>
                <div className="rounded-lg bg-surface-1/50 p-4">
                  <p className="text-2xl font-bold text-warning">&lt;5min</p>
                  <p className="text-xs text-muted-foreground">
                    Detection Time
                  </p>
                </div>
                <div className="rounded-lg bg-surface-1/50 p-4">
                  <p className="text-2xl font-bold text-success">95%</p>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
