// ==========================================
// 1. DASHBOARD DATA LOAD
// ==========================================
async function loadDashboard() {
    try {
        if (!window.pywebview || !window.pywebview.api) return;

        const data = await window.pywebview.api.test();
        const ipAddress = await window.pywebview.api.get_lab_network();

        document.getElementById("totalComputers").innerText = data.total;
        document.getElementById("onlineComputers").innerText = data.online;
        document.getElementById("offlineComputers").innerText = data.offline;
        document.getElementById("networkPercentage").innerText = data.network + "%";
        
        document.getElementById("circlePercent").innerText = data.network + "%";
        document.getElementById("circleOnline").innerText = data.online;
        document.getElementById("circleOffline").innerText = data.offline;
        document.getElementById("circleTotal").innerText = data.total;

        document.getElementById("labNetwork").innerText = ipAddress;
    } catch(e) {
        console.error("Error loading dashboard data:", e);
    }
}

// ==========================================
// 2. COMPUTERS TAB (GRID & LIST VIEW RENDER)
// ==========================================
async function renderComputersGrid() {
    const gridContainer = document.getElementById('pcGridContainer');
    const tableBody = document.getElementById('pcListTableBody');
    
    if (gridContainer) gridContainer.innerHTML = "<p style='color:#64748b; font-weight:600;'>Loading computers...</p>";
    if (tableBody) tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>Loading...</td></tr>";

    try {
        if (!window.pywebview || !window.pywebview.api) return;

        const pcList = await window.pywebview.api.get_all_computers();
        
        if (gridContainer) gridContainer.innerHTML = "";
        if (tableBody) tableBody.innerHTML = "";

        if (pcList && pcList.length > 0) {
            pcList.forEach(pc => {
                const isOnline = pc.status.toLowerCase() === "online";
                const badgeClass = isOnline ? "status-success" : "status-offline";
                
                // Grid Card View
                const card = `
                    <div class="pc-card" data-name="${pc.name.toLowerCase()}" data-ip="${pc.ip}">
                        <div class="pc-card-header">
                            <span class="pc-card-title"><i class="fa-solid fa-desktop"></i> ${pc.name}</span>
                            <span class="badge-status ${badgeClass}">${pc.status}</span>
                        </div>
                        <div class="pc-card-ip"><i class="fa-solid fa-network-wired"></i> ${pc.ip}</div>
                        <div class="pc-card-actions">
                            <button class="pc-action-btn" style="background:#dc2626;" title="Shutdown" onclick="openShutdownModal('${pc.name}')"><i class="fa-solid fa-power-off"></i> Shutdown</button>
                            <button class="pc-action-btn" style="background:#16a34a;" title="Restart" onclick="openRestartModal('${pc.name}')"><i class="fa-solid fa-rotate-right"></i> Restart</button>
                            <button class="pc-action-btn" style="background:#0284c7;" title="Send Message"><i class="fa-solid fa-envelope"></i> Msg</button>
                        </div>
                    </div>
                `;
                if (gridContainer) gridContainer.innerHTML += card;

                // List View Row
                const row = `
                    <tr class="pc-table-row" data-name="${pc.name.toLowerCase()}" data-ip="${pc.ip}">
                        <td class="pc-name"><i class="fa-solid fa-desktop" style="margin-right:8px;"></i>${pc.name}</td>
                        <td style="color:#475569;">${pc.ip}</td>
                        <td><span class="badge-status ${badgeClass}">${pc.status}</span></td>
                        <td>
                            <div class="list-action-btns">
                                <button class="pc-action-btn" style="background:#dc2626; padding: 6px 10px;" title="Shutdown" onclick="openShutdownModal('${pc.name}')"><i class="fa-solid fa-power-off"></i> Shutdown</button>
                                <button class="pc-action-btn" style="background:#16a34a; padding: 6px 10px;" title="Restart" onclick="openRestartModal('${pc.name}')"><i class="fa-solid fa-rotate-right"></i> Restart</button>
                                <button class="pc-action-btn" style="background:#0284c7; padding: 6px 10px;" title="Send Message"><i class="fa-solid fa-envelope"></i> Msg</button>
                            </div>
                        </td>
                    </tr>
                `;
                if (tableBody) tableBody.innerHTML += row;
            });
        } else {
            if (gridContainer) gridContainer.innerHTML = "<p>No computers found.</p>";
            if (tableBody) tableBody.innerHTML = "<tr><td colspan='4' style='text-align:center;'>No computers found.</td></tr>";
        }
    } catch(e) {
        console.error("Error rendering PCs:", e);
    }
}

