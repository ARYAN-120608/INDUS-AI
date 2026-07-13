/**
 * Indus AI — 3D Factory / Refinery Monitoring Page
 * Complete UI redesign. FactoryScene3D is untouched.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, CheckCircle2, XCircle,
  Activity, Zap, Thermometer, Droplets,
  X, ChevronDown, ChevronUp, LayoutGrid,
  Flame, Waves, Gauge, Wind, Filter, Database,
} from 'lucide-react';
import useStore from '../stores/useStore';
import FactoryScene3D from '../components/3d_factory/FactoryScene3D';
import {
  MACHINE_NAMES, SENSOR_LABELS, SENSOR_UNITS,
  STATUS_COLORS, STATUS_BG, STATUS_BORDER,
  SUBSYSTEM_ICONS, CHART_COLORS,
} from '../utils/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SKIP = new Set(['machine_id', 'machine_type', 'status', 'timestamp']);

// Machine-type → Lucide icon + color mapping (mirrors MachinesPage)
const MACHINE_ICON_MAP = {
  'Distillation Column': { Icon: Flame,    color: '#ef4444', bg: 'rgba(239,68,68,0.15)'    },
  'Heat Exchanger':      { Icon: Waves,    color: '#f59e0b', bg: 'rgba(245,158,11,0.15)'   },
  'Pump Station':        { Icon: Gauge,    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)'   },
  'Cooling Tower':       { Icon: Wind,     color: '#06b6d4', bg: 'rgba(6,182,212,0.15)'    },
  'Separator Unit':      { Icon: Filter,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)'   },
  'Compressor':          { Icon: Zap,      color: '#f97316', bg: 'rgba(249,115,22,0.15)'   },
  'Storage Tank':        { Icon: Database, color: '#14b8a6', bg: 'rgba(20,184,166,0.15)'   },
};

function fmt(val, key) {
  if (val == null) return '—';
  if (key === 'fouling_factor') return val.toExponential(2);
  if (typeof val === 'number') {
    return val.toFixed((key === 'reflux_ratio' || key === 'ph_level') ? 2 : Math.abs(val) >= 100 ? 0 : 1);
  }
  return String(val);
}

const STATUS_META = {
  critical: { label: 'CRITICAL', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.35)',  icon: <XCircle size={12} color="#ef4444" /> },
  warning:  { label: 'WARNING',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',  icon: <AlertTriangle size={12} color="#f59e0b" /> },
  healthy:  { label: 'HEALTHY',  color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', icon: <CheckCircle2 size={12} color="#22c55e" /> },
};
const sm = (s) => STATUS_META[s] || STATUS_META.healthy;

// ─── Machine sidebar card ──────────────────────────────────────────────────────
function MachineSideCard({ machine, isSelected, onClick }) {
  const { machine_id, machine_type, status } = machine;
  const name = MACHINE_NAMES[machine_id] || machine_type;
  const machConf = MACHINE_ICON_MAP[machine_type] || { Icon: Activity, color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' };
  const { Icon: MachineIcon, color: iconColor, bg: iconBg } = machConf;
  const meta = sm(status);

  return (
    <motion.button
      onClick={() => onClick(machine)}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      style={{
        width: '100%', textAlign: 'left',
        background: isSelected ? meta.bg : 'transparent',
        border: `1px solid ${isSelected ? meta.color : 'var(--border-subtle)'}`,
        borderRadius: 10, cursor: 'pointer', padding: '10px 12px',
        transition: 'all 0.18s ease',
        boxShadow: isSelected ? `0 0 0 3px ${meta.color}20` : 'none',
        animation: status === 'critical' ? 'card-critical-pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Icon badge */}
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: iconBg,
          border: `1.5px solid ${iconColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 8px ${iconColor}20`,
        }}>
          <MachineIcon size={17} color={iconColor} />
        </div>

        {/* Name + ID */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            {machine_id}
          </div>
        </div>

        {/* Status pill */}
        <div style={{
          padding: '2px 8px', borderRadius: 20, fontSize: 9, fontWeight: 800,
          background: meta.color, color: '#fff', letterSpacing: '0.05em', flexShrink: 0,
        }}>
          {meta.label}
        </div>
      </div>

      {/* Mini sensor strip */}
      {machine.temperature != null && (
        <div style={{ display: 'flex', gap: 14, marginTop: 7, paddingTop: 7, borderTop: `1px solid ${meta.border}` }}>
          {[
            { k: 'temperature',       icon: <Thermometer size={9} />, unit: '°C' },
            { k: 'vibration',         icon: <Activity     size={9} />, unit: 'mm/s' },
            { k: 'power_consumption', icon: <Zap          size={9} />, unit: 'kW' },
          ].map(({ k, icon, unit }) => machine[k] != null && (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: 10 }}>
              {icon}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: 'var(--text-secondary)' }}>
                {typeof machine[k] === 'number' ? machine[k].toFixed(0) : '—'}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{unit}</span>
            </div>
          ))}
        </div>
      )}
    </motion.button>
  );
}

