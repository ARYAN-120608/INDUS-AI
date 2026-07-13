import { MACHINE_TYPES } from './constants';

const MACHINE_PROFILES = {
  "Distillation Column": {
    id: "distillation-column-1",
    normal: { temperature: [320, 370], pressure: [1.5, 2.2], flow_rate: [80, 120], efficiency: [88, 97], reflux_ratio: [2.8, 3.5], vibration: [5, 18], power_consumption: [850, 1100] },
  },
  "Heat Exchanger": {
    id: "heat-exchanger-hx1",
    normal: { temperature: [180, 240], pressure: [3.0, 5.5], flow_rate: [60, 95], efficiency: [85, 96], fouling_factor: [0, 0.0002], vibration: [3, 12], power_consumption: [200, 380] },
  },
  "Pump Station": {
    id: "pump-station-p1",
    normal: { temperature: [45, 75], pressure: [8, 14], flow_rate: [100, 160], rpm: [2800, 3200], vibration: [2, 10], bearing_health: [85, 100], power_consumption: [300, 480] },
  },
  "Cooling Tower": {
    id: "cooling-tower-ct1",
    normal: { temperature: [28, 42], pressure: [1.0, 2.0], flow_rate: [200, 320], efficiency: [88, 97], vibration: [4, 14], ph_level: [7.0, 8.5], power_consumption: [180, 290] },
  },
  "Separator Unit": {
    id: "separator-unit-s1",
    normal: { temperature: [60, 90], pressure: [4.0, 7.0], flow_rate: [70, 110], efficiency: [82, 95], liquid_level: [40, 65], vibration: [3, 11], power_consumption: [120, 200] },
  },
  "Compressor": {
    id: "compressor-c1",
    normal: { temperature: [90, 130], pressure: [12, 18], rpm: [3500, 4200], vibration: [4, 16], efficiency: [80, 93], bearing_health: [82, 100], power_consumption: [600, 900] },
  },
  "Storage Tank": {
    id: "storage-tank-t1",
    normal: { temperature: [25, 45], pressure: [0.1, 0.5], liquid_level: [30, 80], vibration: [0, 5], efficiency: [95, 100], flow_rate: [10, 50], power_consumption: [30, 80] },
  },
};

const FAULT_PROFILES = {
  "column_flooding": { effects: { pressure: [0.8, 1.5], temperature: [20, 45], efficiency: [-25, -40], flow_rate: [-30, -50], vibration: [10, 25] }, rate: 0.13, threshold: 0.45 },
  "heat_fouling": { effects: { temperature: [25, 55], efficiency: [-18, -32], pressure: [0.5, 1.2], fouling_factor: [0.0003, 0.0008], power_consumption: [60, 150] }, rate: 0.08, threshold: 0.50 },
  "pump_cavitation": { effects: { vibration: [15, 45], flow_rate: [-25, -50], pressure: [-2, -5], bearing_health: [-20, -40], temperature: [10, 25] }, rate: 0.16, threshold: 0.40 },
  "compressor_surge": { effects: { pressure: [3, 8], vibration: [20, 60], temperature: [30, 70], rpm: [-500, -1200], efficiency: [-22, -38] }, rate: 0.20, threshold: 0.35 },
  "cooling_tower_failure": { effects: { temperature: [15, 35], efficiency: [-20, -40], flow_rate: [-40, -70], vibration: [8, 22], ph_level: [-1.5, 2.0] }, rate: 0.11, threshold: 0.45 },
  "separator_overflow": { effects: { liquid_level: [25, 45], pressure: [1.5, 3.0], efficiency: [-30, -50], temperature: [10, 20], flow_rate: [-20, -40] }, rate: 0.17, threshold: 0.40 },
  "structural_leak": { effects: { pressure: [-0.2, -0.4], liquid_level: [-15, -35], vibration: [3, 12], efficiency: [-10, -25], flow_rate: [-15, -30] }, rate: 0.09, threshold: 0.55 },
};

class Machine {
  constructor(machine_type) {
    const profile = MACHINE_PROFILES[machine_type];
    this.machine_id = profile.id;
    this.machine_type = machine_type;
    this.normal_ranges = profile.normal;
    this.sensors = {};
    for (const [sensor, rng] of Object.entries(this.normal_ranges)) {
      this.sensors[sensor] = (rng[0] + rng[1]) / 2;
    }
    this.active_fault = null;
    this.fault_progress = 0;
    this.fault_target_deltas = {};
    this.status = 'healthy';
    this.fault_phase = null;
    this.has_alerted = false;
  }

