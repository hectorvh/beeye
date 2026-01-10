import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        critical: "bg-critical/20 text-critical border border-critical/30",
        warning: "bg-warning/20 text-warning border border-warning/30",
        success: "bg-success/20 text-success border border-success/30",
        info: "bg-info/20 text-info border border-info/30",
        neutral: "bg-secondary text-secondary-foreground",
      },
      pulse: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "critical",
        pulse: true,
        className: "pulse-critical",
      },
      {
        variant: "warning",
        pulse: true,
        className: "pulse-warning",
      },
    ],
    defaultVariants: {
      variant: "default",
      pulse: false,
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  dot?: boolean;
}

export function StatusBadge({
  className,
  variant,
  pulse,
  dot = true,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant, pulse }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            variant === "critical" && "bg-critical",
            variant === "warning" && "bg-warning",
            variant === "success" && "bg-success",
            variant === "info" && "bg-info",
            (!variant || variant === "default" || variant === "neutral") &&
              "bg-muted-foreground"
          )}
        />
      )}
      {children}
    </span>
  );
}
