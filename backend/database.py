# ============================================================
# DATABASE SETUP - SQLite with all tables
# ============================================================

import sqlite3
import os
import pandas as pd
from pathlib import Path

DATABASE_PATH = "data/disaster_relief.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with all tables"""

    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)

    conn = get_db_connection()
    cursor = conn.cursor()

    # ============================================================
    # TABLE 1: Areas (affected areas/locations)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            zipcode TEXT,
            latitude REAL,
            longitude REAL,
            population INTEGER DEFAULT 0,
            accessibility_score REAL DEFAULT 0.5,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ============================================================
    # TABLE 2: Resources (available supplies)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            resource_type TEXT NOT NULL,
            quantity INTEGER DEFAULT 0,
            unit TEXT DEFAULT 'units',
            warehouse_name TEXT,
            warehouse_lat REAL,
            warehouse_lon REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ============================================================
    # TABLE 3: Vehicles (for delivery)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_name TEXT NOT NULL,
            vehicle_type TEXT,
            capacity INTEGER DEFAULT 100,
            current_lat REAL,
            current_lon REAL,
            status TEXT DEFAULT 'available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ============================================================
    # TABLE 4: Disasters (disaster events)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS disasters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_type TEXT NOT NULL,
            disaster_subtype TEXT,
            magnitude REAL,
            location_name TEXT,
            latitude REAL,
            longitude REAL,
            continent TEXT,
            region TEXT,
            predicted_severity INTEGER,
            severity_label TEXT,
            confidence REAL,
            priority_score REAL,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ============================================================
    # TABLE 5: Affected Areas (links disasters to areas)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS affected_areas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_id INTEGER,
            area_id INTEGER,
            severity INTEGER,
            population_affected INTEGER,
            priority_score REAL,
            priority_rank INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (disaster_id) REFERENCES disasters(id),
            FOREIGN KEY (area_id) REFERENCES areas(id)
        )
    ''')

    # ============================================================
    # TABLE 6: Allocations (resource allocations)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS allocations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_id INTEGER,
            area_id INTEGER,
            resource_type TEXT,
            quantity_allocated INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (disaster_id) REFERENCES disasters(id),
            FOREIGN KEY (area_id) REFERENCES areas(id)
        )
    ''')

    # ============================================================
    # TABLE 7: Routes (optimized delivery routes)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            disaster_id INTEGER,
            vehicle_id INTEGER,
            route_order INTEGER,
            area_id INTEGER,
            distance_km REAL,
            estimated_time_mins REAL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (disaster_id) REFERENCES disasters(id),
            FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
            FOREIGN KEY (area_id) REFERENCES areas(id)
        )
    ''')

    # ============================================================
    # TABLE 8: Population Lookup (from CSV)
    # ============================================================
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS population_lookup (
            zipcode TEXT PRIMARY KEY,
            total_population INTEGER
        )
    ''')

    conn.commit()
    conn.close()

    print("✓ Database tables created successfully!")