  inject_fault(fault_type) {
    if (this.active_fault) return;
    const fault = FAULT_PROFILES[fault_type];
    this.active_fault = fault_type;
    this.fault_progress = 0;
    this.fault_phase = 'developing';
    this.has_alerted = false;
    this.fault_target_deltas = {};
    for (const [sensor, rng] of Object.entries(fault.effects)) {
      this.fault_target_deltas[sensor] = rng[0] + Math.random() * (rng[1] - rng[0]);
    }
  }

  clear_fault() {
    if (this.active_fault) {
      this.fault_phase = 'resolving';
    }
  }

  tick() {
    let newly_critical = false;
    if (this.active_fault) {
      const fault = FAULT_PROFILES[this.active_fault];
      if (this.fault_phase === 'developing') {
        this.fault_progress = Math.min(1.0, this.fault_progress + fault.rate);
        if (this.fault_progress < fault.threshold) {
          this.status = 'warning';
        } else {
          this.status = 'critical';
          this.fault_phase = 'active';
          if (!this.has_alerted) {
             newly_critical = true;
             this.has_alerted = true;
          }
        }
      } else if (this.fault_phase === 'active') {
        this.status = 'critical';
      } else if (this.fault_phase === 'resolving') {
        this.fault_progress = Math.max(0.0, this.fault_progress - fault.rate * 1.5);
        this.status = this.fault_progress > 0.1 ? 'warning' : 'healthy';
        if (this.fault_progress <= 0) {
          this.active_fault = null;
          this.fault_progress = 0;
          this.fault_target_deltas = {};
          this.status = 'healthy';
          this.fault_phase = null;
          this.has_alerted = false;
        }
      }
    } else {
      this.status = 'healthy';
    }

    const reading = {
      machine_id: this.machine_id,
      machine_type: this.machine_type,
      status: this.status,
      timestamp: Date.now() / 1000
    };
    
    const t = Date.now() / 1000;
    for (const [sensor, rng] of Object.entries(this.normal_ranges)) {
       const mid = (rng[0] + rng[1]) / 2;
       const span = rng[1] - rng[0];
       let base = mid + (Math.random() * 2 - 1) * span * 0.08;
       base += Math.sin(t * 0.05 + sensor.length) * span * 0.04;
       
       if (this.active_fault && this.fault_target_deltas[sensor]) {
         base += this.fault_target_deltas[sensor] * this.fault_progress;
       }
       
       reading[sensor] = Math.max(0, base);
    }
    return { reading, newly_critical };
  }
}

const machines = Object.keys(MACHINE_PROFILES).map(type => new Machine(type));

