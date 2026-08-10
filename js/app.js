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
                
                // Grid Card View (Direct Shutdown Trigger)
                const card = `
                    <div class="pc-card" data-name="${pc.name.toLowerCase()}" data-ip="${pc.ip}">
                        <div class="pc-card-header">
                            <span class="pc-card-title"><i class="fa-solid fa-desktop"></i> ${pc.name}</span>
                            <span class="badge-status ${badgeClass}">${pc.status}</span>
                        </div>
                        <div class="pc-card-ip"><i class="fa-solid fa-network-wired"></i> ${pc.ip}</div>
                        <div class="pc-card-actions">
                            <button class="pc-action-btn" style="background:#dc2626;" title="Shutdown" onclick="directShutdown('${pc.name}')">
                                <i class="fa-solid fa-power-off"></i> Shutdown
                            </button>
                            <button class="pc-action-btn" style="background:#16a34a;" title="Restart" onclick="openRestartModal('${pc.name}')"><i class="fa-solid fa-rotate-right"></i> Restart</button>
                            <button class="pc-action-btn" style="background:#0284c7;" title="Send Message" onclick="openSendMsgModal()"><i class="fa-solid fa-envelope"></i> Msg</button>
                        </div>
                    </div>
                `;
                if (gridContainer) gridContainer.innerHTML += card;

                // List View Row (Direct Shutdown Trigger)
                const row = `
                    <tr class="pc-table-row" data-name="${pc.name.toLowerCase()}" data-ip="${pc.ip}">
                        <td class="pc-name"><i class="fa-solid fa-desktop" style="margin-right:8px;"></i>${pc.name}</td>
                        <td style="color:#475569;">${pc.ip}</td>
                        <td><span class="badge-status ${badgeClass}">${pc.status}</span></td>
                        <td>
                            <div class="list-action-btns">
                                <button class="pc-action-btn" style="background:#dc2626; padding: 6px 10px;" title="Shutdown" onclick="directShutdown('${pc.name}')">
                                    <i class="fa-solid fa-power-off"></i> Shutdown
                                </button>
                                <button class="pc-action-btn" style="background:#16a34a; padding: 6px 10px;" title="Restart" onclick="openRestartModal('${pc.name}')"><i class="fa-solid fa-rotate-right"></i> Restart</button>
                                <button class="pc-action-btn" style="background:#0284c7; padding: 6px 10px;" title="Send Message" onclick="openSendMsgModal()"><i class="fa-solid fa-envelope"></i> Msg</button>
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
// 3. DIRECT SHUTDOWN HANDLER
// ==========================================
async function directShutdown(computerName) {
    if (localStorage.getItem("loginSuccess") !== "true") {
        if (typeof showAccessDenied === "function") {
            showAccessDenied();
        } else {
            alert("Access Denied\n\nYou are not authorized to perform this action.");
        }
        return;
    }

    if (!confirm(`Kya aap waqai ${computerName} ko shutdown karna chahte hain?`)) return;

    try {
        let response = await window.pywebview.api.shutdown_computer({
            targets: [computerName],
            delay: 0,
            force: true
        });

        if (response && response.success) {
            alert(`${computerName} par shutdown command bhej di gayi hai.`);
            if (typeof logActivity === "function") {
                logActivity(computerName, "Shutdown Sent", "Success");
            }
            loadDashboard();
        } else {
            alert(`Shutdown fail ho gaya: ${response ? response.message : "Unknown error"}`);
        }
    } catch (e) {
        console.error("Error executing shutdown:", e);
        alert("Shutdown execute karte waqt error aaya.");
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
// 7. WEBSITE, COPY FILES & SEND MSG LOGIC
// ==========================================
function openWebsiteModal() { document.getElementById("websiteModal").style.display = "flex"; }
function closeWebsiteModal() { document.getElementById("websiteModal").style.display = "none"; }
async function executeOpenWebsite() {
    const url = document.getElementById("websiteUrlInput").value.trim();
    if (!url) { alert("Please enter a valid URL."); return; }
    try {
        const res = await window.pywebview.api.open_website({ url, targets: ["ALL"] });
        document.getElementById("websiteResponseMsg").innerText = res.message;
    } catch(e) { console.error(e); }
}

function openCopyFilesModal() { document.getElementById("copyFilesModal").style.display = "flex"; }
function closeCopyFilesModal() { document.getElementById("copyFilesModal").style.display = "none"; }
async function executeCopyFiles() {
    const source = document.getElementById("sourcePathInput").value.trim();
    const dest = document.getElementById("destPathInput").value.trim();
    if (!source || !dest) { alert("Please fill both paths."); return; }
    try {
        const res = await window.pywebview.api.copy_files({ source, dest, targets: ["ALL"] });
        document.getElementById("copyFilesResponseMsg").innerText = res.message;
    } catch(e) { console.error(e); }
}

function openSendMsgModal() { document.getElementById("sendMsgModal").style.display = "flex"; }
function closeSendMsgModal() { document.getElementById("sendMsgModal").style.display = "none"; }
async function executeSendMsg() {
    const message = document.getElementById("broadcastMsgInput").value.trim();
    if (!message) { alert("Please enter a message."); return; }
    try {
        const res = await window.pywebview.api.send_message({ message, targets: ["ALL"] });
        document.getElementById("sendMsgResponseMsg").innerText = res.message;
    } catch(e) { console.error(e); }
}

function openSettingsModal() { document.getElementById("settingsModal").style.display = "flex"; }
function closeSettingsModal() { document.getElementById("settingsModal").style.display = "none"; }

// Live Clock Updater Function
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
    if (clockElement) clockElement.innerText = timeString;
}
setInterval(updateLiveClock, 1000);

// Global array to store activities
let activityLog = [
    { time: "09:15 AM", computer: "PC-LAB-01", action: "VNC Started", status: "Success" }
];

function logActivity(computer, action, status) {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeString = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    activityLog.unshift({ time: timeString, computer, action, status });
    renderRecentActivity();
}

function renderRecentActivity() {
    const tbody = document.getElementById('recentActivityBody');
    const modalTbody = document.getElementById('allActivityModalBody');
    if (!tbody) return;

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

function openRecentActivityModal() {
    renderRecentActivity();
    document.getElementById('recentActivityModal').style.display = 'flex';
}

function closeRecentActivityModal() {
    document.getElementById('recentActivityModal').style.display = 'none';
}

document.addEventListener("DOMContentLoaded", () => {
    renderRecentActivity();
    loadSystemUser();
});

// RESTRICTED ACCESS & LOGIN VALIDATION LOGIC
document.addEventListener("DOMContentLoaded", function () {
    const isSuccess = localStorage.getItem("loginSuccess") === "true";
    if (!isSuccess) {
        disableRestrictedActions();
    }
});

function disableRestrictedActions() {
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
}

function showAccessDenied() {
    alert("Access Denied\n\nYou are not authorized to perform this action.");
}

async function loadSystemUser() {
    try {
        let systemUserText = await window.pywebview.api.get_current_system_user();
        const displayEl = document.getElementById("systemUserDisplay");
        if (displayEl) displayEl.innerText = systemUserText;
    } catch (error) {
        console.error("Error fetching system user:", error);
    }
}