"""
Indus AI — Pydantic Data Models
Shared schema definitions for the entire backend.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MachineStatus(str, Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"


class Severity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TicketStatus(str, Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class SensorData(BaseModel):
    """Sensor telemetry from a single machine."""
    machine_id: str
    machine_type: str
    status: str = "healthy"
    temperature: float = 0
    pressure: float = 0
    rpm: float = 0
    vibration: float = 0
    power_consumption: float = 0
    efficiency: float = 0
    oil_level: float = 0
    bearing_health: float = 0
    timestamp: float = 0


class SensorBatch(BaseModel):
    """Batch of sensor data from all machines."""
    type: str = "sensor_batch"
    timestamp: float
    machines: List[Dict[str, Any]]


class AIDiagnosis(BaseModel):
    """AI diagnostic output for a machine anomaly."""
    machine_id: str
    machine_type: str
    fault_cause: str
    severity: str
    downtime_estimate: str
    recommended_action: str
    confidence: float = 0.0
    details: str = ""
    timestamp: float = 0


class SOPStep(BaseModel):
    """A single step in a Standard Operating Procedure."""
    step_number: int
    action: str
    safety_note: Optional[str] = None


class SOPResult(BaseModel):
    """SOP retrieval result."""
    fault_type: str
    procedure_name: str
    steps: List[SOPStep]
    tools_required: List[str] = []
    estimated_time: str = ""
    safety_precautions: List[str] = []


class Incident(BaseModel):
    """An anomaly incident record."""
    id: Optional[int] = None
    machine_id: str
    problem: str
    severity: str
    ai_diagnosis: Optional[Dict[str, Any]] = None
    sop_steps: Optional[List[Dict[str, Any]]] = None
    sensor_snapshot: Optional[Dict[str, Any]] = None
    created_at: Optional[str] = None


class Ticket(BaseModel):
    """A maintenance ticket."""
    ticket_id: str
    machine_id: str
    incident_id: Optional[int] = None
    problem: str
    priority: str
    downtime_estimate: Optional[str] = None
    assigned_team: Optional[str] = None
    status: str = "OPEN"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TicketUpdate(BaseModel):
    """Payload for updating ticket status."""
    status: Optional[str] = None
    assigned_team: Optional[str] = None


class Alert(BaseModel):
    """Real-time alert sent to frontend."""
    type: str  # "anomaly", "ticket_created", "fault_cleared"
    severity: str
    machine_id: str
    machine_type: str
    message: str
    diagnosis: Optional[Dict[str, Any]] = None
    ticket: Optional[Dict[str, Any]] = None
    timestamp: float = 0
