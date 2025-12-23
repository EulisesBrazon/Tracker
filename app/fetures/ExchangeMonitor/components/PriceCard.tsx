import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { PriceIndicator } from '../types';
import { cn } from '../../../lib/utils';

interface PriceCardProps {
  title: string;
  indicator: PriceIndicator;
  variant: 'bcv' | 'paralelo';
}

export function PriceCard({ title, indicator, variant }: PriceCardProps) {
  const TrendIcon = indicator.trend === 'up' ? TrendingUp : indicator.trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="overflow-hidden">
      <div className={cn(
        'h-1',
        variant === 'bcv' ? 'bg-bcv' : 'bg-paralelo'
      )} />
      <CardContent className="p-4 text-left">
        <p className="text-sm text-muted-foreground mb-1 text-left">{title}</p>
        <div className="flex items-baseline gap-2 justify-start">
          <span className="text-2xl font-semibold font-mono">
            {indicator.current.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">Bs/$</span>
        </div>
        <div className="flex items-center gap-1 mt-2 justify-start">
          <TrendIcon className={cn(
            'h-4 w-4',
            indicator.trend === 'up' && 'text-trend-up',
            indicator.trend === 'down' && 'text-trend-down',
            indicator.trend === 'stable' && 'text-muted-foreground'
          )} />
          <span className={cn(
            'text-sm font-medium',
            indicator.trend === 'up' && 'text-trend-up',
            indicator.trend === 'down' && 'text-trend-down',
            indicator.trend === 'stable' && 'text-muted-foreground'
          )}>
            {indicator.variation > 0 ? '+' : ''}{indicator.variation}%
          </span>
          <span className="text-xs text-muted-foreground">hoy</span>
        </div>
      </CardContent>
    </Card>
  );
}
