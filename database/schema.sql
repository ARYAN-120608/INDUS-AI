-- ============================================
-- Indus AI — Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- MACHINES TABLE
-- Stores current state of all factory machines
-- ============================================
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'healthy' CHECK (status IN ('healthy', 'warning', 'critical')),
    last_temperature REAL,
    last_pressure REAL,
    last_rpm REAL,
    last_vibration REAL,
    last_power REAL,
    last_efficiency REAL,
    last_oil_level REAL,
    last_bearing_health REAL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial machine data
INSERT INTO machines (id, name, type, status) VALUES
    ('cnc-cutter-alpha', 'CNC Cutter Alpha', 'CNC Cutter', 'healthy'),
    ('conveyor-main', 'Conveyor Belt Main', 'Conveyor Belt', 'healthy'),
    ('press-hydraulic', 'Hydraulic Press H1', 'Hydraulic Press', 'healthy'),
    ('robot-arm-a', 'Robotic Arm R1', 'Robotic Arm', 'healthy'),
    ('drill-press-1', 'Drill Machine D1', 'Drill Machine', 'healthy'),
    ('packaging-line', 'Packaging Unit P1', 'Packaging Machine', 'healthy'),
    ('cooling-tower', 'Cooling Unit C1', 'Cooling Unit', 'healthy')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- INCIDENTS TABLE
-- Stores AI-detected anomaly incidents
-- ============================================
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    machine_id TEXT REFERENCES machines(id),
    problem TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    ai_diagnosis JSONB,
    sop_steps JSONB,
    sensor_snapshot JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TICKETS TABLE
-- Stores auto-generated maintenance tickets
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    ticket_id TEXT PRIMARY KEY,
    machine_id TEXT REFERENCES machines(id),
    incident_id INTEGER REFERENCES incidents(id),
    problem TEXT NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    downtime_estimate TEXT,
    assigned_team TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incidents_machine ON incidents(machine_id);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_tickets_machine ON tickets(machine_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- ============================================
-- ENABLE REALTIME (Supabase-specific)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;
