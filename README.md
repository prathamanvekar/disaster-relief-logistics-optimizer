# Disaster Relief Logistics Optimization System

An end-to-end disaster response workflow that helps teams:

1. Predict disaster severity using a machine learning model
2. Rank affected areas by urgency
3. Allocate limited resources proportionally
4. Generate optimized delivery routes for available vehicles

This project includes a **FastAPI backend** and a **vanilla HTML/CSS/JS frontend dashboard**.

---

## Features

- **Severity Prediction (Step 1)**
  - Predicts severity level (`Low`, `Moderate`, `High`, `Critical`)
  - Returns confidence and probability distribution
  - Stores each disaster event in SQLite

- **Priority Ranking (Step 2)**
  - Ranks impacted areas by a weighted formula:
    - Severity (40%)
    - Population (35%)
    - Accessibility inverse (25%)

- **Resource Allocation (Step 3)**
  - Proportional distribution of available resources based on priority score
  - Saves allocations per area and resource type

- **Route Optimization (Step 4)**
  - Builds delivery routes with a nearest-neighbor approach
  - Uses haversine distance and estimated travel time
  - Assigns stops to available vehicles and updates status

- **Operations Dashboard**
  - Active disasters, registered areas, available vehicles, resources, and recent events

---

## Tech Stack

### Backend

- Python 3.10+
- FastAPI + Uvicorn
- SQLite
- scikit-learn, pandas, numpy
- Pydantic

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript (`fetch` API)

---

## Project Structure

```text
backend/
  main.py                 # FastAPI app entry point
  database.py             # SQLite schema + seed/load helpers
  ml_service.py           # ML model + domain rule scoring
  schemas.py              # Pydantic request/response models
  requirements.txt
  data/
    population_by_zipcode.csv
    sample_disasters.csv
  models/
    severity_model.pkl
    feature_scaler.pkl
    label_encoders.pkl
    feature_config.json
    historical_stats.json
    severity_reference.json
  routers/
    prediction.py
    priority.py
    allocation.py
    routing.py

frontend/
  index.html              # Dashboard
  predict.html            # Step 1 UI
  priority.html           # Step 2 UI
  allocate.html           # Step 3 UI
  routes.html             # Step 4 UI
  css/styles.css
  js/*.js                 # API client + page logic
```

---

## Local Setup

### 1) Clone and enter project

```bash
git clone <your-repo-url>
cd disaster
```

### 2) Backend setup

From project root:

```bash
cd backend
python -m venv .venv
```

### Activate virtual environment

**Windows (PowerShell):**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux (bash/zsh):**

```bash
source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Run backend API

```bash
python main.py
```

Backend will start on:

- `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

On startup, the app:

- Creates SQLite tables in `backend/data/disaster_relief.db`
- Seeds sample areas/resources/vehicles (first run only)
- Loads population lookup from `backend/data/population_by_zipcode.csv`
- Loads ML artifacts from `backend/models/`

### 4) Run frontend

Open a second terminal:

```bash
cd frontend
python -m http.server 5500
```

Then open:

- `http://localhost:5500/index.html`

> The frontend API base URL is `http://localhost:8000` (defined in `frontend/js/api.js`).

---

## End-to-End Workflow

1. Go to **Severity Prediction** (`predict.html`) and submit disaster details
2. Continue to **Priority Ranking** (`priority.html`) and rank affected areas
3. Continue to **Resource Allocation** (`allocate.html`) and distribute resources
4. Continue to **Route Optimization** (`routes.html`) and optimize delivery routes

The current disaster ID is stored in browser `localStorage` to carry context between steps.

---

## API Overview

### Core workflow endpoints

- `POST /api/predict/severity`
- `POST /api/priority/rank`
- `POST /api/allocate/resources`
- `POST /api/route/optimize`

### Utility endpoints

- `GET /health`
- `GET /api/dashboard/stats`
- `GET /api/predict/config`
- `GET /api/priority/areas`
- `GET /api/allocate/resources`
- `GET /api/route/vehicles`

Example health check:

```bash
curl http://localhost:8000/health
```

---

## Notes / Troubleshooting

- If prediction fails, verify these files exist in `backend/models/`:
  - `severity_model.pkl`
  - `feature_scaler.pkl`
  - `label_encoders.pkl`
  - `feature_config.json`
- If frontend cannot reach backend, confirm backend runs on port `8000` and CORS/network settings allow access.
- If PowerShell blocks script activation, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## Future Improvements (Optional)

- Add authentication and role-based access
- Add map-based route visualization (Leaflet/Mapbox)
- Add Docker setup (`docker-compose`) for one-command startup
- Add test suite for API routes and workflow validation

---

## License

No license file is currently included. Add one (for example MIT) before open-source distribution.
