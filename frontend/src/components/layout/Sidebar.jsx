/**
 * Indus AI — Sidebar Navigation
 * Enterprise-grade dark sidebar with icon navigation
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Factory,
  LayoutDashboard,
  BrainCircuit,
  Ticket,
  AlertTriangle,
  Settings,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';
import useStore from '../../stores/useStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/factory', icon: Factory, label: '3D Factory' },
  { path: '/analysis', icon: BrainCircuit, label: 'AI Analysis' },
  { path: '/tickets', icon: Ticket, label: 'Tickets' },
  { path: '/alerts', icon: AlertTriangle, label: 'Alerts' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const unreadAlerts = useStore((s) => s.unreadAlerts);
  const [isLight, setIsLight] = React.useState(
    document.documentElement.classList.contains('light-theme')
  );

  const toggleTheme = () => {
    if (isLight) {
      document.documentElement.classList.remove('light-theme');
      setIsLight(false);
    } else {
      document.documentElement.classList.add('light-theme');
      setIsLight(true);
    }
  };

  return (
    <aside className="sidebar" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border-subtle)' }}>
      {/* Logo */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
        }}
        onClick={() => navigate('/')}
      >
        <Activity size={22} color="white" strokeWidth={2.5} />
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <div
              key={item.path}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.label}
            >
              <Icon size={20} />
              {item.path === '/alerts' && unreadAlerts > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#ff3366',
                    color: 'white',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {unreadAlerts > 9 ? '9+' : unreadAlerts}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      {/* Theme Toggle */}
      <div className="sidebar-item" title="Toggle Theme" onClick={toggleTheme}>
        {isLight ? <Moon size={20} /> : <Sun size={20} />}
      </div>
    </aside>
  );
}
