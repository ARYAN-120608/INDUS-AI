/**
 * FactoryScene3D — Professional Refinery 3D Model
 *
 * Features:
 *  • High-fidelity PBR materials (stainless steel, insulation, concrete, rust)
 *  • Detailed geometry for all 7 refinery machines
 *  • Closed pipeline network with elbow fittings and valves connecting all machines
 *  • Animated flow particles along pipes
 *  • Hover tooltips (HTML overlay) showing live sensor stats
 *  • Status-driven animations: critical = red blink, warning = amber pulse
 *  • Multi-source studio lighting + environment map
 */

import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls, Environment, Grid, Float, Text, Html, Sparkles, ContactShadows,
} from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../../stores/useStore';
import {
  MACHINE_NAMES, SENSOR_LABELS, SENSOR_UNITS,
  SUBSYSTEM_ICONS, CHART_COLORS,
} from '../../utils/constants';

// ─────────────────────────────────────────────────────────────────────────────
// PALETTE & STATUS HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const MAT = {
  steel:      { color: '#B8C4CC', roughness: 0.18, metalness: 0.92 },
  stainless:  { color: '#D0D8DC', roughness: 0.12, metalness: 0.95 },
  darkSteel:  { color: '#78909C', roughness: 0.25, metalness: 0.88 },
  pipe:       { color: '#A0B0B8', roughness: 0.20, metalness: 0.90 },
  insulation: { color: '#E8D5A0', roughness: 0.80, metalness: 0.00 },
  concrete:   { color: '#BDBDBD', roughness: 0.92, metalness: 0.00 },
  grating:    { color: '#90A4AE', roughness: 0.55, metalness: 0.70 },
  paint:      { color: '#CFD8DC', roughness: 0.35, metalness: 0.30 },
  valve:      { color: '#546E7A', roughness: 0.30, metalness: 0.85 },
  rubber:     { color: '#37474F', roughness: 0.90, metalness: 0.00 },
};

const STATUS_EMISSIVE = {
  critical: new THREE.Color('#ff1111'),
  warning:  new THREE.Color('#ff8800'),
  healthy:  new THREE.Color('#00dd55'),
};
const STATUS_GLOW = { critical: '#ff2222', warning: '#ffaa00', healthy: '#22dd77' };

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE MATERIAL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function Mat({ type = 'steel', color, roughness, metalness, transparent, opacity }) {
  const m = MAT[type] || MAT.steel;
  return (
    <meshStandardMaterial
      color={color || m.color}
      roughness={roughness ?? m.roughness}
      metalness={metalness ?? m.metalness}
      transparent={transparent}
      opacity={opacity ?? 1}
      envMapIntensity={1.4}
    />
  );
}

// Emissive material that pulses with status
function StatusMat({ status, type = 'steel', color }) {
  const ref = useRef();
  const t   = useRef(Math.random() * Math.PI * 2);
  const m   = MAT[type] || MAT.steel;
  useFrame((_, dt) => {
    if (!ref.current) return;
    t.current += dt;
    const em = STATUS_EMISSIVE[status] || STATUS_EMISSIVE.healthy;
    let s = 0;
    if (status === 'critical') s = Math.abs(Math.sin(t.current * Math.PI / 0.38)) * 0.9;
    else if (status === 'warning') s = 0.08 + Math.abs(Math.sin(t.current / 1.4)) * 0.38;
    else s = 0.015 + Math.sin(t.current * 0.4) * 0.008;
    ref.current.emissiveIntensity = s;
    ref.current.emissive.copy(em);
  });
  return (
    <meshStandardMaterial
      ref={ref}
      color={color || m.color}
      roughness={m.roughness}
      metalness={m.metalness}
      emissive={STATUS_EMISSIVE[status] || STATUS_EMISSIVE.healthy}
      emissiveIntensity={0}
      envMapIntensity={1.4}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED POINT LIGHT (status-driven blinking)
// ─────────────────────────────────────────────────────────────────────────────
function StatusLight({ status, position }) {
  const ref = useRef();
  const t   = useRef(Math.random() * Math.PI * 2);
  useFrame((_, dt) => {
    if (!ref.current) return;
    t.current += dt;
    if (status === 'critical')
      ref.current.intensity = Math.abs(Math.sin(t.current * Math.PI / 0.38)) * 6 + 0.3;
    else if (status === 'warning')
      ref.current.intensity = 1.2 + Math.sin(t.current / 1.4) * 1.4;
    else
      ref.current.intensity = 0.4 + Math.sin(t.current * 0.5) * 0.15;
  });
  return (
    <pointLight
      ref={ref}
      position={position}
      color={STATUS_GLOW[status] || STATUS_GLOW.healthy}
      intensity={1}
      distance={7}
      decay={2}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ALARM BEACON (blinking orb above critical/warning machines)
// ─────────────────────────────────────────────────────────────────────────────
function AlarmBeacon({ status, position }) {
  const ref = useRef();
  const t   = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current) return;
    t.current += dt;
    if (status === 'critical') {
      ref.current.scale.setScalar(0.6 + Math.abs(Math.sin(t.current * Math.PI / 0.38)) * 0.7);
      ref.current.material.opacity = 0.3 + Math.abs(Math.sin(t.current * Math.PI / 0.38)) * 0.7;
    } else {
      ref.current.scale.setScalar(0.7 + Math.sin(t.current / 1.4) * 0.35);
      ref.current.material.opacity = 0.25 + Math.abs(Math.sin(t.current / 1.4)) * 0.55;
    }
  });
  if (status === 'healthy') return null;
  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.18, 12, 12]} />
      <meshStandardMaterial
        color={status === 'critical' ? '#ff1111' : '#ff9900'}
        emissive={status === 'critical' ? '#ff0000' : '#ff8800'}
        emissiveIntensity={3}
        transparent opacity={0.8}
      />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HOVER TOOLTIP (HTML overlay with live sensor data)
// ─────────────────────────────────────────────────────────────────────────────
const SKIP = new Set(['machine_id', 'machine_type', 'status', 'timestamp', 'time']);

