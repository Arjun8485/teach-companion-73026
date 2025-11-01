import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export default function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("border-border/40 transition-all hover:border-border hover:shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground opacity-60">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-semibold text-foreground">{value}</div>
          {trend && (
            <div className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-md",
              trend.positive ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
            )}>
              {trend.positive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
