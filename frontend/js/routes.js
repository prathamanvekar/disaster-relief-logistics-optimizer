// ============================================================
// ROUTES - Route optimization logic
// ============================================================

let vehicles = [];
let currentDisasterId = null;
let map = null;
let routeLayers = [];

document.addEventListener("DOMContentLoaded", async () => {
  currentDisasterId = getCurrentDisaster();

  if (!currentDisasterId) {
    document.getElementById("disaster-info").innerHTML = `
            <div class="result-box warning">
                <div class="result-header">
                    <span class="icon">⚠️</span>
                    <h3>No Disaster Selected</h3>
                </div>
                <p>Please complete Steps 1, 2, and 3 first.</p>
                <a href="predict.html" class="btn btn-primary mt-2">Go to Step 1</a>
            </div>
        `;
    return;
  }

  await loadDisasterInfo();
  await loadVehicles();
});

async function loadDisasterInfo() {
  try {
    const disaster = await api.getDisaster(currentDisasterId);

    document.getElementById("disaster-info").innerHTML = `
            <div class="flex flex-between flex-center">
                <div>
                    <h3 class="card-title">Current Disaster: #${disaster.id}</h3>
                    <p class="card-subtitle">${disaster.disaster_type} in ${disaster.location_name}</p>
                </div>
                <div class="flex gap-2">
                    <span class="badge badge-${getSeverityClass(disaster.predicted_severity)}">
                        ${disaster.severity_label}
                    </span>
                    <span class="badge badge-info">
                        Priority: ${disaster.priority_score}
                    </span>
                </div>
            </div>
        `;

    // Set depot location based on disaster location
    document.getElementById("depot-lat").value = disaster.latitude || 34.0522;
    document.getElementById("depot-lon").value =
      disaster.longitude || -118.2437;
  } catch (error) {
    console.error("Error loading disaster:", error);
    document.getElementById("disaster-info").innerHTML = `
            <div class="result-box error">
                <p>Failed to load disaster information.</p>
            </div>
        `;
  }
}

async function loadVehicles() {
  const container = document.getElementById("vehicles-list");

  try {
    vehicles = await api.getVehicles();

    if (vehicles.length === 0) {
      container.innerHTML = `<p class="text-muted">No vehicles available.</p>`;
      return;
    }

    const vehicleIcons = {
      "Heavy Truck": "🚛",
      "Cargo Van": "🚐",
      Helicopter: "🚁",
    };

    container.innerHTML = vehicles
      .map(
        (vehicle) => `
            <div class="checkbox-item ${vehicle.status !== "available" ? "disabled" : ""}" data-vehicle-id="${vehicle.id}">
                <input type="checkbox"
                       id="vehicle-${vehicle.id}"
                       value="${vehicle.id}"
                       ${vehicle.status !== "available" ? "disabled" : ""}>
                <label for="vehicle-${vehicle.id}">
                    <strong>${vehicleIcons[vehicle.vehicle_type] || "🚚"} ${vehicle.vehicle_name}</strong>
                    <br>
                    <small class="text-muted">
                        ${vehicle.vehicle_type} |
                        Capacity: ${vehicle.capacity} |
                        <span class="badge badge-${vehicle.status === "available" ? "success" : "warning"}" style="font-size:0.7rem;">
                            ${vehicle.status}
                        </span>
                    </small>
                </label>
            </div>
        `,
      )
      .join("");

    // Add click handlers
    container
      .querySelectorAll(".checkbox-item:not(.disabled)")
      .forEach((item) => {
        item.addEventListener("click", (e) => {
          if (e.target.tagName !== "INPUT") {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (!checkbox.disabled) {
              checkbox.checked = !checkbox.checked;
              item.classList.toggle("selected", checkbox.checked);
            }
          }
        });
      });

    // Auto-select available vehicles
    container
      .querySelectorAll(".checkbox-item:not(.disabled) input")
      .forEach((cb, index) => {
        if (index < 3) {
          cb.checked = true;
          cb.closest(".checkbox-item").classList.add("selected");
        }
      });
  } catch (error) {
    console.error("Error loading vehicles:", error);
    container.innerHTML = `<p class="text-danger">Failed to load vehicles.</p>`;
  }
}

