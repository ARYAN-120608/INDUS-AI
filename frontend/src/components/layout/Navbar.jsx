/**
 * Indus AI — Top Navigation Bar
 * Shows system status, branding, and real-time connection indicator
 */

import React from 'react';
import { Wifi, WifiOff, Bell, Cpu } from 'lucide-react';
import useStore from '../../stores/useStore';

export default function Navbar() {
  const wsConnected = useStore((s) => s.wsConnected);
  const machines = useStore((s) => s.machines);
  const unreadAlerts = useStore((s) => s.unreadAlerts);

  const machineList = Object.values(machines);
  const healthyCount = machineList.filter((m) => m.status === 'healthy').length;
  const warningCount = machineList.filter((m) => m.status === 'warning').length;
  const criticalCount = machineList.filter((m) => m.status === 'critical').length;

  return (
    <header className="navbar">
      {/* Left — Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "'Syne', 'Plus Jakarta Sans', system-ui, sans-serif",
            background: 'linear-gradient(135deg, #1a73e8 0%, #00d4ff 50%, #00ff88 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.03em',
          }}
        >
          INDUS AI
        </h1>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            padding: '2px 8px',
            background: 'rgba(26, 115, 232, 0.06)',
            borderRadius: 6,
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            letterSpacing: '0.01em',
          }}
        >
          Industrial Intelligence
        </span>
      </div>

      {/* Center — Machine Status Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Machines:</span>
        </div>
        
        {machineList.length > 0 && (
          <>
            <StatusDot color="#00ff88" count={healthyCount} label="Healthy" />
            <StatusDot color="#ffaa00" count={warningCount} label="Warning" />
            <StatusDot color="#ff3366" count={criticalCount} label="Critical" />
          </>
        )}
      </div>

      {/* Right — Connection Status & Notifications */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Connection indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 8,
            background: wsConnected
              ? 'rgba(0, 255, 136, 0.08)'
              : 'rgba(255, 51, 102, 0.08)',
            border: `1px solid ${wsConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)'}`,
          }}
        >
          {wsConnected ? (
            <Wifi size={13} color="#00ff88" />
          ) : (
            <WifiOff size={13} color="#ff3366" />
          )}
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: wsConnected ? '#00ff88' : '#ff3366',
            }}
          >
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Notification bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <Bell size={18} color="var(--text-muted)" />
          {unreadAlerts > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#ff3366',
                color: 'white',
                fontSize: 8,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadAlerts > 9 ? '!' : unreadAlerts}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusDot({ color, count, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>
        {count}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
