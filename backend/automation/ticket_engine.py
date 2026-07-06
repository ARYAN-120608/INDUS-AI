"""
Indus AI — Ticket Automation Engine
Auto-generates maintenance tickets when AI detects anomalies.
Stores tickets in memory (with Supabase integration ready).
"""

import time
import random
import string
from typing import Dict, Any, List, Optional


# Team assignment mapping based on fault type
TEAM_ASSIGNMENTS = {
    "Bearing Failure": "Mechanical Team",
    "Overheating": "Thermal Systems Team",
    "Motor Imbalance": "Mechanical Team",
    "Pressure Leak": "Hydraulic Systems Team",
    "Power Surge": "Electrical Team",
    "General Anomaly": "General Maintenance Team",
}

# Priority mapping
PRIORITY_MAP = {
    "CRITICAL": "CRITICAL",
    "HIGH": "HIGH",
    "MEDIUM": "MEDIUM",
    "LOW": "LOW",
}


class TicketEngine:
    """Generates and manages maintenance tickets."""

    def __init__(self):
        self.tickets: Dict[str, Dict[str, Any]] = {}
        self.incidents: List[Dict[str, Any]] = []
        self._ticket_counter = 1000

    def _generate_ticket_id(self) -> str:
        """Generate a unique ticket ID."""
        self._ticket_counter += 1
        return f"INC-{self._ticket_counter}"

    def create_ticket(
        self,
        machine_id: str,
        machine_type: str,
        diagnosis: Dict[str, Any],
        sop: Optional[Dict[str, Any]] = None,
        sensor_snapshot: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a new maintenance ticket from AI diagnosis.
        Returns the created ticket.
        """
        fault_cause = diagnosis.get("fault_cause", "Unknown Fault")
        severity = diagnosis.get("severity", "MEDIUM")

        # Create incident record
        incident = {
            "id": len(self.incidents) + 1,
            "machine_id": machine_id,
            "problem": fault_cause,
            "severity": severity,
            "ai_diagnosis": diagnosis,
            "sop_steps": sop.get("steps", []) if sop else [],
            "sensor_snapshot": sensor_snapshot,
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        self.incidents.append(incident)

        # Create ticket
        ticket_id = self._generate_ticket_id()
        ticket = {
            "ticket_id": ticket_id,
            "machine_id": machine_id,
            "machine_type": machine_type,
            "incident_id": incident["id"],
            "problem": fault_cause,
            "priority": PRIORITY_MAP.get(severity, "MEDIUM"),
            "downtime_estimate": diagnosis.get("downtime_estimate", "Unknown"),
            "assigned_team": TEAM_ASSIGNMENTS.get(fault_cause, "General Maintenance Team"),
            "recommended_action": diagnosis.get("recommended_action", ""),
            "sop_procedure": sop.get("procedure_name", "") if sop else "",
            "status": "OPEN",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

        self.tickets[ticket_id] = ticket
        print(
            f"[TICKET ENGINE] Ticket created: {ticket_id} | "
            f"{machine_id} | {fault_cause} | {severity}"
        )

        return ticket

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a ticket's status or assignment."""
        if ticket_id not in self.tickets:
            return None

        ticket = self.tickets[ticket_id]
        for key, value in updates.items():
            if key in ticket:
                ticket[key] = value
        ticket["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        return ticket

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific ticket."""
        return self.tickets.get(ticket_id)

    def get_all_tickets(self) -> List[Dict[str, Any]]:
        """Get all tickets, sorted by creation time (newest first)."""
        return sorted(
            self.tickets.values(),
            key=lambda t: t.get("created_at", ""),
            reverse=True,
        )

    def get_all_incidents(self) -> List[Dict[str, Any]]:
        """Get all incidents, sorted by creation time (newest first)."""
        return sorted(
            self.incidents,
            key=lambda i: i.get("created_at", ""),
            reverse=True,
        )

    def get_open_tickets(self) -> List[Dict[str, Any]]:
        """Get all open tickets."""
        return [t for t in self.tickets.values() if t["status"] == "OPEN"]

    def get_tickets_for_machine(self, machine_id: str) -> List[Dict[str, Any]]:
        """Get all tickets for a specific machine."""
        return [t for t in self.tickets.values() if t["machine_id"] == machine_id]
