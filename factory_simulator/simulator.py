"""
Indus AI — Refinery Simulator
Async WebSocket server producing real-time refinery telemetry.
Fault timing uses Weibull-distributed MTBF and lognormal repair times for realism.
"""

import asyncio
import json
import math
import random
import time
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from factory_simulator.machines import create_all_machines, FAULT_PROFILES

# ─────────────────────────────────────────────────────────────────────
#  Configuration
# ─────────────────────────────────────────────────────────────────────
WS_HOST = "0.0.0.0"
WS_PORT = 8765
TICK_INTERVAL = 1.0          # seconds between sensor updates


def weibull_sample(scale: float, shape: float = 1.8) -> float:
    """
    Draw a random sample from a Weibull distribution.
    shape ≈ 1.8  → increasing failure rate (wear-out dominated).
    Returns time in seconds.
    """
    u = random.random()
    return scale * (-math.log(1.0 - u + 1e-9)) ** (1.0 / shape)


def lognormal_repair_hours(mean_h: float, sigma: float = 0.35) -> float:
    """
    Lognormal repair duration (hours).  Realistic: most repairs fast,
    occasional long ones due to part availability / complexity.
    """
    mu = math.log(mean_h) - 0.5 * sigma ** 2
    return math.exp(random.gauss(mu, sigma))


# Per-subsystem Weibull scale parameters (seconds between natural faults).
# Higher value → less frequent spontaneous failures.
SUBSYSTEM_MTBF_SCALE = {
    "Distillation Column": 420,   # ~7 min average between faults
    "Heat Exchanger":      360,
    "Pump Station":        300,
    "Cooling Tower":       390,
    "Separator Unit":      330,
    "Compressor":          270,   # most likely to fail
    "Storage Tank":        500,   # least likely
}

# Which fault types can naturally occur per subsystem
SUBSYSTEM_FAULT_MAP = {
    "Distillation Column": ["column_flooding", "heat_fouling", "structural_leak"],
    "Heat Exchanger":      ["heat_fouling", "structural_leak", "cooling_tower_failure"],
    "Pump Station":        ["pump_cavitation", "structural_leak"],
    "Cooling Tower":       ["cooling_tower_failure", "structural_leak"],
    "Separator Unit":      ["separator_overflow", "structural_leak", "pump_cavitation"],
    "Compressor":          ["compressor_surge", "pump_cavitation"],
    "Storage Tank":        ["structural_leak", "separator_overflow"],
}


class FactorySimulator:
    """Simulates the Sketchfab refinery with 7 monitored subsystems."""

    def __init__(self):
        self.machines           = create_all_machines()
        self.connected_clients  = set()
        self.running            = False

        # Per-machine: when is the NEXT spontaneous fault due?
        self._next_fault_time: dict[str, float] = {}
        self._fault_clear_time: dict[str, float] = {}   # when auto-clear happens
        self._schedule_all_next_faults()

    def _schedule_all_next_faults(self):
        now = time.time()
        for m in self.machines:
            scale = SUBSYSTEM_MTBF_SCALE.get(m.machine_type, 360)
            self._next_fault_time[m.machine_id] = now + weibull_sample(scale)

    def _schedule_next_fault(self, machine):
        scale = SUBSYSTEM_MTBF_SCALE.get(machine.machine_type, 360)
        self._next_fault_time[machine.machine_id] = time.time() + weibull_sample(scale)

    # ── Client management ────────────────────────────────────────────
    async def register(self, websocket):
        self.connected_clients.add(websocket)
        print(f"[SIM] Client connected ({len(self.connected_clients)} total)")

    async def unregister(self, websocket):
        self.connected_clients.discard(websocket)
        print(f"[SIM] Client disconnected ({len(self.connected_clients)} total)")

    async def broadcast(self, message: str):
        if not self.connected_clients:
            return
        dead = set()
        for client in self.connected_clients:
            try:
                await client.send(message)
            except Exception:
                dead.add(client)
        for c in dead:
            await self.unregister(c)

    # ── Fault scheduling ─────────────────────────────────────────────
    def _tick_faults(self):
        now = time.time()

        for m in self.machines:
            mid = m.machine_id

            # Auto-inject if scheduled time has passed and machine is healthy
            if m.active_fault is None and now >= self._next_fault_time.get(mid, 0):
                candidates = SUBSYSTEM_FAULT_MAP.get(m.machine_type, list(FAULT_PROFILES.keys()))
                fault_type = random.choice(candidates)
                fault_def  = FAULT_PROFILES[fault_type]

                # Repair duration = lognormal from MTTR range
                lo_h, hi_h = fault_def["mttr_hours"]
                mean_h = (lo_h + hi_h) / 2
                repair_seconds = lognormal_repair_hours(mean_h) * 3600
                # Cap to 90 s in simulator time for demo responsiveness
                sim_cap = random.uniform(25, 75)
                self._fault_clear_time[mid] = now + sim_cap

                m.inject_fault(fault_type)
                print(
                    f"[SIM] !! FAULT >> {m.machine_type} ({mid}): "
                    f"{fault_def['description']}  "
                    f"[real MTTR~{mean_h:.1f}h, sim clear in {sim_cap:.0f}s]"
                )

            # Auto-clear if active fault has run its course
            elif m.active_fault is not None and now >= self._fault_clear_time.get(mid, float("inf")):
                print(f"[SIM] OK RESOLVING >> {m.machine_type} ({mid})")
                m.clear_fault()          # enters 'resolving' phase
                self._schedule_next_fault(m)   # schedule next fault

    # ── Simulation loop ──────────────────────────────────────────────
    async def simulation_loop(self):
        print("[SIM] Refinery simulation started")
        for m in self.machines:
            print(f"  > {m.machine_id}: {m.machine_type}")
        self.running = True

        while self.running:
            self._tick_faults()

            readings = [m.tick() for m in self.machines]
            payload  = json.dumps({
                "type":      "sensor_batch",
                "timestamp": time.time(),
                "machines":  readings,
            })
            await self.broadcast(payload)
            await asyncio.sleep(TICK_INTERVAL)

    # ── WebSocket handler ────────────────────────────────────────────
    async def handler(self, websocket):
        await self.register(websocket)
        try:
            async for message in websocket:
                try:
                    cmd = json.loads(message)
                    if cmd.get("action") == "inject_fault":
                        for m in self.machines:
                            if m.machine_id == cmd.get("machine_id"):
                                m.inject_fault(cmd.get("fault_type", "compressor_surge"))
                                repair_s = random.uniform(30, 70)
                                self._fault_clear_time[m.machine_id] = time.time() + repair_s
                                break
                    elif cmd.get("action") == "clear_fault":
                        for m in self.machines:
                            if m.machine_id == cmd.get("machine_id"):
                                m.clear_fault()
                                self._schedule_next_fault(m)
                                break
                except json.JSONDecodeError:
                    pass
        except Exception:
            pass
        finally:
            await self.unregister(websocket)


async def main():
    try:
        import websockets
    except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets"])
        import websockets

    simulator = FactorySimulator()
    task = asyncio.create_task(simulator.simulation_loop())

    print(f"[SIM] WebSocket server on ws://{WS_HOST}:{WS_PORT}")
    async with websockets.serve(simulator.handler, WS_HOST, WS_PORT):
        await task


if __name__ == "__main__":
    asyncio.run(main())
