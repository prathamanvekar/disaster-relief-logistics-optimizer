# ============================================================
# ROUTING ROUTER - Route optimization endpoints
# ============================================================

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Tuple
import math

from schemas import (
    RoutingInput,
    RoutingResponse,
    VehicleRoute,
    RouteStop
)
from database import get_db_connection

router = APIRouter(prefix="/api/route", tags=["Routing"])

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees)

    Returns distance in kilometers
    """
    # Convert to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))

    # Earth's radius in kilometers
    r = 6371

    return c * r

def estimate_travel_time(distance_km: float, speed_kmh: float = 50) -> float:
    """Estimate travel time in minutes"""
    return (distance_km / speed_kmh) * 60

def nearest_neighbor_route(
    depot: Tuple[float, float],
    locations: List[Tuple[int, float, float, str, Dict[str, int]]],
    capacity: int
) -> List[dict]:
    """
    Simple nearest neighbor algorithm for route optimization

    Returns ordered list of stops
    """
    if not locations:
        return []

    route = []
    current_pos = depot
    remaining = list(locations)
    current_load = 0

    while remaining:
        # Prefer nearest location that fits remaining capacity
        nearest = None
        nearest_dist = float('inf')

        for loc in remaining:
            area_id, lat, lon, name, resources = loc
            dist = haversine_distance(current_pos[0], current_pos[1], lat, lon)
            load_for_this = sum(resources.values())

            if dist < nearest_dist and (current_load + load_for_this) <= capacity:
                nearest = loc
                nearest_dist = dist

        if nearest is None:
            fallback = min(
                remaining,
                key=lambda loc: haversine_distance(
                    current_pos[0], current_pos[1], loc[1], loc[2]
                )
            )
            nearest = fallback
            nearest_dist = haversine_distance(
                current_pos[0], current_pos[1], fallback[1], fallback[2]
            )

        area_id, lat, lon, name, resources = nearest

        route.append({
            'area_id': area_id,
            'area_name': name,
            'latitude': lat,
            'longitude': lon,
            'distance_from_previous_km': round(nearest_dist, 2),
            'estimated_time_mins': round(estimate_travel_time(nearest_dist), 1),
            'resources_to_deliver': resources
        })

        current_pos = (lat, lon)
        current_load += sum(resources.values())
        remaining.remove(nearest)

    return route

@router.post("/optimize", response_model=RoutingResponse)
async def optimize_routes(input_data: RoutingInput):
    """
    Step 4: Optimize delivery routes

    Takes depot location and vehicle IDs
    Returns optimized routes for each vehicle
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get vehicles
        vehicles = []
        for vid in input_data.vehicle_ids:
            cursor.execute("SELECT * FROM vehicles WHERE id = ?", (vid,))
            vehicle = cursor.fetchone()
            if vehicle and vehicle['status'] == 'available':
                vehicles.append(dict(vehicle))

        if not vehicles:
            raise HTTPException(status_code=400, detail="No available vehicles found")

        # Get affected areas with allocations for this disaster
        cursor.execute('''
            SELECT
                a.id as area_id,
                a.name,
                a.latitude,
                a.longitude,
                aa.priority_rank
            FROM affected_areas aa
            JOIN areas a ON aa.area_id = a.id
            WHERE aa.disaster_id = ?
            ORDER BY aa.priority_rank
        ''', (input_data.disaster_id,))

        areas = cursor.fetchall()

        if not areas:
            raise HTTPException(status_code=400, detail="No affected areas found for this disaster")

        # Get allocations for each area
        locations = []
        for area in areas:
            cursor.execute('''
                SELECT resource_type, quantity_allocated
                FROM allocations
                WHERE disaster_id = ? AND area_id = ?
            ''', (input_data.disaster_id, area['area_id']))

            alloc_rows = cursor.fetchall()
            allocations = {row['resource_type']: row['quantity_allocated'] for row in alloc_rows}

            if allocations:  # Only include areas with allocations
                locations.append((
                    area['area_id'],
                    area['latitude'],
                    area['longitude'],
                    area['name'],
                    allocations
                ))

        if not locations:
            raise HTTPException(status_code=400, detail="No allocations found for this disaster")

        # Distribute locations among vehicles
        depot = (input_data.depot_lat, input_data.depot_lon)
        vehicle_routes = []
        total_distance = 0
        total_time = 0

        # Simple distribution: divide locations among vehicles
        locations_per_vehicle = len(locations) // len(vehicles) + 1

        for i, vehicle in enumerate(vehicles):
            # Get subset of locations for this vehicle
            start_idx = i * locations_per_vehicle
            end_idx = min(start_idx + locations_per_vehicle, len(locations))
            vehicle_locations = locations[start_idx:end_idx]

            if not vehicle_locations:
                continue

            # Optimize route for this vehicle
            route_stops = nearest_neighbor_route(
                depot=depot,
                locations=vehicle_locations,
                capacity=vehicle['capacity']
            )

            if not route_stops:
                continue

            # Add stop order
            for j, stop in enumerate(route_stops):
                stop['stop_order'] = j + 1

            # Calculate totals for this route
            route_distance = sum(s['distance_from_previous_km'] for s in route_stops)
            route_time = sum(s['estimated_time_mins'] for s in route_stops)
            route_load = sum(
                sum(s['resources_to_deliver'].values())
                for s in route_stops
            )

            # Save route to database
            for stop in route_stops:
                cursor.execute('''
                    INSERT INTO routes (
                        disaster_id, vehicle_id, route_order, area_id,
                        distance_km, estimated_time_mins, status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    input_data.disaster_id,
                    vehicle['id'],
                    stop['stop_order'],
                    stop['area_id'],
                    stop['distance_from_previous_km'],
                    stop['estimated_time_mins'],
                    'pending'
                ))

            # Update vehicle status
            cursor.execute(
                "UPDATE vehicles SET status = 'dispatched' WHERE id = ?",
                (vehicle['id'],)
            )

            vehicle_routes.append(VehicleRoute(
                vehicle_id=vehicle['id'],
                vehicle_name=vehicle['vehicle_name'],
                vehicle_type=vehicle['vehicle_type'],
                capacity=vehicle['capacity'],
                total_distance_km=round(route_distance, 2),
                total_time_mins=round(route_time, 1),
                total_load=route_load,
                stops=[RouteStop(**stop) for stop in route_stops]
            ))

            total_distance += route_distance
            total_time += route_time

        conn.commit()
        conn.close()

        return RoutingResponse(
            disaster_id=input_data.disaster_id,
            total_vehicles=len(vehicle_routes),
            total_distance_km=round(total_distance, 2),
            total_time_mins=round(total_time, 1),
            routes=vehicle_routes,
            message=f"Optimized routes for {len(vehicle_routes)} vehicles"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/vehicles")
async def get_all_vehicles():
    """Get all vehicles"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM vehicles ORDER BY vehicle_name")
    rows = cursor.fetchall()
    conn.close()

    return [dict(row) for row in rows]

@router.get("/disaster/{disaster_id}/routes")
async def get_routes_for_disaster(disaster_id: int):
    """Get all routes for a specific disaster"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT
            r.*,
            v.vehicle_name,
            v.vehicle_type,
            a.name as area_name,
            a.latitude,
            a.longitude
        FROM routes r
        JOIN vehicles v ON r.vehicle_id = v.id
        JOIN areas a ON r.area_id = a.id
        WHERE r.disaster_id = ?
        ORDER BY r.vehicle_id, r.route_order
    ''', (disaster_id,))

    rows = cursor.fetchall()
    conn.close()

    # Group by vehicle
    result = {}
    for row in rows:
        vid = row['vehicle_id']
        if vid not in result:
            result[vid] = {
                'vehicle_id': vid,
                'vehicle_name': row['vehicle_name'],
                'vehicle_type': row['vehicle_type'],
                'stops': []
            }
        result[vid]['stops'].append({
            'stop_order': row['route_order'],
            'area_id': row['area_id'],
            'area_name': row['area_name'],
            'latitude': row['latitude'],
            'longitude': row['longitude'],
            'distance_km': row['distance_km'],
            'estimated_time_mins': row['estimated_time_mins'],
            'status': row['status']
        })

    return list(result.values())

@router.put("/vehicles/{vehicle_id}/reset")
async def reset_vehicle_status(vehicle_id: int):
    """Reset vehicle status to available"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute(
        "UPDATE vehicles SET status = 'available' WHERE id = ?",
        (vehicle_id,)
    )

    conn.commit()
    conn.close()

    return {"message": f"Vehicle {vehicle_id} reset to available"}