// ==========================================
// 3. ADVANCED SHUTDOWN MANAGEMENT
// ==========================================
async function openShutdownModal(targetName = "") {
    const modal = document.getElementById("shutdownModal");
    if (!modal) return;
    modal.style.display = "flex";
    
    const responseMsg = document.getElementById("shutdownResponseMsg");
    if (responseMsg) responseMsg.innerText = "";

    if (targetName) {
        document.querySelector('input[name="shutdownScope"][value="single"]').checked = true;
        toggleShutdownScope('single');
        document.getElementById("shutdownTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="shutdownScope"][value="all"]').checked = true;
        toggleShutdownScope('all');
    }
    await loadShutdownCheckboxList();
}

function closeShutdownModal() {
    const modal = document.getElementById("shutdownModal");
    if (modal) modal.style.display = "none";
}

function toggleShutdownScope(scope) {
    const singleContainer = document.getElementById("shutdownSingleContainer");
    const selectedContainer = document.getElementById("shutdownSelectedContainer");

    if (scope === 'all') {
        singleContainer.style.display = 'none';
        selectedContainer.style.display = 'none';
    } else if (scope === 'single') {
        singleContainer.style.display = 'block';
        selectedContainer.style.display = 'none';
    } else if (scope === 'selected') {
        singleContainer.style.display = 'none';
        selectedContainer.style.display = 'block';
    }
}

async function loadShutdownCheckboxList() {
    const container = document.getElementById("shutdownPCListCheckboxes");
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px; color:#64748b;'>Loading computers...</span>";

    try {
        if (!window.pywebview || !window.pywebview.api) return;
        const pcList = await window.pywebview.api.get_all_computers();
        container.innerHTML = "";

        if (pcList && pcList.length > 0) {
            pcList.forEach(pc => {
                container.innerHTML += `
                    <label style="font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" class="shutdown-pc-checkbox" value="${pc.name}" style="width: 14px; height: 14px;"> 
                        ${pc.name} <span style="color:#64748b; font-weight:normal;">(${pc.ip})</span>
                    </label>
                `;
            });
        } else {
            container.innerHTML = "<span style='font-size:12px; color:#64748b;'>No computers found.</span>";
        }
    } catch (e) {
        console.error("Error loading checkboxes:", e);
    }
}

async function executeAdvancedShutdown() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="shutdownScope"]:checked').value;
    const delay = document.getElementById("shutdownDelayInput").value;
    const force = document.getElementById("shutdownForceCheck").checked;
    const responseMsg = document.getElementById("shutdownResponseMsg");
    let targets = [];

    if (scope === 'all') {
        targets = ["ALL"];
    } else if (scope === 'single') {
        const singleTarget = document.getElementById("shutdownTargetInput").value.trim();
        if (!singleTarget) { alert("Please enter a computer name or IP."); return; }
        targets = [singleTarget];
    } else if (scope === 'selected') {
        document.querySelectorAll('.shutdown-pc-checkbox:checked').forEach(cb => targets.push(cb.value));
        if (targets.length === 0) { alert("Please select at least one computer."); return; }
    }

    if (!confirm(`Are you sure you want to shut down: ${targets.join(', ')}?`)) return;

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Sending shutdown command...";

        const response = await window.pywebview.api.shutdown_computer({
            targets: targets, delay: parseInt(delay) || 0, force: force
        });

        if (response && response.success) {
            responseMsg.style.color = "#16a34a";
            responseMsg.innerText = response.message;
            loadDashboard();
        } else {
            responseMsg.style.color = "#dc2626";
            responseMsg.innerText = `Failed: ${response ? response.message : "Unknown error"}`;
        }
    } catch (e) {
        console.error("Error executing shutdown:", e);
        responseMsg.style.color = "#dc2626";
        responseMsg.innerText = "An error occurred.";
    }
}

