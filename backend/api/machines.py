"""
Indus AI — Machine REST API Routes
"""

from fastapi import APIRouter
from typing import Dict, Any, List

router = APIRouter(prefix="/api/machines", tags=["machines"])

# Reference to app state (set by main.py)
_app_state = None

def set_app_state(state):
    global _app_state
    _app_state = state


@router.get("/")
async def get_all_machines() -> List[Dict[str, Any]]:
    """Get current status of all machines."""
    if _app_state and "machine_states" in _app_state:
        return list(_app_state["machine_states"].values())
    return []


@router.get("/{machine_id}")
async def get_machine(machine_id: str) -> Dict[str, Any]:
    """Get specific machine status and recent telemetry."""
    if _app_state and "machine_states" in _app_state:
        machine = _app_state["machine_states"].get(machine_id)
        if machine:
            # Include recent history
            history = _app_state.get("machine_history", {}).get(machine_id, [])
            return {
                "current": machine,
                "history": history[-60:],  # Last 60 readings (1 minute)
            }
    return {"error": "Machine not found"}


@router.get("/{machine_id}/history")
async def get_machine_history(machine_id: str, limit: int = 120) -> Dict[str, Any]:
    """Get telemetry history for a machine."""
    if _app_state and "machine_history" in _app_state:
        history = _app_state["machine_history"].get(machine_id, [])
        return {
            "machine_id": machine_id,
            "readings": history[-limit:],
            "count": len(history[-limit:]),
        }
    return {"machine_id": machine_id, "readings": [], "count": 0}
