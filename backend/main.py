"""
Indus AI — FastAPI Backend Server
Main entry point. Connects simulator, AI engine, and frontend via WebSocket.
"""

import asyncio
import json
import os
import sys
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.websocket_manager import manager
from backend.ai_engine.diagnosis import detect_anomaly, diagnose
from backend.rag.knowledge_base import get_sop, get_all_sops
from backend.automation.ticket_engine import TicketEngine
from backend.api import machines as machines_api
from backend.api import incidents as incidents_api
from backend.api import tickets as tickets_api

# ============================================
# Application State
# ============================================
app_state = {
    "machine_states": {},       # Latest sensor data per machine
    "machine_history": defaultdict(lambda: deque(maxlen=300)),  # 5 min history per machine
    "alerts": deque(maxlen=100),
    "anomaly_cooldown": {},     # Prevent alert spam per machine
}

ticket_engine = TicketEngine()

ANOMALY_COOLDOWN_SECONDS = 30  # Minimum seconds between anomaly alerts per machine


# ============================================
# Lifespan — Connect to Simulator on startup
# ============================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background task to connect to factory simulator."""
    # Set app state references in API routers
    machines_api.set_app_state(app_state)
    incidents_api.set_ticket_engine(ticket_engine)
    tickets_api.set_ticket_engine(ticket_engine)

    # Start simulator listener
    task = asyncio.create_task(simulator_listener())
    print("[BACKEND] Indus AI Backend started")
    yield
    task.cancel()
    print("[BACKEND] Backend shutting down")


