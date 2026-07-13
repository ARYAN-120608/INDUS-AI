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

const generateMockAlert = (machine, fault_type) => {
   const ticket_id = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
   const displayFault = fault_type.replace('_', ' ');
   return {
     type: 'anomaly_alert',
     severity: 'HIGH',
     machine_id: machine.machine_id,
     machine_type: machine.machine_type,
     message: `${displayFault} detected on ${machine.machine_type} (${machine.machine_id})`,
     timestamp: Date.now() / 1000,
     diagnosis: {
       fault_cause: displayFault,
       confidence: 0.95,
       severity: 'HIGH',
       recommendation: 'Inspect subsystem and perform maintenance.'
     },
     ticket: {
       ticket_id,
       machine_id: machine.machine_id,
       title: `Auto-Ticket: ${displayFault}`,
       status: 'OPEN',
       priority: 'HIGH',
       created_at: new Date().toISOString()
     },
     sop: {
       procedure_name: `SOP for ${displayFault}`,
       estimated_time: '2 hours',
       steps: ['Isolate subsystem', 'Inspect for damage', 'Replace worn parts', 'Restart and monitor']
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
