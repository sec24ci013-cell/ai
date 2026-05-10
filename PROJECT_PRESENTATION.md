# AI-Powered Forensic Triage & Postmortem Intelligence System

> **Project Name:** RAW — Investigation OS  
> **Domain:** Forensic Science × Artificial Intelligence  
> **Team Repository:** [github.com/sec24ci013-cell/ai](https://github.com/sec24ci013-cell/ai)

---

## 1. Problem Statement

Investigative agencies and forensic departments face challenges processing large volumes of forensic and digital evidence within limited time. Manual analysis of autopsy reports, environmental conditions, and digital traces (CCTV logs, mobile metadata) delays investigations and increases oversight risk. There is a growing need for an intelligent system that can assist investigators by organizing, analyzing, and correlating forensic evidence efficiently.

---

## 2. Proposed Solution

An AI-powered platform that integrates **Natural Language Processing (NLP)**, **Computer Vision**, **Graph Intelligence**, and **LLM-based reasoning** to support forensic investigations end-to-end — from evidence ingestion to final case briefing.

---

## 3. Core Features (Mapped to Problem Statement)

### 3.1 AI-Based Autopsy Report Analysis
- **Agent:** `autopsy_agent.py` → Extracts injury classifications, toxicology findings, cause of death
- **NLP Pipeline:** spaCy NER extracts persons, locations, organizations, dates from reports
- **OCR Engine:** PyMuPDF (PDF) + pytesseract (images) for text extraction
- **UI:** "Autopsy Intelligence" panel on Case Detail page with one-click AI analysis

### 3.2 Time-of-Death Estimation
- **Agent:** `tod_agent.py` → Uses Henssge nomogram formula + postmortem indicators
- **Inputs:** Body temperature, ambient temperature, body weight, clothing, rigor mortis stage, livor mortis stage
- **Output:** Estimated PMI (Postmortem Interval) range with confidence level
- **UI:** Interactive input form on Case Detail page with dropdown selectors for each indicator

### 3.3 Digital Evidence Correlation
- **CCTV Analytics:** Upload video → object detection → suspicious activity flagging → AI analysis
- **Graph Intelligence:** Neo4j-powered entity relationship mapping (persons ↔ evidence ↔ locations)
- **Semantic Search:** Milvus vector database for embedding-based evidence search
- **Face Recognition:** Suspect face registration and CCTV cross-matching via `face_service.py`

### 3.4 Case Risk Scoring & Anomaly Detection
- **Engine:** `risk_service.py` — Rule-based + anomaly detection
- **Scoring Factors:**
  - Evidence volume and type distribution
  - Suspect network size (from graph data)
  - Keyword analysis (violence, drugs, financial, forensic)
  - Timeline gap anomaly detection (unexplained time gaps)
  - Cross-entity frequency analysis (same person in multiple evidence items)
  - Evidence type imbalance detection
- **Risk Levels:** LOW (0-29) → MEDIUM (30-59) → HIGH (60-79) → CRITICAL (80-100)

### 3.5 Interactive Investigation Dashboard
- **13 dedicated pages** with real-time data visualization
- **Recharts** for evidence distribution (pie), risk severity (bar), activity timeline
- **Forensic Brief PDF** — AI-generated, hash-locked investigation reports with charts and chain of custody ledger

### 3.6 Third Eye — Forensic Face Sketch Module
- Inspired by [Third-Eye Project](https://github.com/imakashsahu/Third-Eye-Final-Year-Project)
- **AI Mode:** Generates detailed suspect facial composite from case evidence and witness statements
- **Manual Mode:** Feature-by-feature witness input (face shape, hair, eyes, nose, mouth, skin tone, distinguishing marks)
- **Output:** Structured suspect profile for forensic sketch artists

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  TanStack Router · Framer Motion · Recharts · jsPDF    │
│                                                         │
│  Dashboard │ Cases │ Evidence │ Timeline │ CCTV         │
│  Graph │ Search │ Copilot │ Voice │ Reports             │
│  Third Eye │ Supervisor │ Settings │ Login              │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (JWT Auth)
┌──────────────────────▼──────────────────────────────────┐
│                 BACKEND (FastAPI)                        │
│                                                         │
│  ┌──────────┐ ┌───────────┐ ┌─────────────────────┐    │
│  │ Auth/MFA │ │ Dashboard │ │ AI Agent Orchestrator│    │
│  └──────────┘ └───────────┘ └─────────┬───────────┘    │
│                                       │                 │
│  ┌────────────────────────────────────▼──────────────┐  │
│  │              7 AI AGENTS                          │  │
│  │  Autopsy · Evidence · Timeline · Graph            │  │
│  │  CCTV · Legal Report · Time-of-Death              │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │            SERVICES LAYER                         │  │
│  │  OCR · NLP/NER · Risk Scoring · LLM Client       │  │
│  │  Metadata · Face Recognition · Search · Voice     │  │
│  └──────────────────────────────────────────────────┘   │
└──────────┬──────────┬──────────┬──────────┬─────────────┘
           │          │          │          │
     ┌─────▼───┐ ┌───▼────┐ ┌──▼───┐ ┌───▼────┐
     │ MongoDB │ │ MinIO  │ │Neo4j │ │Milvus  │
     │  (Data) │ │(Files) │ │(Graph│ │(Vector)│
     └─────────┘ └────────┘ └──────┘ └────────┘
                       │
                 ┌─────▼─────┐
                 │Redis/Celery│
                 │(AI Pipeline│
                 └────────────┘
```

---

## 5. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript | UI Framework |
| **Routing** | TanStack Router (File-based) | Client-side navigation |
| **Styling** | Custom CSS + Design Tokens | Premium white theme |
| **Animations** | Framer Motion | Micro-interactions |
| **Charts** | Recharts | Data visualization |
| **PDF Export** | jsPDF + html2canvas | Forensic Brief generation |
| **Backend** | FastAPI (Python) | REST API server |
| **Auth** | JWT + OAuth2 + MFA (TOTP) | Secure authentication |
| **ODM** | Beanie (MongoDB) | Document modeling |
| **Database** | MongoDB | Primary data store |
| **File Storage** | MinIO (S3-compatible) | Evidence file storage |
| **Graph DB** | Neo4j | Entity relationship mapping |
| **Vector DB** | Milvus | Semantic embedding search |
| **Task Queue** | Redis + Celery | Async AI pipeline |
| **AI/LLM** | Featherless AI API | Agent reasoning |
| **NLP** | spaCy (en_core_web_sm) | Named Entity Recognition |
| **OCR** | PyMuPDF + pytesseract | Text extraction |
| **Vision** | OpenCV (CCTV analysis) | Object/person detection |

---

## 6. AI Agent Architecture

| Agent | Input | Output | Trigger |
|-------|-------|--------|---------|
| **Autopsy Agent** | Medical/forensic report text | Injury classification, toxicology, cause of death | Case Detail → "Run Autopsy AI" |
| **Evidence Agent** | All case evidence summaries | Cross-evidence analysis, patterns, gaps | Case Detail → "Run Evidence Analysis" |
| **Timeline Agent** | Timeline events | Chronological reconstruction, anomalies | Case Detail → auto |
| **Graph Agent** | Neo4j nodes & edges | Relationship patterns, central figures | Graph Intelligence page |
| **CCTV Agent** | Detection events + flags | Suspicious behavior, recommended footage | CCTV Analytics page |
| **ToD Agent** | Body temp, rigor/livor, environment | PMI range + confidence + inconsistencies | Case Detail → "Estimate ToD" |
| **Legal Report Agent** | Full case data | Court-ready investigation summary | Reports page |

---

## 7. Evidence Processing Pipeline

```
Upload Evidence
      │
      ▼
┌─────────────┐
│  SHA-256     │  ← Cryptographic hash for chain of custody
│  Hashing     │
└──────┬──────┘
       ▼
┌─────────────┐
│  Metadata    │  ← File type, size, timestamps, EXIF
│  Extraction  │
└──────┬──────┘
       ▼
┌─────────────┐
│  OCR / Text  │  ← PyMuPDF (PDF) or pytesseract (images)
│  Extraction  │
└──────┬──────┘
       ▼
┌─────────────┐
│  NLP / NER   │  ← spaCy: persons, locations, orgs, dates
│  Tagging     │
└──────┬──────┘
       ▼
┌─────────────┐
│  AI Summary  │  ← LLM generates evidence summary
│  Generation  │
└──────┬──────┘
       ▼
┌─────────────┐
│  Chain       │  ← Evidence locked with hash verification
│  Locked ✓    │
└─────────────┘
```

---

## 8. Security Features

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT Bearer tokens with configurable expiry |
| **Password Hashing** | bcrypt via passlib |
| **MFA** | TOTP-based (Google Authenticator compatible) |
| **Role-Based Access** | officer → investigator → admin (supervisor) |
| **Evidence Integrity** | SHA-256 hash on every uploaded file |
| **Audit Trail** | Every API call logged with timestamp, method, path, user ID, status |
| **Chain of Custody** | Tamper-evident ledger in every Forensic Brief PDF |

---

## 9. Frontend Pages (13 Pages)

| # | Page | File | Description |
|---|------|------|-------------|
| 1 | **Dashboard** | `index.tsx` | KPI cards, recent cases, activity chart, evidence stats |
| 2 | **Active Cases** | `cases.tsx` | Case grid with risk scores, crime types, status filters |
| 3 | **Case Detail** | `cases_.$id.tsx` | Evidence list, timeline, risk analysis, autopsy AI, ToD estimator, suspect sketch |
| 4 | **Forensic Brief** | `cases_.$id_.report.tsx` | PDF-ready report with charts, hash ledger, AI summaries |
| 5 | **Evidence Upload** | `evidence.tsx` | Drag-and-drop upload with live pipeline status tracking |
| 6 | **Timeline** | `timeline.tsx` | Chronological event reconstruction with confidence scores |
| 7 | **CCTV Analytics** | `cctv.tsx` | Video upload, detection events, AI surveillance analysis |
| 8 | **AI Copilot** | `copilot.tsx` | Chat-based AI assistant for case queries |
| 9 | **Graph Intelligence** | `graph.tsx` | Entity relationship visualization + AI analysis |
| 10 | **Search Engine** | `search.tsx` | Semantic + keyword search across all evidence |
| 11 | **Voice Assistant** | `voice.tsx` | Audio transcription and analysis |
| 12 | **Reports** | `reports.tsx` | Generated investigation briefs management |
| 13 | **Third Eye** | `third-eye.tsx` | Forensic face sketch (AI + manual witness input) |
| 14 | **Supervisor** | `supervisor.tsx` | 6-tab admin panel: Overview, Users, Cases, Reports, Audit, AI Agents |
| 15 | **Settings** | `settings.tsx` | MFA setup, profile management |
| 16 | **Login** | `login.tsx` | Secure authentication with MFA support |

---

## 10. API Endpoints (Backend)

### Authentication (`/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new user account |
| POST | `/login` | JWT token authentication |
| POST | `/seed-supervisor` | Create/reset admin accounts |
| GET | `/users` | List all users (admin only) |
| PUT | `/users/{id}/role` | Update user role (admin only) |
| POST | `/mfa/setup` | Initialize TOTP MFA |
| POST | `/mfa/verify` | Verify and enable MFA |
| GET | `/audit-logs` | System audit trail |

### Cases (`/cases`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all cases |
| POST | `/` | Create new case |
| GET | `/{id}` | Get case details |
| PUT | `/{id}` | Update case |
| GET | `/{id}/evidence` | Get case evidence |
| GET | `/{id}/timeline` | Get case timeline |

### AI Agents (`/agents`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/evidence/{id}` | Run evidence analysis agent |
| POST | `/autopsy/{id}` | Run autopsy intelligence agent |
| POST | `/timeline/{id}` | Run timeline reconstruction agent |
| POST | `/graph/{id}` | Run graph intelligence agent |
| POST | `/tod/{id}` | Run time-of-death estimation agent |
| POST | `/face-sketch/{id}` | Generate suspect composite profile |
| GET | `/risk/{id}` | Calculate risk score + anomaly detection |
| POST | `/legal-report/{id}` | Generate legal investigation report |

### Other Routes
| Route | Description |
|-------|-------------|
| `/upload` | Evidence file upload with pipeline trigger |
| `/cctv` | Video analysis, face registration |
| `/dashboard/stats` | Aggregated system metrics |
| `/reports` | Report CRUD operations |
| `/search` | Semantic + keyword evidence search |
| `/copilot` | AI chat assistant |
| `/graph` | Neo4j graph queries |
| `/voice` | Audio transcription |

---

## 11. Database Schema

### MongoDB Collections

**Cases**
```
{ title, crime_type, status, risk_score, created_at,
  ai_risk_level, ai_risk_flags, ai_risk_recommendation, assignee_id }
```

**Evidence**
```
{ case_id, type, hash (SHA-256), path, uploaded_by, timestamp,
  ai_summary, ai_entities, ai_raw_text, ai_status }
```

**Users**
```
{ name, email, password_hash, role, mfa_enabled, mfa_secret }
```

**Timeline Events**
```
{ case_id, event_type, description, timestamp, confidence_score, source }
```

**Reports**
```
{ case_id, title, report_type, content, pages, status, created_at }
```

**Audit Logs**
```
{ method, path, status_code, user_id, timestamp }
```

---

## 12. How to Run

### Prerequisites
- Python 3.11+, Node.js 18+, Docker Desktop

### Step 1: Infrastructure
```bash
cd backend
docker-compose up -d db redis minio neo4j
```

### Step 2: Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
celery -A app.workers.celery_app worker --loglevel=info -P solo
```

### Step 3: Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Seed Admin Accounts
```
POST http://localhost:8000/api/v1/auth/seed-supervisor
```
This creates:
- `rp@gmail.com` / `admin123` (Admin)
- `rp1@gmail.com` / `rohit123` (Admin)

---

## 13. Key Innovations

| Innovation | Description |
|-----------|-------------|
| **Henssge Nomogram AI** | Combines mathematical body cooling formula with LLM reasoning for time-of-death estimation |
| **Multi-Agent Forensic AI** | 7 specialized agents work independently but share case context |
| **Evidence Hash Chain** | SHA-256 cryptographic integrity verification on every evidence item |
| **Anomaly Detection** | Automated detection of timeline gaps, cross-entity correlations, evidence imbalance |
| **Third Eye Integration** | AI-powered suspect facial composite from witness statements |
| **Async AI Pipeline** | Celery workers process evidence without blocking the UI |

---

## 14. Future Scope

- **Real-time IoT Integration** — Environmental sensors for temperature/humidity at crime scenes
- **Multilingual NLP** — Support for forensic reports in multiple languages
- **Federated Learning** — Secure multi-agency collaboration without data sharing
- **Mobile Application** — Field investigator app for on-scene evidence capture
- **3D Face Reconstruction** — Upgrade Third Eye from text descriptions to 3D facial models

---

## 15. Conclusion

This system demonstrates how AI can augment forensic investigation workflows by automating evidence triage, providing intelligent analysis, and maintaining legal-grade evidence integrity. It serves as a **support tool** for forensic experts — accelerating investigations while keeping human judgment at the center of every decision.

---

> **Built with:** FastAPI · React · MongoDB · Neo4j · Milvus · Redis · Celery · spaCy · PyMuPDF · Featherless AI