# ============================================
# FastAPI App
# ============================================
app = FastAPI(
    title="Indus AI — Industrial Intelligence Platform",
    description="Autonomous AI Agent for Real-Time Industrial Monitoring",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(machines_api.router)
app.include_router(incidents_api.router)
app.include_router(tickets_api.router)


# ============================================
# Simulator Listener — connects to factory simulator WebSocket
# ============================================
async def simulator_listener():
    """Connect to the factory simulator and process incoming telemetry."""
    import websockets

    simulator_url = os.environ.get("SIMULATOR_URL", "ws://localhost:8765")
    retry_delay = 2

    while True:
        try:
            print(f"[BACKEND] Connecting to simulator at {simulator_url}...")
            async with websockets.connect(simulator_url) as ws:
                print(f"[BACKEND] Connected to factory simulator")
                retry_delay = 2

                async for message in ws:
                    try:
                        data = json.loads(message)
                        await process_sensor_batch(data)
                    except json.JSONDecodeError:
                        pass
                    except Exception as e:
                        print(f"[BACKEND] Error processing data: {e}")

        except Exception as e:
            print(f"[BACKEND] Simulator connection failed: {e}. Retrying in {retry_delay}s...")
            await asyncio.sleep(retry_delay)
            retry_delay = min(retry_delay * 2, 30)


async def process_sensor_batch(batch: dict):
    """Process a batch of sensor readings from all machines."""
    if batch.get("type") != "sensor_batch":
        return

    machines = batch.get("machines", [])

    for machine_data in machines:
        machine_id = machine_data.get("machine_id")
        if not machine_id:
            continue

        # Update latest state
        app_state["machine_states"][machine_id] = machine_data

        # Append to history
        app_state["machine_history"][machine_id].append(machine_data)

        # Check for anomalies
        anomaly = detect_anomaly(machine_data)
        if anomaly:
            await handle_anomaly(machine_data, anomaly)

    # Forward to all connected frontend clients
    forward_payload = json.dumps({
        "type": "sensor_update",
        "timestamp": batch.get("timestamp", time.time()),
        "machines": machines,
    })
    await manager.broadcast_data(forward_payload)


async def handle_anomaly(machine_data: dict, anomaly: dict):
    """Handle a detected anomaly — run AI diagnosis, create ticket, alert frontend."""
    machine_id = machine_data.get("machine_id")

    # Check cooldown to prevent alert spam
    now = time.time()
    last_alert = app_state["anomaly_cooldown"].get(machine_id, 0)
    if now - last_alert < ANOMALY_COOLDOWN_SECONDS:
        return

    app_state["anomaly_cooldown"][machine_id] = now

    # Run AI diagnosis
    diagnosis = await diagnose(machine_data, anomaly)

    # Get SOP for the fault
    fault_cause = diagnosis.get("fault_cause", "General Anomaly")
    sop = get_sop(fault_cause)

    # Create ticket
    ticket = ticket_engine.create_ticket(
        machine_id=machine_id,
        machine_type=machine_data.get("machine_type", "Unknown"),
        diagnosis=diagnosis,
        sop=sop,
        sensor_snapshot=anomaly.get("sensor_snapshot"),
    )

    # Build alert payload
    alert = {
        "type": "anomaly_alert",
        "severity": diagnosis.get("severity", "MEDIUM"),
        "machine_id": machine_id,
        "machine_type": machine_data.get("machine_type", "Unknown"),
        "message": f"{fault_cause} detected on {machine_data.get('machine_type', 'Unknown')} ({machine_id})",
        "diagnosis": diagnosis,
        "ticket": ticket,
        "sop": {
            "procedure_name": sop.get("procedure_name", "") if sop else "",
            "steps": sop.get("steps", []) if sop else [],
            "estimated_time": sop.get("estimated_time", "") if sop else "",
        },
        "timestamp": time.time(),
    }

    # Store alert
    app_state["alerts"].appendleft(alert)

    # Broadcast to frontend
    await manager.broadcast_alert(json.dumps(alert))
    print(f"[BACKEND] !! Alert sent: {alert['message']}")


# ============================================
# WebSocket Endpoints
# ============================================
@app.websocket("/ws/live-data")
async def websocket_live_data(websocket: WebSocket):
    """WebSocket endpoint for real-time sensor data."""
    await manager.connect(websocket, "data")
    try:
        while True:
            # Keep connection alive, handle client messages if needed
            data = await websocket.receive_text()
            # Could handle commands from frontend
    except WebSocketDisconnect:
        manager.disconnect(websocket, "data")


@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for anomaly alerts."""
    await manager.connect(websocket, "alerts")
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "alerts")


# ============================================
# Additional REST Endpoints
# ============================================
@app.get("/")
async def root():
    """Health check / welcome."""
    return {
        "name": "Indus AI",
        "tagline": "Autonomous AI Agent for Real-Time Industrial Monitoring",
        "version": "1.0.0",
        "status": "online",
        "machines_online": len(app_state["machine_states"]),
    }


@app.get("/api/alerts")
async def get_alerts(limit: int = 50):
    """Get recent alerts."""
    alerts = list(app_state["alerts"])
    return alerts[:limit]


@app.get("/api/sops")
async def get_sops():
    """Get all available SOPs."""
    return get_all_sops()


@app.get("/api/sops/{fault_type}")
async def get_sop_by_type(fault_type: str):
    """Get SOP for a specific fault type."""
    sop = get_sop(fault_type)
    if sop:
        return sop
    return {"error": "SOP not found"}


@app.get("/api/stats")
async def get_system_stats():
    """Get system-wide statistics."""
    all_tickets = ticket_engine.get_all_tickets()
    open_tickets = ticket_engine.get_open_tickets()

    # Count machines by status
    status_counts = {"healthy": 0, "warning": 0, "critical": 0}
    for m in app_state["machine_states"].values():
        status = m.get("status", "healthy")
        status_counts[status] = status_counts.get(status, 0) + 1

    return {
        "total_machines": len(app_state["machine_states"]),
        "machine_status": status_counts,
        "total_incidents": len(ticket_engine.incidents),
        "total_tickets": len(all_tickets),
        "open_tickets": len(open_tickets),
        "recent_alerts": len(list(app_state["alerts"])),
    }
