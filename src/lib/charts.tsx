// Web now: recharts; later on RN: swap to react-native-svg + a chart lib.
import {
    LineChart as RLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid
  } from "recharts";
  
  type LineSeries = { dataKey: string; strokeWidth?: number };
  export function LineChart({
    data,
    xKey,
    yKey,
    series = [{ dataKey: "value" }]
  }: {
    data: any[];
    xKey: string;
    yKey: string;
    series?: LineSeries[];
  }) {
    return (
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <RLineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} />
            <YAxis />
            <Tooltip />
            {series.map((s) => (
              <Line key={s.dataKey} type="monotone" dataKey={s.dataKey || yKey} dot={false} strokeWidth={s.strokeWidth ?? 2} />
            ))}
          </RLineChart>
        </ResponsiveContainer>
      </div>
    );
  }
  