import { GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CourseCardProps {
  title: string;
  code: string;
  dates: string;
  department: string;
  onClick?: () => void;
}

export default function CourseCard({ title, code, dates, department, onClick }: CourseCardProps) {
  return (
    <Card 
      className="group cursor-pointer border-border/40 transition-all hover:border-primary/30 hover:shadow-sm"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground leading-snug mb-1 line-clamp-2">{title}</h3>
              <p className="text-xs text-muted-foreground font-mono">{code}</p>
            </div>
          </div>
          <div className="space-y-1 pt-2 border-t border-border/40">
            <p className="text-xs text-muted-foreground">{dates}</p>
            <p className="text-xs text-muted-foreground/80">{department}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
