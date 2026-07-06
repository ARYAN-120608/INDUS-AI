"""
Indus AI — AI Diagnostic Engine (Refinery Edition)
LLaMA-3 via Groq for expert fault diagnosis; rule-based fallback.
"""

import json
import math
import os
import random
import time
import httpx
from typing import Optional, Dict, Any

from backend.ai_engine.prompts import SYSTEM_PROMPT, build_diagnosis_prompt

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL   = "llama-3.3-70b-versatile"

_last_api_call   = 0.0
MIN_API_INTERVAL = 6   # seconds between Groq API calls


# ─────────────────────────────────────────────────────────────────────
#  Anomaly thresholds — calibrated for refinery operating conditions
# ─────────────────────────────────────────────────────────────────────
THRESHOLDS = {
    # Distillation Column / Heat Exchanger
    "temperature_high": {"warning": 400,  "critical": 430},   # °C
    "temperature_low":  {"warning": 20,   "critical": 10},    # °C (cold utility)
    # Pump / Compressor
    "vibration":        {"warning": 22,   "critical": 40},    # mm/s
    "bearing_health":   {"warning": 65,   "critical": 45},    # % (lower = worse)
    # Process variables
    "efficiency":       {"warning": 75,   "critical": 60},    # %
    "pressure_high":    {"warning": 16,   "critical": 20},    # bar
    "pressure_low":     {"warning": 1.0,  "critical": 0.3},   # bar (for cooling / storage)
    "liquid_level_high":{"warning": 80,   "critical": 90},    # %
    "liquid_level_low": {"warning": 20,   "critical": 10},    # %
    "fouling_factor":   {"warning": 0.00025, "critical": 0.0005},  # m²K/W
    "ph_high":          {"warning": 9.0,  "critical": 10.0},  # pH
    "ph_low":           {"warning": 6.5,  "critical": 5.5},   # pH
    "power_consumption":{"warning": 1000, "critical": 1300},  # kW
    "flow_rate_low":    {"warning": 40,   "critical": 20},    # m³/h
}

# Realistic downtime distribution parameters (hours): (mean, std_dev)
# Based on industry data (OREDA / IOGP statistics).
DOWNTIME_PARAMS = {
    ("Column Flooding",       "CRITICAL"): (7.2,  2.5),
    ("Column Flooding",       "HIGH"):     (4.0,  1.5),
    ("Heat Exchanger Fouling","CRITICAL"): (10.5, 3.0),
    ("Heat Exchanger Fouling","HIGH"):     (6.0,  2.0),
    ("Pump Cavitation",       "CRITICAL"): (3.5,  1.2),
    ("Pump Cavitation",       "HIGH"):     (1.8,  0.8),
    ("Compressor Surge",      "CRITICAL"): (5.5,  1.8),
    ("Compressor Surge",      "HIGH"):     (3.0,  1.0),
    ("Cooling Tower Failure", "CRITICAL"): (8.0,  2.8),
    ("Cooling Tower Failure", "HIGH"):     (4.5,  1.5),
    ("Separator Overflow",    "CRITICAL"): (3.0,  1.0),
    ("Separator Overflow",    "HIGH"):     (1.5,  0.6),
    ("Structural Leak",       "CRITICAL"): (12.0, 4.0),
    ("Structural Leak",       "HIGH"):     (6.5,  2.0),
    ("General Anomaly",       "CRITICAL"): (5.0,  2.0),
    ("General Anomaly",       "HIGH"):     (2.5,  1.0),
}


def _realistic_downtime(fault: str, severity: str) -> str:
    """
    Generate a realistic, slightly random downtime estimate using a
    lognormal distribution parameterised by historical MTTR data.
    Returns a human-readable range string.
    """
    params = DOWNTIME_PARAMS.get((fault, severity)) or DOWNTIME_PARAMS.get(("General Anomaly", severity), (4.0, 1.5))
    mean_h, sigma_h = params
    mu    = math.log(mean_h) - 0.5 * (sigma_h / mean_h) ** 2
    sigma = sigma_h / mean_h  # coefficient of variation → log-space sigma approx
    sampled = math.exp(random.gauss(mu, sigma))
    low  = max(0.5, sampled * 0.75)
    high = sampled * 1.30
    if high < 2:
        return f"{low:.0f}–{high:.0f} hours"
    return f"{low:.1f}–{high:.1f} hours"