// ─── Detailed SOP Library — indexed by fault type ─────────────────────────────
const SOP_LIBRARY = {
  column_flooding: {
    procedure_name: 'Distillation Column Flooding Recovery',
    estimated_time: '3–4 hours',
    severity: 'CRITICAL',
    downtime_estimate: '4 hours',
    recommended_action: 'Reduce feed rate and reflux ratio; initiate column re-stabilization',
    steps: [
      { step_number: 1, action: 'Immediately reduce column feed rate by 30–40% to relieve hydraulic load', safety_note: 'Wear PPE — high-temperature hydrocarbons present' },
      { step_number: 2, action: 'Lower reflux ratio from operating value to minimum (≈2.0) to reduce vapor/liquid load', safety_note: null },
      { step_number: 3, action: 'Monitor differential pressure across trays — target reduction below 0.05 bar/tray', safety_note: null },
      { step_number: 4, action: 'Increase reboiler duty gradually (5% increments) to re-establish proper vapor flow', safety_note: 'Monitor temperature profile every 10 minutes' },
      { step_number: 5, action: 'Once pressure differential normalizes, slowly ramp feed rate back up (10% per 15 min)', safety_note: null },
      { step_number: 6, action: 'Verify tray temperatures and composition profiles return to design specifications', safety_note: null },
      { step_number: 7, action: 'If flooding persists after 2 hours, schedule shutdown for tray inspection and cleaning', safety_note: 'Notify shift supervisor before initiating shutdown' },
      { step_number: 8, action: 'Document event in maintenance log with timestamped sensor readings', safety_note: null },
    ],
  },

  heat_fouling: {
    procedure_name: 'Heat Exchanger Fouling Mitigation & Cleaning',
    estimated_time: '6–8 hours',
    severity: 'HIGH',
    downtime_estimate: '6 hours',
    recommended_action: 'Switch to standby exchanger; schedule chemical or mechanical cleaning',
    steps: [
      { step_number: 1, action: 'Switch process flow to standby heat exchanger HX-202 using bypass valves', safety_note: 'Confirm standby unit is pre-warmed before switching' },
      { step_number: 2, action: 'Isolate HX-201 by closing shell-side and tube-side inlet/outlet block valves', safety_note: null },
      { step_number: 3, action: 'Depressurize unit to 0 bar and allow to cool to ambient temperature (< 50°C)', safety_note: 'Do not open flanges until temperature is confirmed safe' },
      { step_number: 4, action: 'Drain residual process fluid and flush with clean condensate water', safety_note: 'Collect flush water for waste treatment — do not drain to sewer' },
      { step_number: 5, action: 'Perform CIP (Clean-In-Place) using 2% citric acid solution for 45 min if bio-fouling; hydroblast at 700 bar if mechanical fouling', safety_note: 'Full face shield and chemical suit required during CIP' },
      { step_number: 6, action: 'Inspect tube bundle for damage, erosion, or pitting; replace fouled tubes as required', safety_note: null },
      { step_number: 7, action: 'Reassemble, pressure test at 1.5× design pressure (hold 30 min, no leaks)', safety_note: null },
      { step_number: 8, action: 'Return HX-201 to service; verify fouling factor < 0.0002 m²K/W within 24 hours', safety_note: null },
    ],
  },

  pump_cavitation: {
    procedure_name: 'Pump Station Cavitation Prevention & Repair',
    estimated_time: '2–3 hours',
    severity: 'HIGH',
    downtime_estimate: '3 hours',
    recommended_action: 'Reduce pump speed and increase suction pressure; inspect impeller',
    steps: [
      { step_number: 1, action: 'Reduce pump speed by 15–20% via VFD to lower cavitation-inducing velocity', safety_note: null },
      { step_number: 2, action: 'Check and increase suction header pressure by partially closing downstream control valve', safety_note: null },
      { step_number: 3, action: 'Verify suction strainer is clear — differential pressure across strainer should be < 0.3 bar', safety_note: 'Shut down pump before opening strainer for inspection' },
      { step_number: 4, action: 'Inspect suction piping for any air ingestion points, loose flanges, or valve leakage', safety_note: null },
      { step_number: 5, action: 'If cavitation noise persists after 30 minutes, take pump offline and open impeller casing', safety_note: 'Lock-out/Tag-out pump before any mechanical access' },
      { step_number: 6, action: 'Inspect impeller for erosion pitting — replace if material loss exceeds 5% of blade area', safety_note: null },
      { step_number: 7, action: 'Check and record vibration signature; bearing replacement required if RMS velocity > 10 mm/s', safety_note: null },
      { step_number: 8, action: 'Restart pump and verify vibration < 4 mm/s and bearing temp < 80°C before returning to service', safety_note: null },
    ],
  },

  compressor_surge: {
    procedure_name: 'Compressor Anti-Surge Recovery Procedure',
    estimated_time: '1–2 hours',
    severity: 'CRITICAL',
    downtime_estimate: '2 hours',
    recommended_action: 'Open anti-surge valve; reduce speed and reload at stable operating point',
    steps: [
      { step_number: 1, action: 'Immediately open anti-surge recycle valve 100% to unload the compressor', safety_note: 'Surge can cause catastrophic blade damage — act within 60 seconds' },
      { step_number: 2, action: 'Reduce compressor speed to minimum governor setpoint via turbine speed control', safety_note: null },
      { step_number: 3, action: 'Check suction and discharge pressures — confirm surge line has been crossed', safety_note: null },
      { step_number: 4, action: 'Inspect process for any downstream blockage causing high discharge pressure buildup', safety_note: null },
      { step_number: 5, action: 'Allow compressor to stabilize at minimum speed for 10 minutes', safety_note: null },
      { step_number: 6, action: 'Gradually close anti-surge valve (5% per minute) while monitoring flow vs. pressure curve', safety_note: 'Re-open immediately if surge noise (banging/reversing flow) recurs' },
      { step_number: 7, action: 'Perform vibration analysis — if blade damage suspected, shut down for boroscope inspection', safety_note: 'Vibration > 25 mm/s requires mandatory shutdown' },
      { step_number: 8, action: 'Recalibrate anti-surge controller setpoints with process engineer before resuming full load', safety_note: null },
    ],
  },

  cooling_tower_failure: {
    procedure_name: 'Cooling Tower Performance Recovery',
    estimated_time: '2–4 hours',
    severity: 'HIGH',
    downtime_estimate: '3 hours',
    recommended_action: 'Inspect fan motors, fill packing, and water distribution system',
    steps: [
      { step_number: 1, action: 'Check cooling water supply and return temperatures — design approach should be ≤ 5°C', safety_note: null },
      { step_number: 2, action: 'Inspect all fan cells — verify fan blades, motor amps, and pitch angle on each cell', safety_note: 'Follow lockout procedure before entering any fan cell' },
      { step_number: 3, action: 'Check water distribution nozzles for blockage — flush each spray nozzle with clean water', safety_note: null },
      { step_number: 4, action: 'Inspect PVC fill packing for scaling, biological growth, or physical damage', safety_note: null },
      { step_number: 5, action: 'Test cooling water chemistry: pH 7.0–8.5, conductivity < 3000 μS/cm, Legionella inhibitor at spec', safety_note: 'Legionella risk — no misting operations without biocide treatment confirmed' },
      { step_number: 6, action: 'Shock-dose biocide if biological fouling is present (chlorine 5 ppm for 2 hours)', safety_note: 'Keep personnel clear during chlorination — toxic fumes possible' },
      { step_number: 7, action: 'Replace damaged fan belts or motor bearings; re-pitch blades to design angle', safety_note: null },
      { step_number: 8, action: 'Return to full flow and verify outlet temperature meets design spec within 30 minutes', safety_note: null },
    ],
  },

  separator_overflow: {
    procedure_name: 'Separator Unit Overflow Recovery',
    estimated_time: '2–3 hours',
    severity: 'HIGH',
    downtime_estimate: '2.5 hours',
    recommended_action: 'Increase liquid draw-off rate; check level controller and outlet valve operation',
    steps: [
      { step_number: 1, action: 'Manually open liquid outlet valve to 80% to rapidly reduce vessel liquid level', safety_note: 'Do not exceed max liquid draw-off rate — risk of hydrocarbon carryover to gas outlet' },
      { step_number: 2, action: 'Verify level transmitter reading is accurate — compare with sight glass if available', safety_note: null },
      { step_number: 3, action: 'Check level controller setpoint — recalibrate if output is stuck or oscillating', safety_note: null },
      { step_number: 4, action: 'Inspect liquid outlet control valve for sticking, incorrect signal, or failure-mode issue', safety_note: null },
      { step_number: 5, action: 'Reduce feed inlet flow by 20% until level is back within normal operating range (40–65%)', safety_note: null },
      { step_number: 6, action: 'Verify gas-liquid interface is clean — excessive emulsification may require demulsifier dosing', safety_note: null },
      { step_number: 7, action: 'Return level controller to auto and validate stable response before re-ramping feed', safety_note: null },
      { step_number: 8, action: 'Inspect separator internals (mist pad, vane pack) at next planned shutdown if issue recurring', safety_note: null },
    ],
  },

  structural_leak: {
    procedure_name: 'Structural Integrity Leak Response & Repair',
    estimated_time: '4–8 hours',
    severity: 'CRITICAL',
    downtime_estimate: '6 hours',
    recommended_action: 'Isolate affected section immediately; deploy emergency containment and repair team',
    steps: [
      { step_number: 1, action: 'Trigger emergency isolation — close all upstream and downstream block valves on the affected line/vessel', safety_note: 'EVACUATE immediate area — flammable or toxic material release possible' },
      { step_number: 2, action: 'Activate emergency containment berm; deploy absorbent booms if liquid release', safety_note: 'Ensure wind direction is checked — position response team upwind' },
      { step_number: 3, action: 'Depressurize affected section to 0 bar via blowdown valve', safety_note: 'Blowdown to flare stack — confirm flare pilot is lit' },
      { step_number: 4, action: 'Drain and purge section with nitrogen to < 1% LEL before any mechanical work', safety_note: 'Continuous gas monitoring required throughout repair' },
      { step_number: 5, action: 'Inspect and locate exact leak source — use dye penetrant or ultrasonic testing for crack detection', safety_note: null },
      { step_number: 6, action: 'For pinhole leaks: apply temporary clamp repair. For cracks > 50mm: full section replacement required', safety_note: 'All welding requires hot-work permit and fire watch' },
      { step_number: 7, action: 'Pressure test repaired section to 1.5× MAWP; hydro-test hold for 1 hour', safety_note: null },
      { step_number: 8, action: 'Complete incident report, root-cause analysis, and notify regulatory authority if required', safety_note: 'Spills > 50 litres must be reported to environmental authority within 2 hours' },
    ],
  },
};

