// ============================================================
// DASHBOARD - Main dashboard logic
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardStats();
    await loadRecentDisasters();
    await loadResourcesOverview();
});

async function loadDashboardStats() {
    try {
        const stats = await api.getDashboardStats();

        document.getElementById('stat-disasters').textContent = stats.active_disasters;
        document.getElementById('stat-areas').textContent = stats.total_areas;
        document.getElementById('stat-vehicles').textContent = `${stats.available_vehicles}/${stats.total_vehicles}`;
        document.getElementById('stat-resources').textContent = Object.keys(stats.total_resources).length;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

async function loadRecentDisasters() {
    const tbody = document.getElementById('disasters-tbody');

    try {
        const disasters = await api.getAllDisasters();

        if (disasters.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-state">
                            <div class="icon">🚨</div>
                            <h3>No Disasters Recorded</h3>
                            <p>Start by predicting a disaster severity</p>
                            <a href="predict.html" class="btn btn-primary mt-2">+ Add Disaster</a>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = disasters.slice(0, 10).map(disaster => `
            <tr>
                <td><strong>#${disaster.id}</strong></td>
                <td>${disaster.disaster_type}</td>
                <td>${disaster.location_name}</td>
                <td>
                    <span class="badge badge-${getSeverityClass(disaster.predicted_severity)}">
                        ${disaster.severity_label}
                    </span>
                </td>
                <td><strong>${disaster.priority_score}</strong></td>
                <td>
                    <span class="badge badge-${disaster.status === 'active' ? 'info' : 'success'}">
                        ${disaster.status}
                    </span>
                </td>
                <td>${new Date(disaster.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (error) {
        console.error('Error loading disasters:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    Failed to load disasters. Is the server running?
                </td>
            </tr>
        `;
    }
}

async function loadResourcesOverview() {
    const container = document.getElementById('resources-grid');

    try {
        const resources = await api.getAvailableResources();

        if (resources.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>No resources available</p>
                </div>
            `;
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

        const colors = ['blue', 'green', 'orange', 'purple', 'red', 'blue'];

        container.innerHTML = resources.map((resource, index) => `
            <div class="stat-card">
                <div class="stat-icon ${colors[index % colors.length]}">
                    ${icons[resource.resource_type] || '📦'}
                </div>
                <div class="stat-info">
                    <h3>${formatNumber(resource.total_quantity)}</h3>
                    <p>${resource.resource_type}</p>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading resources:', error);
        container.innerHTML = `
            <div class="text-center text-danger">
                Failed to load resources
            </div>
        `;
    }
}
