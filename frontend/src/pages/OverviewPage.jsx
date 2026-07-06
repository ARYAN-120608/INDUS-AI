/**
 * Indus AI — Factory Overview Page (Dashboard Home)
 *
 * Layout:
 *  ① KPI Bar — 6 live metrics across the top
 *  ② Two-column main grid:
 *      LEFT:  Interactive 3D Factory Model (R3F, status animations)
 *      RIGHT: Machine Status Cards (live data)
 *  ③ Production Metrics — efficiency gauges, throughput, OEE
 *  ④ Real-Time Sensor Charts — auto-selected or click-to-focus
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Thermometer, Activity, Cpu, Info } from 'lucide-react';
import useStore from '../stores/useStore';
import KPIBar from '../components/dashboard/KPIBar';
import MachineCard from '../components/dashboard/MachineCard';
import SensorChart from '../components/dashboard/SensorChart';
import ProductionMetrics from '../components/dashboard/ProductionMetrics';
import FactoryScene3D from '../components/3d_factory/FactoryScene3D';
import { MACHINE_TYPES } from '../utils/constants';

export default function OverviewPage() {
  const machines = useStore((s) => s.machines);
  const machineHistory = useStore((s) => s.machineHistory);
  const [selectedMachine, setSelectedMachine] = useState(null);

  const machineList = Object.values(machines);
  const selectedHistory = selectedMachine
    ? machineHistory[selectedMachine.machine_id] || []
    : [];

  const criticalCount = machineList.filter((m) => m.status === 'critical').length;

  return (
    <div>
      {/* ① KPI Strip */}
      <KPIBar />

      {/* ② Main Grid: 3D Factory Model + Machine Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, marginBottom: 16 }}>

        {/* LEFT — 3D Factory Model */}
        <div>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-title" style={{ fontSize: 15 }}>
              <Cpu size={16} className="icon" />
              Live 3D Factory Model
              {criticalCount > 0 && (
                <span style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 6,
                  background: 'rgba(255, 42, 42, 0.15)', color: '#ff2a2a', fontWeight: 700,
                  animation: 'blink-red 0.8s ease-in-out infinite',
                }}>
                  ● {criticalCount} CRITICAL
                </span>
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={11} />
              Drag to rotate · Scroll to zoom
            </span>
          </div>

          {/* 3D Canvas */}
          <div style={{ height: 400, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-subtle)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <FactoryScene3D />
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 16, marginTop: 8, padding: '6px 10px',
            background: 'var(--bg-secondary)', borderRadius: 8,
            border: '1px solid var(--border-subtle)',
          }}>
            {[
              { color: '#22ff88', label: 'Healthy', dot: true },
              { color: '#ffaa00', label: 'Warning — amber pulse', dot: true },
              { color: '#ff2222', label: 'Critical — red blink', dot: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: item.color,
                  boxShadow: `0 0 6px ${item.color}`,
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Machine Status Cards */}
        <div>
          <div className="section-header" style={{ marginBottom: 10 }}>
            <div className="section-title" style={{ fontSize: 15 }}>
              <Activity size={16} className="icon" />
              Machine Status
            </div>
          </div>
          <div style={{ height: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
            {machineList.length > 0 ? (
              machineList.map((m) => (
                <MachineCard
                  key={m.machine_id}
                  machine={m}
                  onClick={setSelectedMachine}
                />
              ))
            ) : (
              Object.entries(MACHINE_TYPES).map(([id, type]) => (
                <div key={id} className="metric-card shimmer" style={{ height: 100 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
                    {type}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono'" }}>
                    {id} — Awaiting data...
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ③ Production Metrics — replaces old Digital Twin position */}
      <div style={{ marginBottom: 16 }}>
        <div className="section-header" style={{ marginBottom: 10 }}>
          <div className="section-title" style={{ fontSize: 15 }}>
            <Activity size={16} className="icon" />
            Production &amp; Performance Metrics
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live — updates every 5s</span>
        </div>
        <ProductionMetrics />
      </div>

      {/* ④ Real-Time Sensor Charts */}
      <AnimatePresence mode="wait">
        {selectedMachine ? (
          <SelectedMachineCharts
            key="selected"
            machine={selectedMachine}
            history={selectedHistory}
            onClose={() => setSelectedMachine(null)}
          />
        ) : (
          <DefaultCharts key="default" machineList={machineList} machineHistory={machineHistory} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Selected machine full-sensor view ────────────────────────────────────────
function SelectedMachineCharts({ machine, history, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <div className="section-header">
        <div className="section-title" style={{ fontSize: 15 }}>
          <Thermometer size={16} className="icon" />
          {machine.machine_type} ({machine.machine_id}) — Live Telemetry
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 6,
            background: machine.status === 'critical' ? '#ff336620' : '#00d4ff15',
            color: machine.status === 'critical' ? '#ff3366' : '#00d4ff',
            fontWeight: 600,
          }}>
            {machine.status?.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,51,102,0.08)',
            border: '1px solid rgba(255,51,102,0.25)',
            borderRadius: 8,
            padding: '6px 12px',
            color: '#ff3366',
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          <X size={14} /> Close
        </button>
      </div>
      <div className="grid-4">
        <SensorChart data={history} sensorKey="temperature" />
        <SensorChart data={history} sensorKey="vibration" />
        <SensorChart data={history} sensorKey="rpm" />
        <SensorChart data={history} sensorKey="bearing_health" />
      </div>
      <div className="grid-4" style={{ marginTop: 12 }}>
        <SensorChart data={history} sensorKey="power_consumption" />
        <SensorChart data={history} sensorKey="pressure" />
        <SensorChart data={history} sensorKey="oil_level" />
        <SensorChart data={history} sensorKey="efficiency" />
      </div>
    </motion.div>
  );
}

// ─── Default charts (highest priority machine) ────────────────────────────────
function DefaultCharts({ machineList, machineHistory }) {
  const priorityMachine =
    machineList.find((m) => m.status === 'critical') ||
    machineList.find((m) => m.status === 'warning') ||
    machineList[0];

  const history = priorityMachine ? machineHistory[priorityMachine.machine_id] || [] : [];

  if (!priorityMachine) {
    return (
      <div>
        <div className="section-header">
          <div className="section-title" style={{ fontSize: 15 }}>
            <Thermometer size={16} className="icon" />
            Real-Time Sensor Charts
          </div>
        </div>
        <div className="grid-4">
          {['temperature', 'vibration', 'rpm', 'bearing_health'].map((sensor) => (
            <div key={sensor} className="chart-container shimmer" style={{ height: 220 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Awaiting sensor data...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="section-header">
        <div className="section-title" style={{ fontSize: 15 }}>
          <Thermometer size={16} className="icon" />
          {priorityMachine.machine_type} — Live Telemetry
          <span style={{
            fontSize: 10, padding: '2px 8px', borderRadius: 6,
            background: `${priorityMachine.status === 'critical' ? '#ff336620' : '#00d4ff15'}`,
            color: priorityMachine.status === 'critical' ? '#ff3366' : '#00d4ff',
            fontWeight: 600,
          }}>
            {priorityMachine.status?.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Click a machine card to view its specific charts
        </span>
      </div>
      <div className="grid-4">
        <SensorChart data={history} sensorKey="temperature" />
        <SensorChart data={history} sensorKey="vibration" />
        <SensorChart data={history} sensorKey="rpm" />
        <SensorChart data={history} sensorKey="bearing_health" />
      </div>
    </motion.div>
  );
}
