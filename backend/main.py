# ============================================================
# MAIN APPLICATION - FastAPI Entry Point
# ============================================================

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

# Import routers
from routers import prediction, priority, allocation, routing

# Import database and ML service
from database import init_database, seed_sample_data, load_population_data, get_db_connection
from ml_service import get_ml_service

# ============================================================
# LIFESPAN - Startup and Shutdown Events
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("\n" + "=" * 60)
    print("🚀 STARTING DISASTER RELIEF SYSTEM")
    print("=" * 60)

    # Initialize database
    print("\n📦 Initializing Database...")
    init_database()
    seed_sample_data()
    load_population_data()

    # Load ML model
    print("\n🤖 Loading ML Model...")
    try:
        ml_service = get_ml_service()
        print("✓ ML Service initialized!")
    except Exception as e:
        print(f"⚠ ML Service error: {e}")
        print("  Make sure all model files are in the 'models' folder")

    print("\n" + "=" * 60)
    print("✅ SYSTEM READY!")
    print("=" * 60)
    print("\n📍 API Documentation: http://localhost:8000/docs")
    print("📍 Alternative Docs:  http://localhost:8000/redoc")
    print("\n")

    yield

    # Shutdown
    print("\n👋 Shutting down Disaster Relief System...")

# ============================================================
# CREATE APP
# ============================================================

app = FastAPI(
    title="Disaster Relief Logistics Optimization System",
    description="""
    An intelligent system for disaster relief logistics optimization.

    ## Features

    * **Severity Prediction** - Predict disaster severity using ML
    * **Priority Ranking** - Rank affected areas by priority
    * **Resource Allocation** - Allocate resources proportionally
    * **Route Optimization** - Optimize delivery routes

    ## Workflow

    1. POST /api/predict/severity - Predict disaster severity
    2. POST /api/priority/rank - Rank affected areas
    3. POST /api/allocate/resources - Allocate resources
    4. POST /api/route/optimize - Optimize delivery routes
    """,
    version="1.0.0",
    lifespan=lifespan
)

# ============================================================
# CORS MIDDLEWARE
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# INCLUDE ROUTERS
# ============================================================

app.include_router(prediction.router)
app.include_router(priority.router)
app.include_router(allocation.router)
app.include_router(routing.router)

# ============================================================
# ROOT ENDPOINTS
# ============================================================

@app.get("/")
async def root():
    """Root endpoint - API info"""
    return {
        "name": "Disaster Relief Logistics Optimization System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "prediction": "/api/predict",
            "priority": "/api/priority",
            "allocation": "/api/allocate",
            "routing": "/api/route"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total disasters
    cursor.execute("SELECT COUNT(*) as count FROM disasters")
    total_disasters = cursor.fetchone()['count']

    # Active disasters
    cursor.execute("SELECT COUNT(*) as count FROM disasters WHERE status = 'active'")
    active_disasters = cursor.fetchone()['count']

    # Total areas
    cursor.execute("SELECT COUNT(*) as count FROM areas")
    total_areas = cursor.fetchone()['count']

    # Total resources by type
    cursor.execute('''
        SELECT resource_type, SUM(quantity) as total
        FROM resources
        GROUP BY resource_type
    ''')
    resources = {row['resource_type']: row['total'] for row in cursor.fetchall()}

    # Vehicles
    cursor.execute("SELECT COUNT(*) as count FROM vehicles")
    total_vehicles = cursor.fetchone()['count']

    cursor.execute("SELECT COUNT(*) as count FROM vehicles WHERE status = 'available'")
    available_vehicles = cursor.fetchone()['count']

    # Recent disasters
    cursor.execute('''
        SELECT * FROM disasters
        ORDER BY created_at DESC
        LIMIT 5
    ''')
    recent_disasters = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return {
        "total_disasters": total_disasters,
        "active_disasters": active_disasters,
        "total_areas": total_areas,
        "total_resources": resources,
        "total_vehicles": total_vehicles,
        "available_vehicles": available_vehicles,
        "recent_disasters": recent_disasters
    }

# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
