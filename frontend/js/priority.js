// ============================================================
// PRIORITY - Priority ranking logic
// ============================================================

let areas = [];
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
                <p>Please complete Step 1 first to predict a disaster severity.</p>
                <a href="predict.html" class="btn btn-primary mt-2">Go to Step 1</a>
            </div>
        `;
        return;
    }

    await loadDisasterInfo();
    await loadAreas();
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

async function loadAreas() {
    const container = document.getElementById('areas-list');

    try {
        areas = await api.getAreas();

        container.innerHTML = areas.map(area => `
            <div class="checkbox-item" data-area-id="${area.id}">
                <input type="checkbox" id="area-${area.id}" value="${area.id}">
                <label for="area-${area.id}">
                    <strong>${area.name}</strong>
                    <br>
                    <small class="text-muted">
                        Pop: ${formatNumber(area.population)} |
                        Access: ${(area.accessibility_score * 100).toFixed(0)}%
                    </small>
                </label>
            </div>
        `).join('');

        // Add click handlers
        container.querySelectorAll('.checkbox-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') {
                    const checkbox = item.querySelector('input[type="checkbox"]');
                    checkbox.checked = !checkbox.checked;
                }
                item.classList.toggle('selected', item.querySelector('input').checked);
                updateSeveritySelection();
            });
        });

    } catch (error) {
        console.error('Error loading areas:', error);
        container.innerHTML = `<p class="text-danger">Failed to load areas</p>`;
    }
}

function selectAllAreas() {
    document.querySelectorAll('#areas-list input[type="checkbox"]').forEach(cb => {
        cb.checked = true;
        cb.closest('.checkbox-item').classList.add('selected');
    });
    updateSeveritySelection();
}

function updateSeveritySelection() {
    const selected = document.querySelectorAll('#areas-list input[type="checkbox"]:checked');
    const severityDiv = document.getElementById('severity-selection');

    if (selected.length > 0) {
        severityDiv.classList.remove('hidden');
    } else {
        severityDiv.classList.add('hidden');
    }
}

async function rankPriorities() {
    const btn = document.getElementById('rank-btn');
    const resultDiv = document.getElementById('ranking-result');

    const selectedAreas = Array.from(
        document.querySelectorAll('#areas-list input[type="checkbox"]:checked')
    ).map(cb => parseInt(cb.value));

    if (selectedAreas.length === 0) {
        alert('Please select at least one area');
        return;
    }

    const severity = parseInt(document.getElementById('area-severity').value);

    btn.disabled = true;
    btn.textContent = '⏳ Ranking...';

    const data = {
        disaster_id: parseInt(currentDisasterId),
        affected_areas: selectedAreas.map(areaId => {
            const area = areas.find(a => a.id === areaId);
            return {
                area_id: areaId,
                severity: severity,
                population: area?.population || 10000,
                accessibility_score: area?.accessibility_score || 0.5
            };
        })
    };

    try {
        const result = await api.rankPriorities(data);

        resultDiv.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Priority Ranking Results</h3>
                        <p class="card-subtitle">${result.total_areas} areas ranked by priority</p>
                    </div>
                </div>

                <ul class="priority-list">
                    ${result.ranked_areas.map(area => `
                        <li class="priority-item">
                            <div class="priority-rank ${area.priority_rank <= 3 ? 'top-' + area.priority_rank : ''}">
                                ${area.priority_rank}
                            </div>
                            <div class="priority-info">
                                <h4>${area.area_name}</h4>
                                <p>
                                    Population: ${formatNumber(area.population)} |
                                    Severity: ${getSeverityLabel(area.severity)} |
                                    Accessibility: ${(area.accessibility_score * 100).toFixed(0)}%
                                </p>
                            </div>
                            <div class="priority-score">
                                <div class="score">${area.priority_score.toFixed(1)}</div>
                                <div class="label">Priority Score</div>
                            </div>
                        </li>
                    `).join('')}
                </ul>

                <div class="btn-group">
                    <a href="allocate.html" class="btn btn-primary btn-lg">
                        Continue to Step 3: Resource Allocation →
                    </a>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Ranking error:', error);
        showError('ranking-result', 'Failed to rank priorities. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '📋 Rank Priorities';
    }
}