// ==========================================
// 4. ADVANCED RESTART MANAGEMENT
// ==========================================
async function openRestartModal(targetName = "") {
    const modal = document.getElementById("restartModal");
    if (!modal) return;
    modal.style.display = "flex";
    
    const responseMsg = document.getElementById("restartResponseMsg");
    if (responseMsg) responseMsg.innerText = "";

    if (targetName) {
        document.querySelector('input[name="restartScope"][value="single"]').checked = true;
        toggleRestartScope('single');
        document.getElementById("restartTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="restartScope"][value="all"]').checked = true;
        toggleRestartScope('all');
    }
    await loadRestartCheckboxList();
}

function closeRestartModal() {
    const modal = document.getElementById("restartModal");
    if (modal) modal.style.display = "none";
}

function toggleRestartScope(scope) {
    const singleContainer = document.getElementById("restartSingleContainer");
    const selectedContainer = document.getElementById("restartSelectedContainer");

    if (scope === 'all') {
        singleContainer.style.display = 'none';
        selectedContainer.style.display = 'none';
    } else if (scope === 'single') {
        singleContainer.style.display = 'block';
        selectedContainer.style.display = 'none';
    } else if (scope === 'selected') {
        singleContainer.style.display = 'none';
        selectedContainer.style.display = 'block';
    }
}

async function loadRestartCheckboxList() {
    const container = document.getElementById("restartPCListCheckboxes");
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px; color:#64748b;'>Loading computers...</span>";

    try {
        if (!window.pywebview || !window.pywebview.api) return;
        const pcList = await window.pywebview.api.get_all_computers();
        container.innerHTML = "";

        if (pcList && pcList.length > 0) {
            pcList.forEach(pc => {
                container.innerHTML += `
                    <label style="font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" class="restart-pc-checkbox" value="${pc.name}" style="width: 14px; height: 14px;"> 
                        ${pc.name} <span style="color:#64748b; font-weight:normal;">(${pc.ip})</span>
                    </label>
                `;
            });
        } else {
            container.innerHTML = "<span style='font-size:12px; color:#64748b;'>No computers found.</span>";
        }
    } catch (e) {
        console.error("Error loading checkboxes:", e);
    }
}

async function executeAdvancedRestart() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="restartScope"]:checked').value;
    const delay = document.getElementById("restartDelayInput").value;
    const force = document.getElementById("restartForceCheck").checked;
    const responseMsg = document.getElementById("restartResponseMsg");
    let targets = [];

    if (scope === 'all') {
        targets = ["ALL"];
    } else if (scope === 'single') {
        const singleTarget = document.getElementById("restartTargetInput").value.trim();
        if (!singleTarget) { alert("Please enter a computer name or IP."); return; }
        targets = [singleTarget];
    } else if (scope === 'selected') {
        document.querySelectorAll('.restart-pc-checkbox:checked').forEach(cb => targets.push(cb.value));
        if (targets.length === 0) { alert("Please select at least one computer."); return; }
    }

    if (!confirm(`Are you sure you want to restart: ${targets.join(', ')}?`)) return;

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Sending restart command...";

        const response = await window.pywebview.api.restart_computer({
            targets: targets, delay: parseInt(delay) || 0, force: force
        });

        if (response && response.success) {
            responseMsg.style.color = "#16a34a";
            responseMsg.innerText = response.message;
            loadDashboard();
        } else {
            responseMsg.style.color = "#dc2626";
            responseMsg.innerText = `Failed: ${response ? response.message : "Unknown error"}`;
        }
    } catch (e) {
        console.error("Error executing restart:", e);
        responseMsg.style.color = "#dc2626";
        responseMsg.innerText = "An error occurred.";
    }
}

// ==========================================
// 5. TOGGLE VIEW & SEARCH FILTER
// ==========================================
function togglePCView(viewType) {
    const gridContainer = document.getElementById('pcGridContainer');
    const listContainer = document.getElementById('pcListContainer');

    if (!gridContainer || !listContainer) return;

    if (viewType === 'list') {
        gridContainer.style.display = 'none';
        listContainer.style.display = 'block';
    } else {
        gridContainer.style.display = 'grid';
        listContainer.style.display = 'none';
    }
}

function filterPCCards() {
    const query = document.getElementById('pcSearchInput').value.toLowerCase();
    
    document.querySelectorAll('.pc-card').forEach(card => {
        const name = card.getAttribute('data-name');
        const ip = card.getAttribute('data-ip');
        card.style.display = (name.includes(query) || ip.includes(query)) ? 'flex' : 'none';
    });

    document.querySelectorAll('.pc-table-row').forEach(row => {
        const name = row.getAttribute('data-name');
        const ip = row.getAttribute('data-ip');
        row.style.display = (name.includes(query) || ip.includes(query)) ? 'table-row' : 'none';
    });
}

// ==========================================
// 6. POPUP MODAL CONTROL
// ==========================================
async function openPCModal() {
    const modal = document.getElementById("pcModal");
    if (!modal) return;
    modal.style.display = "flex";
    const tableBody = document.getElementById("modalPcTableBody");
    tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>Loading computers...</td></tr>";

    try {
        const pcList = await window.pywebview.api.get_all_computers();
        tableBody.innerHTML = "";

        if (pcList && pcList.length > 0) {
            pcList.forEach(pc => {
                const isOnline = pc.status.toLowerCase() === "online";
                const badgeClass = isOnline ? "status-success" : "status-offline";
                tableBody.innerHTML += `
                    <tr>
                        <td class="pc-name"><i class="fa-solid fa-desktop" style="margin-right:8px;"></i>${pc.name}</td>
                        <td style="color:#475569;">${pc.ip}</td>
                        <td><span class="badge-status ${badgeClass}">${pc.status}</span></td>
                    </tr>
                `;
            });
        } else {
            tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center;'>No computers found</td></tr>";
        }
    } catch(e) {
        console.error("Error fetching PC list:", e);
        tableBody.innerHTML = "<tr><td colspan='3' style='text-align:center; color:red;'>Error fetching list</td></tr>";
    }
}

function closePCModal() {
    const modal = document.getElementById("pcModal");
    if (modal) modal.style.display = "none";
}

