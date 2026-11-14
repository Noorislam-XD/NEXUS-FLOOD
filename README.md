# NEXUS FLOOD

> **From scattered information to coordinated flood response.**

[![System Status](https://img.shields.io/badge/System-Operational-emerald)](#)
[![AI Engine](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-cyan)](#)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e)](#)
[![Mapping](https://img.shields.io/badge/Maps-Leaflet%20%7C%20OpenStreetMap-1e88e5)](#)
[![License](https://img.shields.io/badge/License-MIT-gray)](#)

---

## 🌊 Product Vision & Mission

During catastrophic flooding events, people encounter fragmented, chaotic information: frantic social media posts, conflicting road closure reports, raw eyewitness photos, muffled voice notes, and scattered municipal alerts. Emergency responders struggle to prioritize, while citizens cannot determine if their evacuation route is passable or if a shelter has open capacity.

**NEXUS FLOOD** transforms unstructured multimodal human information into structured, evidence-backed, and actionable disaster intelligence. It bridges citizens, environmental feeds (NOAA National Weather Service), first responders, and community mutual-aid networks without ever compromising on human oversight.

---

## 🌟 Core Principles

1. **Multimodal Ingestion**: Accepts text descriptions, eyewitness photographs, citizen voice notes, short video clips, and official emergency PDF bulletins.
2. **Context Fusion**: Merges overlapping inputs into unified incident dossiers rather than isolated chat messages.
3. **Evidence-First Verification**: Every critical claim is explicitly classified: `VERIFIED`, `UNCONFIRMED`, `CONFLICTING`, or `UNKNOWN`.
4. **Action-Oriented Workflows**: Automatically derives prioritized response actions (e.g. barricade deployment, boat rescue dispatch, shelter activation) awaiting human approval.
5. **Strict Human Oversight**: AI never autonomously dispatches emergency personnel or declares roads safe without qualified human confirmation.
6. **Data Privacy & RLS**: Personal identity and medical notes are shielded using Supabase Row Level Security (RLS) and private signed storage buckets.
7. **Transparent Demonstration Mode**: All simulated scenario data is prominently badged with `[DEMO]` to prevent confusion with real emergencies.

---

## 🏛 Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              NEXUS FLOOD Client               │
                      │  React 19 + Vite + Tailwind CSS + Lucide      │
                      │       Interactive Leaflet & OpenStreetMap     │
                      └──────────────────────┬────────────────────────┘
                                             │ REST / JSON
                                             ▼
                      ┌───────────────────────────────────────────────┐
                      │            Express.js API Gateway             │
                      │       Rate Limiting • Input Validation        │
                      └──────┬────────────────┬───────────────┬───────┘
                             │                │               │
                             ▼                ▼               ▼
           ┌───────────────────────┐ ┌────────────────┐ ┌────────────────┐
           │   Google Gemini 2.0   │ │    Supabase    │ │   NOAA / NWS   │
           │   Multimodal Engine   │ │   PostgreSQL   │ │  Live Weather  │
           │  Structured JSON Schema│ │ + Storage + RLS│ │  & Flood Feeds │
           └───────────────────────┘ └────────────────┘ └────────────────┘
```

---

## 🚀 Key Features

### 1. Multimodal Incident Reporting
- Submit reports via **Text**, **Photographs**, **Direct Microphone Recording (Voice)**, **Video**, or **PDF/Docs**.
- Real-time client-side file validation (size limits, MIME types, instant preview, removal).
- High-efficiency drag-and-drop workspace.

### 2. Gemini Multimodal Disaster Intelligence
- Deeply analyzed using **Google Gemini 2.0 Flash**.
- Extracts:
  - Incident classification (`flood`, `rescue_needed`, `infrastructure_damage`, etc.)
  - Severity level (`critical`, `high`, `medium`, `low`)
  - Precise landmark & coordinate extraction
  - Affected civil infrastructure
  - Reported community needs (boats, sandbags, medical, shelter)
  - Estimated affected population
  - Missing critical information & contradictions
  - Recommended response actions

### 3. Interactive Live Flood Map
- Built on **Leaflet** & **OpenStreetMap** with custom styled markers.
- Distinct visual iconography for:
  - Verified vs. Unconfirmed Incidents (color-coded by priority)
  - Emergency resources (shelters, medical centers, staging areas)
  - Active flood hazard warning polygons
- Filter by priority, incident status, or search locations.

### 4. Evidence & Verification Registry
- Tracks the factual provenance of every emergency claim.
- Cross-references community reports against official meteorological agencies (NOAA) and local public works authorities.
- Transparent disclaimer: AI confidence scores are never treated as factual verification proof.

### 5. Response Center with Human-in-the-Loop Workflow
- Structured state machine for AI-generated response actions:
  `Suggested` ➔ `Awaiting Approval` ➔ `Approved` ➔ `In Progress` ➔ `Completed` (or `Rejected`).
- Strictly enforces human officer approval before operational escalation.

### 6. Community Assistance Directory
- Verified shelters, emergency medical stations, food/water distribution sites, and rescue staging hubs.
- Houston, TX metropolitan area disaster demo pre-seeded.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Leaflet
- **Backend**: Node.js, Express, Multer, Cors, Express-Rate-Limit
- **AI**: Google Generative AI SDK (`gemini-2.0-flash`)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **External Feeds**: NOAA / National Weather Service Active Weather Alert API
- **Maps**: OpenStreetMap tile layer with Leaflet API

---

## 📦 Getting Started

### Prerequisites
- Node.js v18+ (tested on Node v20/v24)
- npm v9+

### 1. Clone & Install
```bash
git clone https://github.com/your-username/nexus-flood.git
cd nexus-flood

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Frontend (Safe to expose)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_URL=http://localhost:3001/api

# Backend (Keep private - never expose to client)
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

> **Note**: If `GEMINI_API_KEY` or `SUPABASE_URL` is omitted, NEXUS FLOOD automatically runs in a fully functional high-fidelity **Demonstration Mode** with complete in-memory mock disaster intelligence and live NOAA weather alerts.

### 3. Database Setup (Supabase)
1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Run the SQL script located at:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
4. This sets up all 7 tables (`profiles`, `incidents`, `evidence`, `ai_analysis`, `response_actions`, `resources`, `incident_updates`), foreign keys, performance indices, and restrictive Row Level Security (RLS) policies.

---

## 🏃 Running the Application

### Option A: Complete Full-Stack Server (Recommended)
Build the frontend and run the production Express server (serves both API & Frontend on port 3001):
```bash
npm run build
npm start
```
Visit: [http://localhost:3001](http://localhost:3001)

### Option B: Development Mode (Hot Reloading)
In terminal 1 (Backend):
```bash
npm run server
```

In terminal 2 (Vite Frontend):
```bash
npm run dev
```
Visit: [http://localhost:5173](http://localhost:5173)

---

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service diagnostic & integration status |
| `GET` | `/api/incidents` | List incidents with filtering & pagination |
| `POST` | `/api/incidents` | Create a new flood incident |
| `GET` | `/api/incidents/:id` | Get incident dossier with evidence & AI analysis |
| `PATCH` | `/api/incidents/:id` | Update incident status/priority |
| `POST` | `/api/analyze` | Gemini multimodal analysis (text, image, audio, doc) |
| `POST` | `/api/analyze/verify` | Cross-reference evidence claim against sources |
| `GET` | `/api/resources` | Query community shelters, medical hubs, and resources |
| `GET` | `/api/alerts` | Active flood warnings (live NOAA NWS feed) |
| `GET` | `/api/actions` | Retrieve response action recommendations |
| `PATCH` | `/api/actions/:id` | Human approval/update of response action |

---

## 🔒 Security & Responsible AI Protocols

- **Emergency Primacy**: Prominent notices instruct users that in life-critical situations, official 911/emergency guidance takes precedence over AI analysis.
- **Strict Human Oversight**: All consequential emergency actions require operator approval before progression.
- **Zero Hallucination Policy**: If coordinates or details cannot be determined from evidence, fields return `null` or `unknown` rather than fabricated data.
- **API Key Protection**: Gemini and Supabase service-role keys are strictly encapsulated in the Node.js backend.
- **Data Privacy**: Row Level Security prevents unauthorized viewing or tampering with citizen profiles and private incident submissions.

---

## 📄 License

This project is licensed under the MIT License - built for social impact and disaster resilience.
