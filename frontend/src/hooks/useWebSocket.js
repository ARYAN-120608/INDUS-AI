/**
 * Indus AI — WebSocket Hook
 * Manages real-time connection to backend for sensor data and alerts
 */

import { useEffect, useRef, useCallback } from 'react';
import useStore from '../stores/useStore';

const WS_URL = `ws://${window.location.hostname}:8000/ws/live-data`;
const RECONNECT_INTERVAL = 3000;

export function useWebSocket() {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { updateMachines, addAlert, addTicket, addIncident, setWsConnected } = useStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WS] Connected to Indus AI Backend');
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'sensor_update') {
            updateMachines(data.machines || []);
          } else if (data.type === 'anomaly_alert') {
            addAlert(data);
            if (data.ticket) {
              addTicket(data.ticket);
            }
            if (data.diagnosis) {
              addIncident({
                ...data.diagnosis,
                sop: data.sop,
                timestamp: data.timestamp,
              });
            }
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected. Reconnecting...');
        setWsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection failed:', err);
      reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_INTERVAL);
    }
  }, [updateMachines, addAlert, addTicket, addIncident, setWsConnected]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [connect]);

  return wsRef;
}
