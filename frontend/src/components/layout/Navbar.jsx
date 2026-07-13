/**
 * Indus AI — Top Navigation Bar
 * Shows system status, branding, and a notification bell with alert dropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { Wifi, WifiOff, Bell, Cpu, AlertCircle, XCircle, AlertTriangle, Info, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../stores/useStore';
import { PRIORITY_COLORS } from '../../utils/constants';

const severityIcon = (sev) => {
  if (sev === 'CRITICAL') return <XCircle size={14} color="#dc2626" />;
  if (sev === 'HIGH') return <AlertCircle size={14} color="#d97706" />;
  if (sev === 'MEDIUM') return <AlertTriangle size={14} color="#2563eb" />;
  return <Info size={14} color="#16a34a" />;
};

export default function Navbar() {
  const wsConnected    = useStore((s) => s.wsConnected);
  const machines       = useStore((s) => s.machines);
  const unreadAlerts   = useStore((s) => s.unreadAlerts);
  const alerts         = useStore((s) => s.alerts);
  const clearUnread    = useStore((s) => s.clearUnreadAlerts);

  const machineList    = Object.values(machines);
  const healthyCount   = machineList.filter((m) => m.status === 'healthy').length;
  const warningCount   = machineList.filter((m) => m.status === 'warning').length;
  const criticalCount  = machineList.filter((m) => m.status === 'critical').length;

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  // Close panel on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    setOpen((v) => !v);
    if (!open && unreadAlerts > 0) clearUnread();
  };

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
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
            display: 'inline-block',
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

      {/* Right — Connection Status & Bell */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Connection indicator */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 8,
            background: wsConnected ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 51, 102, 0.08)',
            border: `1px solid ${wsConnected ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)'}`,
          }}
        >
          {wsConnected ? <Wifi size={13} color="#00ff88" /> : <WifiOff size={13} color="#ff3366" />}
          <span style={{ fontSize: 11, fontWeight: 600, color: wsConnected ? '#00ff88' : '#ff3366' }}>
            {wsConnected ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Notification Bell + Dropdown */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            onClick={handleBellClick}
            style={{
              position: 'relative',
              background: open ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: open ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
              borderRadius: 10,
              padding: '6px 8px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
            title="Notifications"
          >
            <Bell size={18} color={open ? 'var(--accent-blue)' : 'var(--text-muted)'} />
            {unreadAlerts > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ff3366', color: 'white',
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse-ring 2s infinite',
              }}>
                {unreadAlerts > 9 ? '9+' : unreadAlerts}
              </span>
            )}
          </button>

          {/* Alert Dropdown Panel */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  width: 380, maxHeight: 480,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.3)',
                  zIndex: 200,
                  overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {/* Panel Header */}
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bell size={15} color="var(--accent-blue)" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                      Notifications
                    </span>
                    {alerts.length > 0 && (
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 10,
                        background: 'rgba(255,51,102,0.12)', color: '#ff3366', fontWeight: 700,
                      }}>
                        {alerts.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Alert list */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                  {alerts.length === 0 ? (
                    <div style={{
                      padding: 40, textAlign: 'center',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    }}>
                      <CheckCircle2 size={32} color="#00ff88" />
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>All Clear</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No alerts at the moment</div>
                    </div>
                  ) : (
                    alerts.slice(0, 20).map((alert, i) => {
                      const color = PRIORITY_COLORS[alert.severity] || '#00d4ff';
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border-subtle)',
                            display: 'flex', gap: 10, alignItems: 'flex-start',
                          }}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: `${color}15`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {severityIcon(alert.severity)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            }}>
                              {alert.message}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8 }}>
                              <span style={{ color, fontWeight: 700 }}>{alert.severity}</span>
                              <span>{alert.timestamp ? new Date(alert.timestamp * 1000).toLocaleTimeString() : 'Just now'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function StatusDot({ color, count, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 12, fontWeight: 600, color }}>{count}</span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