function HoverTooltip({ machineId, machineData, tooltipY }) {
  if (!machineData) return null;
  const name   = MACHINE_NAMES[machineId] || machineData.machine_type || machineId;
  const status = machineData.status || 'healthy';
  const icon   = SUBSYSTEM_ICONS[machineData.machine_type] || '⚙️';

  const statusColor = status === 'critical' ? '#ef4444'
                    : status === 'warning'  ? '#f59e0b'
                    : '#22c55e';

  const sensors = Object.entries(machineData)
    .filter(([k, v]) => !SKIP.has(k) && typeof v === 'number')
    .slice(0, 8);

  return (
    <Html
      position={[0, tooltipY, 0]}
      center
      distanceFactor={14}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div style={{
        background: 'rgba(15, 23, 42, 0.97)',
        border: `1.5px solid ${statusColor}50`,
        borderRadius: 12,
        padding: '10px 13px',
        minWidth: 195,
        maxWidth: 230,
        boxShadow: `0 8px 32px rgba(0,0,0,0.55), 0 0 16px ${statusColor}25`,
        backdropFilter: 'blur(12px)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        userSelect: 'none',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8, paddingBottom: 7, borderBottom: `1px solid ${statusColor}30` }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.2 }}>{name}</div>
            <div style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: '#64748b' }}>{machineId}</div>
          </div>
          <span style={{
            marginLeft: 'auto', padding: '2px 7px', borderRadius: 20,
            background: `${statusColor}22`, border: `1px solid ${statusColor}55`,
            color: statusColor, fontSize: 8, fontWeight: 800, letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
            animation: status === 'critical' ? 'none' : undefined,
          }}>
            {status.toUpperCase()}
          </span>
        </div>
        {/* Sensor rows */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px' }}>
          {sensors.map(([key, val]) => {
            const color = CHART_COLORS[key] || '#94a3b8';
            const label = SENSOR_LABELS[key] || key.replace(/_/g, ' ');
            const unit  = SENSOR_UNITS[key]  || '';
            const display = key === 'fouling_factor'
              ? val.toExponential(1)
              : val.toFixed(Math.abs(val) >= 100 ? 0 : 1);
            return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8.5, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color }}>
                  {display}
                  <span style={{ fontSize: 8.5, color: '#475569', marginLeft: 2 }}>{unit}</span>
                </span>
              </div>
            );
          })}
        </div>
        {/* Bottom hint */}
        <div style={{ marginTop: 7, paddingTop: 5, borderTop: '1px solid #1e293b', fontSize: 8.5, color: '#334155', textAlign: 'center' }}>
          Click machine card → full telemetry
        </div>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE COMPONENTS — closed network with elbows & valves
// ─────────────────────────────────────────────────────────────────────────────

/** Single pipe cylinder between two points */
function PipeSeg({ from, to, r = 0.055 }) {
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const end   = useMemo(() => new THREE.Vector3(...to),   [to]);
  const dir   = useMemo(() => end.clone().sub(start),      [start, end]);
  const len   = dir.length();
  const mid   = start.clone().add(end).multiplyScalar(0.5);
  const up    = new THREE.Vector3(0, 1, 0);
  const quat  = useMemo(() => new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()), [dir]);
  if (len < 0.01) return null;
  return (
    <mesh position={[mid.x, mid.y, mid.z]} quaternion={quat}>
      <cylinderGeometry args={[r, r, len, 10]} />
      <Mat type="pipe" />
    </mesh>
  );
}

/** Flange ring at waypoints */
function Flange({ pos, r = 0.085 }) {
  return (
    <mesh position={pos}>
      <cylinderGeometry args={[r, r, 0.06, 12]} />
      <Mat type="darkSteel" />
    </mesh>
  );
}

/** Inline gate valve */
function Valve({ pos, axis = 'y', r = 0.055 }) {
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : [0, 0, 0];
  return (
    <group position={pos} rotation={rot}>
      {/* Body */}
      <mesh>
        <cylinderGeometry args={[r * 1.6, r * 1.6, 0.14, 10]} />
        <Mat type="valve" />
      </mesh>
      {/* Hand-wheel stem */}
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
        <Mat type="darkSteel" />
      </mesh>
      {/* Hand-wheel */}
      <mesh position={[0, 0.30, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.012, 6, 14]} />
        <Mat type="steel" />
      </mesh>
    </group>
  );
}

/**
 * PipeLine — renders a route as cylinders + flange spheres at every waypoint.
 * Waypoints: array of [x,y,z]. Flanges mark bends (i.e., real pipe-fitting joints).
 * Optional valve positions (indices of waypoints to put valves).
 */
function PipeLine({ pts, r = 0.055, valveAt = [] }) {
  return (
    <group>
      {pts.slice(0, -1).map((p, i) => (
        <React.Fragment key={i}>
          <PipeSeg from={p} to={pts[i + 1]} r={r} />
          {/* Flange at every bend point (not at endpoints) */}
          {i > 0 && <Flange pos={p} r={r * 1.55} />}
          {valveAt.includes(i) && (
            <Valve pos={midpt(p, pts[i + 1])} axis={axisOf(p, pts[i + 1])} r={r} />
          )}
        </React.Fragment>
      ))}
      {/* End flanges */}
      <Flange pos={pts[0]} r={r * 1.55} />
      <Flange pos={pts[pts.length - 1]} r={r * 1.55} />
    </group>
  );
}

function midpt(a, b) { return [(a[0]+b[0])/2, (a[1]+b[1])/2, (a[2]+b[2])/2]; }
function axisOf(a, b) {
  const dx = Math.abs(b[0]-a[0]), dz = Math.abs(b[2]-a[2]);
  return dx > dz ? 'x' : 'z';
}

