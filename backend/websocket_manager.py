"""
Indus AI — WebSocket Connection Manager
Manages real-time data pipeline: Simulator → Backend → Frontend
"""

import asyncio
import json
import time
from typing import Dict, Any, List, Set
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """Manages WebSocket connections to frontend clients."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.alert_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, channel: str = "data"):
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        if channel == "alerts":
            self.alert_connections.append(websocket)
        else:
            self.active_connections.append(websocket)
        print(f"[WS] Client connected to '{channel}'. Active: data={len(self.active_connections)}, alerts={len(self.alert_connections)}")

    def disconnect(self, websocket: WebSocket, channel: str = "data"):
        """Remove a disconnected WebSocket."""
        if channel == "alerts":
            if websocket in self.alert_connections:
                self.alert_connections.remove(websocket)
        else:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        print(f"[WS] Client disconnected from '{channel}'.")

    async def broadcast_data(self, message: str):
        """Send sensor data to all data channel clients."""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn, "data")

    async def broadcast_alert(self, message: str):
        """Send alert to all alert channel clients AND data channel clients."""
        disconnected = []
        # Send to alert subscribers
        for connection in self.alert_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn, "alerts")

        # Also send to data subscribers
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn, "data")


# Global connection manager instance
manager = ConnectionManager()