window.addEventListener("pywebviewready", loadDashboard);
// ==========================================
// START VNC MANAGEMENT LOGIC
// ==========================================
async function openStartVncModal(targetName = "") {
    const modal = document.getElementById("startVncModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.getElementById("startVncResponseMsg").innerText = "";

    if (targetName) {
        document.querySelector('input[name="startVncScope"][value="single"]').checked = true;
        toggleStartVncScope('single');
        document.getElementById("startVncTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="startVncScope"][value="all"]').checked = true;
        toggleStartVncScope('all');
    }
    await loadStartVncCheckboxList();
}

function closeStartVncModal() {
    document.getElementById("startVncModal").style.display = "none";
}

function toggleStartVncScope(scope) {
    document.getElementById("startVncSingleContainer").style.display = (scope === 'single') ? 'block' : 'none';
    document.getElementById("startVncSelectedContainer").style.display = (scope === 'selected') ? 'block' : 'none';
}

async function loadStartVncCheckboxList() {
    const container = document.getElementById("startVncPCListCheckboxes");
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px; color:#64748b;'>Loading computers...</span>";
    try {
        const pcList = await window.pywebview.api.get_all_computers();
        container.innerHTML = "";
        pcList.forEach(pc => {
            container.innerHTML += `
                <label style="font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" class="startvnc-pc-checkbox" value="${pc.name}" style="width: 14px; height: 14px;"> 
                    ${pc.name} <span style="color:#64748b; font-weight:normal;">(${pc.ip})</span>
                </label>
            `;
        });
    } catch(e) { console.error(e); }
}

async function executeStartVnc() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="startVncScope"]:checked').value;
    const responseMsg = document.getElementById("startVncResponseMsg");
    let targets = scope === 'all' ? ["ALL"] : (scope === 'single' ? [document.getElementById("startVncTargetInput").value.trim()] : []);
    if (scope === 'selected') {
        document.querySelectorAll('.startvnc-pc-checkbox:checked').forEach(cb => targets.push(cb.value));
    }
    if (targets.length === 0 || targets[0] === "") { alert("Please specify targets."); return; }

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Starting VNC server...";
        const res = await window.pywebview.api.start_vnc({ targets });
        responseMsg.style.color = res.success ? "#16a34a" : "#dc2626";
        responseMsg.innerText = res.message;
    } catch(e) { console.error(e); }
}

// ==========================================
// STOP VNC MANAGEMENT LOGIC
// ==========================================
async function openStopVncModal(targetName = "") {
    const modal = document.getElementById("stopVncModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.getElementById("stopVncResponseMsg").innerText = "";

    if (targetName) {
        document.querySelector('input[name="stopVncScope"][value="single"]').checked = true;
        toggleStopVncScope('single');
        document.getElementById("stopVncTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="stopVncScope"][value="all"]').checked = true;
        toggleStopVncScope('all');
    }
    await loadStopVncCheckboxList();
}

function closeStopVncModal() {
    document.getElementById("stopVncModal").style.display = "none";
}

function toggleStopVncScope(scope) {
    document.getElementById("stopVncSingleContainer").style.display = (scope === 'single') ? 'block' : 'none';
    document.getElementById("stopVncSelectedContainer").style.display = (scope === 'selected') ? 'block' : 'none';
}

async function loadStopVncCheckboxList() {
    const container = document.getElementById("stopVncPCListCheckboxes");
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px; color:#64748b;'>Loading computers...</span>";
    try {
        const pcList = await window.pywebview.api.get_all_computers();
        container.innerHTML = "";
        pcList.forEach(pc => {
            container.innerHTML += `
                <label style="font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" class="stopvnc-pc-checkbox" value="${pc.name}" style="width: 14px; height: 14px;"> 
                    ${pc.name} <span style="color:#64748b; font-weight:normal;">(${pc.ip})</span>
                </label>
            `;
        });
    } catch(e) { console.error(e); }
}

async function executeStopVnc() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="stopVncScope"]:checked').value;
    const responseMsg = document.getElementById("stopVncResponseMsg");
    let targets = scope === 'all' ? ["ALL"] : (scope === 'single' ? [document.getElementById("stopVncTargetInput").value.trim()] : []);
    if (scope === 'selected') {
        document.querySelectorAll('.stopvnc-pc-checkbox:checked').forEach(cb => targets.push(cb.value));
    }
    if (targets.length === 0 || targets[0] === "") { alert("Please specify targets."); return; }

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Stopping VNC server...";
        const res = await window.pywebview.api.stop_vnc({ targets });
        responseMsg.style.color = res.success ? "#16a34a" : "#dc2626";
        responseMsg.innerText = res.message;
    } catch(e) { console.error(e); }
}

