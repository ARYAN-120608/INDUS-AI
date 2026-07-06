/**
 * Indus AI — Global State Store (Zustand)
 * Manages all application state: machines, alerts, tickets, incidents
 */

import { create } from 'zustand';

const useStore = create((set, get) => ({
  // ============================================
  // Machine States
  // ============================================
  machines: {},
  machineHistory: {},
  
  updateMachines: (machineData) => {
    set((state) => {
      const newMachines = { ...state.machines };
      const newHistory = { ...state.machineHistory };
      
      machineData.forEach((m) => {
        newMachines[m.machine_id] = m;
        
        if (!newHistory[m.machine_id]) {
          newHistory[m.machine_id] = [];
        }
        newHistory[m.machine_id] = [
          ...newHistory[m.machine_id].slice(-119),
          {
            ...m,
            time: new Date().toLocaleTimeString(),
          },
        ];
      });
      
      return { machines: newMachines, machineHistory: newHistory };
    });
  },

  // ============================================
  // Alerts
  // ============================================
  alerts: [],
  unreadAlerts: 0,
  
  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
      unreadAlerts: state.unreadAlerts + 1,
    }));
  },
  
  clearUnreadAlerts: () => {
    set({ unreadAlerts: 0 });
  },

  // ============================================
  // Tickets
  // ============================================
  tickets: [],
  
  setTickets: (tickets) => {
    set({ tickets });
  },
  
  addTicket: (ticket) => {
    set((state) => ({
      tickets: [ticket, ...state.tickets],
    }));
  },
  
  updateTicket: (ticketId, updates) => {
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.ticket_id === ticketId ? { ...t, ...updates } : t
      ),
    }));
  },

  // ============================================
  // Incidents & Diagnoses
  // ============================================
  incidents: [],
  
  addIncident: (incident) => {
    set((state) => ({
      incidents: [incident, ...state.incidents].slice(0, 100),
    }));
  },

  // ============================================
  // System Stats
  // ============================================
  stats: {
    total_machines: 7,
    machine_status: { healthy: 7, warning: 0, critical: 0 },
    total_incidents: 0,
    total_tickets: 0,
    open_tickets: 0,
  },
  
  updateStats: (stats) => {
    set({ stats });
  },

  // ============================================
  // WebSocket Connection Status
  // ============================================
  wsConnected: false,
  
  setWsConnected: (connected) => {
    set({ wsConnected: connected });
  },

  // ============================================
  // Selected Machine (for detail view)
  // ============================================
  selectedMachine: null,
  
  setSelectedMachine: (machine) => {
    set({ selectedMachine: machine });
  },
}));

export default useStore;
