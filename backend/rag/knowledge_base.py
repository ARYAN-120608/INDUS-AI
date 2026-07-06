"""
Indus AI — SOP Knowledge Base (RAG)
JSON-based Standard Operating Procedures for maintenance.
Retrieves repair procedures based on fault type.
"""

from typing import Optional, Dict, Any, List


# Comprehensive SOP knowledge base
SOP_DATABASE = {
    "Bearing Failure": {
        "procedure_name": "Bearing Replacement & Motor Recalibration",
        "steps": [
            {"step_number": 1, "action": "Immediately shut down the machine using emergency stop", "safety_note": "Ensure lockout/tagout (LOTO) procedures are followed"},
            {"step_number": 2, "action": "Disconnect power supply at the main breaker", "safety_note": "Verify zero-energy state with multimeter"},
            {"step_number": 3, "action": "Allow machine to cool down for 15-20 minutes", "safety_note": "Surface temperature may exceed 100°C"},
            {"step_number": 4, "action": "Remove protective guards and access panels", "safety_note": "Use proper PPE - gloves, safety glasses"},
            {"step_number": 5, "action": "Inspect bearing housing for visible damage or discoloration", "safety_note": None},
            {"step_number": 6, "action": "Use bearing puller to remove damaged bearing", "safety_note": "Support shaft to prevent misalignment"},
            {"step_number": 7, "action": "Clean bearing seat and shaft journal thoroughly", "safety_note": None},
            {"step_number": 8, "action": "Install new bearing with correct press fit", "safety_note": "Use bearing heater for interference fit bearings"},
            {"step_number": 9, "action": "Apply specified lubricant (Shell Gadus S2 V220 or equivalent)", "safety_note": "Do not over-grease"},
            {"step_number": 10, "action": "Reassemble guards and panels", "safety_note": None},
            {"step_number": 11, "action": "Recalibrate motor alignment using laser alignment tool", "safety_note": None},
            {"step_number": 12, "action": "Run machine at low speed for 10 minutes to verify repair", "safety_note": "Monitor vibration levels during test run"},
        ],
        "tools_required": [
            "Bearing puller set",
            "Bearing heater",
            "Laser alignment tool",
            "Torque wrench",
            "Multimeter",
            "Grease gun",
        ],
        "estimated_time": "3-4 hours",
        "safety_precautions": [
            "Follow LOTO procedures at all times",
            "Wear appropriate PPE (gloves, safety glasses, ear protection)",
            "Ensure machine is at zero-energy state before work begins",
            "Keep work area clean and free of oil spills",
        ],
    },
    "Overheating": {
        "procedure_name": "Cooling System Inspection & Thermal Management",
        "steps": [
            {"step_number": 1, "action": "Reduce machine load to 50% immediately", "safety_note": "Do not touch heated surfaces"},
            {"step_number": 2, "action": "Check coolant level and flow rate", "safety_note": "Hot coolant - use caution when opening reservoir"},
            {"step_number": 3, "action": "Inspect cooling fans and heat exchangers for blockage", "safety_note": None},
            {"step_number": 4, "action": "Clean air filters and cooling fins with compressed air", "safety_note": "Wear dust mask"},
            {"step_number": 5, "action": "Check thermostat and temperature sensors for proper operation", "safety_note": None},
            {"step_number": 6, "action": "Inspect lubricant quality — check for contamination or degradation", "safety_note": None},
            {"step_number": 7, "action": "Replace lubricant if degraded (use manufacturer-specified grade)", "safety_note": "Dispose of old lubricant per environmental regulations"},
            {"step_number": 8, "action": "Verify belt tension on cooling fan drive", "safety_note": "Ensure machine is off before adjusting"},
            {"step_number": 9, "action": "Restart machine and monitor temperature for 30 minutes", "safety_note": "Set temperature alarm at 85°C"},
        ],
        "tools_required": [
            "Infrared thermometer",
            "Coolant test kit",
            "Compressed air",
            "Belt tension gauge",
            "Lubricant sample kit",
        ],
        "estimated_time": "1-3 hours",
        "safety_precautions": [
            "Risk of burns from hot surfaces and fluids",
            "Ensure adequate ventilation",
            "Use infrared thermometer for temperature checks, not contact",
        ],
    },
    "Motor Imbalance": {
        "procedure_name": "Motor Vibration Analysis & Shaft Alignment",
        "steps": [
            {"step_number": 1, "action": "Stop the machine and engage safety lockout", "safety_note": "Follow LOTO procedures"},
            {"step_number": 2, "action": "Perform vibration spectrum analysis on motor and driven equipment", "safety_note": None},
            {"step_number": 3, "action": "Check motor mounting bolts for looseness", "safety_note": None},
            {"step_number": 4, "action": "Inspect coupling for wear or damage", "safety_note": None},
            {"step_number": 5, "action": "Perform laser shaft alignment", "safety_note": None},
            {"step_number": 6, "action": "Balance the rotor if imbalance is detected (use dynamic balancing)", "safety_note": None},
            {"step_number": 7, "action": "Replace coupling if worn beyond tolerance", "safety_note": None},
            {"step_number": 8, "action": "Tighten all mounting bolts to specified torque", "safety_note": "Use calibrated torque wrench"},
            {"step_number": 9, "action": "Run machine and verify vibration levels are within ISO 10816 limits", "safety_note": "Monitor for 15 minutes"},
        ],
        "tools_required": [
            "Vibration analyzer",
            "Laser alignment tool",
            "Dynamic balancing kit",
            "Torque wrench",
            "Dial indicator",
        ],
        "estimated_time": "3-5 hours",
        "safety_precautions": [
            "Never work on rotating equipment",
            "Ensure complete lockout before inspection",
            "Use hearing protection near running motors",
        ],
    },
    "Pressure Leak": {
        "procedure_name": "Hydraulic/Pneumatic Leak Detection & Repair",
        "steps": [
            {"step_number": 1, "action": "Isolate the pressure system using isolation valves", "safety_note": "Depressurize system before opening any connections"},
            {"step_number": 2, "action": "Perform visual inspection of all fittings, hoses, and seals", "safety_note": "Use mirror for hard-to-reach areas"},
            {"step_number": 3, "action": "Apply leak detection fluid to suspected areas", "safety_note": None},
            {"step_number": 4, "action": "Use ultrasonic leak detector for hard-to-find leaks", "safety_note": None},
            {"step_number": 5, "action": "Replace damaged seals, O-rings, or gaskets", "safety_note": "Use OEM-specified parts only"},
            {"step_number": 6, "action": "Tighten loose fittings to manufacturer specification", "safety_note": "Do not over-tighten"},
            {"step_number": 7, "action": "Replace damaged hoses if cracks or bulges are found", "safety_note": "Match hose rating to system pressure"},
            {"step_number": 8, "action": "Re-pressurize system gradually and test for leaks", "safety_note": "Stand clear of fittings during pressurization"},
            {"step_number": 9, "action": "Verify pressure holds steady for 15 minutes", "safety_note": None},
        ],
        "tools_required": [
            "Ultrasonic leak detector",
            "Leak detection fluid",
            "Seal kit (O-rings, gaskets)",
            "Hydraulic fitting wrench set",
            "Pressure gauge",
        ],
        "estimated_time": "2-4 hours",
        "safety_precautions": [
            "High-pressure fluid injection hazard",
            "Depressurize system completely before repairs",
            "Wear face shield when working with pressurized systems",
        ],
    },
    "Power Surge": {
        "procedure_name": "Electrical System Inspection & Surge Protection",
        "steps": [
            {"step_number": 1, "action": "Disconnect machine from power source immediately", "safety_note": "Use insulated gloves rated for system voltage"},
            {"step_number": 2, "action": "Inspect main power cables and connections for damage", "safety_note": "Verify zero-energy state"},
            {"step_number": 3, "action": "Check motor windings for insulation resistance (megger test)", "safety_note": "Follow electrical safety protocols"},
            {"step_number": 4, "action": "Inspect VFD/motor controller for error codes or damage", "safety_note": None},
            {"step_number": 5, "action": "Test surge protection devices and replace if tripped", "safety_note": None},
            {"step_number": 6, "action": "Check grounding connections for continuity", "safety_note": None},
            {"step_number": 7, "action": "Verify incoming power quality (voltage, frequency, THD)", "safety_note": None},
            {"step_number": 8, "action": "Install or upgrade surge protection if inadequate", "safety_note": None},
            {"step_number": 9, "action": "Reconnect and test machine under monitored conditions", "safety_note": "Monitor power consumption for 20 minutes"},
        ],
        "tools_required": [
            "Megger (insulation resistance tester)",
            "Multimeter",
            "Power quality analyzer",
            "Insulated tool set",
            "Thermal camera",
        ],
        "estimated_time": "1-3 hours",
        "safety_precautions": [
            "Arc flash hazard - wear appropriate PPE",
            "Only qualified electricians should perform electrical work",
            "Follow NFPA 70E guidelines",
        ],
    },
    "General Anomaly": {
        "procedure_name": "General Machine Inspection & Diagnostics",
        "steps": [
            {"step_number": 1, "action": "Record all current sensor readings", "safety_note": None},
            {"step_number": 2, "action": "Compare readings with baseline values from last calibration", "safety_note": None},
            {"step_number": 3, "action": "Perform visual and auditory inspection of the machine", "safety_note": "Keep safe distance from moving parts"},
            {"step_number": 4, "action": "Check all fluid levels (oil, coolant, hydraulic)", "safety_note": None},
            {"step_number": 5, "action": "Inspect belts, chains, and drive components for wear", "safety_note": "Machine must be stopped"},
            {"step_number": 6, "action": "Run diagnostic self-test if available", "safety_note": None},
            {"step_number": 7, "action": "Document findings and schedule follow-up if needed", "safety_note": None},
        ],
        "tools_required": [
            "Inspection checklist",
            "Flashlight",
            "Basic hand tools",
            "Notepad/tablet for documentation",
        ],
        "estimated_time": "1-2 hours",
        "safety_precautions": [
            "Follow standard safety protocols",
            "Use PPE as required for the specific machine",
        ],
    },
}


def get_sop(fault_type: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve Standard Operating Procedure for a given fault type.
    Returns the SOP dict or None if not found.
    """
    # Try exact match first
    if fault_type in SOP_DATABASE:
        sop = SOP_DATABASE[fault_type].copy()
        sop["fault_type"] = fault_type
        return sop

    # Try fuzzy match (case-insensitive, partial match)
    fault_lower = fault_type.lower()
    for key, value in SOP_DATABASE.items():
        if fault_lower in key.lower() or key.lower() in fault_lower:
            sop = value.copy()
            sop["fault_type"] = key
            return sop

    # Default to general anomaly
    sop = SOP_DATABASE["General Anomaly"].copy()
    sop["fault_type"] = "General Anomaly"
    return sop


def get_all_sops() -> List[Dict[str, Any]]:
    """Return all available SOPs."""
    result = []
    for fault_type, sop in SOP_DATABASE.items():
        entry = sop.copy()
        entry["fault_type"] = fault_type
        result.append(entry)
    return result
