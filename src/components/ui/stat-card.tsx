import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "critical" | "warning" | "success";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-all hover:bg-card/80",
        variant === "critical" && "border-critical/30 glow-critical",
        variant === "warning" && "border-warning/30",
        variant === "success" && "border-success/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p
            className={cn(
              "text-3xl font-bold tracking-tight",
              variant === "critical" && "text-critical",
              variant === "warning" && "text-warning",
              variant === "success" && "text-success"
            )}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              "rounded-lg bg-surface-2 p-2",
              variant === "critical" && "bg-critical/10",
              variant === "warning" && "bg-warning/10",
              variant === "success" && "bg-success/10"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                variant === "critical" && "text-critical",
                variant === "warning" && "text-warning",
                variant === "success" && "text-success",
                variant === "default" && "text-muted-foreground"
              )}
            />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "text-critical" : "text-success"
            )}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