# ─────────────────────────────────────────────────────────────────────
#  Anomaly detection
# ─────────────────────────────────────────────────────────────────────
def detect_anomaly(machine_data: dict) -> Optional[Dict[str, Any]]:
    anomalies = []
    severity  = "LOW"

    def escalate(new_sev: str):
        nonlocal severity
        order = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        if order.index(new_sev) > order.index(severity):
            severity = new_sev

    temp    = machine_data.get("temperature",       0)
    vib     = machine_data.get("vibration",         0)
    bearing = machine_data.get("bearing_health",  100)
    eff     = machine_data.get("efficiency",       100)
    power   = machine_data.get("power_consumption", 0)
    press   = machine_data.get("pressure",          5)
    level   = machine_data.get("liquid_level",      50)
    fouling = machine_data.get("fouling_factor",    0)
    ph      = machine_data.get("ph_level",          7.5)
    flow    = machine_data.get("flow_rate",         100)

    # Temperature
    if temp >= THRESHOLDS["temperature_high"]["critical"]:
        anomalies.append(f"Temperature critically high: {temp}°C"); escalate("CRITICAL")
    elif temp >= THRESHOLDS["temperature_high"]["warning"]:
        anomalies.append(f"Temperature elevated: {temp}°C"); escalate("HIGH")

    # Vibration
    if vib >= THRESHOLDS["vibration"]["critical"]:
        anomalies.append(f"Vibration critically high: {vib} mm/s"); escalate("CRITICAL")
    elif vib >= THRESHOLDS["vibration"]["warning"]:
        anomalies.append(f"Vibration elevated: {vib} mm/s"); escalate("HIGH")

    # Bearing health
    if bearing <= THRESHOLDS["bearing_health"]["critical"]:
        anomalies.append(f"Bearing health critical: {bearing}%"); escalate("CRITICAL")
    elif bearing <= THRESHOLDS["bearing_health"]["warning"]:
        anomalies.append(f"Bearing health degraded: {bearing}%"); escalate("HIGH")

    # Efficiency
    if eff <= THRESHOLDS["efficiency"]["critical"]:
        anomalies.append(f"Efficiency critically low: {eff}%"); escalate("HIGH")
    elif eff <= THRESHOLDS["efficiency"]["warning"]:
        anomalies.append(f"Efficiency degraded: {eff}%"); escalate("MEDIUM")

    # Pressure high
    if press >= THRESHOLDS["pressure_high"]["critical"]:
        anomalies.append(f"Pressure dangerously high: {press} bar"); escalate("CRITICAL")
    elif press >= THRESHOLDS["pressure_high"]["warning"]:
        anomalies.append(f"Pressure elevated: {press} bar"); escalate("HIGH")

    # Liquid level
    if level >= THRESHOLDS["liquid_level_high"]["critical"]:
        anomalies.append(f"Vessel overflow imminent: {level}%"); escalate("CRITICAL")
    elif level >= THRESHOLDS["liquid_level_high"]["warning"]:
        anomalies.append(f"Liquid level high: {level}%"); escalate("HIGH")
    elif level <= THRESHOLDS["liquid_level_low"]["critical"]:
        anomalies.append(f"Vessel critically low: {level}%"); escalate("CRITICAL")
    elif level <= THRESHOLDS["liquid_level_low"]["warning"]:
        anomalies.append(f"Liquid level low: {level}%"); escalate("HIGH")

    # Fouling
    if fouling >= THRESHOLDS["fouling_factor"]["critical"]:
        anomalies.append(f"Severe fouling: {fouling:.4f} m²K/W"); escalate("CRITICAL")
    elif fouling >= THRESHOLDS["fouling_factor"]["warning"]:
        anomalies.append(f"Fouling detected: {fouling:.4f} m²K/W"); escalate("HIGH")

    # pH
    if ph >= THRESHOLDS["ph_high"]["critical"] or ph <= THRESHOLDS["ph_low"]["critical"]:
        anomalies.append(f"pH out of safe range: {ph}"); escalate("CRITICAL")
    elif ph >= THRESHOLDS["ph_high"]["warning"] or ph <= THRESHOLDS["ph_low"]["warning"]:
        anomalies.append(f"pH drifting: {ph}"); escalate("MEDIUM")

    # Power
    if power >= THRESHOLDS["power_consumption"]["critical"]:
        anomalies.append(f"Power draw excessive: {power} kW"); escalate("HIGH")
    elif power >= THRESHOLDS["power_consumption"]["warning"]:
        anomalies.append(f"Power draw elevated: {power} kW"); escalate("MEDIUM")

    # Flow rate low
    if flow <= THRESHOLDS["flow_rate_low"]["critical"]:
        anomalies.append(f"Flow critically low: {flow} m³/h"); escalate("CRITICAL")
    elif flow <= THRESHOLDS["flow_rate_low"]["warning"]:
        anomalies.append(f"Flow rate low: {flow} m³/h"); escalate("HIGH")

    if not anomalies:
        return None

    return {
        "machine_id":      machine_data.get("machine_id"),
        "machine_type":    machine_data.get("machine_type"),
        "anomalies":       anomalies,
        "severity":        severity,
        "sensor_snapshot": {k: machine_data.get(k) for k in machine_data
                            if k not in ("machine_id", "machine_type", "status", "timestamp")},
    }


