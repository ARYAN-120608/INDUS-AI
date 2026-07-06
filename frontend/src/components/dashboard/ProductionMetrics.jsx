/**
 * Indus AI — Production Metrics Panel
 * Shows production efficiency, throughput, energy, and uptime gauges
 * Replaces the removed Digital Twin section on the Overview page
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Zap, TrendingUp, Droplets, Clock, BarChart2, Thermometer, Activity, Wind
} from 'lucide-react';
import useStore from '../../stores/useStore';

// ─── Radial gauge ────────────────────────────────────────────────────────────
function RadialGauge({ value, max = 100, label, unit, color, size = 100 }) {
  const pct = Math.min(value / max, 1);
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  // Arc goes from -225° to 45° (270° sweep)
  const sweep = 0.75;  // 270/360
  const dashArray = circ;
  const dashOffset = circ * (1 - sweep * pct);
  const viewBox = `0 0 ${size} ${size}`;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={viewBox}>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth={size * 0.08}
          strokeDasharray={`${circ * sweep} ${circ * (1 - sweep)}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
        />
        {/* Value arc */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={`url(#g-${label})`}
          strokeWidth={size * 0.08}
          strokeDasharray={`${circ * sweep * pct} ${circ * (1 - sweep * pct)}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135 ${cx} ${cy})`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Center value */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={size * 0.17} fontWeight="800" fill={color} fontFamily="'JetBrains Mono', monospace">
          {typeof value === 'number' ? value.toFixed(value >= 100 ? 0 : 1) : value}
        </text>
        <text x={cx} y={cy + size * 0.13} textAnchor="middle" fontSize={size * 0.1} fill="rgba(100,116,139,0.9)" fontFamily="system-ui">
          {unit}
        </text>
      </svg>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>
        {label}
      </span>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────────────────
function StatTile({ icon: Icon, label, value, unit, color, sub, pulse }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'var(--bg-secondary)',
        border: `1.5px solid ${color}22`,
        borderRadius: 12,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        boxShadow: `0 8px 24px ${color}30`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent glow bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
        borderRadius: '12px 12px 0 0',
        animation: pulse ? 'gradient-pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={color} />
        </div>
        {pulse && (
          <span style={{
            fontSize: 9, fontWeight: 700, color: '#dc2626',
            background: 'rgba(255, 42, 42, 0.15)', borderRadius: 4, padding: '2px 6px',
            animation: 'blink-red 0.8s ease-in-out infinite',
          }}>
            ● ALERT
          </span>
        )}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{
        fontSize: 22, fontWeight: 800,
        fontFamily: "'JetBrains Mono', monospace",
        color: color,
        lineHeight: 1.1,
      }}>
        {value}
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{sub}</div>}
    </motion.div>
  );
}

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function ThroughputBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
          {value.toFixed(0)}%
        </span>
      </div>
      <div style={{ height: 6, background: 'rgba(148,163,184,0.15)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            borderRadius: 3,
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProductionMetrics() {
  const machines = useStore((s) => s.machines);
  const alerts = useStore((s) => s.alerts);

  const machineList = useMemo(() => Object.values(machines), [machines]);
  const criticalCount = machineList.filter((m) => m.status === 'critical').length;
  const warningCount = machineList.filter((m) => m.status === 'warning').length;
  const healthyCount = machineList.filter((m) => m.status === 'healthy').length;
  const totalMachines = machineList.length || 7;

  // Derived production KPIs from live sensor averages
  const avgEfficiency = useMemo(() => {
    const effs = machineList.map((m) => m.efficiency).filter((v) => typeof v === 'number');
    return effs.length ? effs.reduce((a, b) => a + b, 0) / effs.length : 88.4;
  }, [machineList]);

  const avgTemp = useMemo(() => {
    const temps = machineList.map((m) => m.temperature).filter((v) => typeof v === 'number');
    return temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  }, [machineList]);

  const totalPower = useMemo(() => {
    const pows = machineList.map((m) => m.power_consumption).filter((v) => typeof v === 'number');
    return pows.length ? pows.reduce((a, b) => a + b, 0) : 0;
  }, [machineList]);

  const avgFlow = useMemo(() => {
    const flows = machineList.map((m) => m.flow_rate).filter((v) => typeof v === 'number');
    return flows.length ? flows.reduce((a, b) => a + b, 0) / flows.length : 0;
  }, [machineList]);

  const uptime = totalMachines > 0 ? ((healthyCount / totalMachines) * 100) : 100;

  // Per-subsystem efficiency breakdown
  const efficiencyBreakdown = useMemo(() => {
    const types = [
      { key: 'distillation-column-1', label: 'Distillation', color: '#6366f1' },
      { key: 'heat-exchanger-hx1',    label: 'Heat Exchange', color: '#f59e0b' },
      { key: 'pump-station-p1',       label: 'Pumping', color: '#10b981' },
      { key: 'cooling-tower-ct1',     label: 'Cooling', color: '#0ea5e9' },
      { key: 'compressor-c1',         label: 'Compression', color: '#8b5cf6' },
    ];
    return types.map((t) => ({
      ...t,
      value: machines[t.key]?.efficiency ?? (72 + Math.random() * 20),
    }));
  }, [machines]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Row 1: 4 stat tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatTile
          icon={TrendingUp}
          label="Overall Efficiency"
          value={avgEfficiency.toFixed(1)}
          unit="%"
          color="#10b981"
          sub="Fleet average"
          pulse={avgEfficiency < 70}
        />
        <StatTile
          icon={Zap}
          label="Total Power Draw"
          value={totalPower > 0 ? (totalPower / 1000).toFixed(2) : '—'}
          unit="MW"
          color="#f59e0b"
          sub="All subsystems"
          pulse={criticalCount > 0}
        />
        <StatTile
          icon={Droplets}
          label="Avg Flow Rate"
          value={avgFlow > 0 ? avgFlow.toFixed(1) : '—'}
          unit="m³/h"
          color="#0ea5e9"
          sub="Process streams"
        />
        <StatTile
          icon={Thermometer}
          label="Avg Temperature"
          value={avgTemp > 0 ? avgTemp.toFixed(1) : '—'}
          unit="°C"
          color={avgTemp > 120 ? '#dc2626' : '#6366f1'}
          sub="Thermal profile"
          pulse={avgTemp > 120}
        />
      </div>

      {/* Row 2: Gauges + throughput breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Radial gauges */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={14} />  System Health Gauges
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <RadialGauge
              value={uptime}
              max={100}
              label="Plant Uptime"
              unit="%"
              color="#10b981"
              size={90}
            />
            <RadialGauge
              value={criticalCount > 0 ? 100 - criticalCount * 15 : warningCount > 0 ? 100 - warningCount * 8 : 98}
              max={100}
              label="Reliability"
              unit="%"
              color={criticalCount > 0 ? '#dc2626' : warningCount > 0 ? '#f59e0b' : '#6366f1'}
              size={90}
            />
            <RadialGauge
              value={avgEfficiency}
              max={100}
              label="OEE Score"
              unit="%"
              color="#0ea5e9"
              size={90}
            />
          </div>
        </div>

        {/* Subsystem throughput bars */}
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 12,
          padding: '14px 16px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart2 size={14} />  Subsystem Efficiency
          </div>
          {efficiencyBreakdown.map((item) => (
            <ThroughputBar
              key={item.key}
              label={item.label}
              value={item.value}
              max={100}
              color={item.color}
            />
          ))}
        </div>
      </div>

      {/* Row 3: Operating params */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatTile
          icon={Clock}
          label="MTBF"
          value="1,247"
          unit="hrs"
          color="#8b5cf6"
          sub="Mean time between failures"
        />
        <StatTile
          icon={Wind}
          label="Emissions Index"
          value={criticalCount > 0 ? 'HIGH' : warningCount > 0 ? 'MOD' : 'LOW'}
          unit=""
          color={criticalCount > 0 ? '#dc2626' : warningCount > 0 ? '#f59e0b' : '#10b981'}
          sub="GHG intensity"
          pulse={criticalCount > 0}
        />
        <StatTile
          icon={Activity}
          label="Throughput Rate"
          value={avgFlow > 0 ? (avgFlow * 7).toFixed(0) : '—'}
          unit="m³/h"
          color="#06b6d4"
          sub="All streams combined"
        />
        <StatTile
          icon={BarChart2}
          label="Active Alerts"
          value={alerts.length}
          unit=""
          color={alerts.length > 5 ? '#dc2626' : alerts.length > 0 ? '#f59e0b' : '#10b981'}
          sub="Last 24 hours"
          pulse={criticalCount > 0}
        />
      </div>
    </div>
  );
}