async function optimizeRoutes() {
  const btn = document.getElementById("optimize-btn");
  const resultDiv = document.getElementById("routes-result");

  const selectedVehicles = Array.from(
    document.querySelectorAll('#vehicles-list input[type="checkbox"]:checked'),
  ).map((cb) => parseInt(cb.value));

  if (selectedVehicles.length === 0) {
    alert("Please select at least one vehicle");
    return;
  }

  const depotLat = parseFloat(document.getElementById("depot-lat").value);
  const depotLon = parseFloat(document.getElementById("depot-lon").value);

  if (isNaN(depotLat) || isNaN(depotLon)) {
    alert("Please enter valid depot coordinates");
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Optimizing...";

  const data = {
    disaster_id: parseInt(currentDisasterId),
    depot_lat: depotLat,
    depot_lon: depotLon,
    vehicle_ids: selectedVehicles,
  };

  try {
    const result = await api.optimizeRoutes(data);

    if (result.routes.length === 0) {
      resultDiv.innerHTML = `
                <div class="result-box warning">
                    <div class="result-header">
                        <span class="icon">⚠️</span>
                        <h3>No Routes Generated</h3>
                    </div>
                    <p>No deliverable route could be generated with the selected vehicles and depot. Try selecting more vehicles or adjusting the depot location.</p>
                    <a href="allocate.html" class="btn btn-secondary mt-2">Review Step 3</a>
                </div>
            `;
      return;
    }

    // Show map
    document.getElementById("map-card").style.display = "block";
    initializeMap(depotLat, depotLon, result.routes);

    // Build route cards
    const routeCards = result.routes
      .map((route, index) => {
        const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
        const color = colors[index % colors.length];

        const stops = route.stops
          .map(
            (stop) => `
                <div class="route-stop">
                    <div class="stop-number">${stop.stop_order}</div>
                    <div class="stop-info">
                        <h5>${stop.area_name}</h5>
                        <p>
                            ${
                              Object.entries(stop.resources_to_deliver)
                                .filter(([_, qty]) => qty > 0)
                                .map(
                                  ([type, qty]) =>
                                    `${type}: ${formatNumber(qty)}`,
                                )
                                .join(" | ") || "No resources"
                            }
                        </p>
                    </div>
                    <div class="stop-distance">
                        <div class="km">${stop.distance_from_previous_km.toFixed(1)} km</div>
                        <div class="time">${stop.estimated_time_mins.toFixed(0)} min</div>
                    </div>
                </div>
            `,
          )
          .join("");

        return `
                <div class="route-card">
                    <div class="route-header" style="border-left: 4px solid ${color};">
                        <h4>
                            <span style="color: ${color};">●</span>
                            ${route.vehicle_name}
                        </h4>
                        <div class="route-stats">
                            <span>Type: <strong>${route.vehicle_type}</strong></span>
                            <span>Distance: <strong>${route.total_distance_km.toFixed(1)} km</strong></span>
                            <span>Time: <strong>${route.total_time_mins.toFixed(0)} min</strong></span>
                            <span>Load: <strong>${route.total_load} units</strong></span>
                        </div>
                    </div>
                    <div class="route-stops">
                        ${stops}
                    </div>
                </div>
            `;
      })
      .join("");

    resultDiv.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">✅ Routes Optimized</h3>
                        <p class="card-subtitle">
                            ${result.total_vehicles} vehicles |
                            Total Distance: ${result.total_distance_km.toFixed(1)} km |
                            Total Time: ${result.total_time_mins.toFixed(0)} min
                        </p>
                    </div>
                </div>

                ${routeCards}
            </div>
        `;

    // Show workflow complete
    document.getElementById("workflow-complete").style.display = "block";

    // Reload vehicles to show updated status
    await loadVehicles();
  } catch (error) {
    console.error("Route optimization error:", error);
    showError("routes-result", `Failed to optimize routes: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = "🚚 Optimize Routes";
  }
}

function initializeMap(depotLat, depotLon, routes) {
  // Clear existing map
  if (map) {
    map.remove();
  }

  // Clear existing layers
  routeLayers = [];

  // Initialize map
  map = L.map("map").setView([depotLat, depotLon], 5);

  // Add tile layer (OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Add depot marker
  const depotIcon = L.divIcon({
    className: "depot-marker",
    html: '<div style="background:#1e40af;color:white;padding:8px;border-radius:50%;font-size:16px;text-align:center;width:36px;height:36px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏭</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  L.marker([depotLat, depotLon], { icon: depotIcon })
    .addTo(map)
    .bindPopup(
      "<h4>📦 Depot / Warehouse</h4><p>Starting point for all deliveries</p>",
    );

  const colors = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];
  const allCoords = [[depotLat, depotLon]];

  routes.forEach((route, routeIndex) => {
    const color = colors[routeIndex % colors.length];
    const routeCoords = [[depotLat, depotLon]];

    route.stops.forEach((stop, stopIndex) => {
      const coords = [stop.latitude, stop.longitude];
      routeCoords.push(coords);
      allCoords.push(coords);

      // Create custom icon for stop
      const stopIcon = L.divIcon({
        className: "stop-marker",
        html: `<div style="background:${color};color:white;padding:4px 8px;border-radius:50%;font-size:12px;font-weight:bold;text-align:center;min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.2);">${stop.stop_order}</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Add marker
      L.marker(coords, { icon: stopIcon }).addTo(map).bindPopup(`
                    <h4>${stop.area_name}</h4>
                    <p><strong>Stop #${stop.stop_order}</strong> on ${route.vehicle_name}</p>
                    <p>Distance: ${stop.distance_from_previous_km.toFixed(1)} km</p>
                    <p>ETA: ${stop.estimated_time_mins.toFixed(0)} min</p>
                `);
    });

    // Draw route line
    const polyline = L.polyline(routeCoords, {
      color: color,
      weight: 3,
      opacity: 0.8,
      dashArray: "10, 5",
    }).addTo(map);

    routeLayers.push(polyline);
  });

  // Fit map to show all markers
  if (allCoords.length > 1) {
    const bounds = L.latLngBounds(allCoords);
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

async function resetVehicles() {
  const btn = document.querySelector('button[onclick="resetVehicles()"]');
  btn.disabled = true;
  btn.textContent = "⏳ Resetting...";

  try {
    // Reset all dispatched vehicles
    for (const vehicle of vehicles) {
      if (vehicle.status === "dispatched") {
        await api.resetVehicle(vehicle.id);
      }
    }

    // Reload vehicles
    await loadVehicles();

    alert("All vehicles reset to available status.");
  } catch (error) {
    console.error("Error resetting vehicles:", error);
    alert("Failed to reset vehicles.");
  } finally {
    btn.disabled = false;
    btn.textContent = "🔄 Reset Vehicles";
  }
}
