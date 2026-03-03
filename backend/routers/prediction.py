# ============================================================
# PREDICTION ROUTER - Severity prediction endpoints
# ============================================================

from fastapi import APIRouter, HTTPException
from datetime import datetime

from schemas import DisasterInput, PredictionResponse, ConfigResponse
from ml_service import get_ml_service
from database import get_db_connection

router = APIRouter(prefix="/api/predict", tags=["Prediction"])

@router.post("/severity", response_model=PredictionResponse)
async def predict_severity(disaster: DisasterInput):
    """
    Step 1: Predict disaster severity

    Takes disaster details and returns:
    - Severity level (0-3)
    - Severity label (Low/Moderate/High/Critical)
    - Confidence score
    - Priority score
    """
    try:
        ml_service = get_ml_service()

        # Get current month if not provided
        month = disaster.month or datetime.now().month

        # Make prediction
        result = ml_service.predict_severity(
            disaster_type=disaster.disaster_type,
            disaster_subtype=disaster.disaster_subtype,
            continent=disaster.continent,
            region=disaster.region,
            month=month,
            magnitude=disaster.magnitude,
            duration_months=0,
            year=datetime.now().year
        )

        # Save to database
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO disasters (
                disaster_type, disaster_subtype, magnitude,
                location_name, latitude, longitude,
                continent, region,
                predicted_severity, severity_label, confidence, priority_score,
                status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            disaster.disaster_type,
            disaster.disaster_subtype,
            disaster.magnitude,
            disaster.location_name,
            disaster.latitude,
            disaster.longitude,
            disaster.continent,
            disaster.region,
            result['severity'],
            result['severity_label'],
            result['confidence'],
            result['priority_score'],
            'active'
        ))

        disaster_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return PredictionResponse(
            disaster_id=disaster_id,
            disaster_type=disaster.disaster_type,
            location_name=disaster.location_name,
            severity=result['severity'],
            severity_label=result['severity_label'],
            confidence=result['confidence'],
            probabilities=result['probabilities'],
            priority_score=result['priority_score'],
            message=f"Severity predicted successfully. Level: {result['severity_label']}"
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config", response_model=ConfigResponse)
async def get_prediction_config():
    """
    Get configuration for prediction form

    Returns disaster types, subtypes, continents, regions
    """
    try:
        ml_service = get_ml_service()

        return ConfigResponse(
            disaster_types=ml_service.get_disaster_types(),
            subtypes_by_type=ml_service.get_subtypes_by_type(),
            continents=ml_service.get_continents(),
            regions=ml_service.get_regions(),
            severity_levels=ml_service.get_severity_reference().get('severity_levels', {})
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/disaster/{disaster_id}")
async def get_disaster(disaster_id: int):
    """Get a specific disaster by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM disasters WHERE id = ?", (disaster_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail="Disaster not found")

    return dict(row)

@router.get("/disasters")
async def get_all_disasters():
    """Get all disasters"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM disasters ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]
