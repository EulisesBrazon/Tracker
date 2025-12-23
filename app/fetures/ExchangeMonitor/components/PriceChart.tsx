import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { ExchangeDataPoint } from '../types';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface PriceChartProps {
  data: ExchangeDataPoint[];
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <p className="text-xs text-muted-foreground mb-2">
        {format(parseISO(label), 'dd MMM yyyy', { locale: es })}
      </p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-mono font-medium">{entry.value.toFixed(2)} Bs</span>
        </div>
      ))}
    </div>
  );
}

export function PriceChart({ data }: PriceChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base font-medium text-center">
          Comparación de Tasas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 px-2 sm:px-6 pb-4 sm:pb-6">
        <div className="h-[280px] sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} syncId="exchangeSync" margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                tickFormatter={(value) => value.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                align="center"
                wrapperStyle={{ paddingTop: 10, marginLeft: 10 }}
                iconType="circle"
                iconSize={8}
              />
              <Line
                type="monotone"
                dataKey="bcv"
                name="BCV"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="paralelo"
                name="Paralelo"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
