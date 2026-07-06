/**
 * Indus AI — Constants & Configuration (Refinery Edition)
 */

// Maps machine_id → display name
export const MACHINE_NAMES = {
  'distillation-column-1': 'Distillation Column C-101',
  'heat-exchanger-hx1':    'Heat Exchanger HX-201',
  'pump-station-p1':       'Pump Station P-301',
  'cooling-tower-ct1':     'Cooling Tower CT-401',
  'separator-unit-s1':     'Separator Unit V-501',
  'compressor-c1':         'Compressor K-601',
  'storage-tank-t1':       'Storage Tank TK-701',
};

// Maps machine_id → subsystem type
export const MACHINE_TYPES = {
  'distillation-column-1': 'Distillation Column',
  'heat-exchanger-hx1':    'Heat Exchanger',
  'pump-station-p1':       'Pump Station',
  'cooling-tower-ct1':     'Cooling Tower',
  'separator-unit-s1':     'Separator Unit',
  'compressor-c1':         'Compressor',
  'storage-tank-t1':       'Storage Tank',
};

export const STATUS_COLORS = {
  healthy:  '#16a34a',
  warning:  '#d97706',
  critical: '#dc2626',
};

export const STATUS_BG = {
  healthy:  'rgba(0, 255, 136, 0.08)',
  warning:  'rgba(255, 170, 0, 0.08)',
  critical: 'rgba(255, 42, 42, 0.10)',
};

export const STATUS_BORDER = {
  healthy:  'rgba(0, 255, 136, 0.25)',
  warning:  'rgba(255, 170, 0, 0.30)',
  critical: 'rgba(255, 42, 42, 0.30)',
};

export const PRIORITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH:     '#d97706',
  MEDIUM:   '#2563eb',
  LOW:      '#16a34a',
};

export const CHART_COLORS = {
  temperature:       '#ef4444',
  pressure:          '#8b5cf6',
  rpm:               '#0ea5e9',
  vibration:         '#f59e0b',
  power_consumption: '#06b6d4',
  efficiency:        '#10b981',
  flow_rate:         '#3b82f6',
  bearing_health:    '#ec4899',
  liquid_level:      '#14b8a6',
  fouling_factor:    '#a855f7',
  ph_level:          '#84cc16',
  reflux_ratio:      '#f97316',
};

export const SENSOR_UNITS = {
  temperature:       '°C',
  pressure:          'bar',
  rpm:               'RPM',
  vibration:         'mm/s',
  power_consumption: 'kW',
  efficiency:        '%',
  flow_rate:         'm³/h',
  bearing_health:    '%',
  liquid_level:      '%',
  fouling_factor:    'm²K/W',
  ph_level:          'pH',
  reflux_ratio:      '',
};

export const SENSOR_LABELS = {
  temperature:       'Temperature',
  pressure:          'Pressure',
  rpm:               'Speed',
  vibration:         'Vibration',
  power_consumption: 'Power Draw',
  efficiency:        'Efficiency',
  flow_rate:         'Flow Rate',
  bearing_health:    'Bearing Health',
  liquid_level:      'Liquid Level',
  fouling_factor:    'Fouling Factor',
  ph_level:          'pH Level',
  reflux_ratio:      'Reflux Ratio',
};

// Icon emoji per subsystem type (for the stats panel)
export const SUBSYSTEM_ICONS = {
  'Distillation Column': '🏭',
  'Heat Exchanger':      '♨️',
  'Pump Station':        '⚙️',
  'Cooling Tower':       '❄️',
  'Separator Unit':      '🔵',
  'Compressor':          '💨',
  'Storage Tank':        '🛢️',
};

// Legacy 3D positions (unused with Sketchfab embed, kept for reference)
export const MACHINE_POSITIONS = {
  'distillation-column-1': [-8, 0, -4],
  'heat-exchanger-hx1':    [-3, 0, 0],
  'pump-station-p1':       [2, 0, -4],
  'cooling-tower-ct1':     [7, 0, -2],
  'separator-unit-s1':     [-6, 0, 4],
  'compressor-c1':         [0, 0, 5],
  'storage-tank-t1':       [6, 0, 5],
};
