// ============================================================
// ALLOCATE - Resource allocation logic
// ============================================================

let rankedAreas = [];
let availableResources = [];
let currentDisasterId = null;

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
    } catch (error) {
        console.error('Error loading disaster:', error);
        document.getElementById('disaster-info').innerHTML = `
            <div class="result-box error">
                <p>Failed to load disaster information.</p>
            </div>
        `;
    }
}

async function loadRankedAreas() {
    const container = document.getElementById('ranked-areas-list');

    try {
        rankedAreas = await api.getRankedAreas(currentDisasterId);

        if (rankedAreas.length === 0) {
            container.innerHTML = `
                <div class="result-box warning">
                    <div class="result-header">
                        <span class="icon">⚠️</span>
                        <h3>No Areas Ranked</h3>
                    </div>
                    <p>Please complete Step 2 (Priority Ranking) first.</p>
                    <a href="priority.html" class="btn btn-primary mt-2">Go to Step 2</a>
                </div>
            `;
            return;
        }

        container.innerHTML = `
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
                        ${rankedAreas.map(area => `
                            <tr>
                                <td>
                                    <span class="priority-rank ${area.priority_rank <= 3 ? 'top-' + area.priority_rank : ''}" style="width:30px;height:30px;font-size:0.875rem;">
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
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

    } catch (error) {
        console.error('Error loading ranked areas:', error);
        container.innerHTML = `
            <div class="result-box error">
                <p>Failed to load ranked areas. Please complete Step 2 first.</p>
                <a href="priority.html" class="btn btn-primary mt-2">Go to Step 2</a>
            </div>
        `;
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
                            <span class="text-muted">(Available: ${formatNumber(resource.total_quantity)})</span>
                        </label>
                        <input
                            type="number"
                            id="resource-${resource.resource_type.replace(/\s+/g, '-')}"
                            class="form-control resource-input"
                            data-resource-type="${resource.resource_type}"
                            min="0"
                            max="${resource.total_quantity}"
                            value="${Math.floor(resource.total_quantity * 0.8)}"
                            placeholder="Enter quantity to allocate"
                        >
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
                    <div class="resource-tag">
                        <span class="type">${type}:</span>
                        <span class="amount">${formatNumber(qty)}</span>
                    </div>
                `).join('');

            return `
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
        }).join('');

        // Build summary
        const summaryItems = Object.entries(result.resource_summary).map(([type, data]) => `
            <div class="result-item">
                <div class="value">${formatNumber(data.allocated)}</div>
                <div class="label">${type}</div>
            </div>
        `).join('');

        resultDiv.innerHTML = `
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

    } catch (error) {
        console.error('Allocation error:', error);
        showError('allocation-result', 'Failed to allocate resources. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '📦 Allocate Resources';
    }
}