const generateMockAlert = (machine, fault_type) => {
   const ticket_id = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
   const displayFault = fault_type.replace(/_/g, ' ');
   const sop = SOP_LIBRARY[fault_type] || {
     procedure_name: `SOP for ${displayFault}`,
     estimated_time: '2 hours',
     severity: 'HIGH',
     downtime_estimate: '2 hours',
     recommended_action: 'Inspect subsystem and perform maintenance.',
     steps: [
       { step_number: 1, action: 'Isolate the affected subsystem', safety_note: 'Follow LOTO procedure' },
       { step_number: 2, action: 'Inspect all components for visible damage', safety_note: null },
       { step_number: 3, action: 'Replace worn or damaged parts', safety_note: null },
       { step_number: 4, action: 'Restart system and monitor for 30 minutes', safety_note: null },
     ],
   };

   return {
     type: 'anomaly_alert',
     severity: sop.severity || 'HIGH',
     machine_id: machine.machine_id,
     machine_type: machine.machine_type,
     message: `${displayFault.charAt(0).toUpperCase() + displayFault.slice(1)} detected on ${machine.machine_type} (${machine.machine_id})`,
     timestamp: Date.now() / 1000,
     diagnosis: {
       fault_cause: displayFault.charAt(0).toUpperCase() + displayFault.slice(1),
       confidence: 0.95,
       severity: sop.severity || 'HIGH',
       downtime_estimate: sop.downtime_estimate,
       recommended_action: sop.recommended_action,
     },
     ticket: {
       ticket_id,
       machine_id: machine.machine_id,
       title: `Auto-Ticket: ${displayFault.charAt(0).toUpperCase() + displayFault.slice(1)} — ${machine.machine_type}`,
       status: 'OPEN',
       priority: sop.severity || 'HIGH',
       created_at: new Date().toISOString()
     },
     sop: {
       procedure_name: sop.procedure_name,
       estimated_time: sop.estimated_time,
       steps: sop.steps,
     }
   };
};

