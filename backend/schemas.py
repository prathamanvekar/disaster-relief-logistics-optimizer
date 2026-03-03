# ============================================================
# PYDANTIC SCHEMAS - Request/Response Models
# ============================================================

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime

# ============================================================
# PREDICTION SCHEMAS
# ============================================================

class DisasterInput(BaseModel):
    """Input for disaster severity prediction"""
    disaster_type: str = Field(..., example="Earthquake")
    disaster_subtype: Optional[str] = Field(None, example="Ground movement")
    magnitude: float = Field(..., ge=0, le=10, example=7.5)
    location_name: str = Field(..., example="Los Angeles, California")
    latitude: float = Field(..., ge=-90, le=90, example=34.0522)
    longitude: float = Field(..., ge=-180, le=180, example=-118.2437)
    continent: str = Field(..., example="Americas")
    region: str = Field(..., example="Northern America")
    month: Optional[int] = Field(None, ge=1, le=12, example=6)

class PredictionResponse(BaseModel):
    """Response from severity prediction"""
    disaster_id: int
    disaster_type: str
    location_name: str
    severity: int
    severity_label: str
    confidence: float
    probabilities: List[float]
    priority_score: float
    message: str

# ============================================================
# PRIORITY SCHEMAS
# ============================================================

class AffectedAreaInput(BaseModel):
    """Input for a single affected area"""
    area_id: int
    severity: int = Field(..., ge=0, le=3)
    population: Optional[int] = Field(None, ge=0)
    accessibility_score: Optional[float] = Field(0.5, ge=0, le=1)

class PriorityRankingInput(BaseModel):
    """Input for priority ranking"""
    disaster_id: int
    affected_areas: List[AffectedAreaInput]

class RankedArea(BaseModel):
    """A single ranked area"""
    area_id: int
    area_name: str
    priority_score: float
    priority_rank: int
    severity: int
    population: int
    accessibility_score: float

class PriorityRankingResponse(BaseModel):
    """Response from priority ranking"""
    disaster_id: int
    total_areas: int
    ranked_areas: List[RankedArea]
    message: str

# ============================================================
# ALLOCATION SCHEMAS
# ============================================================

class ResourceStock(BaseModel):
    """Available resource stock"""
    resource_type: str
    quantity_available: int

class AllocationInput(BaseModel):
    """Input for resource allocation"""
    disaster_id: int
    area_ids: List[int]
    available_resources: List[ResourceStock]

class AreaAllocation(BaseModel):
    """Allocation for a single area"""
    area_id: int
    area_name: str
    priority_score: float
    allocations: Dict[str, int]

class AllocationResponse(BaseModel):
    """Response from resource allocation"""
    disaster_id: int
    total_areas: int
    area_allocations: List[AreaAllocation]
    resource_summary: Dict[str, Dict[str, int]]
    message: str

# ============================================================
# ROUTING SCHEMAS
# ============================================================

class RouteStop(BaseModel):
    """A single stop in a route"""
    stop_order: int
    area_id: int
    area_name: str
    latitude: float
    longitude: float
    distance_from_previous_km: float
    estimated_time_mins: float
    resources_to_deliver: Dict[str, int]

class VehicleRoute(BaseModel):
    """Complete route for a vehicle"""
    vehicle_id: int
    vehicle_name: str
    vehicle_type: str
    capacity: int
    total_distance_km: float
    total_time_mins: float
    total_load: int
    stops: List[RouteStop]

class RoutingInput(BaseModel):
    """Input for route optimization"""
    disaster_id: int
    depot_lat: float
    depot_lon: float
    vehicle_ids: List[int]

class RoutingResponse(BaseModel):
    """Response from route optimization"""
    disaster_id: int
    total_vehicles: int
    total_distance_km: float
    total_time_mins: float
    routes: List[VehicleRoute]
    message: str

# ============================================================
# GENERAL SCHEMAS
# ============================================================

class Area(BaseModel):
    """Area model"""
    id: int
    name: str
    zipcode: Optional[str]
    latitude: float
    longitude: float
    population: int
    accessibility_score: float

class Resource(BaseModel):
    """Resource model"""
    id: int
    resource_type: str
    quantity: int
    unit: str
    warehouse_name: str

class Vehicle(BaseModel):
    """Vehicle model"""
    id: int
    vehicle_name: str
    vehicle_type: str
    capacity: int
    status: str

class Disaster(BaseModel):
    """Disaster model"""
    id: int
    disaster_type: str
    disaster_subtype: Optional[str]
    magnitude: Optional[float]
    location_name: str
    predicted_severity: int
    severity_label: str
    confidence: float
    priority_score: float
    status: str
    created_at: str

class DashboardStats(BaseModel):
    """Dashboard statistics"""
    total_disasters: int
    active_disasters: int
    total_areas: int
    total_resources: Dict[str, int]
    total_vehicles: int
    available_vehicles: int
    recent_disasters: List[Disaster]

class ConfigResponse(BaseModel):
    """Configuration data for frontend"""
    disaster_types: List[str]
    subtypes_by_type: Dict[str, List[str]]
    continents: List[str]
    regions: List[str]
    severity_levels: Dict[str, Dict[str, str]]
