// ============================================================
// API SERVICE - All API calls to backend
// ============================================================

const API_BASE_URL = "http://localhost:8000";

const api = {
  // ============================================================
  // PREDICTION ENDPOINTS
  // ============================================================

  async predictSeverity(disasterData) {
    const response = await fetch(`${API_BASE_URL}/api/predict/severity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(disasterData),
    });
    if (!response.ok) throw new Error("Failed to predict severity");
    return response.json();
  },

  async getConfig() {
    const response = await fetch(`${API_BASE_URL}/api/predict/config`);
    if (!response.ok) throw new Error("Failed to get config");
    return response.json();
  },

  async getDisaster(disasterId) {
    const response = await fetch(
      `${API_BASE_URL}/api/predict/disaster/${disasterId}`,
    );
    if (!response.ok) throw new Error("Failed to get disaster");
    return response.json();
  },

  async getAllDisasters() {
    const response = await fetch(`${API_BASE_URL}/api/predict/disasters`);
    if (!response.ok) throw new Error("Failed to get disasters");
    return response.json();
  },

  // ============================================================
  // PRIORITY ENDPOINTS
  // ============================================================

  async rankPriorities(data) {
    const response = await fetch(`${API_BASE_URL}/api/priority/rank`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to rank priorities");
    return response.json();
  },

<<<<<<< HEAD
  async getAreas() {
    const response = await fetch(`${API_BASE_URL}/api/priority/areas`);
=======
  async getAreas(options = {}) {
    const params = new URLSearchParams();
    if (options.disasterId) {
      params.set("disaster_id", String(options.disasterId));
    }
    if (options.limit) {
      params.set("limit", String(options.limit));
    }

    const query = params.toString();
    const response = await fetch(
      `${API_BASE_URL}/api/priority/areas${query ? `?${query}` : ""}`,
    );
>>>>>>> 7bc589d (push to github with readme)
    if (!response.ok) throw new Error("Failed to get areas");
    return response.json();
  },

  async getRankedAreas(disasterId) {
    const response = await fetch(
      `${API_BASE_URL}/api/priority/disaster/${disasterId}/ranked-areas`,
    );
    if (!response.ok) throw new Error("Failed to get ranked areas");
    return response.json();
  },

  // ============================================================
  // ALLOCATION ENDPOINTS
  // ============================================================

  async allocateResources(data) {
    const response = await fetch(`${API_BASE_URL}/api/allocate/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to allocate resources");
    return response.json();
  },

  async getAvailableResources() {
    const response = await fetch(`${API_BASE_URL}/api/allocate/resources`);
    if (!response.ok) throw new Error("Failed to get resources");
    return response.json();
  },

  async getAllocations(disasterId) {
    const response = await fetch(
      `${API_BASE_URL}/api/allocate/disaster/${disasterId}/allocations`,
    );
    if (!response.ok) throw new Error("Failed to get allocations");
    return response.json();
  },

  // ============================================================
  // ROUTING ENDPOINTS
  // ============================================================

  async optimizeRoutes(data) {
    const response = await fetch(`${API_BASE_URL}/api/route/optimize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      let message = "Failed to optimize routes";
      try {
        const errorData = await response.json();
        if (errorData?.detail) {
          message = errorData.detail;
        }
      } catch (_) {}
      throw new Error(message);
    }
    return response.json();
  },

  async getVehicles() {
    const response = await fetch(`${API_BASE_URL}/api/route/vehicles`);
    if (!response.ok) throw new Error("Failed to get vehicles");
    return response.json();
  },

  async getRoutes(disasterId) {
    const response = await fetch(
      `${API_BASE_URL}/api/route/disaster/${disasterId}/routes`,
    );
    if (!response.ok) throw new Error("Failed to get routes");
    return response.json();
  },

  async resetVehicle(vehicleId) {
    const response = await fetch(
      `${API_BASE_URL}/api/route/vehicles/${vehicleId}/reset`,
      {
        method: "PUT",
      },
    );
    if (!response.ok) throw new Error("Failed to reset vehicle");
    return response.json();
  },

  // ============================================================
  // DASHBOARD ENDPOINTS
  // ============================================================

  async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    if (!response.ok) throw new Error("Failed to get dashboard stats");
    return response.json();
  },

  async healthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) throw new Error("Server not responding");
    return response.json();
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function showLoading(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
  }
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.innerHTML = `
            <div class="result-box error">
                <div class="result-header">
                    <span class="icon">❌</span>
                    <h3>Error</h3>
                </div>
                <p>${message}</p>
            </div>
        `;
  }
}

function getSeverityClass(severity) {
  const classes = ["low", "moderate", "high", "critical"];
  return classes[severity] || "low";
}

function getSeverityLabel(severity) {
  const labels = ["Low", "Moderate", "High", "Critical"];
  return labels[severity] || "Unknown";
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// Store current disaster ID for workflow
function setCurrentDisaster(disasterId) {
  localStorage.setItem("currentDisasterId", disasterId);
}

function getCurrentDisaster() {
  return localStorage.getItem("currentDisasterId");
}
