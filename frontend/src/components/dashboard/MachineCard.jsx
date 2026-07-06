/**
 * Indus AI — Machine Status Card
 * Displays live sensor data for a single machine with status indicator
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Gauge, Activity, Zap, Droplets, Heart, Cog } from 'lucide-react';
import { STATUS_COLORS } from '../../utils/constants';

const sensorIcons = {
  temperature: Thermometer,
  pressure: Gauge,
  vibration: Activity,
  rpm: Cog,
  power_consumption: Zap,
  bearing_health: Heart,
  oil_level: Droplets,
};

export default function MachineCard({ machine, onClick }) {
  if (!machine) return null;

  const status = machine.status || 'healthy';
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.healthy;

  const sensors = [
    { key: 'temperature', label: 'Temp', value: machine.temperature, unit: '°C', max: 150 },
    { key: 'vibration', label: 'Vibration', value: machine.vibration, unit: 'mm/s', max: 100 },
    { key: 'rpm', label: 'RPM', value: machine.rpm, unit: '', max: 3000 },
    { key: 'bearing_health', label: 'Bearing', value: machine.bearing_health, unit: '%', max: 100 },
    { key: 'power_consumption', label: 'Power', value: machine.power_consumption, unit: 'W', max: 1200 },
    { key: 'oil_level', label: 'Oil', value: machine.oil_level, unit: '%', max: 100 },
  ];

  return (
    <motion.div
      className={`metric-card ${status === 'critical' ? 'pulse-red' : ''}`}
      style={{
        cursor: 'pointer',
        borderColor: status === 'critical' ? 'rgba(255, 51, 102, 0.4)' : undefined,
      }}
      onClick={() => onClick?.(machine)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            {machine.machine_type}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
            {machine.machine_id}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            className={status === 'critical' ? 'pulse-red' : status === 'warning' ? 'pulse-amber' : 'pulse-green'}
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: statusColor,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: statusColor,
              letterSpacing: '0.05em',
            }}
          >
            {status}
          </span>
        </div>
      </div>

      {/* Sensor Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {sensors.map((sensor) => {
          const Icon = sensorIcons[sensor.key] || Activity;
          const val = typeof sensor.value === 'number' ? sensor.value : 0;
          const pct = Math.min((val / sensor.max) * 100, 100);
          const isWarning = sensor.key === 'bearing_health' || sensor.key === 'oil_level'
            ? val < 50
            : val > sensor.max * 0.75;
          const barColor = isWarning ? '#ff3366' : statusColor;

          return (
            <div key={sensor.key} style={{ textAlign: 'center' }}>
              <Icon size={12} color="var(--text-muted)" style={{ marginBottom: 2 }} />
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: isWarning ? '#ff3366' : 'var(--text-primary)',
                }}
              >
                {val.toFixed(0)}{sensor.unit}
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginBottom: 4 }}>
                {sensor.label}
              </div>
              {/* Mini progress bar */}
              <div
                style={{
                  height: 2,
                  background: 'rgba(148, 163, 184, 0.1)',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${sensor.key === 'bearing_health' || sensor.key === 'oil_level' ? pct : pct}%`,
                    background: barColor,
                    borderRadius: 1,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
