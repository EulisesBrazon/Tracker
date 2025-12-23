import { BarChart3 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { PeriodStats } from '../types';

interface StatsCardProps {
  bcvStats: PeriodStats;
  paraleloStats: PeriodStats;
}

export function StatsCard({ bcvStats, paraleloStats }: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-bcv to-paralelo" />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Estadísticas del Período</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-bcv mb-1 text-left">BCV</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Promedio:</span>
                <span className="font-mono">{bcvStats.average.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máximo:</span>
                <span className="font-mono">{bcvStats.max.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mínimo:</span>
                <span className="font-mono">{bcvStats.min.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-paralelo mb-1 text-left">Paralelo</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Promedio:</span>
                <span className="font-mono">{paraleloStats.average.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Máximo:</span>
                <span className="font-mono">{paraleloStats.max.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mínimo:</span>
                <span className="font-mono">{paraleloStats.min.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
