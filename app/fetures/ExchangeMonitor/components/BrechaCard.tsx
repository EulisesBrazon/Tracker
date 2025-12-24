import { Activity } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';

interface BrechaCardProps {
  current: number;
  average: number;
  mode?: 'official' | 'parallel' | 'ratio' | 'ratio_inv';
}

export function BrechaCard({ current, average, mode = 'parallel' }: BrechaCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1 bg-brecha" />
      <CardContent className="p-4 text-left">
        <div className="flex items-center gap-2 mb-1 justify-start">
          <Activity className="h-4 w-4 text-brecha" />
          <p className="text-sm text-muted-foreground">Brecha Cambiaria</p>
        </div>
        <div className="flex items-baseline gap-2 justify-start">
          <span className="text-2xl font-semibold font-mono">
            {mode === 'ratio' || mode === 'ratio_inv' ? current.toFixed(2) : `${current.toFixed(2)}%`}
          </span>
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Fórmula</span>
              {mode === 'official' && (
                <div className="inline-flex items-center gap-2">
                  <span className="text-xs font-mono">(</span>
                  <div className="inline-flex flex-col items-center text-xs font-mono bg-border/10 px-2 py-1 rounded">
                      <span className="leading-4">USDT - BCV</span>
                      <span className="w-full border-t-2 border-muted-foreground/80 my-0.5" />
                      <span className="leading-4">BCV</span>
                    </div>
                  <span className="text-xs font-mono">) × 100</span>
                </div>
              )}
              {mode === 'parallel' && (
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex flex-col items-center text-xs font-mono bg-border/10 px-2 py-1 rounded">
                    <span className="leading-4">USDT - BCV</span>
                    <span className="w-full border-t-2 border-muted-foreground/80 my-0.5" />
                    <span className="leading-4">USDT</span>
                  </div>
                  <span className="text-xs font-mono">× 100</span>
                </div>
              )}
              {mode === 'ratio' && (
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex flex-col items-center text-xs font-mono bg-border/10 px-2 py-1 rounded">
                    <span className="leading-4">USDT</span>
                    <span className="w-full border-t-2 border-muted-foreground/80 my-0.5" />
                    <span className="leading-4">BCV</span>
                  </div>
                </div>
              )}
              {mode === 'ratio_inv' && (
                <div className="inline-flex items-center gap-2">
                  <div className="inline-flex flex-col items-center text-xs font-mono bg-border/10 px-2 py-1 rounded">
                    <span className="leading-4">BCV</span>
                    <span className="w-full border-t-2 border-muted-foreground/80 my-0.5" />
                    <span className="leading-4">USDT</span>
                  </div>
                </div>
              )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'official' && (
              <>Base: <span className="font-medium">BCV</span></>
            )}
            {mode === 'parallel' && (
              <>Base: <span className="font-medium">USDT</span></>
            )}
            {mode === 'ratio' && (
              <>Ratio directo: <span className="font-medium">USDT / BCV</span></>
            )}
            {mode === 'ratio_inv' && (
              <>Ratio directo: <span className="font-medium">BCV / USDT</span></>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
