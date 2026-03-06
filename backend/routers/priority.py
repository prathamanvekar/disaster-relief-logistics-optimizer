# ============================================================
# PRIORITY ROUTER - Priority ranking endpoints
# ============================================================

from fastapi import APIRouter, HTTPException
from typing import List
<<<<<<< HEAD
=======
import math
>>>>>>> 7bc589d (push to github with readme)

from schemas import (
    PriorityRankingInput,
    PriorityRankingResponse,
    RankedArea,
    AffectedAreaInput
)
from database import get_db_connection

router = APIRouter(prefix="/api/priority", tags=["Priority"])

<<<<<<< HEAD
=======

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in kilometers between two latitude/longitude points."""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return 6371 * c

>>>>>>> 7bc589d (push to github with readme)
def calculate_priority_score(severity: int, population: int, accessibility: float) -> float:
    """
    Calculate priority score using weighted formula

    Priority = (Severity × 0.4) + (Population_normalized × 0.35) + ((1 - Accessibility) × 0.25)

    - Higher severity = higher priority
    - Higher population = higher priority
    - Lower accessibility = higher priority (harder to reach needs more attention)
    """

    # Normalize severity to 0-1 scale (severity is 0-3)
    severity_normalized = severity / 3.0

    # Normalize population (assume max 200,000 for a single area)
    population_normalized = min(population / 200000.0, 1.0)

    # Accessibility is already 0-1, but we invert it (low accessibility = high priority)
    accessibility_factor = 1 - accessibility

    # Weighted formula
    priority_score = (
        severity_normalized * 0.4 +
        population_normalized * 0.35 +
        accessibility_factor * 0.25
    )

    # Scale to 0-100
    return round(priority_score * 100, 2)

@router.post("/rank", response_model=PriorityRankingResponse)
async def rank_priorities(input_data: PriorityRankingInput):
    """
    Step 2: Rank affected areas by priority

    Takes list of affected areas with severity, population, accessibility
    Returns sorted list with priority scores and ranks
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Check if disaster exists
        cursor.execute("SELECT * FROM disasters WHERE id = ?", (input_data.disaster_id,))
        disaster = cursor.fetchone()
        if not disaster:
            raise HTTPException(status_code=404, detail="Disaster not found")

        ranked_areas = []

        for area_input in input_data.affected_areas:
            # Get area details
            cursor.execute("SELECT * FROM areas WHERE id = ?", (area_input.area_id,))
            area = cursor.fetchone()

            if not area:
                continue

            # Use provided population or fall back to database value
            population = area_input.population or area['population']
            accessibility = area_input.accessibility_score or area['accessibility_score']

            # Calculate priority score
            priority_score = calculate_priority_score(
                severity=area_input.severity,
                population=population,
                accessibility=accessibility
            )

            ranked_areas.append({
                'area_id': area['id'],
                'area_name': area['name'],
                'priority_score': priority_score,
                'severity': area_input.severity,
                'population': population,
                'accessibility_score': accessibility
            })

        # Sort by priority score (descending)
        ranked_areas.sort(key=lambda x: x['priority_score'], reverse=True)

        # Add ranks
        for i, area in enumerate(ranked_areas):
            area['priority_rank'] = i + 1

            # Save to affected_areas table
            cursor.execute('''
                INSERT INTO affected_areas (
                    disaster_id, area_id, severity,
                    population_affected, priority_score, priority_rank
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                input_data.disaster_id,
                area['area_id'],
                area['severity'],
                area['population'],
                area['priority_score'],
                area['priority_rank']
            ))

        conn.commit()
        conn.close()

        # Convert to response model
        ranked_response = [
            RankedArea(
                area_id=a['area_id'],
                area_name=a['area_name'],
                priority_score=a['priority_score'],
                priority_rank=a['priority_rank'],
                severity=a['severity'],
                population=a['population'],
                accessibility_score=a['accessibility_score']
            )
            for a in ranked_areas
        ]

        return PriorityRankingResponse(
            disaster_id=input_data.disaster_id,
            total_areas=len(ranked_areas),
            ranked_areas=ranked_response,
            message=f"Successfully ranked {len(ranked_areas)} areas by priority"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/areas")
<<<<<<< HEAD
async def get_all_areas():
    """Get all available areas"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM areas ORDER BY name")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]
=======
async def get_all_areas(disaster_id: int = None, limit: int = 20):
    """Get available areas, optionally prioritized by disaster location relevance."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM areas")
    rows = [dict(row) for row in cursor.fetchall()]

    # Backward compatible behavior when no disaster context is provided.
    if disaster_id is None:
        conn.close()
        return sorted(rows, key=lambda x: x["name"])

    cursor.execute("SELECT * FROM disasters WHERE id = ?", (disaster_id,))
    disaster = cursor.fetchone()

    if not disaster:
        conn.close()
        raise HTTPException(status_code=404, detail="Disaster not found")

    disaster_lat = disaster["latitude"]
    disaster_lon = disaster["longitude"]
    disaster_continent = (disaster["continent"] or "").strip().lower()
    disaster_region = (disaster["region"] or "").strip().lower()

    if disaster_lat is None or disaster_lon is None:
        conn.close()
        return sorted(rows, key=lambda x: x["name"])[: max(1, min(limit, 50))]

    scored_rows = []
    for area in rows:
        distance_km = haversine_distance(
            disaster_lat,
            disaster_lon,
            area["latitude"],
            area["longitude"],
        )

        # Basic geo-buckets for demo relevance (focus on India/Japan + nearby Asia).
        area_lat = area["latitude"]
        area_lon = area["longitude"]
        in_asia_bbox = 5 <= area_lat <= 48 and 65 <= area_lon <= 146

        region_boost = 0
        if disaster_region in ["eastern asia", "southern asia"] and in_asia_bbox:
            region_boost = -500
        elif disaster_continent == "asia" and in_asia_bbox:
            region_boost = -250

        score = distance_km + region_boost

        area_copy = dict(area)
        area_copy["distance_km"] = round(distance_km, 2)
        area_copy["_rank_score"] = score
        scored_rows.append(area_copy)

    scored_rows.sort(key=lambda x: x["_rank_score"])
    selected = scored_rows[: max(1, min(limit, 50))]

    for item in selected:
        item.pop("_rank_score", None)

    conn.close()
    return selected
>>>>>>> 7bc589d (push to github with readme)

@router.get("/disaster/{disaster_id}/ranked-areas")
async def get_ranked_areas_for_disaster(disaster_id: int):
    """Get ranked areas for a specific disaster"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT aa.*, a.name as area_name, a.latitude, a.longitude
        FROM affected_areas aa
        JOIN areas a ON aa.area_id = a.id
        WHERE aa.disaster_id = ?
        ORDER BY aa.priority_rank
    ''', (disaster_id,))

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]
