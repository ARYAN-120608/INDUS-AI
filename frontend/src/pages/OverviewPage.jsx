/**
 * Indus AI — Overview Page
 * A clean introduction dashboard explaining what this project does.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  Activity,
  ShieldAlert,
  Ticket,
  Bell,
  Factory,
  Cpu,
  Zap,
  BarChart2,
  Server,
  ArrowRight,
  Flame,
  Waves,
  Gauge,
  Wind,
  Filter,
  Database,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  {
    icon: Activity,
    color: '#00d4ff',
    title: 'Real-Time Sensor Monitoring',
    description:
      'Continuously streams live telemetry from 7 critical refinery subsystems — temperature, pressure, vibration, RPM, flow rate, and more — updating every 5 seconds.',
  },
  {
    icon: BrainCircuit,
    color: '#9d00ff',
    title: 'AI Diagnostic Engine',
    description:
      'Indus AI uses a rule-based diagnostic engine to analyze sensor data patterns, detect anomalies, and pinpoint the root cause of equipment faults with 95% confidence.',
  },
  {
    icon: ShieldAlert,
    color: '#ff2a2a',
    title: 'Fault Detection & Alerts',
    description:
      'Automatically detects critical faults such as pump cavitation, compressor surge, heat fouling, and column flooding — instantly generating alerts when thresholds are breached.',
  },
  {
    icon: Ticket,
    color: '#ffaa00',
    title: 'Auto Ticket Generation',
    description:
      'Every detected fault automatically raises a maintenance ticket with priority level, affected machine, and fault details — so your team never misses an issue.',
  },
  {
    icon: Bell,
    color: '#00ffcc',
    title: 'Alert Management',
    description:
      'A dedicated alerts feed captures all system events in real time, ordered by severity. Alerts are marked as read once reviewed, keeping your team focused on what matters.',
  },
  {
    icon: BarChart2,
    color: '#00ff88',
    title: 'SOP Step-by-Step Guidance',
    description:
      'For every diagnosed fault, the AI Analysis page provides Standard Operating Procedure (SOP) steps — actionable instructions to resolve the issue safely and efficiently.',
  },
];

const MACHINES = [
  { Icon: Flame,    color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    name: 'Distillation Column C-101',  type: 'Distillation Column' },
  { Icon: Waves,    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   name: 'Heat Exchanger HX-201',       type: 'Heat Exchanger'      },
  { Icon: Gauge,    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',   name: 'Pump Station P-301',          type: 'Pump Station'        },
  { Icon: Wind,     color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',    name: 'Cooling Tower CT-401',        type: 'Cooling Tower'       },
  { Icon: Filter,   color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',   name: 'Separator Unit V-501',        type: 'Separator Unit'      },
  { Icon: Zap,      color: '#f97316', bg: 'rgba(249,115,22,0.12)',   name: 'Compressor K-601',            type: 'Compressor'          },
  { Icon: Database, color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',   name: 'Storage Tank TK-701',         type: 'Storage Tank'        },
];

const NAV_LINKS = [
  { icon: Factory,      label: '3D Factory',           path: '/factory',  color: '#00d4ff', desc: 'Explore the interactive 3D refinery model' },
  { icon: Server,       label: 'Machines',              path: '/machines', color: '#00ffcc', desc: 'View live metrics for each machine' },
  { icon: BrainCircuit, label: 'AI Analysis',           path: '/analysis', color: '#9d00ff', desc: 'See AI diagnostics and SOP guidance' },
  { icon: Ticket,       label: 'Tickets',               path: '/tickets',  color: '#ffaa00', desc: 'Manage all auto-generated maintenance tickets' },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.45, ease: 'easeOut' },
});

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* ─── Hero Banner ─────────────────────────────────────── */}
      <motion.div
        className="glass-card"
        style={{
          padding: '40px 40px 32px',
          background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,102,255,0.04) 50%, rgba(157,0,255,0.04) 100%)',
          borderColor: 'rgba(0,212,255,0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
        {...fadeUp(0)}
      >
        {/* Decorative glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 20 }}>
          <img
            src="/indus-ai.svg"
            alt="Indus AI"
            style={{
              width: 60, height: 60, borderRadius: 16, flexShrink: 0,
              boxShadow: '0 0 24px rgba(0,212,255,0.4)',
              display: 'block',
            }}
          />
          <div>
            <h1 style={{
              fontSize: 32, fontWeight: 800, margin: '0 0 6px',
              fontFamily: "'Syne', sans-serif",
              background: 'linear-gradient(135deg, #1a73e8 0%, #00d4ff 50%, #00ff88 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.03em',
              display: 'inline-block',
            }}>
              INDUS AI
            </h1>
            <div style={{
              fontSize: 14, color: 'var(--accent-cyan)',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.12em', fontWeight: 500,
            }}>
              INDUSTRIAL AI MONITORING PLATFORM
            </div>
          </div>
        </div>

        <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 780, margin: 0 }}>
          Indus AI is an intelligent factory monitoring system built for oil refinery operations. It combines 
          <strong style={{ color: 'var(--text-primary)' }}> real-time sensor telemetry</strong>, an 
          <strong style={{ color: 'var(--accent-purple)' }}> AI-powered diagnostic engine</strong>, and 
          <strong style={{ color: 'var(--accent-green)' }}> automated maintenance workflows</strong> into a 
          single unified command center — giving operators complete visibility into the health of their plant 
          and actionable guidance to resolve faults before they cause downtime.
        </p>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 32, marginTop: 28, flexWrap: 'wrap' }}>
          {[
            { value: '7',   label: 'Subsystems Monitored', color: '#00d4ff' },
            { value: '49+', label: 'Live Sensor Streams',  color: '#00ffcc' },
            { value: '7',   label: 'Fault Types Detected', color: '#9d00ff' },
            { value: '95%', label: 'AI Confidence Level',  color: '#00ff88' },
            { value: '5s',  label: 'Update Frequency',     color: '#ffaa00' },
          ].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ─── What This System Does ────────────────────────────── */}
      <motion.section {...fadeUp(0.1)}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ fontSize: 18 }}>
            <Zap size={18} className="icon" />
            What This System Does
          </div>
        </div>
        <div className="grid-3" style={{ gap: 16 }}>
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                className="glass-card"
                style={{ padding: 20 }}
                {...fadeUp(0.12 + i * 0.06)}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                  background: `${feat.color}18`,
                  border: `1px solid ${feat.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={feat.color} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  {feat.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                  {feat.description}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <motion.section {...fadeUp(0.2)}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ fontSize: 18 }}>
            <Server size={18} className="icon" />
            Monitored Subsystems
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>7 refinery machines under continuous surveillance</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {MACHINES.map((m, i) => {
            const { Icon, color, bg, name, type } = m;
            return (
              <motion.div
                key={name}
                className="glass-card"
                style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}
                {...fadeUp(0.22 + i * 0.04)}
              >
                {/* Same icon badge style as MachinesPage */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: bg,
                  border: `1.5px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${color}15`,
                }}>
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 10, color: color, fontWeight: 600, marginTop: 2 }}>
                    {type}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ─── Navigate to Sections ────────────────────────────── */}
      <motion.section {...fadeUp(0.3)}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ fontSize: 18 }}>
            <BarChart2 size={18} className="icon" />
            Explore the Dashboard
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {NAV_LINKS.map((link, i) => {
            const Icon = link.icon;
            return (
              <motion.div
                key={link.path}
                className="glass-card"
                style={{ padding: '18px 16px', cursor: 'pointer', textAlign: 'center' }}
                {...fadeUp(0.32 + i * 0.05)}
                onClick={() => navigate(link.path)}
                whileHover={{ scale: 1.03, borderColor: link.color }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12, margin: '0 auto 12px',
                  background: `${link.color}15`,
                  border: `1px solid ${link.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={20} color={link.color} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {link.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {link.desc}
                </div>
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: link.color, fontSize: 11, fontWeight: 600 }}>
                  Open <ArrowRight size={12} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

    </div>
  );
}