// ─── Animated smooth flow along a pipe ───────────────────────────────────────
function FlowParticles({ pts, color = '#00d4ff', count = 5, speed = 0.12 }) {
  const ref  = useRef();
  const ts   = useRef(Array.from({ length: count }, (_, i) => i / count));

  const curve = useMemo(() => {
    const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
    c.tension = 0.0;
    return c;
  }, [pts]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  useFrame((_, dt) => {
    if (!ref.current) return;
    ts.current = ts.current.map(t => (t + dt * speed) % 1);
    ts.current.forEach((t, i) => {
      const p = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      dummy.position.set(p.x, p.y, p.z);
      dummy.quaternion.setFromUnitVectors(up, tangent);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <cylinderGeometry args={[0.045, 0.045, 0.6, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.65} depthWrite={false} />
    </instancedMesh>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACHINE GEOMETRIES
// ─────────────────────────────────────────────────────────────────────────────

/** Insulation band wrapper on a vessel */
function InsulBand({ y, r, thickness = 0.025 }) {
  return (
    <mesh position={[0, y, 0]}>
      <cylinderGeometry args={[r + thickness, r + thickness, 0.12, 16]} />
      <Mat type="insulation" />
    </mesh>
  );
}

/** Ladder strip */
function Ladder({ x, yBot, yTop, z = 0 }) {
  const rungs = Math.floor((yTop - yBot) / 0.3);
  return (
    <group>
      {/* Rails */}
      {[-0.07, 0.07].map((dx, i) => (
        <mesh key={i} position={[x + dx, (yBot + yTop) / 2, z]}>
          <boxGeometry args={[0.02, yTop - yBot, 0.02]} />
          <Mat type="grating" />
        </mesh>
      ))}
      {/* Rungs */}
      {Array.from({ length: rungs }).map((_, i) => (
        <mesh key={i} position={[x, yBot + 0.3 * i + 0.15, z]}>
          <boxGeometry args={[0.16, 0.018, 0.018]} />
          <Mat type="grating" />
        </mesh>
      ))}
    </group>
  );
}

/** Structural column (I-beam approximation) */
function IBeam({ x, z, h }) {
  return (
    <group position={[x, h / 2, z]}>
      <mesh><boxGeometry args={[0.06, h, 0.06]} /><Mat type="darkSteel" /></mesh>
      {[0, 1].map((e) => (
        <mesh key={e} position={[0, (e - 0.5) * h, 0]}>
          <boxGeometry args={[0.16, 0.04, 0.06]} />
          <Mat type="darkSteel" />
        </mesh>
      ))}
    </group>
  );
}

// ─── 1. DISTILLATION COLUMN C-101 ────────────────────────────────────────────
function DistillationColumn({ status, onHover, hovered, machineData }) {
  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 7.2, 0]} />
      <AlarmBeacon status={status} position={[0, 7.0, 0]} />

      {/* Skirt base */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.62, 0.70, 0.56, 20]} />
        <Mat type="concrete" />
      </mesh>
      {/* Skirt access openings (recessed boxes) */}
      {[0, 1].map(i => (
        <mesh key={i} position={[0.62 * Math.cos(i * Math.PI), 0.28, 0.62 * Math.sin(i * Math.PI)]}>
          <boxGeometry args={[0.2, 0.3, 0.08]} />
          <Mat type="rubber" />
        </mesh>
      ))}

      {/* Shell — 3 courses */}
      {[[0, 2.2, 0.44, 4.5], [0, 5.1, 0.40, 3.2], [0, 7.5, 0.36, 1.2]].map(([, y, r, h], i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[r, i === 0 ? 0.46 : r, h, 20]} />
          <StatusMat status={status} type="stainless" />
        </mesh>
      ))}

      {/* Hemispherical top head — sits directly on top course */}
      <mesh position={[0, 8.1, 0]}>
        <sphereGeometry args={[0.36, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <StatusMat status={status} type="stainless" />
      </mesh>

      {/* Insulation bands */}
      {[1.0, 2.2, 3.4, 4.6, 5.8, 7.0].map((y, i) => (
        <InsulBand key={i} y={y} r={0.44} thickness={0.022} />
      ))}

      {/* Nozzle stubs — feed, overhead, bottoms, side-draws */}
      {[
        { pos: [0.46, 3.5, 0], rot: [0, 0, Math.PI / 2] },   // feed nozzle
        { pos: [-0.46, 6.0, 0], rot: [0, 0, -Math.PI / 2] },  // side-draw
        { pos: [0, 8.46, 0], rot: [0, 0, 0] },                 // overhead vent
        { pos: [0.62, 0.4, 0], rot: [0, 0, Math.PI / 2] },    // bottoms out
      ].map((n, i) => (
        <mesh key={i} position={n.pos} rotation={n.rot}>
          <cylinderGeometry args={[0.065, 0.065, 0.35, 10]} />
          <Mat type="pipe" />
        </mesh>
      ))}

      {/* Platform gratings at 3 levels */}
      {[2.8, 5.2, 7.2].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.50, 0.90, 16]} />
          <Mat type="grating" roughness={0.7} />
        </mesh>
      ))}

      {/* Ladder */}
      <Ladder x={0.55} yBot={0.6} yTop={8.1} z={0} />

      {/* Tray-count annotation */}
      {hovered && <HoverTooltip machineId="distillation-column-1" machineData={machineData} tooltipY={8.8} />}
    </group>
  );
}

