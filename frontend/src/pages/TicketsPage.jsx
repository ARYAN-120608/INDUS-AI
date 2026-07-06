/**
 * Indus AI — Maintenance Tickets Page
 * Displays auto-generated maintenance tickets with priority and status
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Search,
  Filter,
  Clock,
  User2,
  Wrench,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import useStore from '../stores/useStore';
import { PRIORITY_COLORS } from '../utils/constants';

export default function TicketsPage() {
  const tickets = useStore((s) => s.tickets);

  const openCount = tickets.filter((t) => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter((t) => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div>
      {/* Header */}
      <div className="section-header">
        <div className="section-title">
          <Ticket size={18} className="icon" />
          Maintenance Tickets
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatBadge label="Open" count={openCount} color="#ff3366" />
          <StatBadge label="In Progress" count={inProgressCount} color="#ffaa00" />
          <StatBadge label="Resolved" count={resolvedCount} color="#00ff88" />
        </div>
      </div>

      {/* Tickets Table */}
      {tickets.length === 0 ? (
        <EmptyTickets />
      ) : (
        <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Machine</th>
                <th>Problem</th>
                <th>Priority</th>
                <th>Downtime</th>
                <th>Assigned Team</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {tickets.map((ticket, index) => (
                  <motion.tr
                    key={ticket.ticket_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontWeight: 600,
                          color: 'var(--accent-blue)',
                          fontSize: 12,
                        }}
                      >
                        {ticket.ticket_id}
                      </span>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>
                          {ticket.machine_type || ticket.machine_id}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono'" }}>
                          {ticket.machine_id}
                        </div>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200 }}>
                      <span style={{ fontSize: 12 }}>{ticket.problem}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.priority?.toLowerCase()}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} color="var(--text-muted)" />
                        <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono'" }}>
                          {ticket.downtime_estimate || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User2 size={11} color="var(--text-muted)" />
                        <span style={{ fontSize: 12 }}>
                          {ticket.assigned_team || 'Unassigned'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${ticket.status?.toLowerCase().replace('_', '-')}`}>
                        {ticket.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono'" }}>
                        {ticket.created_at
                          ? new Date(ticket.created_at).toLocaleTimeString()
                          : 'Just now'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, count, color }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 12px',
        borderRadius: 8,
        background: `${color}10`,
        border: `1px solid ${color}25`,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'JetBrains Mono'" }}>
        {count}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function EmptyTickets() {
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
          background: 'rgba(0, 212, 255, 0.05)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CheckCircle2 size={36} color="#00ff88" />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        No Maintenance Tickets
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 400 }}>
        Tickets are automatically generated by the AI engine when anomalies are detected.
        All machines are currently operating within normal parameters.
      </div>
    </div>
  );
}
