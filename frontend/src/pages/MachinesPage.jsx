import React from 'react';
import { motion } from 'framer-motion';
import {
  Server,
  Flame,        // Distillation Column
  Waves,        // Heat Exchanger
  Gauge,        // Pump Station
  Wind,         // Cooling Tower
  Filter,       // Separator Unit
  Zap,          // Compressor
  Database,     // Storage Tank
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import useStore from '../stores/useStore';
import SensorChart from '../components/dashboard/SensorChart';
import { MACHINE_NAMES, SENSOR_LABELS, SENSOR_UNITS, STATUS_COLORS, CHART_COLORS } from '../utils/constants';

const SKIP_KEYS = new Set(['machine_id', 'machine_type', 'status', 'timestamp']);

// Machine-type to Lucide icon + color mapping
const MACHINE_ICON_MAP = {
  'Distillation Column': { Icon: Flame,    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'    },
  'Heat Exchanger':      { Icon: Waves,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'   },
  'Pump Station':        { Icon: Gauge,    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'   },
  'Cooling Tower':       { Icon: Wind,     color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'    },
  'Separator Unit':      { Icon: Filter,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'   },
  'Compressor':          { Icon: Zap,      color: '#f97316', bg: 'rgba(249,115,22,0.12)'   },
  'Storage Tank':        { Icon: Database, color: '#14b8a6', bg: 'rgba(20,184,166,0.12)'   },
};

const STATUS_CONFIG = {
  critical: { label: 'CRITICAL', color: '#ef4444', Icon: XCircle,       anim: 'blink-red 0.8s ease-in-out infinite' },
  warning:  { label: 'WARNING',  color: '#f59e0b', Icon: AlertTriangle,  anim: 'none' },
  healthy:  { label: 'HEALTHY',  color: '#22c55e', Icon: CheckCircle2,   anim: 'none' },
};

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

export default function MachinesPage() {
  const machines      = useStore((s) => s.machines);
  const machineHistory = useStore((s) => s.machineHistory);
  const machineList   = Object.values(machines);

  return (
    <div>
      {/* Page header */}
      <div className="section-header" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/indus-ai.svg"
            alt="Indus AI"
            style={{
              width: 42, height: 42, borderRadius: 12,
              boxShadow: '0 0 16px rgba(0,212,255,0.25)',
              display: 'block',
            }}
          />
          <div>
            <div className="section-title" style={{ fontSize: 20 }}>Machines Overview</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Detailed live metrics & sensor charts for all {machineList.length || 7} subsystems
            </div>
          </div>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Activity size={12} />
          Updates every 5s
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {machineList.length === 0 ? (
          <div className="glass-card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            Awaiting machine data...
          </div>
        ) : (
          machineList.map((machine, idx) => {
            const history    = machineHistory[machine.machine_id] || [];
            const sensors    = Object.keys(machine).filter(k => !SKIP_KEYS.has(k));
            const machConf   = MACHINE_ICON_MAP[machine.machine_type] || { Icon: Activity, color: '#00d4ff', bg: 'rgba(0,212,255,0.1)' };
            const { Icon, color: iconColor, bg: iconBg } = machConf;
            const statusConf = STATUS_CONFIG[machine.status] || STATUS_CONFIG.healthy;
            const StatusIcon = statusConf.Icon;

            return (
              <motion.div
                key={machine.machine_id}
                className="glass-card"
                style={{ padding: 24, overflow: 'hidden' }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
              >
                {/* ── Machine header ── */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  marginBottom: 20, paddingBottom: 18,
                  borderBottom: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Machine-specific icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: iconBg,
                      border: `1.5px solid ${iconColor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 4px 16px ${iconColor}20`,
                    }}>
                      <Icon size={26} color={iconColor} />
                    </div>

                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                        {MACHINE_NAMES[machine.machine_id] || machine.machine_type}
                      </div>
                      <div style={{ fontSize: 11, color: iconColor, fontWeight: 600, marginTop: 2 }}>
                        {machine.machine_type}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", marginTop: 1 }}>
                        {machine.machine_id}
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 18px', borderRadius: 24,
                    background: `${statusConf.color}15`,
                    border: `1.5px solid ${statusConf.color}40`,
                    animation: statusConf.anim,
                  }}>
                    <StatusIcon size={14} color={statusConf.color} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: statusConf.color, letterSpacing: '0.06em' }}>
                      {statusConf.label}
                    </span>
                  </div>
                </div>

                {/* ── Live Values Grid ── */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Live Sensor Readings
                  </div>
                  <div className="grid-auto" style={{ gap: 10 }}>
                    {sensors.map(sensor => {
                      const dotColor = CHART_COLORS[sensor] || iconColor;
                      return (
                        <div key={sensor} style={{
                          background: 'var(--bg-tertiary)',
                          padding: '10px 14px',
                          borderRadius: 10,
                          border: `1px solid ${dotColor}20`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: dotColor, boxShadow: `0 0 4px ${dotColor}`,
                              display: 'inline-block', flexShrink: 0,
                            }} />
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {SENSOR_LABELS[sensor] || sensor.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)' }}>
                            {fmt(machine[sensor], sensor)}
                            {SENSOR_UNITS[sensor] && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 3, fontWeight: 400 }}>
                                {SENSOR_UNITS[sensor]}
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Sensor Charts ── */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                    Real-Time Charts
                  </div>
                  <div className="grid-auto">
                    {sensors.slice(0, 4).map(sensor => (
                      <SensorChart key={sensor} data={history} sensorKey={sensor} />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