// ==========================================
// WAKE ON LAN (WOL) MANAGEMENT LOGIC
// ==========================================
async function openWolModal(targetName = "") {
    const modal = document.getElementById("wolModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.getElementById("wolResponseMsg").innerText = "";

    if (targetName) {
        document.querySelector('input[name="wolScope"][value="single"]').checked = true;
        toggleWolScope('single');
        document.getElementById("wolTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="wolScope"][value="all"]').checked = true;
        toggleWolScope('all');
    }
    await loadWolCheckboxList();
}

function closeWolModal() {
    document.getElementById("wolModal").style.display = "none";
}

function toggleWolScope(scope) {
    document.getElementById("wolSingleContainer").style.display = (scope === 'single') ? 'block' : 'none';
    document.getElementById("wolSelectedContainer").style.display = (scope === 'selected') ? 'block' : 'none';
}

async function loadWolCheckboxList() {
    const container = document.getElementById("wolPCListCheckboxes");
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px; color:#64748b;'>Loading computers...</span>";
    try {
        const pcList = await window.pywebview.api.get_all_computers();
        container.innerHTML = "";
        pcList.forEach(pc => {
            container.innerHTML += `
                <label style="font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" class="wol-pc-checkbox" value="${pc.name}" style="width: 14px; height: 14px;"> 
                    ${pc.name} <span style="color:#64748b; font-weight:normal;">(${pc.ip})</span>
                </label>
            `;
        });
    } catch(e) { console.error(e); }
}

async function executeWol() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="wolScope"]:checked').value;
    const responseMsg = document.getElementById("wolResponseMsg");
    let targets = scope === 'all' ? ["ALL"] : (scope === 'single' ? [document.getElementById("wolTargetInput").value.trim()] : []);
    if (scope === 'selected') {
        document.querySelectorAll('.wol-pc-checkbox:checked').forEach(cb => targets.push(cb.value));
    }
    if (targets.length === 0 || targets[0] === "") { alert("Please specify targets."); return; }

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Sending Wake-on-LAN packet...";
        const res = await window.pywebview.api.wake_on_lan({ targets });
        responseMsg.style.color = res.success ? "#16a34a" : "#dc2626";
        responseMsg.innerText = res.message;
    } catch(e) { console.error(e); }
}
// ==========================================
// EMERGENCY BUTTON CLICK BINDINGS FIX
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Helper to safely bind click events if elements exist
    const bindClick = (selector, fn) => {
        const el = document.querySelector(selector);
        if (el) el.addEventListener("click", fn);
    };

    // You can also bind classes if multiple buttons share actions
});

// ==========================================
// 7. POWERSHELL MANAGEMENT LOGIC
// ==========================================
async function openPowershellModal(targetName = "") {
    const modal = document.getElementById("powershellModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.getElementById("psResponseMsg").innerText = "";

    if (targetName) {
        document.querySelector('input[name="psScope"][value="single"]').checked = true;
        togglePsScope('single');
        document.getElementById("psTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="psScope"][value="all"]').checked = true;
        togglePsScope('all');
    }
    await loadPsCheckboxList();
}

function closePowershellModal() {
    document.getElementById("powershellModal").style.display = "none";
}

function togglePsScope(scope) {
    document.getElementById("psSingleContainer").style.display = (scope === 'single') ? 'block' : 'none';
    document.getElementById("psSelectedContainer").style.display = (scope === 'selected') ? 'block' : 'none';
}

async function loadPsCheckboxList() {
    const container = document.getElementById("psPCListCheckboxes");
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px; color:#64748b;'>Loading computers...</span>";
    try {
        const pcList = await window.pywebview.api.get_all_computers();
        container.innerHTML = "";
        pcList.forEach(pc => {
            container.innerHTML += `
                <label style="font-size: 12px; font-weight: 600; color: #334155; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <input type="checkbox" class="ps-pc-checkbox" value="${pc.name}" style="width: 14px; height: 14px;"> 
                    ${pc.name} <span style="color:#64748b; font-weight:normal;">(${pc.ip})</span>
                </label>
            `;
        });
    } catch(e) { console.error(e); }
}

async function executePowershell() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="psScope"]:checked').value;
    const command = document.getElementById("psCommandInput").value.trim();
    const responseMsg = document.getElementById("psResponseMsg");
    
    let targets = scope === 'all' ? ["ALL"] : (scope === 'single' ? [document.getElementById("psTargetInput").value.trim()] : []);
    if (scope === 'selected') {
        document.querySelectorAll('.ps-pc-checkbox:checked').forEach(cb => targets.push(cb.value));
    }
    if (targets.length === 0 || targets[0] === "") { alert("Please specify targets."); return; }
    if (!command) { alert("Please enter a PowerShell command."); return; }

    if (!confirm(`Run this PowerShell command on ${targets.join(", ")}?\n\n${command}`)) return;

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Executing PowerShell command...";
        const res = await window.pywebview.api.execute_powershell({ targets, command });
        responseMsg.style.color = res.success ? "#16a34a" : "#dc2626";
        responseMsg.innerText = res.message;
    } catch(e) { console.error(e); }
}

// ==========================================
// 8. CMD MANAGEMENT LOGIC
// ==========================================
async function openCmdModal(targetName = "") {
    const modal = document.getElementById("cmdModal");
    if (!modal) return;
    modal.style.display = "flex";
    document.getElementById("cmdResponseMsg").innerText = "";

    if (targetName) {
        document.querySelector('input[name="cmdScope"][value="single"]').checked = true;
        toggleCmdScope('single');
        document.getElementById("cmdTargetInput").value = targetName;
    } else {
        document.querySelector('input[name="cmdScope"][value="all"]').checked = true;
        toggleCmdScope('all');
    }
}