// ─── Sensor detail panel (slides up from bottom) ───────────────────────────────
function SensorPanel({ machine, onClose }) {
  const name   = MACHINE_NAMES[machine.machine_id] || machine.machine_type;
  const panelConf = MACHINE_ICON_MAP[machine.machine_type] || { Icon: Activity, color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' };
  const { Icon: PanelIcon, color: panelIconColor } = panelConf;
  const meta   = sm(machine.status);
  const sensors = Object.entries(machine).filter(([k]) => !SKIP.has(k));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        background: 'var(--bg-secondary)',
        border: `1.5px solid ${meta.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: `0 20px 48px rgba(0,0,0,0.3), 0 0 0 1px ${meta.color}15`,
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 18px',
        background: meta.bg,
        borderBottom: `1px solid ${meta.border}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${panelIconColor}18`,
          border: `1.5px solid ${panelIconColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 2px 10px ${panelIconColor}25`,
        }}>
          <PanelIcon size={20} color={panelIconColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>{name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>{machine.machine_id}</div>
        </div>
        <div style={{
          padding: '3px 12px', borderRadius: 20, fontSize: 10, fontWeight: 800,
          background: meta.color, color: '#fff', letterSpacing: '0.05em',
          display: 'flex', alignItems: 'center', gap: 5,
          animation: machine.status === 'critical' ? 'blink-red 0.8s ease-in-out infinite' : 'none',
        }}>
          {meta.icon} {meta.label}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(148,163,184,0.12)', border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
            color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
          }}
        >
          <X size={13} /> Close
        </button>
      </div>

      {/* Sensor grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, padding: '14px 18px' }}>
        {sensors.map(([k, v]) => {
          const label = SENSOR_LABELS[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const unit  = SENSOR_UNITS[k]  || '';
          const color = CHART_COLORS[k]  || '#64748b';
          return (
            <div key={k} style={{
              background: 'var(--bg-tertiary)',
              border: `1px solid ${color}25`,
              borderRadius: 10, padding: '10px 12px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}`, display: 'inline-block' }} />
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', lineHeight: 1 }}>
                {fmt(v, k)}
                {unit && <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Status banner inside canvas ──────────────────────────────────────────────
function CanvasBanner({ criticalCount, warningCount, healthyCount, total }) {
  if (criticalCount > 0) return (
    <div style={{
      background: 'rgba(15,5,5,0.85)', backdropFilter: 'blur(10px)',
      borderBottom: '2px solid rgba(239,68,68,0.6)',
      padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      animation: 'critical-bar-pulse 0.9s ease-in-out infinite',
    }}>
      <span style={{ fontWeight: 800, color: '#ef4444', fontSize: 12, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
        <XCircle size={14} color="#ef4444" />
        {criticalCount} CRITICAL FAULT{criticalCount > 1 ? 'S' : ''} — IMMEDIATE ACTION REQUIRED
      </span>
      <span style={{ fontSize: 11, color: 'rgba(239,68,68,0.7)' }}>{healthyCount}/{total} nominal</span>
    </div>
  );
  if (warningCount > 0) return (
    <div style={{
      background: 'rgba(10,8,2,0.82)', backdropFilter: 'blur(10px)',
      borderBottom: '1.5px solid rgba(245,158,11,0.5)',
      padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontWeight: 700, color: '#f59e0b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <AlertTriangle size={14} color="#f59e0b" />
        {warningCount} WARNING{warningCount > 1 ? 'S' : ''} DETECTED — MONITOR CLOSELY
      </span>
      <span style={{ fontSize: 11, color: 'rgba(245,158,11,0.7)' }}>{healthyCount}/{total} nominal</span>
    </div>
  );
  return (
    <div style={{
      background: 'rgba(2,10,5,0.8)', backdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(34,197,94,0.3)',
      padding: '7px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <CheckCircle2 size={14} color="#22c55e" />
        ALL {total} SYSTEMS NOMINAL
      </span>
      <span style={{ fontSize: 11, color: 'rgba(34,197,94,0.6)' }}>Drag · Scroll · Rotate</span>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function FactoryPage() {
  const machines = useStore(s => s.machines);
  const alerts   = useStore(s => s.alerts);

  const machineList   = useMemo(() => Object.values(machines), [machines]);
  const criticalCount = machineList.filter(m => m.status === 'critical').length;
  const warningCount  = machineList.filter(m => m.status === 'warning').length;
  const healthyCount  = machineList.filter(m => m.status === 'healthy').length;
  const total         = machineList.length || 7;

  const sorted = useMemo(() => [...machineList].sort((a, b) => {
    const o = { critical: 0, warning: 1, healthy: 2 };
    return (o[a.status] ?? 3) - (o[b.status] ?? 3);
  }), [machineList]);

  const [selected, setSelected] = useState(null);
  const handleSelect = useCallback(m => setSelected(p => p?.machine_id === m.machine_id ? null : m), []);

  const recentAlert = alerts?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: 'calc(100vh - 96px)', overflow: 'hidden' }}>

      {/* ── Top bar: title + stats chips + alert ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src="/indus-ai.svg"
            alt="Indus AI"
            style={{
              width: 38, height: 38, borderRadius: 10,
              boxShadow: '0 0 16px rgba(0,212,255,0.3)',
              display: 'block',
            }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", lineHeight: 1.2 }}>
              Interactive Refinery Model
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{total} subsystems · live telemetry</div>
          </div>
        </div>

        {/* Status chips */}
        <div style={{ display: 'flex', gap: 8, marginLeft: 4 }}>
          {[
            { label: 'Healthy',  count: healthyCount,  color: '#22c55e' },
            { label: 'Warning',  count: warningCount,  color: '#f59e0b' },
            { label: 'Critical', count: criticalCount, color: '#ef4444', pulse: criticalCount > 0 },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px',
              background: `${s.color}10`,
              border: `1px solid ${s.color}30`,
              borderRadius: 20,
              animation: s.pulse ? 'blink-red 0.8s ease-in-out infinite' : 'none',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.count}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Latest alert ticker */}
        {recentAlert && (
          <motion.div
            key={recentAlert.timestamp}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 14px',
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, maxWidth: 380, overflow: 'hidden',
            }}
          >
            <XCircle size={12} color="#ef4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <strong style={{ color: '#ef4444' }}>ALERT: </strong>{recentAlert.message}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', flexShrink: 0 }}>
              {new Date(recentAlert.timestamp * 1000).toLocaleTimeString()}
            </span>
          </motion.div>
        )}
      </div>

      {/* ── Main 2-col layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14, flex: 1, minHeight: 0 }}>

        {/* LEFT: 3D scene column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          {/* 3D Canvas card */}
          <div style={{
            flex: 1, minHeight: 0,
            borderRadius: 14, overflow: 'hidden',
            border: '1.5px solid var(--border-subtle)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column',
          }}>
            <CanvasBanner
              criticalCount={criticalCount}
              warningCount={warningCount}
              healthyCount={healthyCount}
              total={total}
            />
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <FactoryScene3D />

              {/* Legend */}
              <div style={{
                position: 'absolute', bottom: 12, left: 12,
                display: 'flex', gap: 10, alignItems: 'center',
                background: 'rgba(8,12,22,0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: 8, padding: '5px 12px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {[{ c: '#22ff88', l: 'Healthy' }, { c: '#ffaa00', l: 'Warning' }, { c: '#ff2222', l: 'Critical' }].map(({ c, l }) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, boxShadow: `0 0 5px ${c}`, display: 'inline-block' }} />
                    {l}
                  </div>
                ))}
                <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Drag · Scroll · Pan</span>
              </div>
            </div>
          </div>

          {/* Sensor detail panel below canvas */}
          <AnimatePresence>
            {selected && (
              <SensorPanel
                key={selected.machine_id}
                machine={selected}
                onClose={() => setSelected(null)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Machine list panel */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid var(--border-subtle)',
          borderRadius: 14,
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {/* Panel header */}
          <div style={{
            padding: '13px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
          }}>
            <Activity size={15} color="var(--accent-blue)" />
            <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)', flex: 1 }}>
              Subsystem Status
            </span>
            {/* Live dot */}
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
              boxShadow: '0 0 0 0 rgba(34,197,94,0.4)',
              animation: 'live-pulse 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>live</span>
          </div>

          {/* Summary row */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
            {[
              { label: 'Healthy',  val: healthyCount,  color: '#22c55e' },
              { label: 'Warning',  val: warningCount,  color: '#f59e0b' },
              { label: 'Critical', val: criticalCount, color: '#ef4444' },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1, textAlign: 'center', padding: '10px 4px',
                borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Machine cards */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sorted.length > 0
              ? sorted.map(m => (
                  <MachineSideCard
                    key={m.machine_id}
                    machine={m}
                    isSelected={selected?.machine_id === m.machine_id}
                    onClick={handleSelect}
                  />
                ))
              : Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} style={{
                    height: 72, borderRadius: 10,
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }} />
                ))
            }
          </div>

          {/* Footer hint */}
          <div style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', flexShrink: 0,
          }}>
            Tap a machine to see all sensor readings
          </div>
        </div>
      </div>
    </div>
  );
}
