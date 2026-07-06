/**
 * Indus AI — KPI Status Bar
 * Shows key performance indicators at the top of the dashboard
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Cpu, AlertTriangle, Ticket, Shield, Activity, TrendingUp } from 'lucide-react';
import useStore from '../../stores/useStore';

export default function KPIBar() {
  const machines = useStore((s) => s.machines);
  const tickets = useStore((s) => s.tickets);
  const alerts = useStore((s) => s.alerts);
  const incidents = useStore((s) => s.incidents);

  const machineList = Object.values(machines);
  const healthyCount = machineList.filter((m) => m.status === 'healthy').length;
  const warningCount = machineList.filter((m) => m.status === 'warning').length;
  const criticalCount = machineList.filter((m) => m.status === 'critical').length;
  const totalMachines = machineList.length || 7;
  const uptime = totalMachines > 0 ? ((healthyCount / totalMachines) * 100).toFixed(1) : '100.0';
  const openTickets = tickets.filter((t) => t.status === 'OPEN').length;

  const kpis = [
    {
      label: 'Machines Online',
      value: totalMachines,
      icon: Cpu,
      color: '#00d4ff',
      suffix: '',
    },
    {
      label: 'System Uptime',
      value: uptime,
      icon: TrendingUp,
      color: '#00ff88',
      suffix: '%',
    },
    {
      label: 'Active Warnings',
      value: warningCount + criticalCount,
      icon: AlertTriangle,
      color: criticalCount > 0 ? '#ff3366' : warningCount > 0 ? '#ffaa00' : '#00ff88',
      suffix: '',
    },
    {
      label: 'Open Tickets',
      value: openTickets,
      icon: Ticket,
      color: openTickets > 0 ? '#ffaa00' : '#00ff88',
      suffix: '',
    },
    {
      label: 'Total Incidents',
      value: incidents.length,
      icon: Shield,
      color: '#8b5cf6',
      suffix: '',
    },
    {
      label: 'Alerts Today',
      value: alerts.length,
      icon: Activity,
      color: '#06b6d4',
      suffix: '',
    },
  ];

  return (
    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 20 }}>
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            className="glass-card"
            style={{ padding: 16 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                {kpi.label}
              </span>
              <Icon size={14} color={kpi.color} />
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                color: kpi.color,
                textShadow: `0 0 12px ${kpi.color}40`,
              }}
            >
              {kpi.value}{kpi.suffix}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
