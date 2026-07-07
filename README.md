# DEA Classroom — Interactive DEA Teaching Platform

**IFHE Hyderabad | MBA Service Operations Management**

A full-stack web application for teaching Data Envelopment Analysis with separate faculty and student portals, a live Python computation engine, built-in datasets, custom data upload, and rich result interpretation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Python 3.11 + FastAPI + Uvicorn |
| Auth + DB | Firebase (Auth + Firestore + Storage) |
| DEA Engine | scipy.optimize (LP solver) + numpy + pandas |
| Hosting | Firebase Hosting (frontend) + Google Cloud Run (backend) |
| CI/CD | GitHub Actions |

---

## Architecture

```
dea-app/
├── frontend/          # React SPA — served by Firebase Hosting
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route-level pages
│   │   ├── hooks/         # Custom React hooks
│   │   └── utils/         # Firebase config, helpers
│   └── public/
│
├── backend/           # FastAPI Python server — deployed on Cloud Run
│   ├── api/           # Route handlers
│   ├── dea_engine/    # Core DEA computation (CCR, BCC, Malmquist)
│   └── data/          # Built-in datasets (JSON)
│
├── firebase/          # Firestore rules + indexes
├── .github/workflows/ # CI/CD pipelines
└── README.md
```

---

## User Roles

### Faculty
- Create and manage courses
- Upload or select built-in datasets
- Run DEA analysis with configurable parameters
- View full results with interpretation
- Access the live Python console
- Export results (PDF / CSV)
- See all student sessions and their results

### Student
- Enroll in faculty-created courses
- Run DEA on assigned datasets
- Step-by-step guided analysis mode
- View results with plain-English interpretation
- Python console (read-only by default, faculty can unlock)
- Submit analysis as assignment

---

## Features

### DEA Models Supported
- CCR (Constant Returns to Scale) — Input + Output oriented
- BCC (Variable Returns to Scale) — Input + Output oriented
- Scale Efficiency decomposition
- Slack analysis (two-stage)
- Malmquist Productivity Index (two-period)

### Built-in Datasets
1. **Bank Branches** — 5 DMUs, 2 inputs, 2 outputs (tutorial dataset)
2. **Indian PSU Banks** — 20 banks, 3 inputs, 3 outputs (RBI BSR data)
3. **District Hospitals** — 15 hospitals, 4 inputs, 4 outputs (health data)
4. **Airline Efficiency** — 8 airlines, 3 inputs, 3 outputs (DGCA data)
5. **Hotel Properties** — 12 hotels, 3 inputs, 3 outputs (FHRAI data)
6. **Engineering Colleges** — 18 colleges, 3 inputs, 3 outputs (NIRF data)

### Python Interface
- Embedded Monaco editor (VS Code engine) in the browser
- Pre-loaded with the DEA engine and current dataset
- Students can write their own LP formulations
- Faculty can run arbitrary analyses
- Code history saved to Firestore per session

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_ORG/dea-classroom.git
cd dea-classroom
```

### 2. Firebase setup
```bash
# Create a Firebase project at https://console.firebase.google.com
# Enable: Authentication (Email/Password), Firestore, Storage, Hosting

firebase login
firebase init   # select: Hosting, Firestore, Storage
```

Copy your Firebase config into `frontend/src/utils/firebase.js`.

### 3. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # Fill in your Firebase Admin SDK key path
uvicorn main:app --reload --port 8000
```

### 4. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local        # Fill in VITE_API_URL and Firebase config
npm run dev
```

### 5. Open the app
- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

---

## Deployment

### Backend → Google Cloud Run
```bash
cd backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT/dea-backend
gcloud run deploy dea-backend \
  --image gcr.io/YOUR_PROJECT/dea-backend \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated
```

### Frontend → Firebase Hosting
```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Automated via GitHub Actions
Push to `main` triggers both deployments automatically. See `.github/workflows/`.

---

## Environment Variables

### Backend `.env`
```
FIREBASE_ADMIN_SDK_KEY=./firebase-admin-key.json
CORS_ORIGINS=http://localhost:5173,https://your-app.web.app
SECRET_KEY=your-secret-key-here
```

### Frontend `.env.local`
```
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Firestore Data Model

```
users/{uid}
  role: "faculty" | "student"
  name: string
  email: string
  createdAt: timestamp

courses/{courseId}
  title: string
  facultyId: string
  enrolledStudents: [uid]
  createdAt: timestamp

sessions/{sessionId}
  userId: string
  courseId: string
  datasetId: string
  model: "CCR" | "BCC"
  orientation: "input" | "output"
  inputCols: [string]
  outputCols: [string]
  results: { ... }
  pythonCode: string
  submittedAt: timestamp | null

datasets/{datasetId}
  name: string
  description: string
  source: string
  type: "builtin" | "uploaded"
  ownerId: string
  data: [ { dmu, ...inputs, ...outputs } ]
  inputCols: [string]
  outputCols: [string]
```

---

## License
MIT — IFHE Hyderabad, 2025
# DEA Lab — IFHE Hyderabad
