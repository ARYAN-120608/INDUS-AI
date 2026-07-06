/**
 * Indus AI — Alert Center Page
 * Shows critical alerts, warnings, and emergency notifications
 */

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Bell,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import useStore from '../stores/useStore';
import { PRIORITY_COLORS } from '../utils/constants';

const severityIcons = {
  CRITICAL: XCircle,
  HIGH: AlertCircle,
  MEDIUM: AlertTriangle,
  LOW: Info,
};

export default function AlertsPage() {
  const alerts = useStore((s) => s.alerts);
  const clearUnreadAlerts = useStore((s) => s.clearUnreadAlerts);

  // Clear unread count when visiting the page
  useEffect(() => {
    clearUnreadAlerts();
  }, [clearUnreadAlerts]);

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
  const highAlerts = alerts.filter((a) => a.severity === 'HIGH');
  const otherAlerts = alerts.filter((a) => a.severity !== 'CRITICAL' && a.severity !== 'HIGH');

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <Bell size={18} className="icon" />
          Alert Center
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <AlertBadge severity="CRITICAL" count={criticalAlerts.length} />
          <AlertBadge severity="HIGH" count={highAlerts.length} />
          <AlertBadge severity="MEDIUM" count={otherAlerts.length} />
        </div>
      </div>

      {/* Emergency Banner */}
      {criticalAlerts.length > 0 && (
        <motion.div
          className="alert-banner critical"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 20 }}
        >
          <XCircle size={20} color="#ff3366" />
          <div>
            <div style={{ fontWeight: 700, color: '#ff3366', fontSize: 14 }}>
              ⚠ EMERGENCY — {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''} Active
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              Immediate action required. Machine shutdown may be necessary.
            </div>
          </div>
        </motion.div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <AlertCard key={index} alert={alert} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AlertCard({ alert, index }) {
  const severity = alert.severity || 'MEDIUM';
  const color = PRIORITY_COLORS[severity] || '#00d4ff';
  const Icon = severityIcons[severity] || AlertTriangle;

  return (
    <motion.div
      className={`alert-banner ${severity === 'CRITICAL' ? 'critical' : severity === 'HIGH' ? 'warning' : 'info'}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      {/* Severity Icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>
            {alert.message || 'Alert'}
          </span>
          <span className={`badge badge-${severity.toLowerCase()}`}>
            {severity}
          </span>
        </div>

        {/* Diagnosis summary */}
        {alert.diagnosis && (
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <strong>Cause:</strong> {alert.diagnosis.fault_cause} &nbsp;|&nbsp;
            <strong>Downtime:</strong> {alert.diagnosis.downtime_estimate} &nbsp;|&nbsp;
            <strong>Action:</strong> {alert.diagnosis.recommended_action}
          </div>
        )}

        {/* Ticket reference */}
        {alert.ticket && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Shield size={10} />
            Ticket {alert.ticket.ticket_id} created → {alert.ticket.assigned_team}
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 10,
          color: 'var(--text-muted)',
          flexShrink: 0,
        }}
      >
        <Clock size={10} />
        {alert.timestamp
          ? new Date(alert.timestamp * 1000).toLocaleTimeString()
          : 'Just now'}
      </div>
    </motion.div>
  );
}

function AlertBadge({ severity, count }) {
  const color = PRIORITY_COLORS[severity] || '#00d4ff';
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        borderRadius: 6,
        background: `${color}10`,
        border: `1px solid ${color}20`,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>
        {count}
      </span>
      <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{severity}</span>
    </div>
  );
}

function EmptyAlerts() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 400,
        gap: 16,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(0, 255, 136, 0.05)',
          border: '1px solid rgba(0, 255, 136, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle2 size={36} color="#00ff88" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        No Active Alerts
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
        All systems are operating normally. Alerts will appear here in real time
        when the AI engine detects any anomalies.
      </div>
    </div>
  );
}
