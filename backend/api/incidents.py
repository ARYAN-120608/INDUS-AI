"""
Indus AI — Incident REST API Routes
"""

from fastapi import APIRouter
from typing import Dict, Any, List

router = APIRouter(prefix="/api/incidents", tags=["incidents"])

# Reference to ticket engine (set by main.py)
_ticket_engine = None

def set_ticket_engine(engine):
    global _ticket_engine
    _ticket_engine = engine


@router.get("/")
async def get_all_incidents() -> List[Dict[str, Any]]:
    """Get all incidents, sorted by most recent."""
    if _ticket_engine:
        return _ticket_engine.get_all_incidents()
    return []


@router.get("/{incident_id}")
async def get_incident(incident_id: int) -> Dict[str, Any]:
    """Get a specific incident by ID."""
    if _ticket_engine:
        incidents = _ticket_engine.get_all_incidents()
        for inc in incidents:
            if inc.get("id") == incident_id:
                return inc
    return {"error": "Incident not found"}
