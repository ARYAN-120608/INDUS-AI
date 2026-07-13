/**
 * Indus AI — AI Analysis Page
 * Displays AI diagnostic results, fault analysis, and SOP recommendations
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  ShieldAlert,
  BookOpen,
} from 'lucide-react';
import useStore from '../stores/useStore';
import { STATUS_COLORS, PRIORITY_COLORS } from '../utils/constants';

export default function AnalysisPage() {
  const incidents = useStore((s) => s.incidents);

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <BrainCircuit size={18} className="icon" />
          AI Diagnostic Engine
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 8,
            background: 'rgba(0, 212, 255, 0.08)',
            color: 'var(--accent-blue)',
            fontWeight: 500,
          }}>
            {incidents.length} Diagnoses
          </span>
        </div>
      </div>

      {/* Incidents List */}
      {incidents.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <AnimatePresence>
            {incidents.map((incident, index) => (
              <DiagnosisCard key={index} incident={incident} index={index} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function DiagnosisCard({ incident, index }) {
  const severity = incident.severity || 'MEDIUM';
  const severityColor = PRIORITY_COLORS[severity] || '#00d4ff';
  const sop = incident.sop;

  return (
    <motion.div
      className="glass-card"
      style={{ padding: 24 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `${severityColor}15`,
              border: `1px solid ${severityColor}30`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldAlert size={20} color={severityColor} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              {incident.fault_cause || 'Unknown Fault'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {incident.machine_type} — {incident.machine_id}
            </div>
          </div>
        </div>
        <span className={`badge badge-${severity.toLowerCase()}`}>
          {severity}
        </span>
      </div>

      {/* Diagnosis Details Grid */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <DetailBox
          icon={AlertCircle}
          label="Fault Cause"
          value={incident.fault_cause || 'N/A'}
          color={severityColor}
        />
        <DetailBox
          icon={Clock}
          label="Estimated Downtime"
          value={incident.downtime_estimate || (incident.diagnosis && incident.diagnosis.downtime_estimate) || 'N/A'}
          color="#ffaa00"
        />
        <DetailBox
          icon={Wrench}
          label="Recommended Action"
          value={incident.recommended_action || (incident.diagnosis && incident.diagnosis.recommended_action) || 'N/A'}
          color="#00d4ff"
        />
      </div>

      {/* Technical Details */}
      {incident.details && (
        <div
          style={{
            background: 'rgba(0, 212, 255, 0.03)',
            border: '1px solid rgba(0, 212, 255, 0.1)',
            borderRadius: 10,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Technical Analysis
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {incident.details}
          </div>
        </div>
      )}

      {/* SOP Steps */}
      {sop && sop.steps && sop.steps.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <BookOpen size={14} color="#00ff88" />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-green)' }}>
              {sop.procedure_name || 'Repair Procedure'}
            </span>
            {sop.estimated_time && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                ({sop.estimated_time})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sop.steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: i % 2 === 0 ? 'rgba(0, 255, 136, 0.03)' : 'transparent',
                  border: '1px solid rgba(0, 255, 136, 0.06)',
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: 'rgba(0, 255, 136, 0.12)',
                    color: '#00ff88',
                    fontSize: 11,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {step.step_number || i + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {step.action || step}
                  </div>
                  {step.safety_note && (
                    <div style={{
                      fontSize: 11, color: '#ffaa00', marginTop: 4,
                      padding: '3px 8px', borderRadius: 4,
                      background: 'rgba(255,170,0,0.08)',
                      display: 'inline-block',
                    }}>
                      ⚠ {step.safety_note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 12, textAlign: 'right' }}>
        {incident.timestamp ? new Date(incident.timestamp * 1000).toLocaleString() : 'Just now'}
      </div>
    </motion.div>
  );
}

function DetailBox({ icon: Icon, label, value, color }) {
  return (
    <div
      style={{
        background: `${color}08`,
        border: `1px solid ${color}15`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
        {value}
      </div>
    </div>
  );
}

function EmptyState() {
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
        All Systems Nominal
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
        No anomalies detected. The AI diagnostic engine is actively monitoring all 7 machines
        and will provide analysis when an anomaly is detected.
      </div>
    </div>
  );
}
