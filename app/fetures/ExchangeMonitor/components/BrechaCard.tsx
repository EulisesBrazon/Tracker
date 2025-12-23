import { Activity } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

interface BrechaCardProps {
  current: number;
  average: number;
}

export function BrechaCard({ current, average }: BrechaCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-brecha" />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Activity className="h-4 w-4 text-brecha" />
          <p className="text-sm text-muted-foreground">Brecha Cambiaria</p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold font-mono">
            {current.toFixed(2)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Promedio del período: <span className="font-medium">{average.toFixed(2)}%</span>
        </p>
      </CardContent>
    </Card>
  );
}