// ─── 2. HEAT EXCHANGER HX-201 ────────────────────────────────────────────────
function HeatExchanger({ status, onHover, hovered, machineData }) {
  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 2.2, 0]} />
      <AlarmBeacon status={status} position={[0, 1.95, 0]} />

      {/* Shell (3 diameter changes for nozzle flanges) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.42, 0.42, 3.4, 18]} />
        <StatusMat status={status} type="stainless" />
      </mesh>
      {/* Insulation jacket */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.44, 0.44, 3.0, 16]} />
        <Mat type="insulation" transparent opacity={0.85} />
      </mesh>

      {/* Front & rear channel heads */}
      {[-1.8, 1.8].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh>
            <cylinderGeometry args={[0.42, 0.42, 0.24, 16]} rotation={[0, 0, Math.PI / 2]} />
            <Mat type="darkSteel" />
          </mesh>
          {/* Bolted flange ring */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.43, 0.04, 8, 20]} />
            <Mat type="darkSteel" />
          </mesh>
          {/* Bolt heads */}
          {Array.from({ length: 8 }).map((_, j) => {
            const a = (j / 8) * Math.PI * 2;
            return (
              <mesh key={j} position={[0, 0.43 * Math.cos(a), 0.43 * Math.sin(a)]}>
                <boxGeometry args={[0.07, 0.045, 0.045]} />
                <Mat type="darkSteel" />
              </mesh>
            );
          })}
          {/* Shell/tube nozzles */}
          <mesh position={[i === 0 ? -0.14 : 0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.22, 10]} />
            <Mat type="pipe" />
          </mesh>
        </group>
      ))}

      {/* Top & bottom shell nozzles */}
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.28, 10]} />
        <Mat type="pipe" />
      </mesh>
      <mesh position={[0.7, -0.48, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.28, 10]} />
        <Mat type="pipe" />
      </mesh>

      {/* Saddle supports */}
      {[-0.9, 0.9].map((x, i) => (
        <group key={i} position={[x, -0.65, 0]}>
          <mesh>
            <boxGeometry args={[0.18, 0.52, 1.1]} />
            <Mat type="concrete" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.18, 0.08, 0.95]} />
            <Mat type="grating" />
          </mesh>
        </group>
      ))}

      {hovered && <HoverTooltip machineId="heat-exchanger-hx1" machineData={machineData} tooltipY={2.5} />}
    </group>
  );
}

// ─── 3. PUMP STATION P-301 ───────────────────────────────────────────────────
function PumpStation({ status, onHover, hovered, machineData }) {
  const impA = useRef(), impB = useRef();
  useFrame((_, dt) => {
    if (impA.current) impA.current.rotation.y += dt * (status === 'critical' ? 5 : 3.5);
    if (impB.current) impB.current.rotation.y += dt * 3.0;
  });
  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 2.1, 0]} />
      <AlarmBeacon status={status} position={[0, 1.9, 0]} />

      {/* Concrete base slab */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[2.6, 0.16, 1.2]} />
        <Mat type="concrete" />
      </mesh>

      {/* — PUMP A (main) — */}
      <group position={[-0.62, 0, 0]}>
        {/* Steel baseplate */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.95, 0.08, 1.0]} />
          <Mat type="darkSteel" />
        </mesh>
        {/* Volute / casing */}
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.32, 0.36, 0.60, 16]} />
          <StatusMat status={status} type="darkSteel" />
        </mesh>
        {/* Volute flange */}
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.37, 0.37, 0.08, 16]} />
          <Mat type="steel" />
        </mesh>
        {/* Impeller glimpse (spinning inside) */}
        <mesh ref={impA} position={[0, 0.52, 0]}>
          {[0, 1, 2, 3, 4, 5].map((j) => {
            const a = (j / 6) * Math.PI * 2;
            return (
              <mesh key={j} position={[0.18 * Math.cos(a), 0, 0.18 * Math.sin(a)]}>
                <boxGeometry args={[0.22, 0.04, 0.06]} rotation={[0, a, 0]} />
                <Mat type="stainless" />
              </mesh>
            );
          })}
        </mesh>
        {/* Motor */}
        <mesh position={[0, 0.52, -0.65]}>
          <cylinderGeometry args={[0.22, 0.22, 0.75, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <Mat type="paint" color="#3E5A6E" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Motor cooling fins */}
        {Array.from({ length: 8 }).map((_, j) => (
          <mesh key={j} position={[0.22 * Math.cos((j / 8) * Math.PI * 2), 0.52, -0.65 + 0.22 * Math.sin((j / 8) * Math.PI * 2)]}>
            <boxGeometry args={[0.04, 0.75, 0.02]} rotation={[0, (j / 8) * Math.PI * 2, 0]} />
            <Mat type="paint" color="#3E5A6E" />
          </mesh>
        ))}
        {/* Coupling */}
        <mesh position={[0, 0.52, -0.30]}>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 10]} rotation={[Math.PI / 2, 0, 0]} />
          <Mat type="rubber" />
        </mesh>
        {/* Discharge nozzle (up) */}
        <mesh position={[0, 0.85, 0.25]}>
          <cylinderGeometry args={[0.055, 0.055, 0.40, 10]} />
          <Mat type="pipe" />
        </mesh>
        {/* Suction nozzle (side) */}
        <mesh position={[0.38, 0.52, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.30, 10]} />
          <Mat type="pipe" />
        </mesh>
        <mesh position={[0, 0.08, 0]}><boxGeometry args={[0.06, 0.08, 0.06]} /><Mat type="darkSteel" /></mesh>
      </group>

      {/* — PUMP B (standby) — */}
      <group position={[0.62, 0, 0]}>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.95, 0.08, 1.0]} />
          <Mat type="darkSteel" />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.32, 0.36, 0.60, 16]} />
          <Mat type="darkSteel" />
        </mesh>
        <mesh position={[0, 0.52, 0]}>
          <cylinderGeometry args={[0.37, 0.37, 0.08, 16]} />
          <Mat type="steel" />
        </mesh>
        <mesh ref={impB} position={[0, 0.52, 0]}>
          {[0, 1, 2, 3, 4, 5].map((j) => {
            const a = (j / 6) * Math.PI * 2;
            return (
              <mesh key={j} position={[0.18 * Math.cos(a), 0, 0.18 * Math.sin(a)]}>
                <boxGeometry args={[0.22, 0.04, 0.06]} rotation={[0, a, 0]} />
                <Mat type="stainless" />
              </mesh>
            );
          })}
        </mesh>
        <mesh position={[0, 0.52, -0.65]}>
          <cylinderGeometry args={[0.22, 0.22, 0.75, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <Mat type="paint" color="#4A6741" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.52, -0.30]}>
          <cylinderGeometry args={[0.09, 0.09, 0.14, 10]} rotation={[Math.PI / 2, 0, 0]} />
          <Mat type="rubber" />
        </mesh>
        <mesh position={[0, 0.85, 0.25]}>
          <cylinderGeometry args={[0.055, 0.055, 0.40, 10]} />
          <Mat type="pipe" />
        </mesh>
        <mesh position={[-0.38, 0.52, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.30, 10]} />
          <Mat type="pipe" />
        </mesh>
      </group>

      {/* Label "A" / "B" */}
      <Text position={[-0.62, 1.2, 0.55]} fontSize={0.14} color="#B0BEC5" anchorX="center" fontWeight={700}>A</Text>
      <Text position={[0.62, 1.2, 0.55]} fontSize={0.14} color="#B0BEC5" anchorX="center" fontWeight={700}>B</Text>

      {hovered && <HoverTooltip machineId="pump-station-p1" machineData={machineData} tooltipY={2.4} />}
    </group>
  );
}