function closeCmdModal() {
    document.getElementById("cmdModal").style.display = "none";
}

function toggleCmdScope(scope) {
    document.getElementById("cmdSingleContainer").style.display = (scope === 'single') ? 'block' : 'none';
    document.getElementById("cmdSelectedContainer").style.display = (scope === 'selected') ? 'block' : 'none';
    if (scope === 'selected') fillTargetCheckboxes("cmdPCListCheckboxes", "cmd-pc-checkbox");
}

async function executeCmd() {
    if (!(await requireAuthenticatedSession())) return;
    const scope = document.querySelector('input[name="cmdScope"]:checked').value;
    const command = document.getElementById("cmdCommandInput").value.trim();
    const responseMsg = document.getElementById("cmdResponseMsg");

    let targets = [];
    if (scope === 'all') targets = ["ALL"];
    else if (scope === 'single') targets = [document.getElementById("cmdTargetInput").value.trim()];
    else targets = Array.from(document.querySelectorAll('.cmd-pc-checkbox:checked')).map(cb => cb.value);

    if (!command) { alert("Please enter a CMD command."); return; }
    if (!targets.length || targets[0] === "") { alert("Please specify targets."); return; }

    if (!confirm(`Run this CMD command on ${targets.join(", ")}?\n\n${command}`)) return;

    try {
        responseMsg.style.color = "#475569";
        responseMsg.innerText = "Executing CMD command...";
        const res = await window.pywebview.api.execute_cmd({ targets, command });
        responseMsg.style.color = res.success ? "#16a34a" : "#dc2626";
        responseMsg.innerText = res.message;
    } catch(e) {
        console.error(e);
        responseMsg.style.color = "#dc2626";
        responseMsg.innerText = "An error occurred.";
    }
}

// ==========================================
// 9. WEBSITE, COPY FILES & SEND MSG LOGIC
// ==========================================
function fillTargetCheckboxes(containerId, className) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "<span style='font-size:12px;color:#64748b;'>Loading computers...</span>";
    window.pywebview.api.get_all_computers().then(pcList => {
        container.innerHTML = "";
        (pcList || []).forEach(pc => {
            container.innerHTML += `
                <label style="font-size:12px;font-weight:600;color:#334155;display:flex;align-items:center;gap:8px;cursor:pointer;">
                    <input type="checkbox" class="${className}" value="${pc.name}" style="width:14px;height:14px;">
                    ${pc.name} <span style="color:#64748b;font-weight:normal;">(${pc.ip})</span>
                </label>`;
        });
        if (!pcList || pcList.length === 0) {
            container.innerHTML = "<span style='font-size:12px;color:#64748b;'>No computers found.</span>";
        }
    }).catch(err => console.error(err));
}

function collectScopedTargets(scopeName, singleInputId, checkboxClass) {
    const scope = document.querySelector(`input[name="${scopeName}"]:checked`).value;
    if (scope === "all") return ["ALL"];
    if (scope === "single") {
        const value = document.getElementById(singleInputId).value.trim();
        return value ? [value] : [];
    }
    return Array.from(document.querySelectorAll(`.${checkboxClass}:checked`)).map(cb => cb.value);
}

function openWebsiteModal(targetName = "") {
    document.getElementById("websiteModal").style.display = "flex";
    document.getElementById("websiteResponseMsg").innerText = "";
    const radio = targetName ? 'single' : 'all';
    document.querySelector(`input[name="websiteScope"][value="${radio}"]`).checked = true;
    toggleWebsiteScope(radio);
    if (targetName) document.getElementById("websiteTargetInput").value = targetName;
}
function closeWebsiteModal() { document.getElementById("websiteModal").style.display = "none"; }
function toggleWebsiteScope(scope) {
    document.getElementById("websiteSingleContainer").style.display = scope === "single" ? "block" : "none";
    document.getElementById("websiteSelectedContainer").style.display = scope === "selected" ? "block" : "none";
    if (scope === "selected") fillTargetCheckboxes("websitePCListCheckboxes", "website-pc-checkbox");
}
async function executeOpenWebsite() {
    if (!(await requireAuthenticatedSession())) return;

    const url = document.getElementById("websiteUrlInput").value.trim();
    const scope = document.querySelector('input[name="websiteScope"]:checked')?.value || "all";
    const targets = getScopedTargets(scope, "websiteTargetInput", "website-pc-checkbox");
    const response = document.getElementById("websiteResponseMsg");

    if (!url) { alert("Please enter a valid URL."); return; }
    if (!targets.length) { alert("Please specify at least one target."); return; }

    try {
        response.innerText = "Launching website...";
        const res = await window.pywebview.api.open_website({ url, targets });
        response.innerText = res.message;
        response.style.color = res.success ? "#16a34a" : "#dc2626";
    } catch(e) {
        console.error(e);
        response.innerText = "An error occurred.";
        response.style.color = "#dc2626";
    }
}

