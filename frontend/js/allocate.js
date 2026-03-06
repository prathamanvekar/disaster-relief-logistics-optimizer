// ============================================================
// ALLOCATE - Resource allocation logic
// ============================================================

let rankedAreas = [];
let availableResources = [];
let currentDisasterId = null;
<<<<<<< HEAD

document.addEventListener('DOMContentLoaded', async () => {
    currentDisasterId = getCurrentDisaster();

    if (!currentDisasterId) {
        document.getElementById('disaster-info').innerHTML = `
            <div class="result-box warning">
                <div class="result-header">
                    <span class="icon">⚠️</span>
                    <h3>No Disaster Selected</h3>
                </div>
                <p>Please complete Steps 1 and 2 first.</p>
                <a href="predict.html" class="btn btn-primary mt-2">Go to Step 1</a>
            </div>
        `;
        return;
    }

    await loadDisasterInfo();
    await loadRankedAreas();
    await loadAvailableResources();
});

async function loadDisasterInfo() {
    try {
        const disaster = await api.getDisaster(currentDisasterId);

        document.getElementById('disaster-info').innerHTML = `
            <div class="flex flex-between flex-center">
=======
let currentDisaster = null;
let availableDisasters = [];

document.addEventListener("DOMContentLoaded", async () => {
  const isReady = await initializeDisasterSelection();
  if (!isReady) {
    return;
  }

  await refreshSelectedDisasterData();
  setupEventListeners();
});

async function initializeDisasterSelection() {
  try {
    const allDisasters = await api.getAllDisasters();
    availableDisasters = allDisasters.sort((a, b) => b.id - a.id);

    if (availableDisasters.length === 0) {
      document.getElementById("disaster-info").innerHTML = `
        <div class="result-box warning">
            <div class="result-header">
                <span class="icon">⚠️</span>
                <h3>No Disasters Found</h3>
            </div>
            <p>Create at least one disaster in Step 1 to continue.</p>
            <a href="predict.html" class="btn btn-primary mt-2">Go to Step 1</a>
        </div>
      `;
      return false;
    }

    const storedDisasterId = parseInt(getCurrentDisaster(), 10);
    const selectedDisaster = availableDisasters.find(
      (d) => d.id === storedDisasterId,
    );
    currentDisasterId = selectedDisaster
      ? selectedDisaster.id
      : availableDisasters[0].id;
    setCurrentDisaster(currentDisasterId);
    return true;
  } catch (error) {
    console.error("Error loading disasters:", error);
    document.getElementById("disaster-info").innerHTML = `
      <div class="result-box error">
        <p>Failed to load disasters. Please try again.</p>
      </div>
    `;
    return false;
  }
}

function buildDisasterOptions(selectedId) {
  return availableDisasters
    .map(
      (disaster) => `
        <option value="${disaster.id}" ${disaster.id === selectedId ? "selected" : ""}>
          #${disaster.id} - ${disaster.disaster_type} (${disaster.location_name})
        </option>
      `,
    )
    .join("");
}

async function refreshSelectedDisasterData() {
  await loadDisasterInfo();
  await loadRankedAreas();
  await loadAvailableResources();
  document.getElementById("allocation-result").innerHTML = "";
}

function setupEventListeners() {
  const loadDemoBtn = document.getElementById("load-allocation-demo-btn");
  if (!loadDemoBtn) {
    return;
  }

  loadDemoBtn.addEventListener("click", loadAllocationDemoData);
}

async function loadDisasterInfo() {
  try {
    const disaster = await api.getDisaster(currentDisasterId);
    currentDisaster = disaster;

    document.getElementById("disaster-info").innerHTML = `
      <div class="flex flex-between" style="gap: 1rem; flex-wrap: wrap;">
>>>>>>> 7bc589d (push to github with readme)
                <div>
                    <h3 class="card-title">Current Disaster: #${disaster.id}</h3>
                    <p class="card-subtitle">${disaster.disaster_type} in ${disaster.location_name}</p>
                </div>
<<<<<<< HEAD
                <div class="flex gap-2">
=======
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; align-items:center;">
          <div>
            <label for="disaster-select" class="text-muted" style="display:block; font-size:0.75rem; margin-bottom:0.25rem;">Select Disaster</label>
            <select id="disaster-select" class="form-control" style="min-width: 300px;">
              ${buildDisasterOptions(disaster.id)}
            </select>
          </div>
>>>>>>> 7bc589d (push to github with readme)
                    <span class="badge badge-${getSeverityClass(disaster.predicted_severity)}">
                        ${disaster.severity_label}
                    </span>
                    <span class="badge badge-info">
                        Priority: ${disaster.priority_score}
                    </span>
                </div>
            </div>
        `;
<<<<<<< HEAD
    } catch (error) {
        console.error('Error loading disaster:', error);
        document.getElementById('disaster-info').innerHTML = `
=======

    document
      .getElementById("disaster-select")
      .addEventListener("change", async (event) => {
        currentDisasterId = parseInt(event.target.value, 10);
        setCurrentDisaster(currentDisasterId);
        await refreshSelectedDisasterData();
      });
  } catch (error) {
    console.error("Error loading disaster:", error);
    document.getElementById("disaster-info").innerHTML = `
>>>>>>> 7bc589d (push to github with readme)
            <div class="result-box error">
                <p>Failed to load disaster information.</p>
            </div>
        `;
<<<<<<< HEAD
    }
}

