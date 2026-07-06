"""
Indus AI — Petroleum Refinery Subsystem Definitions & Fault Profiles
Each subsystem mirrors a real part of the 3D Sketchfab refinery model.
"""

import random
import math
import time

# ─────────────────────────────────────────────────────────────────────
#  SUBSYSTEM PROFILES  (sensor names & normal operating ranges)
# ─────────────────────────────────────────────────────────────────────
MACHINE_PROFILES = {
    "Distillation Column": {
        "id": "distillation-column-1",
        "normal": {
            "temperature":        (320, 370),   # °C   — tray temperatures
            "pressure":           (1.5, 2.2),   # bar  — column pressure
            "flow_rate":          (80,  120),   # m³/h — feed flow
            "efficiency":         (88,  97),    # %
            "reflux_ratio":       (2.8, 3.5),   # dimensionless
            "vibration":          (5,   18),    # mm/s
            "power_consumption":  (850, 1100),  # kW
        },
    },
    "Heat Exchanger": {
        "id": "heat-exchanger-hx1",
        "normal": {
            "temperature":        (180, 240),   # °C   — outlet temp
            "pressure":           (3.0, 5.5),   # bar
            "flow_rate":          (60,  95),    # m³/h
            "efficiency":         (85,  96),    # %
            "fouling_factor":     (0,   0.0002),# m²·K/W  (near zero = clean)
            "vibration":          (3,   12),    # mm/s
            "power_consumption":  (200, 380),   # kW
        },
    },
    "Pump Station": {
        "id": "pump-station-p1",
        "normal": {
            "temperature":        (45,  75),    # °C
            "pressure":           (8,   14),    # bar  — discharge pressure
            "flow_rate":          (100, 160),   # m³/h
            "rpm":                (2800, 3200), # RPM
            "vibration":          (2,   10),    # mm/s
            "bearing_health":     (85,  100),   # %
            "power_consumption":  (300, 480),   # kW
        },
    },
    "Cooling Tower": {
        "id": "cooling-tower-ct1",
        "normal": {
            "temperature":        (28,  42),    # °C   — return water temp
            "pressure":           (1.0, 2.0),   # bar
            "flow_rate":          (200, 320),   # m³/h — cooling water
            "efficiency":         (88,  97),    # %
            "vibration":          (4,   14),    # mm/s (fan vibration)
            "ph_level":           (7.0, 8.5),   # pH
            "power_consumption":  (180, 290),   # kW
        },
    },
    "Separator Unit": {
        "id": "separator-unit-s1",
        "normal": {
            "temperature":        (60,  90),    # °C
            "pressure":           (4.0, 7.0),   # bar
            "flow_rate":          (70,  110),   # m³/h
            "efficiency":         (82,  95),    # %
            "liquid_level":       (40,  65),    # % of vessel
            "vibration":          (3,   11),    # mm/s
            "power_consumption":  (120, 200),   # kW
        },
    },
    "Compressor": {
        "id": "compressor-c1",
        "normal": {
            "temperature":        (90,  130),   # °C   — discharge temp
            "pressure":           (12,  18),    # bar  — discharge pressure
            "rpm":                (3500, 4200), # RPM
            "vibration":          (4,   16),    # mm/s
            "efficiency":         (80,  93),    # %
            "bearing_health":     (82,  100),   # %
            "power_consumption":  (600, 900),   # kW
        },
    },
    "Storage Tank": {
        "id": "storage-tank-t1",
        "normal": {
            "temperature":        (25,  45),    # °C
            "pressure":           (0.1, 0.5),   # bar  — vapor pressure
            "liquid_level":       (30,  80),    # %
            "vibration":          (0,   5),     # mm/s (near zero = normal)
            "efficiency":         (95,  100),   # % (structural integrity proxy)
            "flow_rate":          (10,  50),    # m³/h — in/out flow
            "power_consumption":  (30,  80),    # kW  — pumps & instrumentation
        },
    },
}