function openCopyFilesModal() {
    document.getElementById("copyFilesModal").style.display = "flex";
    document.getElementById("copyFilesResponseMsg").innerText = "";
    document.querySelector('input[name="copyScope"][value="all"]').checked = true;
    toggleCopyScope("all");
}
function closeCopyFilesModal() { document.getElementById("copyFilesModal").style.display = "none"; }
function toggleCopyScope(scope) {
    document.getElementById("copySingleContainer").style.display = scope === "single" ? "block" : "none";
    document.getElementById("copySelectedContainer").style.display = scope === "selected" ? "block" : "none";
    if (scope === "selected") fillTargetCheckboxes("copyPCListCheckboxes", "copy-pc-checkbox");
}
async function executeCopyFiles() {
    if (!(await requireAuthenticatedSession())) return;

    const source = document.getElementById("sourcePathInput").value.trim();
    const dest = document.getElementById("destPathInput").value.trim();
    const scope = document.querySelector('input[name="copyScope"]:checked')?.value || "all";
    const targets = getScopedTargets(scope, "copyTargetInput", "copy-pc-checkbox");
    const response = document.getElementById("copyFilesResponseMsg");

    if (!source || !dest) { alert("Please fill both paths."); return; }
    if (!targets.length) { alert("Please specify at least one target."); return; }

    try {
        response.innerText = "Copying file...";
        const res = await window.pywebview.api.copy_files({ source, dest, targets });
        response.innerText = res.message;
        response.style.color = res.success ? "#16a34a" : "#dc2626";
    } catch(e) {
        console.error(e);
        response.innerText = "An error occurred.";
        response.style.color = "#dc2626";
    }
}

function openSendMsgModal(targetName = "") {
    document.getElementById("sendMsgModal").style.display = "flex";
    document.getElementById("sendMsgResponseMsg").innerText = "";
    const radio = targetName ? "single" : "all";
    document.querySelector(`input[name="msgScope"][value="${radio}"]`).checked = true;
    toggleMsgScope(radio);
    if (targetName) document.getElementById("msgTargetInput").value = targetName;
}
function closeSendMsgModal() { document.getElementById("sendMsgModal").style.display = "none"; }
function toggleMsgScope(scope) {
    document.getElementById("msgSingleContainer").style.display = scope === "single" ? "block" : "none";
    document.getElementById("msgSelectedContainer").style.display = scope === "selected" ? "block" : "none";
    if (scope === "selected") fillTargetCheckboxes("msgPCListCheckboxes", "msg-pc-checkbox");
}
async function executeSendMsg() {
    if (!(await requireAuthenticatedSession())) return;

    const message = document.getElementById("broadcastMsgInput").value.trim();
    const scope = document.querySelector('input[name="msgScope"]:checked')?.value || "all";
    const targets = getScopedTargets(scope, "msgTargetInput", "msg-pc-checkbox");
    const response = document.getElementById("sendMsgResponseMsg");

    if (!message) { alert("Please enter a message."); return; }
    if (!targets.length) { alert("Please specify at least one target."); return; }

    try {
        response.innerText = "Sending message...";
        const res = await window.pywebview.api.send_message({ message, targets });
        response.innerText = res.message;
        response.style.color = res.success ? "#16a34a" : "#dc2626";
    } catch(e) {
        console.error(e);
        response.innerText = "An error occurred.";
        response.style.color = "#dc2626";
    }
}

function openSettingsModal() { document.getElementById("settingsModal").style.display = "flex"; }
function closeSettingsModal() { document.getElementById("settingsModal").style.display = "none"; }

// ==========================================
// CMD selected-target support
// ==========================================
function loadCmdCheckboxList() {
    fillTargetCheckboxes("cmdPCListCheckboxes", "cmd-pc-checkbox");
}

function updateLiveClock() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedHours = String(hours).padStart(2, '0');
    
    const timeString = `${formattedHours}:${minutes}:${seconds} ${ampm}`;
    
    const clockElement = document.getElementById('liveClock');
    if (clockElement) {
        clockElement.innerText = timeString;
    }
}

// Har 1 second (1000ms) baad clock update hogi
setInterval(updateLiveClock, 1000);
// Global array to store activities
let activityLog = [
    { time: "09:15 AM", computer: "PC-LAB-01", action: "VNC Started", status: "Success" }
];

// Function to add a new activity dynamically
function logActivity(computer, action, status) {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeString = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    // Nayi activity ko array ke shuru (top) mein add karna
    activityLog.unshift({
        time: timeString,
        computer: computer,
        action: action,
        status: status
    });

    renderRecentActivity();
}

