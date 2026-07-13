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
  Settings,
  Activity,
  Sun,
  Moon,
  Server,
} from 'lucide-react';
import useStore from '../../stores/useStore';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/factory', icon: Factory, label: '3D Factory' },
  { path: '/machines', icon: Server, label: 'Machines' },
  { path: '/analysis', icon: BrainCircuit, label: 'AI Analysis' },
  { path: '/tickets', icon: Ticket, label: 'Tickets' },
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
        style={{ marginBottom: 24, cursor: 'pointer' }}
        onClick={() => navigate('/')}
        title="INDUS AI — Home"
      >
        <img
          src="/indus-ai.svg"
          alt="Indus AI"
          style={{ width: 42, height: 42, borderRadius: 12, display: 'block' }}
        />
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