def seed_sample_data():
    """Seed database with sample data for testing"""

    conn = get_db_connection()
    cursor = conn.cursor()

    # Make seed idempotent so new demo locations can be added on existing DBs.
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_name ON areas(name)")
    cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_name ON vehicles(vehicle_name)")
    cursor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_resources_type_warehouse ON resources(resource_type, warehouse_name)"
    )

    # ============================================================
    # SEED AREAS (US + India + Japan for region-relevant demos)
    # ============================================================
    areas = [
        ("Los Angeles Downtown", "90012", 34.0522, -118.2437, 50000, 0.8),
        ("San Francisco Bay", "94102", 37.7749, -122.4194, 75000, 0.7),
        ("Houston Central", "77001", 29.7604, -95.3698, 65000, 0.85),
        ("Miami Beach", "33139", 25.7907, -80.1300, 45000, 0.6),
        ("New York Manhattan", "10001", 40.7484, -73.9967, 90000, 0.5),
        ("Chicago Loop", "60601", 41.8781, -87.6298, 55000, 0.75),
        ("Phoenix Central", "85001", 33.4484, -112.0740, 40000, 0.9),
        ("Seattle Downtown", "98101", 47.6062, -122.3321, 60000, 0.7),
        ("Denver Central", "80202", 39.7392, -104.9903, 35000, 0.85),
        ("Atlanta Midtown", "30308", 33.7815, -84.3830, 48000, 0.8),
        ("Boston Downtown", "02108", 42.3554, -71.0640, 52000, 0.65),
        ("Dallas Downtown", "75201", 32.7872, -96.7985, 58000, 0.8),
        ("San Diego Bay", "92101", 32.7157, -117.1611, 42000, 0.75),
        ("Portland Central", "97201", 45.5152, -122.6784, 38000, 0.8),
        ("Las Vegas Strip", "89109", 36.1147, -115.1728, 55000, 0.85),
        ("Tokyo Shinjuku", "1600022", 35.6938, 139.7034, 92000, 0.82),
        ("Tokyo Shibuya", "1500002", 35.6595, 139.7005, 88000, 0.8),
        ("Yokohama Port", "2310002", 35.4437, 139.6380, 74000, 0.78),
        ("Osaka Namba", "5420076", 34.6672, 135.5010, 70000, 0.76),
        ("Osaka Umeda", "5300001", 34.7024, 135.4959, 69000, 0.79),
        ("Kyoto Central", "6008216", 35.0116, 135.7681, 56000, 0.74),
        ("Kobe Harbor", "6500044", 34.6901, 135.1955, 52000, 0.73),
        ("Nagoya Sakae", "4600008", 35.1709, 136.9086, 61000, 0.77),
        ("Sapporo Central", "0600001", 43.0618, 141.3545, 58000, 0.71),
        ("Fukuoka Hakata", "8120011", 33.5902, 130.4017, 55000, 0.75),
        ("Sendai Station", "9800021", 38.2600, 140.8825, 50000, 0.72),
        ("Naha Okinawa", "9000015", 26.2124, 127.6809, 39000, 0.69),
        ("Mumbai South", "400001", 18.9388, 72.8354, 110000, 0.58),
        ("Mumbai Andheri", "400053", 19.1136, 72.8697, 98000, 0.62),
        ("Delhi Central", "110001", 28.6315, 77.2167, 125000, 0.54),
        ("Delhi Rohini", "110085", 28.7495, 77.0565, 86000, 0.6),
        ("Bengaluru Central", "560001", 12.9716, 77.5946, 102000, 0.66),
        ("Bengaluru Whitefield", "560066", 12.9698, 77.75, 82000, 0.7),
        ("Chennai Marina", "600001", 13.0827, 80.2707, 91000, 0.64),
        ("Hyderabad Gachibowli", "500032", 17.4401, 78.3489, 84000, 0.68),
        ("Kolkata Central", "700001", 22.5726, 88.3639, 99000, 0.57),
        ("Pune Shivajinagar", "411005", 18.5314, 73.8446, 76000, 0.67),
        ("Ahmedabad Central", "380001", 23.0225, 72.5714, 79000, 0.65),
        ("Jaipur Walled City", "302002", 26.9124, 75.7873, 68000, 0.61),
        ("Lucknow Hazratganj", "226001", 26.8467, 80.9462, 72000, 0.62),
        ("Kochi Ernakulam", "682011", 9.9816, 76.2999, 59000, 0.72),
    ]

    cursor.executemany('''
        INSERT OR IGNORE INTO areas (name, zipcode, latitude, longitude, population, accessibility_score)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', areas)

    # ============================================================
    # SEED RESOURCES (Available supplies)
    # ============================================================
    resources = [
        ("Food Packets", 10000, "packets", "Central Warehouse LA", 34.0522, -118.2437),
        ("Water Bottles", 25000, "liters", "Central Warehouse LA", 34.0522, -118.2437),
        ("Medical Kits", 2000, "kits", "Central Warehouse LA", 34.0522, -118.2437),
        ("Blankets", 5000, "pieces", "Central Warehouse LA", 34.0522, -118.2437),
        ("Tents", 500, "units", "Central Warehouse LA", 34.0522, -118.2437),
        ("Food Packets", 8000, "packets", "East Warehouse NY", 40.7484, -73.9967),
        ("Water Bottles", 20000, "liters", "East Warehouse NY", 40.7484, -73.9967),
        ("Medical Kits", 1500, "kits", "East Warehouse NY", 40.7484, -73.9967),
        ("Blankets", 4000, "pieces", "East Warehouse NY", 40.7484, -73.9967),
        ("Generators", 100, "units", "East Warehouse NY", 40.7484, -73.9967),
    ]

    cursor.executemany('''
        INSERT OR IGNORE INTO resources (resource_type, quantity, unit, warehouse_name, warehouse_lat, warehouse_lon)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', resources)

    # ============================================================
    # SEED VEHICLES
    # ============================================================
    vehicles = [
        ("Truck-001", "Heavy Truck", 500, 34.0522, -118.2437, "available"),
        ("Truck-002", "Heavy Truck", 500, 34.0522, -118.2437, "available"),
        ("Van-001", "Cargo Van", 200, 34.0522, -118.2437, "available"),
        ("Van-002", "Cargo Van", 200, 34.0522, -118.2437, "available"),
        ("Truck-003", "Heavy Truck", 500, 40.7484, -73.9967, "available"),
        ("Van-003", "Cargo Van", 200, 40.7484, -73.9967, "available"),
        ("Helicopter-001", "Helicopter", 50, 34.0522, -118.2437, "available"),
    ]

    cursor.executemany('''
        INSERT OR IGNORE INTO vehicles (vehicle_name, vehicle_type, capacity, current_lat, current_lon, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', vehicles)

    conn.commit()
    conn.close()

    print("✓ Sample data seeded/updated successfully!")

def load_population_data():
    """Load population data from CSV into database"""

    csv_path = "data/population_by_zipcode.csv"

    if not os.path.exists(csv_path):
        print(f"⚠ Population CSV not found at {csv_path}")
        return

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if already loaded
    cursor.execute("SELECT COUNT(*) FROM population_lookup")
    if cursor.fetchone()[0] > 0:
        print("✓ Population data already loaded, skipping...")
        conn.close()
        return

    # Load CSV
    df = pd.read_csv(csv_path)

    # Insert into database
    for _, row in df.iterrows():
        cursor.execute('''
            INSERT OR REPLACE INTO population_lookup (zipcode, total_population)
            VALUES (?, ?)
        ''', (str(row['zipcode']).zfill(5), int(row['total_population'])))

    conn.commit()
    conn.close()

    print(f"✓ Loaded {len(df)} ZIP codes into population_lookup table!")

def get_population_by_zipcode(zipcode: str) -> int:
    """Get population for a given ZIP code"""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT total_population FROM population_lookup
        WHERE zipcode = ?
    ''', (str(zipcode).zfill(5),))

    result = cursor.fetchone()
    conn.close()

    return result['total_population'] if result else 0

# Initialize on import
if __name__ == "__main__":
    init_database()
    seed_sample_data()
    load_population_data()