// Function to render activities on dashboard & modal
function renderRecentActivity() {
    const tbody = document.getElementById('recentActivityBody');
    const modalTbody = document.getElementById('allActivityModalBody');
    if (!tbody) return;

    // 1. Dashboard par sirf SAB SE NEW (pehli) activity show karne ke liye
    let dashboardHtml = '';
    if (activityLog.length > 0) {
        const latest = activityLog[0];
        const badgeClass = latest.status === 'Success' ? 'badge-status status-success' : 'badge-status status-offline';
        dashboardHtml = `
            <tr>
                <td>${latest.time}</td>
                <td class="pc-name">${latest.computer}</td>
                <td>${latest.action}</td>
                <td><span class="${badgeClass}">${latest.status}</span></td>
            </tr>
        `;
    }
    tbody.innerHTML = dashboardHtml;

    // 2. Modal mein saari history show karne ke liye
    if (modalTbody) {
        let modalHtml = '';
        activityLog.forEach(item => {
            const badgeClass = item.status === 'Success' ? 'badge-status status-success' : 'badge-status status-offline';
            modalHtml += `
                <tr>
                    <td>${item.time}</td>
                    <td class="pc-name">${item.computer}</td>
                    <td>${item.action}</td>
                    <td><span class="${badgeClass}">${item.status}</span></td>
                </tr>
            `;
        });
        modalTbody.innerHTML = modalHtml;
    }
}

// Modal Open/Close Functions
function openRecentActivityModal() {
    renderRecentActivity();
    document.getElementById('recentActivityModal').style.display = 'flex';
}

function closeRecentActivityModal() {
    document.getElementById('recentActivityModal').style.display = 'none';
}

// Page load par render karein
document.addEventListener("DOMContentLoaded", () => {
    renderRecentActivity();
});
// ==========================================
// RESTRICTED ACCESS & LOGIN VALIDATION LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    // Check karein ke login success ki kya state save hui hai
    const isSuccess = localStorage.getItem("loginSuccess") === "true";

    if (!isSuccess) {
        // Agar login fail ya ghalat tha (loginSuccess = false)
        // Toh critical buttons aur sidebar items ko disable kar dein aur styling change kar dein
        disableRestrictedActions();
    }
});

function disableRestrictedActions() {
    // Woh sab features jo block karny hain unhein target karein
    const restrictedTriggers = [
        "openShutdownModal", 
        "openRestartModal", 
        "openStartVncModal", 
        "openStopVncModal", 
        "openWolModal", 
        "openPowershellModal", 
        "openCmdModal", 
        "openWebsiteModal", 
        "openCopyFilesModal", 
        "openSendMsgModal", 
        "openSettingsModal"
    ];

    // Sidebar aur Quick Actions ke elements par restriction lagana
    // Hum ek global click interceptor laga dete hain taake agar koi click kare toh Access Denied popup aaye
    window.openShutdownModal = function() { showAccessDenied(); };
    window.openRestartModal = function() { showAccessDenied(); };
    window.openStartVncModal = function() { showAccessDenied(); };
    window.openStopVncModal = function() { showAccessDenied(); };
    window.openWolModal = function() { showAccessDenied(); };
    window.openPowershellModal = function() { showAccessDenied(); };
    window.openCmdModal = function() { showAccessDenied(); };
    window.openWebsiteModal = function() { showAccessDenied(); };
    window.openCopyFilesModal = function() { showAccessDenied(); };
    window.openSendMsgModal = function() { showAccessDenied(); };
    window.openSettingsModal = function() { showAccessDenied(); };

    // Visual cue ke liye buttons ko thora transparent ya disabled look de sakte hain
    console.log("Restricted Mode Active: User can only monitor computers and view logs.");
}

function showAccessDenied() {
    // Aapka required popup message
    alert("Access Denied\n\nYou are not authorized to perform this action.");
}
async function loadSystemUser() {
    try {
        let systemUserText = await window.pywebview.api.get_current_system_user();
        // Jis element mein aapko yeh name show karwana hai uski ID ya class select karein
        document.getElementById("systemUserDisplay").innerText = systemUserText;
    } catch (error) {
        console.error("Error fetching system user:", error);
    }
}

// Page load hone par call karein
window.addEventListener('DOMContentLoaded', loadSystemUser)
// ==========================================
// AUTHORIZATION HELPER
// ==========================================
async function requireAuthenticatedSession() {
    try {
        if (!window.pywebview || !window.pywebview.api) {
            alert("IMS Control Center backend is not ready.");
            return false;
        }
        const ok = await window.pywebview.api.is_authenticated();
        if (!ok) {
            localStorage.setItem("loginSuccess", "false");
            showAccessDenied();
            return false;
        }
        return true;
    } catch (e) {
        console.error("Authentication state check failed:", e);
        showAccessDenied();
        return false;
    }
}

function getScopedTargets(scope, singleInputId, checkboxClass) {
    if (scope === "all") return ["ALL"];
    if (scope === "single") {
        const value = document.getElementById(singleInputId)?.value.trim();
        return value ? [value] : [];
    }
    return Array.from(document.querySelectorAll("." + checkboxClass + ":checked"))
        .map(cb => cb.value)
        .filter(Boolean);
}

;