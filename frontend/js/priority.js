// ============================================================
// PRIORITY - Priority ranking logic
// ============================================================

let areas = [];
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
=======
let availableDisasters = [];

document.addEventListener("DOMContentLoaded", async () => {
  const isReady = await initializeDisasterSelection();
  if (!isReady) {
    return;
  }

  await refreshSelectedDisasterData();
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
  await loadAreas();
  document.getElementById("ranking-result").innerHTML = "";
  document.getElementById("severity-selection").classList.add("hidden");
}

async function loadDisasterInfo() {
  try {
    const disaster = await api.getDisaster(currentDisasterId);

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

async function loadAreas() {
    const container = document.getElementById('areas-list');

    try {
        areas = await api.getAreas();

        container.innerHTML = areas.map(area => `
=======
  }
}

async function loadAreas() {
  const container = document.getElementById("areas-list");

  try {
    areas = await api.getAreas({
      disasterId: parseInt(currentDisasterId),
      limit: 20,
    });

    container.innerHTML = areas
      .map(
        (area) => `
>>>>>>> 7bc589d (push to github with readme)
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
<<<<<<< HEAD
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
=======
        `,
      )
      .join("");

    // Add click handlers
    container.querySelectorAll(".checkbox-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          const checkbox = item.querySelector('input[type="checkbox"]');
          checkbox.checked = !checkbox.checked;
        }
        item.classList.toggle("selected", item.querySelector("input").checked);
        updateSeveritySelection();
      });
    });
  } catch (error) {
    console.error("Error loading areas:", error);
    container.innerHTML = `<p class="text-danger">Failed to load areas</p>`;
  }
}

function selectAllAreas() {
  document
    .querySelectorAll('#areas-list input[type="checkbox"]')
    .forEach((cb) => {
      cb.checked = true;
      cb.closest(".checkbox-item").classList.add("selected");
    });
  updateSeveritySelection();
}

function updateSeveritySelection() {
  const selected = document.querySelectorAll(
    '#areas-list input[type="checkbox"]:checked',
  );
  const severityDiv = document.getElementById("severity-selection");

  if (selected.length > 0) {
    severityDiv.classList.remove("hidden");
  } else {
    severityDiv.classList.add("hidden");
  }
}

async function rankPriorities() {
  const btn = document.getElementById("rank-btn");
  const resultDiv = document.getElementById("ranking-result");

  const selectedAreas = Array.from(
    document.querySelectorAll('#areas-list input[type="checkbox"]:checked'),
  ).map((cb) => parseInt(cb.value));

  if (selectedAreas.length === 0) {
    alert("Please select at least one area");
    return;
  }

  const severity = parseInt(document.getElementById("area-severity").value);

  btn.disabled = true;
  btn.textContent = "⏳ Ranking...";

  const data = {
    disaster_id: parseInt(currentDisasterId),
    affected_areas: selectedAreas.map((areaId) => {
      const area = areas.find((a) => a.id === areaId);
      return {
        area_id: areaId,
        severity: severity,
        population: area?.population || 10000,
        accessibility_score: area?.accessibility_score || 0.5,
      };
    }),
  };

  try {
    const result = await api.rankPriorities(data);

    resultDiv.innerHTML = `
>>>>>>> 7bc589d (push to github with readme)
            <div class="card">
                <div class="card-header">
                    <div>
                        <h3 class="card-title">Priority Ranking Results</h3>
                        <p class="card-subtitle">${result.total_areas} areas ranked by priority</p>
                    </div>
                </div>

                <ul class="priority-list">
<<<<<<< HEAD
                    ${result.ranked_areas.map(area => `
                        <li class="priority-item">
                            <div class="priority-rank ${area.priority_rank <= 3 ? 'top-' + area.priority_rank : ''}">
=======
                    ${result.ranked_areas
                      .map(
                        (area) => `
                        <li class="priority-item">
                            <div class="priority-rank ${area.priority_rank <= 3 ? "top-" + area.priority_rank : ""}">
>>>>>>> 7bc589d (push to github with readme)
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
<<<<<<< HEAD
                    `).join('')}
=======
                    `,
                      )
                      .join("")}
>>>>>>> 7bc589d (push to github with readme)
                </ul>

                <div class="btn-group">
                    <a href="allocate.html" class="btn btn-primary btn-lg">
                        Continue to Step 3: Resource Allocation →
                    </a>
                </div>
            </div>
        `;
<<<<<<< HEAD

    } catch (error) {
        console.error('Ranking error:', error);
        showError('ranking-result', 'Failed to rank priorities. Please try again.');
    } finally {
        btn.disabled = false;
        btn.textContent = '📋 Rank Priorities';
    }
=======
  } catch (error) {
    console.error("Ranking error:", error);
    showError("ranking-result", "Failed to rank priorities. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "📋 Rank Priorities";
  }
>>>>>>> 7bc589d (push to github with readme)
}