# ─────────────────────────────────────────────────────────────────────
#  FAULT PROFILES  (refinery-specific fault modes)
# ─────────────────────────────────────────────────────────────────────
FAULT_PROFILES = {
    "column_flooding": {
        "description": "Column Flooding",
        "effects": {
            "pressure":           (0.8, 1.5),   # pressure surge
            "temperature":        (20,  45),     # temperature rise
            "efficiency":         (-25, -40),
            "flow_rate":          (-30, -50),
            "vibration":          (10,  25),
        },
        "degradation_rate": 0.13,
        "severity_threshold": 0.45,
        "mttr_hours": (4, 8),   # Mean Time To Repair range
    },
    "heat_fouling": {
        "description": "Heat Exchanger Fouling",
        "effects": {
            "temperature":        (25,  55),
            "efficiency":         (-18, -32),
            "pressure":           (0.5, 1.2),
            "fouling_factor":     (0.0003, 0.0008),
            "power_consumption":  (60,  150),
        },
        "degradation_rate": 0.08,
        "severity_threshold": 0.50,
        "mttr_hours": (6, 12),
    },
    "pump_cavitation": {
        "description": "Pump Cavitation",
        "effects": {
            "vibration":          (15,  45),
            "flow_rate":          (-25, -50),
            "pressure":           (-2,  -5),
            "bearing_health":     (-20, -40),
            "temperature":        (10,  25),
        },
        "degradation_rate": 0.16,
        "severity_threshold": 0.40,
        "mttr_hours": (2, 5),
    },
    "compressor_surge": {
        "description": "Compressor Surge",
        "effects": {
            "pressure":           (3,   8),
            "vibration":          (20,  60),
            "temperature":        (30,  70),
            "rpm":                (-500, -1200),
            "efficiency":         (-22, -38),
        },
        "degradation_rate": 0.20,
        "severity_threshold": 0.35,
        "mttr_hours": (3, 7),
    },
    "cooling_tower_failure": {
        "description": "Cooling Tower Failure",
        "effects": {
            "temperature":        (15,  35),
            "efficiency":         (-20, -40),
            "flow_rate":          (-40, -70),
            "vibration":          (8,   22),
            "ph_level":           (-1.5, 2.0),
        },
        "degradation_rate": 0.11,
        "severity_threshold": 0.45,
        "mttr_hours": (4, 10),
    },
    "separator_overflow": {
        "description": "Separator Overflow",
        "effects": {
            "liquid_level":       (25,  45),
            "pressure":           (1.5, 3.0),
            "efficiency":         (-30, -50),
            "temperature":        (10,  20),
            "flow_rate":          (-20, -40),
        },
        "degradation_rate": 0.17,
        "severity_threshold": 0.40,
        "mttr_hours": (1, 4),
    },
    "structural_leak": {
        "description": "Structural Leak / Seal Failure",
        "effects": {
            "pressure":           (-0.2, -0.4),
            "liquid_level":       (-15, -35),
            "vibration":          (3,   12),
            "efficiency":         (-10, -25),
            "flow_rate":          (-15, -30),
        },
        "degradation_rate": 0.09,
        "severity_threshold": 0.55,
        "mttr_hours": (5, 14),
    },
}


