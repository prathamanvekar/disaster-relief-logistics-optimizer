// ============================================================
// PREDICT - Severity prediction logic
// ============================================================

let config = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    setupEventListeners();
});

async function loadConfig() {
    try {
        config = await api.getConfig();

        // Populate disaster types
        const typeSelect = document.getElementById('disaster_type');
        config.disaster_types.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        });

        // Populate continents
        const continentSelect = document.getElementById('continent');
        config.continents.forEach(continent => {
            const option = document.createElement('option');
            option.value = continent;
            option.textContent = continent;
            continentSelect.appendChild(option);
        });

        // Populate regions
        const regionSelect = document.getElementById('region');
        config.regions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading config:', error);
        showError('prediction-result', 'Failed to load configuration. Is the server running?');
    }
}

function setupEventListeners() {
    // Update subtypes when disaster type changes
    document.getElementById('disaster_type').addEventListener('change', (e) => {
        const subtypeSelect = document.getElementById('disaster_subtype');
        subtypeSelect.innerHTML = '<option value="">Select subtype (optional)...</option>';

        const subtypes = config.subtypes_by_type[e.target.value] || [];
        subtypes.forEach(subtype => {
            const option = document.createElement('option');
            option.value = subtype;
            option.textContent = subtype;
            subtypeSelect.appendChild(option);
        });
    });

    // Form submission
    document.getElementById('predict-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await predictSeverity();
    });
}

async function predictSeverity() {
    const btn = document.getElementById('predict-btn');
    const resultDiv = document.getElementById('prediction-result');

    btn.disabled = true;
    btn.textContent = '⏳ Predicting...';

    const data = {
        disaster_type: document.getElementById('disaster_type').value,
        disaster_subtype: document.getElementById('disaster_subtype').value || null,
        magnitude: parseFloat(document.getElementById('magnitude').value),
        location_name: document.getElementById('location_name').value,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        continent: document.getElementById('continent').value,
        region: document.getElementById('region').value,
        month: parseInt(document.getElementById('month').value)
    };

    try {
        const result = await api.predictSeverity(data);

        // Store disaster ID for next steps
        setCurrentDisaster(result.disaster_id);

        // Display result
        resultDiv.innerHTML = `
            <div class="result-box success">
                <div class="result-header">
                    <span class="icon">✅</span>
                    <h3>Prediction Complete</h3>
                </div>

                <div class="result-grid">
                    <div class="result-item">
                        <div class="value">
                            <span class="severity-indicator">
                                <span class="severity-dot ${getSeverityClass(result.severity)}"></span>
                                ${result.severity_label}
                            </span>
                        </div>
                        <div class="label">Severity Level (${result.severity}/3)</div>
                    </div>
                    <div class="result-item">
                        <div class="value">${result.priority_score}</div>
                        <div class="label">Priority Score</div>
                    </div>
                    <div class="result-item">
                        <div class="value">${(result.confidence * 100).toFixed(1)}%</div>
                        <div class="label">Confidence</div>
                    </div>
                    <div class="result-item">
                        <div class="value">#${result.disaster_id}</div>
                        <div class="label">Disaster ID</div>
                    </div>
                </div>

                <div class="mt-3">
                    <h4>Probability Distribution:</h4>
                    <div class="probability-bars mt-2">
                        ${['Low', 'Moderate', 'High', 'Critical'].map((label, i) => `
                            <div class="probability-bar">
                                <span class="label">${label}</span>
                                <div class="bar-container">
                                    <div class="bar ${getSeverityClass(i)}" style="width: ${result.probabilities[i] * 100}%"></div>
                                </div>
                                <span class="value">${(result.probabilities[i] * 100).toFixed(1)}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="btn-group mt-3">
                    <a href="priority.html" class="btn btn-primary btn-lg">
                        Continue to Step 2: Priority Ranking →
                    </a>
                </div>
            </div>

            <style>
                .probability-bars { display: flex; flex-direction: column; gap: 0.5rem; }
                .probability-bar { display: flex; align-items: center; gap: 1rem; }
                .probability-bar .label { width: 80px; font-size: 0.875rem; }
                .probability-bar .bar-container { flex: 1; height: 20px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
                .probability-bar .bar { height: 100%; border-radius: 4px; transition: width 0.3s; }
                .probability-bar .bar.low { background: var(--severity-low); }
                .probability-bar .bar.moderate { background: var(--severity-moderate); }
                .probability-bar .bar.high { background: var(--severity-high); }
                .probability-bar .bar.critical { background: var(--severity-critical); }
                .probability-bar .value { width: 50px; text-align: right; font-size: 0.875rem; font-weight: 500; }
            </style>
        `;

    } catch (error) {
        console.error('Prediction error:', error);
        showError('prediction-result', 'Failed to predict severity. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '🎯 Predict Severity';
    }
}
