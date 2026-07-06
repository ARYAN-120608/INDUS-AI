"""
Indus AI — Ticket REST API Routes
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

router = APIRouter(prefix="/api/tickets", tags=["tickets"])

# Reference to ticket engine (set by main.py)
_ticket_engine = None

def set_ticket_engine(engine):
    global _ticket_engine
    _ticket_engine = engine


class TicketUpdateRequest(BaseModel):
    status: Optional[str] = None
    assigned_team: Optional[str] = None


@router.get("/")
async def get_all_tickets() -> List[Dict[str, Any]]:
    """Get all tickets, sorted by most recent."""
    if _ticket_engine:
        return _ticket_engine.get_all_tickets()
    return []


@router.get("/open")
async def get_open_tickets() -> List[Dict[str, Any]]:
    """Get all open tickets."""
    if _ticket_engine:
        return _ticket_engine.get_open_tickets()
    return []


@router.get("/{ticket_id}")
async def get_ticket(ticket_id: str) -> Dict[str, Any]:
    """Get a specific ticket."""
    if _ticket_engine:
        ticket = _ticket_engine.get_ticket(ticket_id)
        if ticket:
            return ticket
    return {"error": "Ticket not found"}


@router.patch("/{ticket_id}")
async def update_ticket(ticket_id: str, update: TicketUpdateRequest) -> Dict[str, Any]:
    """Update a ticket's status or assignment."""
    if _ticket_engine:
        updates = {}
        if update.status:
            updates["status"] = update.status
        if update.assigned_team:
            updates["assigned_team"] = update.assigned_team

        result = _ticket_engine.update_ticket(ticket_id, updates)
        if result:
            return result
    return {"error": "Ticket not found"}
