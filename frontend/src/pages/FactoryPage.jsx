/**
 * Indus AI — 3D Factory / Refinery Monitoring Page
 *
 * Uses the shared FactoryScene3D component (R3F + Three.js).
 * Clicking a machine card in the right panel focuses the camera on that
 * machine and highlights it — all status animations (red blink / amber pulse)
 * are driven live from the WebSocket data in the global store.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2, Minimize2, RefreshCw, Info, AlertTriangle,
  CheckCircle2, XCircle, Activity, Zap, Thermometer, Wind,
} from 'lucide-react';
import useStore from '../stores/useStore';
import FactoryScene3D from '../components/3d_factory/FactoryScene3D';
import {
  MACHINE_NAMES, SENSOR_LABELS, SENSOR_UNITS,
  STATUS_COLORS, STATUS_BG, STATUS_BORDER,
  SUBSYSTEM_ICONS, CHART_COLORS,
} from '../utils/constants';

// ─── helpers ──────────────────────────────────────────────────────────────────
const SKIP_KEYS = new Set(['machine_id', 'machine_type', 'status', 'timestamp']);

function fmt(val, sensor) {
  if (val == null) return '—';
  if (sensor === 'fouling_factor') return val.toExponential(2);
  if (typeof val === 'number') {
    const dec = (sensor === 'reflux_ratio' || sensor === 'ph_level') ? 2
              : Math.abs(val) >= 100 ? 0 : 1;
    return val.toFixed(dec);
  }
  return String(val);
}

function statusLabel(s) {
  return s === 'critical' ? 'CRITICAL' : s === 'warning' ? 'WARNING' : 'HEALTHY';
}

function statusIcon(s) {
  if (s === 'critical') return <XCircle size={13} color="#dc2626" />;
  if (s === 'warning')  return <AlertTriangle size={13} color="#d97706" />;
  return <CheckCircle2 size={13} color="#16a34a" />;
}

// ─── Sensor row inside machine detail drawer ───────────────────────────────
function SensorRow({ sensor, value }) {
  if (SKIP_KEYS.has(sensor)) return null;
  const label = SENSOR_LABELS[sensor] || sensor.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const unit  = SENSOR_UNITS[sensor]  || '';
  const color = CHART_COLORS[sensor]  || '#64748b';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a0a8b0', fontSize: 12 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
        {label}
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>
        {fmt(value, sensor)}
        {unit && <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 2, fontSize: 11 }}>{unit}</span>}
      </span>
    </div>
  );
}

// ─── Compact machine list card (right column) ─────────────────────────────────
function MachineListItem({ machineData, isSelected, onClick }) {
  if (!machineData) return null;
  const { machine_id, machine_type, status } = machineData;
  const name    = MACHINE_NAMES[machine_id] || machine_type;
  const icon    = SUBSYSTEM_ICONS[machine_type] || '⚙️';
  const sColor  = STATUS_COLORS[status]  || STATUS_COLORS.healthy;
  const sBg     = STATUS_BG[status]      || STATUS_BG.healthy;
  const sBorder = STATUS_BORDER[status]  || STATUS_BORDER.healthy;

  return (
    <motion.div
      onClick={() => onClick(machineData)}
      whileHover={{ scale: 1.01, x: 2 }}
      whileTap={{ scale: 0.99 }}
      className={`machine-stat-card ${status === 'critical' ? 'card-critical' : status === 'warning' ? 'card-warning' : ''}`}
      style={{
        background: isSelected ? sBg : 'var(--bg-secondary)',
        border: isSelected ? `2px solid ${sColor}` : `1.5px solid ${sBorder}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: isSelected ? `0 8px 24px ${sColor}40` : '0 6px 16px rgba(0,0,0,0.12)',
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{
        padding: '9px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{machine_id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {statusIcon(status)}
          <span style={{
            padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 800,
            background: sColor, color: '#fff', letterSpacing: '0.06em',
            animation: status === 'critical' ? 'kpi-pulse 0.8s ease-in-out infinite' : 'none',
          }}>
            {statusLabel(status)}
          </span>
        </div>
      </div>
      {/* Mini sensor preview */}
      {machineData.temperature != null && (
        <div style={{
          padding: '4px 12px 6px',
          display: 'flex', gap: 10,
          borderTop: `1px solid ${sBorder}`,
          background: `${sBg}88`,
        }}>
          {[
            { icon: <Thermometer size={10} />, key: 'temperature', unit: '°C' },
            { icon: <Activity size={10} />, key: 'vibration', unit: 'mm/s' },
            { icon: <Zap size={10} />, key: 'power_consumption', unit: 'kW' },
          ].map(({ icon, key, unit }) => machineData[key] != null && (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#94a3b8', fontSize: 10 }}>
              {icon}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#475569' }}>
                {typeof machineData[key] === 'number'
                  ? (key === 'power_consumption'
                    ? (machineData[key] / 1000).toFixed(1)
                    : machineData[key].toFixed(0))
                  : '—'}
              </span>
              <span style={{ color: '#cbd5e1', fontSize: 9 }}>{key === 'power_consumption' ? 'kW' : unit}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Machine detail drawer (slides in below 3D canvas) ────────────────────────
function MachineDetailDrawer({ machine, onClose }) {
  if (!machine) return null;
  const { machine_id, machine_type, status } = machine;
  const name    = MACHINE_NAMES[machine_id] || machine_type;
  const icon    = SUBSYSTEM_ICONS[machine_type] || '⚙️';
  const sColor  = STATUS_COLORS[status] || STATUS_COLORS.healthy;
  const sBorder = STATUS_BORDER[status] || STATUS_BORDER.healthy;
  const sensors = Object.entries(machine).filter(([k]) => !SKIP_KEYS.has(k));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      style={{
        background: 'var(--bg-secondary)',
        border: `1.5px solid ${sBorder}`,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: `0 12px 32px ${sColor}30`,
        marginTop: 0,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: STATUS_BG[status] || STATUS_BG.healthy,
        borderBottom: `1px solid ${sBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>{name}</div>
            <div style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{machine_id}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '3px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
            background: sColor, color: '#fff', letterSpacing: '0.06em',
            animation: status === 'critical' ? 'kpi-pulse 0.8s ease-in-out infinite' : 'none',
          }}>
            {statusLabel(status)}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(100,116,139,0.1)', border: 'none',
              borderRadius: 6, padding: '4px 8px', cursor: 'pointer',
              fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 3,
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Sensor grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 0, padding: '8px 16px 12px',
      }}>
        {/* Group sensors into 3 columns */}
        {[0, 1, 2].map((col) => (
          <div key={col} style={{ padding: '0 8px', borderRight: col < 2 ? '1px solid #f1f5f9' : 'none' }}>
            {sensors
              .filter((_, i) => i % 3 === col)
              .map(([k, v]) => <SensorRow key={k} sensor={k} value={v} />)}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Status banner above 3D model ─────────────────────────────────────────────
function StatusBanner({ criticalCount, warningCount, healthyCount, total }) {
  if (criticalCount > 0) return (
    <div className="embed-ring embed-ring-critical" style={{ borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 16px' }}>
      <span style={{ fontWeight: 800, letterSpacing: '0.04em' }}>
        ⚠ {criticalCount} CRITICAL FAULT{criticalCount > 1 ? 'S' : ''} — IMMEDIATE ACTION REQUIRED
      </span>
      <span style={{ fontSize: 11, opacity: 0.8 }}>{healthyCount}/{total} healthy</span>
    </div>
  );
  if (warningCount > 0) return (
    <div className="embed-ring embed-ring-warning" style={{ borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 16px' }}>
      <span style={{ fontWeight: 700 }}>⚡ {warningCount} WARNING{warningCount > 1 ? 'S' : ''} — MONITOR CLOSELY</span>
      <span style={{ fontSize: 11, opacity: 0.8 }}>{healthyCount}/{total} healthy</span>
    </div>
  );
  return (
    <div className="embed-ring embed-ring-healthy" style={{ borderRadius: '12px 12px 0 0', padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontWeight: 700 }}>✓ ALL {total} SYSTEMS NOMINAL</span>
      <span style={{ fontSize: 11, opacity: 0.8 }}>Drag · Zoom · Rotate</span>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FactoryPage() {
  const machines  = useStore(s => s.machines);
  const alerts    = useStore(s => s.alerts);

  const machineList    = useMemo(() => Object.values(machines), [machines]);
  const criticalCount  = machineList.filter(m => m.status === 'critical').length;
  const warningCount   = machineList.filter(m => m.status === 'warning').length;
  const healthyCount   = machineList.filter(m => m.status === 'healthy').length;

  const sorted = useMemo(() => [...machineList].sort((a, b) => {
    const o = { critical: 0, warning: 1, healthy: 2 };
    return (o[a.status] ?? 3) - (o[b.status] ?? 3);
  }), [machineList]);

  const [selectedMachine, setSelectedMachine] = useState(null);
  const [fullscreen, setFullscreen]           = useState(false);

  const handleSelect = useCallback((m) => {
    setSelectedMachine(prev => prev?.machine_id === m.machine_id ? null : m);
  }, []);

  const recentAlert = alerts?.[0];
  const total       = machineList.length || 7;

  return (
    <div className="factory-page-root">

      {/* ── KPI bar ── */}
      <div className="factory-kpi-bar">
        <KPIChip icon="🏭" label="Total Subsystems" value={total}           color="#2563eb" />
        <KPIChip icon="✅" label="Healthy"           value={healthyCount}   color="#16a34a" />
        <KPIChip icon="⚡" label="Warning"           value={warningCount}   color="#d97706" />
        <KPIChip icon="🚨" label="Critical"          value={criticalCount}  color="#dc2626" pulse={criticalCount > 0} />
        {recentAlert && (
          <div className="factory-latest-alert">
            <span style={{ color: '#dc2626', fontWeight: 800, marginRight: 6 }}>LATEST ALERT:</span>
            <span style={{ fontSize: 12, color: '#374151' }}>{recentAlert.message}</span>
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 8 }}>
              {new Date(recentAlert.timestamp * 1000).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="factory-main-grid" style={{ gap: 14 }}>

        {/* LEFT: 3D Factory Model */}
        <div className="factory-embed-col" style={{ position: 'relative' }}>

          {/* Status banner */}
          <StatusBanner
            criticalCount={criticalCount}
            warningCount={warningCount}
            healthyCount={healthyCount}
            total={total}
          />

          {/* Canvas */}
          <div style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            borderRadius: '0 0 12px 12px',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            borderTop: 'none',
          }}>
            <FactoryScene3D />

            {/* Fullscreen toggle */}
            <button
              onClick={() => setFullscreen(f => !f)}
              style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: '#475569', fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                backdropFilter: 'blur(6px)',
              }}
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {/* Legend overlay */}
            <div style={{
              position: 'absolute', bottom: 10, left: 10,
              display: 'flex', gap: 10,
              background: 'rgba(255,255,255,0.88)',
              borderRadius: 8, padding: '5px 10px',
              border: '1px solid rgba(226,232,240,0.8)',
              backdropFilter: 'blur(6px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>
              {[
                { color: '#22ff88', label: 'Healthy' },
                { color: '#ffaa00', label: 'Warning' },
                { color: '#ff2222', label: 'Critical' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: item.color,
                    boxShadow: `0 0 5px ${item.color}`,
                    display: 'inline-block',
                  }} />
                  {item.label}
                </div>
              ))}
              <div style={{ borderLeft: '1px solid #e2e8f0', marginLeft: 2, paddingLeft: 8, fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                <Info size={10} /> Drag · Scroll · Pan
              </div>
            </div>
          </div>

          {/* Machine detail drawer (animated slide-in below canvas) */}
          <AnimatePresence>
            {selectedMachine && (
              <div style={{ marginTop: 10 }}>
                <MachineDetailDrawer
                  machine={selectedMachine}
                  onClose={() => setSelectedMachine(null)}
                />
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Live machine list */}
        <div className="factory-stats-col">
          <div className="stats-col-header" style={{ padding: '12px 14px' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#1e293b' }}>
              Live Sensor Data
            </span>
            <span className="live-dot" />
            <span style={{ fontSize: 10, color: '#64748b' }}>real-time</span>
            {selectedMachine && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                color: '#00d4ff', background: 'rgba(0, 212, 255, 0.08)',
                padding: '2px 8px', borderRadius: 6,
                border: '1px solid #bfdbfe',
              }}>
                Focused: {MACHINE_NAMES[selectedMachine.machine_id]?.split(' ').slice(-2).join(' ')}
              </span>
            )}
          </div>

          <div className="stats-cards-scroll">
            {sorted.length > 0
              ? sorted.map(m => (
                  <MachineListItem
                    key={m.machine_id}
                    machineData={m}
                    isSelected={selectedMachine?.machine_id === m.machine_id}
                    onClick={handleSelect}
                  />
                ))
              : Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    height: 76, borderRadius: 10,
                    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                    marginBottom: 8,
                  }} />
                ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── KPI chip ─────────────────────────────────────────────────────────────────
function KPIChip({ icon, label, value, color, pulse }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)', borderRadius: 10,
      boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
        <div style={{
          fontSize: 20, fontWeight: 800, color,
          animation: pulse ? 'kpi-pulse 1s ease-in-out infinite' : 'none',
        }}>
          {value}
        </div>
      </div>
    </div>
  );
}
