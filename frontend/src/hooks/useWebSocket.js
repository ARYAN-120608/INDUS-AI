/**
 * Indus AI — WebSocket Hook (Refactored to Mock Polling for Vercel Static)
 * Manages real-time connection to backend for sensor data and alerts
 */

import { useEffect, useRef, useCallback } from 'react';
import useStore from '../stores/useStore';
import { mockTick, mockInjectFault, mockClearFault } from '../utils/mockBackend';

const POLL_INTERVAL = 3000;

export function useWebSocket() {
  const pollIntervalRef = useRef(null);
  const { updateMachines, addAlert, addTicket, addIncident, setWsConnected } = useStore();

  const connect = useCallback(() => {
    // Treat the "connection" as our polling loop
    setWsConnected(true);

    const poll = async () => {
      try {
        const data = mockTick();

        if (data.type === 'sensor_update') {
          updateMachines(data.machines || []);
        }

        if (data.new_alerts && data.new_alerts.length > 0) {
          data.new_alerts.forEach((alertData) => {
            addAlert(alertData);
            if (alertData.ticket) {
              addTicket(alertData.ticket);
            }
            if (alertData.diagnosis) {
              addIncident({
                ...alertData.diagnosis,
                sop: alertData.sop,
                timestamp: alertData.timestamp,
              });
            }
          });
        }
      } catch (err) {
        console.error('[POLL] Error:', err);
      }
    };

    // Initial poll
    poll();
    
    // Start interval
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL);
  }, [updateMachines, addAlert, addTicket, addIncident, setWsConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [connect]);

  // Return a mock ref to satisfy anything expecting the WebSocket object
  // Specifically for sending messages like inject_fault
  const mockWsRef = useRef({
    send: (msg) => {
      try {
        const data = JSON.parse(msg);
        if (data.action === "inject_fault") {
          mockInjectFault(data.machine_id, data.fault_type);
        } else if (data.action === "clear_fault") {
          mockClearFault(data.machine_id);
        }
      } catch (e) {
        console.error("Mock WS send failed", e);
      }
    }
  });

  return mockWsRef;
}