async function loadRankedAreas() {
    const container = document.getElementById('ranked-areas-list');

    try {
        rankedAreas = await api.getRankedAreas(currentDisasterId);

        if (rankedAreas.length === 0) {
            container.innerHTML = `
=======
  }
}

function getDemoAllocationRatio(resourceType) {
  // Prioritize essential life-support resources for demo runs.
  const baseRatios = {
    "Water Bottles": 0.9,
    "Food Packets": 0.85,
    "Medical Kits": 0.8,
    Blankets: 0.7,
    Tents: 0.65,
    Generators: 0.6,
  };

  let ratio = baseRatios[resourceType] ?? 0.75;

  // Increase allocations slightly for high/critical disasters.
  const severity = currentDisaster?.predicted_severity;
  if (severity >= 2) {
    ratio = Math.min(0.95, ratio + 0.08);
  }

  return ratio;
}

function loadAllocationDemoData() {
  const inputs = document.querySelectorAll(".resource-input");

  if (inputs.length === 0) {
    showError(
      "allocation-result",
      "Resources are still loading. Please try again in a moment.",
    );
    return;
  }

  inputs.forEach((input) => {
    const maxQty = parseInt(input.max, 10) || 0;
    const resourceType = input.dataset.resourceType;
    const ratio = getDemoAllocationRatio(resourceType);
    const suggestedQty = Math.max(1, Math.floor(maxQty * ratio));

    input.value = suggestedQty;
  });
}

async function loadRankedAreas() {
  const container = document.getElementById("ranked-areas-list");

  try {
    rankedAreas = await api.getRankedAreas(currentDisasterId);

    if (rankedAreas.length === 0) {
      container.innerHTML = `
>>>>>>> 7bc589d (push to github with readme)
                <div class="result-box warning">
                    <div class="result-header">
                        <span class="icon">⚠️</span>
                        <h3>No Areas Ranked</h3>
                    </div>
                    <p>Please complete Step 2 (Priority Ranking) first.</p>
                    <a href="priority.html" class="btn btn-primary mt-2">Go to Step 2</a>
                </div>
            `;
<<<<<<< HEAD
            return;
        }

        container.innerHTML = `
=======
      return;
    }

    container.innerHTML = `
>>>>>>> 7bc589d (push to github with readme)
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Area Name</th>
                            <th>Priority Score</th>
                            <th>Severity</th>
                            <th>Population</th>
                        </tr>
                    </thead>
                    <tbody>
<<<<<<< HEAD
                        ${rankedAreas.map(area => `
                            <tr>
                                <td>
                                    <span class="priority-rank ${area.priority_rank <= 3 ? 'top-' + area.priority_rank : ''}" style="width:30px;height:30px;font-size:0.875rem;">
=======
                        ${rankedAreas
                          .map(
                            (area) => `
                            <tr>
                                <td>
                                    <span class="priority-rank ${area.priority_rank <= 3 ? "top-" + area.priority_rank : ""}" style="width:30px;height:30px;font-size:0.875rem;">
>>>>>>> 7bc589d (push to github with readme)
                                        ${area.priority_rank}
                                    </span>
                                </td>
                                <td><strong>${area.area_name}</strong></td>
                                <td><strong>${area.priority_score.toFixed(1)}</strong></td>
                                <td>
                                    <span class="badge badge-${getSeverityClass(area.severity)}">
                                        ${getSeverityLabel(area.severity)}
                                    </span>
                                </td>
                                <td>${formatNumber(area.population_affected)}</td>
                            </tr>
<<<<<<< HEAD
                        `).join('')}
=======
                        `,
                          )
                          .join("")}
>>>>>>> 7bc589d (push to github with readme)
                    </tbody>
                </table>
            </div>
        `;
<<<<<<< HEAD

    } catch (error) {
        console.error('Error loading ranked areas:', error);
        container.innerHTML = `
=======
  } catch (error) {
    console.error("Error loading ranked areas:", error);
    container.innerHTML = `
>>>>>>> 7bc589d (push to github with readme)
            <div class="result-box error">
                <p>Failed to load ranked areas. Please complete Step 2 first.</p>
                <a href="priority.html" class="btn btn-primary mt-2">Go to Step 2</a>
            </div>
        `;
<<<<<<< HEAD
    }
}

async function loadAvailableResources() {
    const container = document.getElementById('resources-form');

    try {
        availableResources = await api.getAvailableResources();

        if (availableResources.length === 0) {
            container.innerHTML = `<p class="text-muted">No resources available in inventory.</p>`;
            return;
        }

        const icons = {
            'Food Packets': '🍞',
            'Water Bottles': '💧',
            'Medical Kits': '🏥',
            'Blankets': '🛏️',
            'Tents': '⛺',
            'Generators': '🔌'
        };

        container.innerHTML = `
            <div class="form-grid">
                ${availableResources.map(resource => `
                    <div class="form-group">
                        <label for="resource-${resource.resource_type.replace(/\s+/g, '-')}">
                            ${icons[resource.resource_type] || '📦'} ${resource.resource_type}
=======
  }
}

async function loadAvailableResources() {
  const container = document.getElementById("resources-form");

  try {
    availableResources = await api.getAvailableResources();

    if (availableResources.length === 0) {
      container.innerHTML = `<p class="text-muted">No resources available in inventory.</p>`;
      return;
    }

    const icons = {
      "Food Packets": "🍞",
      "Water Bottles": "💧",
      "Medical Kits": "🏥",
      Blankets: "🛏️",
      Tents: "⛺",
      Generators: "🔌",
    };

    container.innerHTML = `
            <div class="form-grid">
                ${availableResources
                  .map(
                    (resource) => `
                    <div class="form-group">
                        <label for="resource-${resource.resource_type.replace(/\s+/g, "-")}">
                            ${icons[resource.resource_type] || "📦"} ${resource.resource_type}
>>>>>>> 7bc589d (push to github with readme)
                            <span class="text-muted">(Available: ${formatNumber(resource.total_quantity)})</span>
                        </label>
                        <input
                            type="number"
<<<<<<< HEAD
                            id="resource-${resource.resource_type.replace(/\s+/g, '-')}"
=======
                            id="resource-${resource.resource_type.replace(/\s+/g, "-")}"
>>>>>>> 7bc589d (push to github with readme)
                            class="form-control resource-input"
                            data-resource-type="${resource.resource_type}"
                            min="0"
                            max="${resource.total_quantity}"
                            value="${Math.floor(resource.total_quantity * 0.8)}"
                            placeholder="Enter quantity to allocate"
                        >
<<<<<<< HEAD
                        <p class="form-hint">Max: ${formatNumber(resource.total_quantity)} ${resource.unit || 'units'}</p>
                    </div>
                `).join('')}
            </div>
        `;

    } catch (error) {
        console.error('Error loading resources:', error);
        container.innerHTML = `<p class="text-danger">Failed to load resources.</p>`;
    }
}

async function allocateResources() {
    const btn = document.getElementById('allocate-btn');
    const resultDiv = document.getElementById('allocation-result');

    if (rankedAreas.length === 0) {
        alert('No ranked areas available. Please complete Step 2 first.');
        return;
    }

    // Gather resource quantities
    const resourceInputs = document.querySelectorAll('.resource-input');
    const resources = [];

    resourceInputs.forEach(input => {
        const quantity = parseInt(input.value) || 0;
        if (quantity > 0) {
            resources.push({
                resource_type: input.dataset.resourceType,
                quantity_available: quantity
            });
        }
    });

    if (resources.length === 0) {
        alert('Please enter at least one resource quantity.');
        return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Allocating...';

    const data = {
        disaster_id: parseInt(currentDisasterId),
        area_ids: rankedAreas.map(a => a.area_id),
        available_resources: resources
    };

    try {
        const result = await api.allocateResources(data);

        // Build allocation cards
        const allocationCards = result.area_allocations.map(area => {
            const resourceTags = Object.entries(area.allocations)
                .filter(([_, qty]) => qty > 0)
                .map(([type, qty]) => `
=======
                        <p class="form-hint">Max: ${formatNumber(resource.total_quantity)} ${resource.unit || "units"}</p>
                    </div>
                `,
                  )
                  .join("")}
            </div>
        `;
  } catch (error) {
    console.error("Error loading resources:", error);
    container.innerHTML = `<p class="text-danger">Failed to load resources.</p>`;
  }
}

async function allocateResources() {
  const btn = document.getElementById("allocate-btn");
  const resultDiv = document.getElementById("allocation-result");

  if (rankedAreas.length === 0) {
    alert("No ranked areas available. Please complete Step 2 first.");
    return;
  }

  // Gather resource quantities
  const resourceInputs = document.querySelectorAll(".resource-input");
  const resources = [];

  resourceInputs.forEach((input) => {
    const quantity = parseInt(input.value) || 0;
    if (quantity > 0) {
      resources.push({
        resource_type: input.dataset.resourceType,
        quantity_available: quantity,
      });
    }
  });

  if (resources.length === 0) {
    alert("Please enter at least one resource quantity.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "⏳ Allocating...";

  const data = {
    disaster_id: parseInt(currentDisasterId),
    area_ids: rankedAreas.map((a) => a.area_id),
    available_resources: resources,
  };

  try {
    const result = await api.allocateResources(data);

    // Build allocation cards
    const allocationCards = result.area_allocations
      .map((area) => {
        const resourceTags = Object.entries(area.allocations)
          .filter(([_, qty]) => qty > 0)
          .map(
            ([type, qty]) => `
>>>>>>> 7bc589d (push to github with readme)
                    <div class="resource-tag">
                        <span class="type">${type}:</span>
                        <span class="amount">${formatNumber(qty)}</span>
                    </div>
<<<<<<< HEAD
                `).join('');

            return `
=======
                `,
          )
          .join("");

        return `
>>>>>>> 7bc589d (push to github with readme)
                <div class="allocation-card">
                    <div class="allocation-header">
                        <div>
                            <h4>${area.area_name}</h4>
                            <p class="text-muted">Priority Score: ${area.priority_score.toFixed(1)}</p>
                        </div>
                    </div>
                    <div class="allocation-resources">
                        ${resourceTags || '<span class="text-muted">No resources allocated</span>'}
                    </div>
                </div>
            `;
<<<<<<< HEAD
        }).join('');

        // Build summary
        const summaryItems = Object.entries(result.resource_summary).map(([type, data]) => `
=======
      })
      .join("");

    // Build summary
    const summaryItems = Object.entries(result.resource_summary)
      .map(
        ([type, data]) => `
>>>>>>> 7bc589d (push to github with readme)
            <div class="result-item">
                <div class="value">${formatNumber(data.allocated)}</div>
                <div class="label">${type}</div>
            </div>
<<<<<<< HEAD
        `).join('');

        resultDiv.innerHTML = `
=======
        `,
      )
      .join("");

    resultDiv.innerHTML = `
>>>>>>> 7bc589d (push to github with readme)
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">✅ Allocation Complete</h3>
                        <p class="card-subtitle">Resources distributed to ${result.total_areas} areas</p>
                    </div>
                </div>

                <div class="result-box success mb-3">
                    <h4>Allocation Summary</h4>
                    <div class="result-grid mt-2">
                        ${summaryItems}
                    </div>
                </div>

                <h4 class="mb-2">Allocation by Area</h4>
                ${allocationCards}

                <div class="btn-group mt-3">
                    <a href="routes.html" class="btn btn-primary btn-lg">
                        Continue to Step 4: Route Optimization →
                    </a>
                </div>
            </div>
        `;
<<<<<<< HEAD

    } catch (error) {
        console.error('Allocation error:', error);
        showError('allocation-result', 'Failed to allocate resources. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '📦 Allocate Resources';
    }
=======
  } catch (error) {
    console.error("Allocation error:", error);
    showError(
      "allocation-result",
      "Failed to allocate resources. Please try again.",
    );
  } finally {
    btn.disabled = false;
    btn.textContent = "📦 Allocate Resources";
  }
>>>>>>> 7bc589d (push to github with readme)
}