// ─── 4. COOLING TOWER CT-401 ─────────────────────────────────────────────────
function CoolingTower({ status, onHover, hovered, machineData }) {
  const fanRef = useRef();
  useFrame((_, dt) => {
    if (fanRef.current) fanRef.current.rotation.y += dt * 2.8;
  });

  // Hyperbolic shell profile points for lathe geometry
  const profilePts = useMemo(() => [
    new THREE.Vector2(0.95, 0.0),
    new THREE.Vector2(0.80, 0.5),
    new THREE.Vector2(0.68, 1.2),
    new THREE.Vector2(0.62, 1.9),
    new THREE.Vector2(0.58, 2.5),  // narrowest
    new THREE.Vector2(0.60, 3.0),
    new THREE.Vector2(0.65, 3.4),  // top
  ], []);

  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 4.5, 0]} />
      <AlarmBeacon status={status} position={[0, 4.2, 0]} />

      {/* Hyperbolic shell (lathe profile) */}
      <mesh>
        <latheGeometry args={[profilePts, 20]} />
        <StatusMat status={status} type="paint" color="#B8C8CC" />
      </mesh>

      {/* Basin rim */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.97, 1.0, 0.12, 20]} />
        <Mat type="concrete" />
      </mesh>
      {/* Basin bottom */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[0.95, 20]} />
        <Mat type="concrete" />
      </mesh>
      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
        <circleGeometry args={[0.90, 20]} />
        <meshStandardMaterial color="#4A90D9" transparent opacity={0.55} roughness={0.05} metalness={0.1} />
      </mesh>

      {/* Louver inlet bands (4 rings) */}
      {[0.35, 0.65, 0.95, 1.25].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[0.84 - i * 0.03, 0.84 - i * 0.03, 0.08, 20]} />
          <Mat type="grating" />
        </mesh>
      ))}

      {/* Fan deck platform */}
      <mesh position={[0, 3.45, 0]}>
        <cylinderGeometry args={[0.66, 0.66, 0.06, 20]} />
        <Mat type="darkSteel" />
      </mesh>
      {/* Fan shroud ring (the rim the blades sit in) */}
      <mesh position={[0, 3.55, 0]}>
        <torusGeometry args={[0.58, 0.04, 8, 20]} />
        <Mat type="darkSteel" />
      </mesh>
      {/* Fan assembly — 6 large visible blades, clearly above the deck */}
      <group ref={fanRef} position={[0, 3.56, 0]}>
        {/* Central hub - prominent */}
        <mesh>
          <cylinderGeometry args={[0.12, 0.14, 0.14, 12]} />
          <Mat type="darkSteel" />
        </mesh>
        {/* Hub dome cap */}
        <mesh position={[0, 0.09, 0]}>
          <sphereGeometry args={[0.11, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <Mat type="valve" />
        </mesh>
        {/* 6 fan blades - large, thick, clearly visible */}
        {Array.from({ length: 6 }).map((_, j) => {
          const a = (j / 6) * Math.PI * 2;
          return (
            <group key={j} rotation={[0, -a, 0]}>
              <mesh position={[0.32, 0.02, 0]} rotation={[0.15, 0, 0.05]}>
                <boxGeometry args={[0.50, 0.05, 0.14]} />
                <meshStandardMaterial
                  color="#546E7A"
                  roughness={0.15}
                  metalness={0.88}
                  envMapIntensity={1.4}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Inlet nozzle (cooling water return) */}
      <mesh position={[0.97, 1.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.065, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>
      {/* Outlet nozzle (cold water supply) */}
      <mesh position={[0.97, 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.065, 0.065, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>

      {/* Ladder (attached directly to shell) */}
      <Ladder x={0.80} yBot={0.06} yTop={3.5} z={0} />

      {hovered && <HoverTooltip machineId="cooling-tower-ct1" machineData={machineData} tooltipY={5.0} />}
    </group>
  );
}

// ─── 5. SEPARATOR UNIT V-501 ─────────────────────────────────────────────────
function SeparatorUnit({ status, onHover, hovered, machineData }) {
  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 2.2, 0]} />
      <AlarmBeacon status={status} position={[0, 2.0, 0]} />

      {/* Main shell */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.48, 0.48, 3.2, 18]} />
        <StatusMat status={status} type="stainless" />
      </mesh>
      {/* Insulation */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.50, 0.50, 2.9, 16]} />
        <Mat type="insulation" transparent opacity={0.80} />
      </mesh>

      {/* Hemispherical heads */}
      {[
        [-1.66, [0, 0, Math.PI / 2]],
        [1.66, [0, 0, -Math.PI / 2]],
      ].map(([x, rot], i) => (
        <mesh key={i} position={[x, 0, 0]} rotation={rot}>
          <sphereGeometry args={[0.48, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <StatusMat status={status} type="stainless" />
        </mesh>
      ))}

      {/* Nozzles: inlet, gas outlet top, liquid outlet bottom, level gauge */}
      <mesh position={[-1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.32, 10]} />
        <Mat type="pipe" />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>
      <mesh position={[0.9, -0.54, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>
      {/* Level gauge (sight glass) */}
      <mesh position={[1.3, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.80, 8]} />
        <meshStandardMaterial color="#88BBCC" transparent opacity={0.6} roughness={0.05} metalness={0.1} />
      </mesh>

      {/* Saddle supports */}
      {[-0.85, 0.85].map((x, i) => (
        <group key={i} position={[x, -0.72, 0]}>
          <mesh><boxGeometry args={[0.22, 0.48, 1.08]} /><Mat type="concrete" /></mesh>
          <mesh position={[0, 0.26, 0]}><boxGeometry args={[0.22, 0.08, 1.0]} /><Mat type="grating" /></mesh>
        </group>
      ))}

      {hovered && <HoverTooltip machineId="separator-unit-s1" machineData={machineData} tooltipY={2.6} />}
    </group>
  );
}

// ─── 6. COMPRESSOR K-601 ─────────────────────────────────────────────────────
function Compressor({ status, onHover, hovered, machineData }) {
  const shaftRef = useRef();
  useFrame((_, dt) => {
    if (shaftRef.current) shaftRef.current.rotation.z += dt * (status === 'critical' ? 6 : 4.5);
  });
  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 2.6, 0]} />
      <AlarmBeacon status={status} position={[0, 2.4, 0]} />

      {/* Concrete pad */}
      <mesh position={[0, -0.09, -0.2]}>
        <boxGeometry args={[2.2, 0.18, 1.8]} />
        <Mat type="concrete" />
      </mesh>

      {/* Compressor casing (multi-stage, horizontally-split) */}
      <mesh position={[0, 0.58, 0]}>
        <cylinderGeometry args={[0.52, 0.58, 1.05, 16]} />
        <StatusMat status={status} type="darkSteel" />
      </mesh>
      {/* Horizontal split line */}
      <mesh position={[0, 0.585, 0]}>
        <boxGeometry args={[1.08, 0.025, 1.08]} />
        <Mat type="steel" />
      </mesh>
      {/* Flange ring */}
      <mesh position={[0, 0.58, 0]}>
        <torusGeometry args={[0.59, 0.055, 8, 22]} />
        <Mat type="darkSteel" />
      </mesh>
      {/* Stud bolts around flange */}
      {Array.from({ length: 12 }).map((_, j) => {
        const a = (j / 12) * Math.PI * 2;
        return (
          <mesh key={j} position={[0.595 * Math.cos(a), 0.58, 0.595 * Math.sin(a)]}>
            <cylinderGeometry args={[0.018, 0.018, 0.18, 6]} />
            <Mat type="steel" />
          </mesh>
        );
      })}

      {/* Driver motor (high-speed) */}
      <mesh position={[0, 0.58, -0.98]}>
        <cylinderGeometry args={[0.28, 0.28, 0.90, 12]} rotation={[Math.PI / 2, 0, 0]} />
        <Mat type="paint" color="#2D4A5A" roughness={0.4} metalness={0.6} />
      </mesh>
      {/* Coupling shaft (animated) */}
      <mesh ref={shaftRef} position={[0, 0.58, -0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.48, 8]} />
        <StatusMat status={status} type="stainless" />
      </mesh>
      {/* Coupling guard */}
      <mesh position={[0, 0.58, -0.52]}>
        <cylinderGeometry args={[0.14, 0.14, 0.38, 10]} rotation={[Math.PI / 2, 0, 0]} />
        <Mat type="grating" transparent opacity={0.5} />
      </mesh>

      {/* Suction filter/silencer */}
      <group position={[0.76, 0.75, 0]}>
        <mesh>
          <cylinderGeometry args={[0.14, 0.14, 0.55, 10]} />
          <Mat type="darkSteel" />
        </mesh>
        <mesh position={[0, 0.31, 0]}>
          <cylinderGeometry args={[0.10, 0.10, 0.20, 8]} />
          <Mat type="pipe" />
        </mesh>
      </group>

      {/* Discharge nozzle */}
      <mesh position={[-0.62, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.075, 0.075, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>

      {/* Anti-vibration mounts (4 corners) */}
      {[[-0.85, -0.68], [0.85, -0.68], [-0.85, 0.68], [0.85, 0.68]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.04, z]}>
          <cylinderGeometry args={[0.06, 0.08, 0.10, 8]} />
          <Mat type="rubber" />
        </mesh>
      ))}

      {hovered && <HoverTooltip machineId="compressor-c1" machineData={machineData} tooltipY={3.0} />}
    </group>
  );
}

// ─── 7. STORAGE TANK TK-701 ──────────────────────────────────────────────────
function StorageTank({ status, onHover, hovered, machineData }) {
  return (
    <group
      onPointerEnter={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerLeave={() => onHover(false)}
    >
      <StatusLight status={status} position={[0, 3.3, 0]} />
      <AlarmBeacon status={status} position={[0, 3.1, 0]} />

      {/* Foundation ring */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.18, 1.28, 0.10, 22]} />
        <Mat type="concrete" />
      </mesh>

      {/* Shell — 3 courses with horizontal weld seams */}
      {[[0.0, 0.70, 1.35], [1.50, 0.72, 1.40], [3.0, 0.69, 1.35]].map(([yOff, h, r], i) => (
        <mesh key={i} position={[0, yOff + h / 2 + 0.10, 0]}>
          <cylinderGeometry args={[r, i === 0 ? r + 0.03 : r, h, 22]} />
          <StatusMat status={status} type="paint" color={i === 0 ? '#C5D0D4' : '#BDCACE'} />
        </mesh>
      ))}
      {/* Weld seam rings */}
      {[1.45, 2.95].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[1.38, 1.38, 0.04, 22]} />
          <Mat type="darkSteel" />
        </mesh>
      ))}

      {/* Cone roof */}
      <mesh position={[0, 4.55, 0]}>
        <coneGeometry args={[1.38, 0.65, 22]} />
        <StatusMat status={status} type="paint" color="#B8C4C8" />
      </mesh>

      {/* Vent / pressure-vacuum valve */}
      <mesh position={[0, 4.90, 0]}>
        <cylinderGeometry args={[0.08, 0.10, 0.25, 10]} />
        <Mat type="valve" />
      </mesh>
      <mesh position={[0, 5.08, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.08, 10]} />
        <Mat type="valve" />
      </mesh>

      {/* Access Ladder */}
      <Ladder x={1.38} yBot={0.05} yTop={4.55} z={0.5} />
      {/* Handrail */}
      <mesh position={[0, 4.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.36, 0.015, 6, 22]} />
        <Mat type="grating" />
      </mesh>

      {/* Nozzles: inlet, outlet, drain, level */}
      <mesh position={[0, 2.5, 1.37]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>
      <mesh position={[0, 0.4, 1.37]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.30, 10]} />
        <Mat type="pipe" />
      </mesh>
      {/* Level gauge glass */}
      <mesh position={[1.38, 2.2, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 2.4, 8]} />
        <meshStandardMaterial color="#88BBCC" transparent opacity={0.55} roughness={0.05} metalness={0.1} />
      </mesh>

      {hovered && <HoverTooltip machineId="storage-tank-t1" machineData={machineData} tooltipY={3.8} />}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPE NETWORK — Fully closed refinery process routing
// ─────────────────────────────────────────────────────────────────────────────
/*
  Layout positions:
    pump-station-p1:       [-7.0, 0.0,  3.5]
    distillation-column-1: [-3.5, 0.0,  0.0]
    heat-exchanger-hx1:    [ 1.5, 0.8, -3.5]
    separator-unit-s1:     [ 5.5, 0.8, -1.0]
    storage-tank-t1:       [ 9.0, 0.0,  2.0]
    compressor-c1:         [ 4.0, 0.0,  4.0]
    cooling-tower-ct1:     [ 8.5, 0.0, -4.0]
*/

const PIPE_ELEV_MAIN  = 0.28;  // main header elevation
const PIPE_ELEV_HIGH  = 0.90;  // elevated header
const PIPE_ELEV_TOPDC = 8.46;  // top of distillation column (hemisphere top)

const PIPE_NETWORK = [
  // ── LOOP 1: Feed Crude → Pump → Column ──────────────────────────────────
  {
    id: 'pump-to-column-feed',
    color: '#F4A261',   // orange = crude
    pts: [
      [-7.0, PIPE_ELEV_MAIN, 3.5],   // pump discharge
      [-7.0, PIPE_ELEV_MAIN, 0.4],   // rise
      [-7.0, PIPE_ELEV_HIGH, 0.4],
      [-4.1, PIPE_ELEV_HIGH, 0.4],   // run to column feed nozzle
      [-4.1, PIPE_ELEV_HIGH, 0.0],
    ],
    valveAt: [2],
  },
  // Pump suction return from tank (bottom loop)
  {
    id: 'tank-to-pump-return',
    color: '#F4A261',
    pts: [
      [9.0, PIPE_ELEV_MAIN, 2.0],   // tank outlet
      [9.0, PIPE_ELEV_MAIN, 3.5],
      [-7.0, PIPE_ELEV_MAIN, 3.5],  // back to pump suction
    ],
    valveAt: [1],
  },

  // ── LOOP 2: Column Overhead → Condenser HX → Separator ──────────────────
  {
    id: 'column-overhead-to-hx',
    color: '#48CAE4',  // light blue = vapour
    pts: [
      [-3.5, PIPE_ELEV_TOPDC, 0.0],  // overhead nozzle at top of column
      [-3.5, PIPE_ELEV_TOPDC, -1.0], // out slightly
      [-3.5, PIPE_ELEV_HIGH,  -1.0], // drop down immediately
      [-3.5, PIPE_ELEV_HIGH,  -3.5], // run on lower rack
      [1.5,  PIPE_ELEV_HIGH,  -3.5], // across to HX inlet
    ],
    valveAt: [3],
  },
  {
    id: 'hx-to-separator',
    color: '#48CAE4',
    pts: [
      [2.0,  PIPE_ELEV_HIGH, -3.5],  // HX outlet
      [5.5,  PIPE_ELEV_HIGH, -3.5],  // run
      [5.5,  PIPE_ELEV_HIGH, -1.0],  // turn to separator
    ],
    valveAt: [1],
  },

  // ── LOOP 3: Separator Liquid → Storage Tank ──────────────────────────────
  {
    id: 'separator-to-tank',
    color: '#F4A261',
    pts: [
      [5.5,  0.26,            -1.0],  // separator liquid outlet
      [9.0,  0.26,            -1.0],
      [9.0,  0.26,             2.0],  // tank inlet
    ],
    valveAt: [1],
  },

  // ── LOOP 4: Separator Gas → Compressor → Column ──────────────────────────
  {
    id: 'separator-gas-to-comp',
    color: '#B5E48C',  // green = gas
    pts: [
      [5.5,  PIPE_ELEV_HIGH, -1.0],  // separator gas outlet (top)
      [5.5,  PIPE_ELEV_HIGH,  4.0],  // run forward
      [4.0,  PIPE_ELEV_HIGH,  4.0],  // compressor suction
    ],
    valveAt: [1],
  },
  {
    id: 'comp-discharge-to-column',
    color: '#B5E48C',
    pts: [
      [4.0,  PIPE_ELEV_HIGH,  4.0],   // compressor discharge
      [-3.5, PIPE_ELEV_HIGH,  4.0],   // run
      [-3.5, PIPE_ELEV_HIGH,  0.6],   // turn to column
    ],
    valveAt: [1],
  },

  // ── LOOP 5: Column Bottoms → Reboiler HX → back to Column ────────────────
  {
    id: 'column-bottoms-to-hx-reboiler',
    color: '#E76F51',  // dark orange = hot bottoms
    pts: [
      [-3.5, PIPE_ELEV_MAIN, 0.0],   // column bottoms nozzle
      [-3.5, PIPE_ELEV_MAIN, -2.5],
      [1.5,  PIPE_ELEV_MAIN, -2.5],
      [1.5,  PIPE_ELEV_MAIN, -3.5],  // HX shell inlet
    ],
    valveAt: [2],
  },
  {
    id: 'reboiler-hx-back-to-column',
    color: '#E76F51',
    pts: [
      [1.5,  PIPE_ELEV_HIGH, -2.5],  // HX shell outlet
      [-3.5, PIPE_ELEV_HIGH, -2.5],
      [-3.5, PIPE_ELEV_HIGH,  0.0],  // back to column stripping section
    ],
    valveAt: [1],
  },

  // ── LOOP 6: Cooling Water — CT → HX → CT ─────────────────────────────────
  {
    id: 'cooling-water-supply',
    color: '#90E0EF',  // pale blue = cooling water
    pts: [
      [8.5,  PIPE_ELEV_MAIN, -4.0],  // CT cold water outlet
      [8.5,  PIPE_ELEV_MAIN, -1.0],
      [3.5,  PIPE_ELEV_MAIN, -1.0],
      [1.5,  PIPE_ELEV_MAIN, -3.0],  // HX cooling inlet
    ],
    valveAt: [2],
  },
  {
    id: 'cooling-water-return',
    color: '#4CC9F0',  // slightly warmer
    pts: [
      [1.5,  PIPE_ELEV_MAIN, -4.0],  // HX cooling outlet
      [5.0,  PIPE_ELEV_MAIN, -4.0],
      [8.5,  PIPE_ELEV_MAIN, -4.0],  // CT hot water inlet
    ],
    valveAt: [1],
  },
];

function PipeNetwork() {
  return (
    <group>
      {PIPE_NETWORK.map((pipe) => (
        <group key={pipe.id}>
          <PipeLine pts={pipe.pts} r={0.055} valveAt={pipe.valveAt || []} />
          <FlowParticles pts={pipe.pts} color={pipe.color} count={6} speed={0.10} />
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FACTORY FLOOR
// ─────────────────────────────────────────────────────────────────────────────
function FactoryFloor() {
  return (
    <>
      {/* Concrete pad */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[34, 22]} />
        <meshStandardMaterial color="#D0D4D8" roughness={0.95} metalness={0.02} />
      </mesh>
      {/* Engineering grid */}
      <Grid
        position={[0, 0.01, 0]}
        args={[34, 22]}
        cellSize={1}
        cellThickness={0.3}
        cellColor="#B8BFC5"
        sectionSize={5}
        sectionThickness={0.7}
        sectionColor="#9AAAB4"
        fadeDistance={26}
        fadeStrength={1.2}
        infiniteGrid={false}
      />
      {/* Removed high pipe rack structures for cleaner view */}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MACHINE LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
const MACHINE_LAYOUT = {
  'distillation-column-1': { Component: DistillationColumn, pos: [-3.5, 0.0,  0.0] },
  'heat-exchanger-hx1':    { Component: HeatExchanger,      pos: [ 1.5, 0.9, -3.5] },
  'pump-station-p1':       { Component: PumpStation,        pos: [-7.0, 0.0,  3.5] },
  'cooling-tower-ct1':     { Component: CoolingTower,       pos: [ 8.5, 0.0, -4.0] },
  'separator-unit-s1':     { Component: SeparatorUnit,      pos: [ 5.5, 0.9, -1.0] },
  'compressor-c1':         { Component: Compressor,         pos: [ 4.0, 0.0,  4.0] },
  'storage-tank-t1':       { Component: StorageTank,        pos: [ 9.0, 0.0,  2.0] },
};

const DEFAULT_STATUS = Object.fromEntries(
  Object.keys(MACHINE_LAYOUT).map(id => [id, 'healthy'])
);

// ─────────────────────────────────────────────────────────────────────────────
// SCENE CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function SceneContent() {
  const machines = useStore(s => s.machines);

  const machineStatuses = useMemo(() => {
    const s = { ...DEFAULT_STATUS };
    Object.values(machines).forEach(m => {
      if (m.machine_id && s[m.machine_id] !== undefined) s[m.machine_id] = m.status || 'healthy';
    });
    return s;
  }, [machines]);

  const [hoveredId, setHoveredId] = useState(null);

  const handleHover = useCallback((id, val) => {
    setHoveredId(val ? id : null);
  }, []);

  return (
    <>
      {/* ── Lighting ── */}
      <ambientLight intensity={0.80} color="#E8EEF5" />
      <directionalLight
        position={[10, 18, 8]}
        intensity={2.0}
        color="#FFF5E8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={60}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <directionalLight position={[-8, 10, -5]} intensity={0.7} color="#C8D8F0" />
      <directionalLight position={[0, 5, 12]} intensity={0.45} color="#E8F0FF" />
      <pointLight position={[0, 12, 0]} intensity={0.5} color="#E8F5FF" distance={30} />
      <hemisphereLight args={['#DDE8F5', '#A0A8B0', 0.6]} />

      {/* ── Sky colour & environment ── */}
      <color attach="background" args={['#D2DDE8']} />
      <fog attach="fog" args={['#C5D5E5', 35, 65]} />
      <Environment preset="warehouse" background={false} />

      {/* ── Floor & structure ── */}
      <FactoryFloor />

      {/* ── Subtle contact shadows under equipment ── */}
      <ContactShadows position={[0, 0.02, 0]} opacity={0.28} scale={40} blur={2.8} far={4} />

      {/* ── Ambient sparkles (steam/aerosol) ── */}
      <Sparkles count={22} scale={[28, 8, 18]} size={0.9} speed={0.12} opacity={0.10} color="#C8E0F8" position={[2, 3, 0]} />

      {/* ── Pipe network ── */}
      <PipeNetwork />

      {/* ── Machines ── */}
      {Object.entries(MACHINE_LAYOUT).map(([id, { Component, pos }]) => (
        <group key={id} position={pos}>
          <Component
            status={machineStatuses[id] || 'healthy'}
            onHover={(val) => handleHover(id, val)}
            hovered={hoveredId === id}
            machineData={machines[id] || null}
          />
        </group>
      ))}

      {/* ── Camera ── */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={5}
        maxDistance={38}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2.05}
        autoRotate
        autoRotateSpeed={0.28}
        target={[1, 1.5, 0]}
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function FactoryScene3D({ style }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      borderRadius: 12,
      overflow: 'hidden',
      background: 'linear-gradient(160deg, #D5E2EE 0%, #C8D8E8 60%, #BDD0E0 100%)',
      ...style,
    }}>
      <Canvas
        shadows="soft"
        camera={{ position: [14, 10, 16], fov: 40, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        dpr={[1, 1.8]}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
