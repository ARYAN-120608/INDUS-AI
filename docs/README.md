# 🏭 Indus AI — Autonomous Industrial Intelligence Platform

> **Autonomous AI Agent for Real-Time Industrial Monitoring, Fault Diagnosis, and Self-Orchestrated Maintenance Operations**

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm

### 1. Start the Factory Simulator

```bash
cd factory_simulator
pip install -r requirements.txt
python simulator.py
```

This starts a WebSocket server on `ws://localhost:8765` simulating 7 factory machines.

### 2. Start the Backend Server

```bash
cd backend
pip install -r requirements.txt

# Optional: Set your Groq API key for AI diagnosis
# set GROQ_API_KEY=your_key_here  (Windows)
# export GROQ_API_KEY=your_key_here  (Linux/Mac)

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at `http://localhost:8000` with:
- REST API at `/api/`
- WebSocket at `/ws/live-data`
- API docs at `/docs`

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

## 🏗 Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Factory Simulator   │────▶│  FastAPI Backend  │────▶│  React Frontend │
│  (Python + asyncio)  │ WS  │  + AI Engine     │ WS  │  + Three.js 3D  │
│  7 Virtual Machines  │     │  + RAG + Tickets  │     │  + Charts       │
└─────────────────────┘     └──────────────────┘     └─────────────────┘
```

## 📁 Project Structure

```
IndusAI/
├── frontend/              # React + Vite + Tailwind + Three.js
│   ├── src/
│   │   ├── components/    # UI Components
│   │   │   ├── 3d_factory/  # Three.js digital twin
│   │   │   ├── dashboard/   # Charts, cards, KPIs
│   │   │   └── layout/      # Sidebar, Navbar
│   │   ├── pages/         # Route pages
│   │   ├── hooks/         # WebSocket hook
│   │   ├── stores/        # Zustand state
│   │   └── utils/         # Constants
│   └── package.json
├── backend/               # FastAPI server
│   ├── main.py            # App entry
│   ├── websocket_manager.py
│   ├── api/               # REST endpoints
│   ├── ai_engine/         # Groq LLM diagnosis
│   ├── rag/               # SOP knowledge base
│   └── automation/        # Ticket engine
├── factory_simulator/     # Async sensor simulator
├── database/              # Supabase SQL schema
└── docs/                  # Documentation
```

## 🤖 AI Engine

The AI diagnostic engine uses **Groq API** (LLaMA 3.3 70B) for intelligent fault analysis with a rule-based fallback when the API key is not configured.

### Supported Fault Types:
- Bearing Failure
- Overheating
- Motor Imbalance
- Pressure Leak
- Power Surge

## 🎫 Automated Ticketing

When an anomaly is detected:
1. AI analyzes sensor data → produces diagnosis
2. SOP retrieval fetches matching repair procedure
3. Maintenance ticket auto-generated with priority & team assignment
4. Alert pushed to frontend in real-time

## 🎨 Design

- **Dark industrial theme** with glassmorphism
- **Color palette**: Navy, Electric Blue, Neon Green, Amber, Critical Red
- **3D Digital Twin** with animated machines, status beacons, smoke effects
- **Real-time charts** with gradient fills
- **Enterprise-grade UI** — not a student project

## 📊 Database

See `database/schema.sql` for the Supabase-compatible PostgreSQL schema.

## 🔑 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
GROQ_API_KEY=your_groq_key
SIMULATOR_URL=ws://localhost:8765
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

## 👥 Team

| Role | Responsibilities |
|------|-----------------|
| AI Systems | LLM integration, diagnosis logic |
| Backend | APIs, WebSockets, database |
| Frontend | Dashboard, charts, UI |
| 3D Engineer | Three.js factory, animations |
| Integration | Simulator, deployment |