export const mockTick = () => {
  const readings = [];
  const new_alerts = [];
  
  // Randomly inject faults to simulate critical errors over time
  if (Math.random() < 0.05) { // 5% chance per tick
    const healthyMachines = machines.filter(m => !m.active_fault);
    if (healthyMachines.length > 0) {
       const target = healthyMachines[Math.floor(Math.random() * healthyMachines.length)];
       const faultTypes = Object.keys(FAULT_PROFILES);
       const randomFault = faultTypes[Math.floor(Math.random() * faultTypes.length)];
       target.inject_fault(randomFault);
    }
  }

  // Randomly clear faults so they don't persist forever
  if (Math.random() < 0.02) { // 2% chance per tick
    const brokenMachines = machines.filter(m => m.active_fault);
    if (brokenMachines.length > 0) {
       const target = brokenMachines[Math.floor(Math.random() * brokenMachines.length)];
       target.clear_fault();
    }
  }

  for (const m of machines) {
    const { reading, newly_critical } = m.tick();
    readings.push(reading);
    if (newly_critical) {
      new_alerts.push(generateMockAlert(m, m.active_fault));
    }
  }
  
  return {
    type: 'sensor_update',
    timestamp: Date.now() / 1000,
    machines: readings,
    new_alerts
  };
};

export const mockInjectFault = (machine_id, fault_type) => {
  const m = machines.find(mac => mac.machine_id === machine_id);
  if (m) {
    m.inject_fault(fault_type);
  }
};

export const mockClearFault = (machine_id) => {
  const m = machines.find(mac => mac.machine_id === machine_id);
  if (m) {
    m.clear_fault();
  }
};
