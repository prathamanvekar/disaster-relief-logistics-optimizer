# ============================================================
# ALLOCATION ROUTER - Resource allocation endpoints
# ============================================================

from fastapi import APIRouter, HTTPException
from typing import List, Dict

from schemas import (
    AllocationInput,
    AllocationResponse,
    AreaAllocation,
    ResourceStock
)
from database import get_db_connection

router = APIRouter(prefix="/api/allocate", tags=["Allocation"])

def proportional_allocation(
    priority_scores: Dict[int, float],
    available_resources: Dict[str, int]
) -> Dict[int, Dict[str, int]]:
    """
    Allocate resources proportionally based on priority scores

    Areas with higher priority get more resources
    """

    # Calculate total priority
    total_priority = sum(priority_scores.values())

    if total_priority == 0:
        # Equal distribution if no priorities
        num_areas = len(priority_scores)
        allocations = {}
        for area_id in priority_scores:
            allocations[area_id] = {
                res: qty // num_areas
                for res, qty in available_resources.items()
            }
        return allocations

    # Calculate proportional allocations
    allocations = {}

    for area_id, priority in priority_scores.items():
        proportion = priority / total_priority

        allocations[area_id] = {
            resource: int(quantity * proportion)
            for resource, quantity in available_resources.items()
        }

    return allocations

@router.post("/resources", response_model=AllocationResponse)
async def allocate_resources(input_data: AllocationInput):
    """
    Step 3: Allocate resources to affected areas

    Takes priority scores and available resources
    Returns proportional allocation for each area
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get priority scores for the affected areas
        priority_scores = {}
        area_names = {}

        for area_id in input_data.area_ids:
            # First check affected_areas table for this disaster
            cursor.execute('''
                SELECT aa.priority_score, a.name
                FROM affected_areas aa
                JOIN areas a ON aa.area_id = a.id
                WHERE aa.disaster_id = ? AND aa.area_id = ?
            ''', (input_data.disaster_id, area_id))

            row = cursor.fetchone()

            if row:
                priority_scores[area_id] = row['priority_score']
                area_names[area_id] = row['name']
            else:
                # Fallback: get area info directly
                cursor.execute("SELECT * FROM areas WHERE id = ?", (area_id,))
                area = cursor.fetchone()
                if area:
                    priority_scores[area_id] = 50.0  # Default priority
                    area_names[area_id] = area['name']

        if not priority_scores:
            raise HTTPException(status_code=400, detail="No valid areas found")

        # Convert available resources to dict
        available = {r.resource_type: r.quantity_available for r in input_data.available_resources}

        # Calculate allocations
        allocations = proportional_allocation(priority_scores, available)

        # Save allocations to database and build response
        area_allocations = []
        resource_summary = {res: {'available': qty, 'allocated': 0} for res, qty in available.items()}

        for area_id, resources in allocations.items():
            # Save each resource allocation
            for resource_type, quantity in resources.items():
                cursor.execute('''
                    INSERT INTO allocations (
                        disaster_id, area_id, resource_type, quantity_allocated
                    ) VALUES (?, ?, ?, ?)
                ''', (input_data.disaster_id, area_id, resource_type, quantity))

                resource_summary[resource_type]['allocated'] += quantity

            area_allocations.append(AreaAllocation(
                area_id=area_id,
                area_name=area_names.get(area_id, f"Area {area_id}"),
                priority_score=priority_scores[area_id],
                allocations=resources
            ))

        conn.commit()
        conn.close()

        # Sort by priority score descending
        area_allocations.sort(key=lambda x: x.priority_score, reverse=True)

        return AllocationResponse(
            disaster_id=input_data.disaster_id,
            total_areas=len(area_allocations),
            area_allocations=area_allocations,
            resource_summary=resource_summary,
            message=f"Resources allocated to {len(area_allocations)} areas"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/resources")
async def get_available_resources():
    """Get all available resources grouped by type"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT resource_type, SUM(quantity) as total_quantity, unit, warehouse_name
        FROM resources
        GROUP BY resource_type
    ''')

    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

@router.get("/disaster/{disaster_id}/allocations")
async def get_allocations_for_disaster(disaster_id: int):
    """Get all allocations for a specific disaster"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT al.*, a.name as area_name
        FROM allocations al
        JOIN areas a ON al.area_id = a.id
        WHERE al.disaster_id = ?
        ORDER BY al.area_id, al.resource_type
    ''', (disaster_id,))

    rows = cursor.fetchall()
    conn.close()

    # Group by area
    result = {}
    for row in rows:
        area_id = row['area_id']
        if area_id not in result:
            result[area_id] = {
                'area_id': area_id,
                'area_name': row['area_name'],
                'allocations': {}
            }
        result[area_id]['allocations'][row['resource_type']] = row['quantity_allocated']

    return list(result.values())