class Machine:
    """Represents one refinery subsystem with live sensor simulation."""

    def __init__(self, machine_type: str):
        profile = MACHINE_PROFILES[machine_type]
        self.machine_id   = profile["id"]
        self.machine_type = machine_type
        self.normal_ranges = profile["normal"]

        # Start sensors at midpoint of normal range
        self.sensors: dict = {}
        for sensor, rng in self.normal_ranges.items():
            lo, hi = rng
            self.sensors[sensor] = (lo + hi) / 2

        # Fault state
        self.active_fault         = None
        self.fault_progress       = 0.0
        self.fault_target_deltas  = {}
        self.status               = "healthy"
        self.fault_start_time     = None
        self.fault_phase          = None   # 'developing' | 'active' | 'resolving'

    # ── Fault management ────────────────────────────────────────────
    def inject_fault(self, fault_type: str):
        if self.active_fault is not None:
            return
        fault = FAULT_PROFILES[fault_type]
        self.active_fault        = fault_type
        self.fault_progress      = 0.0
        self.fault_phase         = "developing"
        self.fault_start_time    = time.time()
        self.fault_target_deltas = {
            sensor: random.uniform(*rng)
            for sensor, rng in fault["effects"].items()
        }

    def clear_fault(self):
        self.fault_phase         = "resolving"
        # actual clear happens after a short wind-down in tick()

    def _complete_clear(self):
        self.active_fault        = None
        self.fault_progress      = 0.0
        self.fault_target_deltas = {}
        self.status              = "healthy"
        self.fault_start_time    = None
        self.fault_phase         = None

    # ── Simulation tick ─────────────────────────────────────────────
    def tick(self) -> dict:
        if self.active_fault:
            fault      = FAULT_PROFILES[self.active_fault]
            threshold  = fault["severity_threshold"]
            rate       = fault["degradation_rate"]

            if self.fault_phase == "developing":
                self.fault_progress = min(1.0, self.fault_progress + rate)
                if self.fault_progress < threshold:
                    self.status = "warning"
                else:
                    self.status   = "critical"
                    self.fault_phase = "active"

            elif self.fault_phase == "active":
                # Add instability noise at peak
                self.status = "critical"

            elif self.fault_phase == "resolving":
                self.fault_progress = max(0.0, self.fault_progress - rate * 1.5)
                self.status = "warning" if self.fault_progress > 0.1 else "healthy"
                if self.fault_progress <= 0.0:
                    self._complete_clear()
        else:
            self.status = "healthy"

        t = time.time()
        reading = {
            "machine_id":   self.machine_id,
            "machine_type": self.machine_type,
            "status":       self.status,
            "timestamp":    t,
        }

        for sensor, rng in self.normal_ranges.items():
            lo, hi = rng
            mid = (lo + hi) / 2
            span = hi - lo

            # Natural Gaussian noise around midpoint
            base = random.gauss(mid, span * 0.08)

            # Sinusoidal drift for realism
            phase = hash(sensor) % 31
            wave  = math.sin(t * 0.05 + phase) * span * 0.04
            base += wave

            # Apply fault delta gradually
            if self.active_fault and sensor in self.fault_target_deltas:
                delta = self.fault_target_deltas[sensor] * self.fault_progress
                base += delta
                # Add instability noise in active phase
                if self.fault_phase == "active" and self.fault_progress > 0.6:
                    base += random.gauss(0, span * 0.06)

            # Physical limits
            base = self._clamp(sensor, base, lo, hi)
            reading[sensor] = round(base, 3 if abs(hi - lo) < 1 else 1)
            self.sensors[sensor] = reading[sensor]

        return reading

    @staticmethod
    def _clamp(sensor: str, value: float, lo: float, hi: float) -> float:
        """Clamp value to safe physical limits."""
        pct_sensors = {"efficiency", "bearing_health", "liquid_level"}
        if sensor in pct_sensors:
            return max(0.0, min(100.0, value))
        if sensor == "ph_level":
            return max(0.0, min(14.0, value))
        if sensor == "fouling_factor":
            return max(0.0, min(0.005, value))
        if sensor in {"vibration", "flow_rate", "rpm", "power_consumption"}:
            return max(0.0, value)
        if sensor == "pressure":
            return max(0.0, value)
        if sensor == "temperature":
            return max(-10.0, min(600.0, value))
        return value


def create_all_machines():
    """Instantiate all 7 refinery subsystems."""
    return [Machine(mtype) for mtype in MACHINE_PROFILES]
