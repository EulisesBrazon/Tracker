import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ExchangeDataPoint } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface BrechaChartProps {
  data: ExchangeDataPoint[];
  mode?: 'official' | 'parallel' | 'ratio' | 'ratio_inv';
}

function CustomTooltip({ active, payload, label, mode }: any) {
  if (!active || !payload?.length) return null;

  const val = payload[0].value;

  return (
    <div className="chart-tooltip">
      <p className="text-xs text-muted-foreground mb-1">
        {format(parseISO(label), 'dd MMM yyyy', { locale: es })}
      </p>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{mode === 'ratio' || mode === 'ratio_inv' ? 'Ratio:' : 'Brecha:'}</span>
        <span className="font-mono font-medium text-brecha">
          {mode === 'ratio' || mode === 'ratio_inv' ? val.toFixed(2) : `${val.toFixed(2)}%`}
        </span>
      </div>
    </div>
  );
}

export function BrechaChart({ data, mode = 'parallel' }: BrechaChartProps) {
  const mapped = data.map(d => {
    if (mode === 'official') return { ...d, value: d.brecha_official ?? 0 };
    if (mode === 'ratio') return { ...d, value: d.ratio ?? 0 };
    if (mode === 'ratio_inv') return { ...d, value: d.ratio_inv ?? 0 };
    return { ...d, value: d.brecha ?? 0 };
  });
  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base font-medium text-center">
          Brecha Cambiaria (%)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-2 sm:px-6 pb-4 sm:pb-6">
        <div className="h-50 sm:h-55">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mapped} syncId="exchangeSync" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="brechaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="fecha"
                tickFormatter={(value) => format(parseISO(value), 'dd/MM')}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 11 }}
                className="text-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => (mode === 'ratio' || mode === 'ratio_inv' ? String(value) : `${value}%`)}
              />
              <Tooltip content={<CustomTooltip mode={mode} />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(25, 95%, 53%)"
                strokeWidth={2}
                fill="url(#brechaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
