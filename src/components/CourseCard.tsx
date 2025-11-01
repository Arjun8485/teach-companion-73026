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
      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 hover:-translate-y-1"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <GraduationCap className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground leading-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{code}</p>
            <p className="text-sm text-muted-foreground">{dates}</p>
            <p className="text-xs text-muted-foreground">{department}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