# ─────────────────────────────────────────────────────────────────────
#  Fault classification
# ─────────────────────────────────────────────────────────────────────
def _classify_fault(machine_data: dict) -> str:
    vib     = machine_data.get("vibration",         0)
    bearing = machine_data.get("bearing_health",  100)
    temp    = machine_data.get("temperature",       0)
    press   = machine_data.get("pressure",          5)
    eff     = machine_data.get("efficiency",       100)
    level   = machine_data.get("liquid_level",      50)
    fouling = machine_data.get("fouling_factor",    0)
    mtype   = machine_data.get("machine_type",      "")

    if fouling > 0.0003 or (temp > 260 and eff < 80):
        return "Heat Exchanger Fouling"
    if bearing < 55 and vib > 22:
        return "Pump Cavitation"
    if vib > 35 and press > 16:
        return "Compressor Surge"
    if press > 1.2 and level > 78 and "Separator" in mtype:
        return "Separator Overflow"
    if temp > 420:
        return "Column Flooding"
    if eff < 65 and temp > 40 and "Cooling" in mtype:
        return "Cooling Tower Failure"
    if level < 20 or (press < 0.5 and "Tank" in mtype):
        return "Structural Leak"
    if vib > 28:
        return "Pump Cavitation"
    if temp > 400:
        return "Column Flooding"
    return "General Anomaly"


# ─────────────────────────────────────────────────────────────────────
#  Rule-based diagnosis (fallback)
# ─────────────────────────────────────────────────────────────────────
ACTION_MAP = {
    "Column Flooding":       "Reduce feed rate immediately. Check reflux ratio and tray integrity. Increase overhead take-off.",
    "Heat Exchanger Fouling":"Schedule CIP (Clean-In-Place) procedure. Check anti-fouling chemicals. Inspect tube bundle.",
    "Pump Cavitation":       "Check NPSH margin. Increase suction pressure or reduce flow demand. Inspect impeller for erosion.",
    "Compressor Surge":      "Open recycle valve immediately. Reduce discharge pressure. Check anti-surge controller set-point.",
    "Cooling Tower Failure": "Inspect fan blades and drive shaft. Check water distribution nozzles. Test water chemistry.",
    "Separator Overflow":    "Open drain valve. Check level controller and control valve. Reduce feed temporarily.",
    "Structural Leak":       "Isolate affected section. Deploy leak detection team. Prepare repair crew and spare parts.",
    "General Anomaly":       "Assign technician for on-site inspection. Trend all sensors for 15 minutes before action.",
}

def rule_based_diagnosis(machine_data: dict, anomaly: dict) -> Dict[str, Any]:
    fault    = _classify_fault(machine_data)
    severity = anomaly["severity"]
    return {
        "machine_id":         machine_data.get("machine_id"),
        "machine_type":       machine_data.get("machine_type"),
        "fault_cause":        fault,
        "severity":           severity,
        "downtime_estimate":  _realistic_downtime(fault, severity),
        "recommended_action": ACTION_MAP.get(fault, ACTION_MAP["General Anomaly"]),
        "confidence":         0.78,
        "details":            f"Rule-based analysis: {'; '.join(anomaly['anomalies'])}",
        "timestamp":          time.time(),
    }


# ─────────────────────────────────────────────────────────────────────
#  LLM diagnosis (primary path)
# ─────────────────────────────────────────────────────────────────────
async def llm_diagnosis(machine_data: dict) -> Optional[Dict[str, Any]]:
    global _last_api_call
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        return None
    now = time.time()
    if now - _last_api_call < MIN_API_INTERVAL:
        return None
    _last_api_call = now

    prompt = build_diagnosis_prompt(machine_data)
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                GROQ_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user",   "content": prompt},
                    ],
                    "temperature": 0.25,
                    "max_tokens":  600,
                    "response_format": {"type": "json_object"},
                },
            )
        if resp.status_code == 200:
            content   = resp.json()["choices"][0]["message"]["content"]
            diagnosis = json.loads(content)
            diagnosis["machine_id"]    = machine_data.get("machine_id")
            diagnosis["machine_type"]  = machine_data.get("machine_type")
            diagnosis["timestamp"]     = time.time()
            # Enrich downtime with realistic value if LLM gave a vague one
            fault    = diagnosis.get("fault_cause", "General Anomaly")
            severity = diagnosis.get("severity", "HIGH")
            if "hour" not in str(diagnosis.get("downtime_estimate", "")):
                diagnosis["downtime_estimate"] = _realistic_downtime(fault, severity)
            diagnosis.setdefault("confidence", 0.93)
            return diagnosis
        else:
            print(f"[AI] Groq error {resp.status_code}")
    except Exception as e:
        print(f"[AI] LLM error: {e}")
    return None


async def diagnose(machine_data: dict, anomaly: dict) -> Dict[str, Any]:
    result = await llm_diagnosis(machine_data)
    if result:
        print(f"[AI] LLM → {machine_data.get('machine_id')}: {result.get('fault_cause')}")
        return result
    result = rule_based_diagnosis(machine_data, anomaly)
    print(f"[AI] Rule → {machine_data.get('machine_id')}: {result.get('fault_cause')}")
    return result
