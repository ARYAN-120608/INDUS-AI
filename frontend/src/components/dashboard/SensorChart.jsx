/**
 * Indus AI — Real-Time Sensor Chart
 * Line chart with live streaming data using Recharts
 */

import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { CHART_COLORS, SENSOR_LABELS, SENSOR_UNITS } from '../../utils/constants';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: 'rgba(10, 14, 39, 0.95)',
        border: '1px solid rgba(0, 212, 255, 0.2)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 11,
      }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
          {p.value?.toFixed(1)} {SENSOR_UNITS[p.dataKey] || ''}
        </div>
      ))}
    </div>
  );
};

export default function SensorChart({ data, sensorKey, title, color, height = 180 }) {
  const chartColor = color || CHART_COLORS[sensorKey] || '#00d4ff';
  const chartTitle = title || SENSOR_LABELS[sensorKey] || sensorKey;

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.slice(-60).map((d, i) => ({
      time: d.time || i,
      [sensorKey]: typeof d[sensorKey] === 'number' ? d[sensorKey] : 0,
    }));
  }, [data, sensorKey]);

  return (
    <div className="chart-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {chartTitle}
        </span>
        {chartData.length > 0 && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: chartColor,
            }}
          >
            {chartData[chartData.length - 1]?.[sensorKey]?.toFixed(1)}
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 2 }}>
              {SENSOR_UNITS[sensorKey] || ''}
            </span>
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`grad-${sensorKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            tick={false}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.06)' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey={sensorKey}
            stroke={chartColor}
            strokeWidth={2}
            fill={`url(#grad-${sensorKey})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
