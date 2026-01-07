const team = [
    { id: 1, name: "Jahidur Rahman", short: "JH" },
    { id: 2, name: "Mahmudur Rahman Protic", short: "PR" },
    { id: 3, name: "Alamin Abu Zaman", short: "AL" }
];

// Configuration
// Requirements: 
// 1. Jahidur Morning (Week of Jan 5, 2026)
// 2. Mahmudur Morning (Week of Jan 12, 2026)
// 3. Alamin Morning (Week of Jan 19, 2026)
// Rotation: Jahidur -> Mahmudur -> Alamin -> Jahidur ...

// Reference date: Jan 5, 2026 is Jahidur's Morning week.
const REFERENCE_MONDAY = new Date('2026-01-05T00:00:00');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Logic: offset 0 is the current/next active week
// getMonday(today) now automatically shifts on Sat/Sun
let currentOffset = 0;


let currentTargetMonday = null; // To store the currently viewed week's Monday

// Storage Keys
const STORAGE_KEY = 'roster_overrides';

function getOverrides() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

function saveOverride(mondayStr, personId) {
    const overrides = getOverrides();
    overrides[mondayStr] = personId;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function removeOverride(mondayStr) {
    const overrides = getOverrides();
    delete overrides[mondayStr];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

function getMonday(d) {
    d = new Date(d);
    var day = d.getDay();
    // Standard Monday calculation
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);

    // UI behavior: Saturday and Sunday shift focus to the next week
    if (day === 6 || day === 0) {
        diff += 7;
    }

    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Helper to get consistent YYYY-MM-DD key using Local Time
function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function _internalUpdateRoster() {
    const today = new Date();
    // Calculate the target week's Monday based on offset
    const targetDate = new Date(today.getTime() + (currentOffset * ONE_WEEK_MS));
    currentTargetMonday = getMonday(targetDate);
    const dateStr = getDateKey(currentTargetMonday);

    // Check for override
    const overrides = getOverrides();
    let morningPerson;
    const overrideId = overrides[dateStr];

    if (overrideId) {
        morningPerson = team.find(p => p.id === parseInt(overrideId));
    }

    if (!morningPerson) {
        // Fallback to auto rotation if no override or invalid override
        const diffTime = currentTargetMonday.getTime() - REFERENCE_MONDAY.getTime();
        const diffWeeks = Math.round(diffTime / ONE_WEEK_MS);

        let morningIndex = diffWeeks % 3;
        if (morningIndex < 0) morningIndex += 3;
        morningPerson = team[morningIndex];
    }

    const eveningPeople = team.filter(p => p.id !== morningPerson.id);

    // Update DOM
    renderDateHeader();
    renderWeekInfo(currentTargetMonday);
    renderShifts(morningPerson, eveningPeople);

    // Update Override Indicator (Visual Cue)
    // Style the edit button if overridden
    const editBtn = document.getElementById('editMorningBtn');
    if (editBtn) {
        if (overrideId) {
            editBtn.style.color = 'var(--accent-morning)';
            editBtn.style.opacity = '1';
        } else {
            editBtn.style.color = '';
            editBtn.style.opacity = '';
        }
    }
}

function renderDateHeader() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDateDisplay').textContent = new Date().toLocaleDateString('en-US', options);
}

function renderWeekInfo(mon) {
    const fri = new Date(mon);
    fri.setDate(mon.getDate() + 4);

    const options = { month: 'short', day: 'numeric' };
    const monStr = mon.toLocaleDateString('en-US', options);
    const friStr = fri.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    document.getElementById('weekRange').textContent = `${monStr} - ${friStr}`;

    // Reliable Date-based labeling using the new getMonday logic
    const today = new Date();
    const baselineMonday = getMonday(today);

    // Difference in weeks from the 'Active' week
    const diffWeeks = Math.round((mon.getTime() - baselineMonday.getTime()) / ONE_WEEK_MS);

    let titleLabel = "";
    if (diffWeeks === 0) {
        titleLabel = "Current Week";
    } else if (diffWeeks === 1) {
        titleLabel = "Next Week";
    } else if (diffWeeks === -1) {
        titleLabel = "Previous Week";
    } else if (diffWeeks > 1) {
        titleLabel = `${diffWeeks} Weeks from Now`;
    } else {
        titleLabel = `${Math.abs(diffWeeks)} Weeks Ago`;
    }

    document.getElementById('weekTitle').textContent = titleLabel;
}

function renderShifts(morning, eveningGroup) {
    // Morning
    document.getElementById('morningPerson').textContent = morning.name;
    document.getElementById('morningAvatar').textContent = morning.short;

    // Evening
    const eveningContainer = document.getElementById('eveningList');
    eveningContainer.innerHTML = '';

    eveningGroup.forEach(person => {
        const div = document.createElement('div');
        div.className = 'assignee-card'; // Changed class name
        div.innerHTML = `
            <div class="avatar">${person.short}</div>
            <div class="person-info">
                <span class="name">${person.name}</span>
                <span class="role">Assignee</span>
            </div>
        `;
        eveningContainer.appendChild(div);
    });
}

// Modal Logic
const modal = document.getElementById('overrideModal');
const modalPersonList = document.getElementById('modalPersonList');
const closeModalBtn = document.getElementById('closeModalBtn');
const resetOverrideBtn = document.getElementById('resetOverrideBtn');
const saveOverrideBtn = document.getElementById('saveOverrideBtn');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

let currentEditMode = 'morning'; // 'morning' or 'evening'
let pendingSelections = [];

function openModal(mode) {
    currentEditMode = mode;
    pendingSelections = [];

    modal.classList.remove('hidden');
    modal.style.display = 'flex'; // Force display flex

    const dateStr = getDateKey(currentTargetMonday);
    const overrides = getOverrides();
    const currentOverrideId = overrides[dateStr];

    // Determine current selections based on mode and current override/auto logic
    let currentMorningId;

    if (currentOverrideId) {
        currentMorningId = parseInt(currentOverrideId);
    } else {
        // Fallback to auto
        const diffTime = currentTargetMonday.getTime() - REFERENCE_MONDAY.getTime();
        const diffWeeks = Math.round(diffTime / ONE_WEEK_MS);
        let morningIndex = diffWeeks % 3;
        if (morningIndex < 0) morningIndex += 3;
        currentMorningId = team[morningIndex].id;
    }

    if (mode === 'morning') {
        modalTitle.textContent = "Override Morning Shift";
        modalDesc.textContent = "Select the person for Morning Shift:";
        saveOverrideBtn.classList.add('hidden'); // Single click for morning
    } else {
        modalTitle.textContent = "Override Evening Shift";
        modalDesc.textContent = "Select 2 people for Evening Shift:";
        saveOverrideBtn.classList.remove('hidden');

        // If mode is evening, the 'selected' ones are the NON-morning ones
        const eveningIds = team.filter(p => p.id !== currentMorningId).map(p => p.id);
        pendingSelections = [...eveningIds];
    }

    renderModalList(currentMorningId);

    // Show Reset if overridden
    if (currentOverrideId) {
        resetOverrideBtn.classList.remove('hidden');
    } else {
        resetOverrideBtn.classList.add('hidden');
    }
}

function renderModalList(currentMorningId) {
    modalPersonList.innerHTML = '';

    team.forEach(person => {
        const div = document.createElement('div');
        div.className = 'person-option';

        let isSelected = false;

        if (currentEditMode === 'morning') {
            isSelected = (person.id === currentMorningId);
        } else {
            isSelected = pendingSelections.includes(person.id);
        }

        if (isSelected) {
            div.classList.add('selected');
        }

        div.innerHTML = `
            <div class="avatar">${person.short}</div>
            <span class="name">${person.name}</span>
            ${isSelected ? '<i class="fa-solid fa-check" style="margin-left:auto;color:var(--primary)"></i>' : ''}
        `;

        div.addEventListener('click', () => handleOptionClick(person.id));
        modalPersonList.appendChild(div);
    });
}

function handleOptionClick(personId) {
    const dateStr = getDateKey(currentTargetMonday);

    if (currentEditMode === 'morning') {
        saveOverride(dateStr, personId);
        closeModal();
        updateRoster();
    } else {
        // Toggle selection for Evening
        if (pendingSelections.includes(personId)) {
            pendingSelections = pendingSelections.filter(id => id !== personId);
        } else {
            if (pendingSelections.length < 2) {
                pendingSelections.push(personId);
            } else {
                // Already 2 selected, maybe replace the first one? Or just block?
                // UX decision: Replace first one to shift selection
                pendingSelections.shift();
                pendingSelections.push(personId);
            }
        }
        // Re-render list to show new selection state
        renderModalList(null); // ID doesn't matter for evening render as it uses pendingSelections
    }
}

function saveEveningOverride() {
    if (pendingSelections.length !== 2) {
        alert("Please select exactly 2 people for the Evening shift.");
        return;
    }

    // The person NOT in pendingSelections is the Morning person
    const morningPerson = team.find(p => !pendingSelections.includes(p.id));
    if (morningPerson) {
        const dateStr = getDateKey(currentTargetMonday);
        saveOverride(dateStr, morningPerson.id);
        closeModal();
        updateRoster();
    }
}

function closeModal() {
    modal.classList.add('hidden');
    setTimeout(() => {
        if (modal.classList.contains('hidden')) modal.style.display = 'none';
    }, 300); // Wait for transition
}

// Event Listeners
document.getElementById('prevWeekBtn').addEventListener('click', () => {
    currentOffset--;
    updateRoster();
});

document.getElementById('nextWeekBtn').addEventListener('click', () => {
    currentOffset++;
    updateRoster();
});

// Security & PIN Protection
const ACTION_PIN_HASH = 'b6602f58690ca41488e97cd28153671356747c951c55541b6c8d8b8493eb7143';
const CONFIG_PASS_HASH = '4ebdc92790b86d6233b9f84fc59c1eecef10cc0d409bf2161649477c524538e3';

async function hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function checkPin(callback) {
    const pin = prompt("🔒 Enter 4-digit PIN to proceed:");
    if (!pin) return;

    const hashedInput = await hashString(pin);
    if (hashedInput === ACTION_PIN_HASH) {
        callback(pin);
    } else {
        alert("❌ Incorrect PIN!");
    }
}

// Global to store public encrypted config
window.PUBLIC_CONFIG = null;

async function fetchPublicConfig() {
    try {
        const res = await fetch('https://jhrahman.github.io/shiftmate/scripts/discord_config.json');
        if (res.ok) {
            window.PUBLIC_CONFIG = await res.json();
            console.log('📦 Loaded public encrypted configuration');
        }
    } catch (e) {
        console.warn('Public config not found or unreachable');
    }
}

// Simple Encryption/Decryption helpers using the PIN
async function decryptWebhook(pin) {
    if (!window.PUBLIC_CONFIG || !window.PUBLIC_CONFIG.v) return null;

    try {
        const data = atob(window.PUBLIC_CONFIG.v);
        const parts = data.split(':');
        const iv = new Uint8Array(parts[0].split(',').map(Number));
        const encrypted = new Uint8Array(parts[1].split(',').map(Number));

        const keyMaterial = await crypto.subtle.importKey(
            "raw", new TextEncoder().encode(pin.padStart(16, '0')), "PBKDF2", false, ["deriveKey"]
        );
        const key = await crypto.subtle.deriveKey(
            { name: "PBKDF2", salt: new TextEncoder().encode("shiftmate-salt"), iterations: 1000, hash: "SHA-256" },
            keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted);
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error('Decryption failed:', e);
        return null;
    }
}

async function encryptWebhook(pin, url) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
        "raw", new TextEncoder().encode(pin.padStart(16, '0')), "PBKDF2", false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: new TextEncoder().encode("shiftmate-salt"), iterations: 1000, hash: "SHA-256" },
        keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
    );

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, new TextEncoder().encode(url));
    const blob = iv.toString() + ':' + new Uint8Array(encrypted).toString();
    return btoa(blob);
}

document.getElementById('editMorningBtn').addEventListener('click', () => checkPin(() => openModal('morning')));
document.getElementById('editEveningBtn').addEventListener('click', () => checkPin(() => openModal('evening')));

closeModalBtn.addEventListener('click', closeModal);
resetOverrideBtn.addEventListener('click', () => {
    const dateStr = getDateKey(currentTargetMonday);
    removeOverride(dateStr);
    closeModal();
    updateRoster();
});

saveOverrideBtn.addEventListener('click', saveEveningOverride);

// Time Format Toggle
let is24Hour = false; // Default to 12h
const toggleTimeBtn = document.getElementById('toggleTimeBtn');
const morningTimeDisplay = document.getElementById('morningTimeDisplay');
const eveningTimeDisplay = document.getElementById('eveningTimeDisplay');

// Initialize button text
toggleTimeBtn.textContent = "12h";

toggleTimeBtn.addEventListener('click', () => {
    is24Hour = !is24Hour;
    toggleTimeBtn.textContent = is24Hour ? "24h" : "12h";
    updateTimeDisplay();
});

const morningTimeOslo = document.getElementById('morningTimeOslo');
const eveningTimeOslo = document.getElementById('eveningTimeOslo');

function updateTimeDisplay() {
    // Current week's Monday at target shift starts
    const targetMonday = currentTargetMonday || getMonday(new Date());

    // Create UTC-aligned dates for the shift starts in Dhaka (UTC+6)
    // Morning: 08:00 AM Dhaka
    const mStart = new Date(targetMonday);
    mStart.setHours(8, 0, 0, 0);
    const mEnd = new Date(targetMonday);
    mEnd.setHours(16, 0, 0, 0);

    // Evening: 12:00 PM Dhaka
    const eStart = new Date(targetMonday);
    eStart.setHours(12, 0, 0, 0);
    const eEnd = new Date(targetMonday);
    eEnd.setHours(20, 0, 0, 0);

    const osloOptions = {
        timeZone: 'Europe/Oslo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour
    };

    const osloFormat = new Intl.DateTimeFormat('en-GB', osloOptions);

    if (is24Hour) {
        morningTimeDisplay.textContent = "08:00 - 16:00";
        eveningTimeDisplay.textContent = "12:00 - 20:00";
    } else {
        morningTimeDisplay.textContent = "08:00 AM - 04:00 PM";
        eveningTimeDisplay.textContent = "12:00 PM - 08:00 PM";
    }

    // Update Oslo labels
    morningTimeOslo.textContent = `Oslo: ${osloFormat.format(mStart)} - ${osloFormat.format(mEnd)}`;
    eveningTimeOslo.textContent = `Oslo: ${osloFormat.format(eStart)} - ${osloFormat.format(eEnd)}`;
}

function updateRoster() {
    _internalUpdateRoster();
    updateTimeDisplay();
    updateDiscordButtonState();
}

// Discord Integration (GitHub-Only Flow)
const DISCORD_WEBHOOK_KEY = 'discord_webhook_url';
const GITHUB_TOKEN_KEY = 'github_token';

const discordConfigModal = document.getElementById('discordConfigModal');
const configDiscordBtn = document.getElementById('configDiscordBtn');
const closeDiscordConfigBtn = document.getElementById('closeDiscordConfigBtn');
const saveWebhookBtn = document.getElementById('saveWebhookBtn');
const webhookUrlInput = document.getElementById('webhookUrlInput');
const githubTokenInput = document.getElementById('githubTokenInput');
const sendDiscordBtn = document.getElementById('sendDiscordBtn');
const incognitoWarning = document.getElementById('incognitoWarning');

function getWebhookUrl() {
    return localStorage.getItem(DISCORD_WEBHOOK_KEY);
}

function saveWebhookUrl(url) {
    localStorage.setItem(DISCORD_WEBHOOK_KEY, url);
}

function getGithubToken() {
    return localStorage.getItem(GITHUB_TOKEN_KEY);
}

function saveGithubToken(token) {
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
}

function isIncognito() {
    try {
        localStorage.setItem('__test__', '1');
        localStorage.removeItem('__test__');
        return false;
    } catch (e) {
        return true;
    }
}

async function syncSettingsToGithub(token, webhookUrl) {
    const varName = 'PUBLIC_DISCORD_WEBHOOK_URL';
    const baseUrl = 'https://api.github.com/repos/jhrahman/shiftmate/actions/variables';

    try {
        const checkRes = await fetch(`${baseUrl}/${varName}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
        });

        const method = checkRes.ok ? 'PATCH' : 'POST';
        const url = checkRes.ok ? `${baseUrl}/${varName}` : baseUrl;
        const body = { name: varName, value: webhookUrl || "" };

        const res = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`GitHub Sync Failed (${res.status}): ${err}`);
        }
    } catch (e) {
        throw new Error("Ensure your token has 'repo' scope and 'Variables: Write' permission. " + e.message);
    }
}

async function syncSettingsFromGithub() {
    const token = getGithubToken();
    if (!token) return;

    try {
        const varName = 'PUBLIC_DISCORD_WEBHOOK_URL';
        const res = await fetch(`https://api.github.com/repos/jhrahman/shiftmate/actions/variables/${varName}`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
        });

        if (res.ok) {
            const data = await res.json();
            if (data.value && data.value !== getWebhookUrl()) {
                saveWebhookUrl(data.value);
                updateDiscordButtonState();
                console.log('🔄 Synced Webhook URL from GitHub');
            }
        }
    } catch (error) {
        console.error('Failed to sync settings from GitHub:', error);
    }
}

function updateDiscordButtonState() {
    const webhookUrl = getWebhookUrl();
    const githubToken = getGithubToken();
    const hasPublicConfig = !!(window.PUBLIC_CONFIG && window.PUBLIC_CONFIG.v);

    if (webhookUrl || githubToken || hasPublicConfig) {
        sendDiscordBtn.disabled = false;

        if (githubToken) {
            sendDiscordBtn.title = "Send to Discord (GitHub Action)";
        } else if (webhookUrl) {
            sendDiscordBtn.title = "Send to Discord (Direct)";
        } else {
            sendDiscordBtn.title = "Send to Discord (Requires PIN)";
        }
    } else {
        sendDiscordBtn.disabled = true;
        sendDiscordBtn.title = "Please configure Discord webhook or GitHub Token first";
    }
}

// Password Protection Configuration
async function openDiscordConfig() {
    const userPass = prompt("🔒 Enter admin password to configure webhook:");
    if (!userPass) return;

    const hashedInput = await hashString(userPass);
    if (hashedInput === CONFIG_PASS_HASH) {
        webhookUrlInput.value = getWebhookUrl() || "";
        githubTokenInput.value = getGithubToken() || "";

        // Show incognito warning
        if (isIncognito()) {
            if (incognitoWarning) incognitoWarning.classList.add('active');
        } else {
            if (incognitoWarning) incognitoWarning.classList.remove('active');
        }

        discordConfigModal.classList.remove('hidden');
        discordConfigModal.style.display = 'flex';
    } else {
        alert("❌ Incorrect password! Access denied.");
    }
}

function closeDiscordConfig() {
    discordConfigModal.classList.add('hidden');
    setTimeout(() => {
        if (discordConfigModal.classList.contains('hidden')) {
            discordConfigModal.style.display = 'none';
        }
    }, 300);
}

configDiscordBtn.addEventListener('click', openDiscordConfig);
closeDiscordConfigBtn.addEventListener('click', closeDiscordConfig);

saveWebhookBtn.addEventListener('click', () => {
    const url = webhookUrlInput.value.trim();
    const token = githubTokenInput.value.trim();

    if (url) {
        if (url.startsWith('https://discord.com/api/webhooks/')) {
            saveWebhookUrl(url);
        } else {
            alert('Please enter a valid Discord webhook URL');
            return;
        }
    } else {
        localStorage.removeItem(DISCORD_WEBHOOK_KEY);
    }

    if (token) {
        saveGithubToken(token);
    } else {
        localStorage.removeItem(GITHUB_TOKEN_KEY);
    }

    closeDiscordConfig();
    updateDiscordButtonState();

    if (token) {
        saveWebhookBtn.disabled = true;
        saveWebhookBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing...';

        // 1. Sync to Variables (Internal storage)
        const p1 = syncSettingsToGithub(token, url);

        // 2. Sync to Public Encrypted File (Cross-device without settings repeated)
        const pin = prompt("🔐 Confirm your 4-digit PIN to enable Cross-Device Sync:");
        if (!pin) {
            saveWebhookBtn.disabled = false;
            saveWebhookBtn.innerHTML = 'Save Settings';
            return;
        }

        encryptWebhook(pin, url).then(encryptedBlob => {
            return commitFileToGithub(token, 'scripts/discord_config.json', JSON.stringify({ v: encryptedBlob }));
        }).then(() => {
            alert('🚀 Cross-device sync enabled! You can now use "Notify Discord" on ANY device using just your PIN.');
        }).catch(err => {
            console.error('Sync error:', err);
            alert('⚠️ Local settings saved, but sync failed: ' + err.message);
        }).finally(() => {
            saveWebhookBtn.disabled = false;
            saveWebhookBtn.innerHTML = 'Save Settings';
        });
    } else {
        alert('✅ Settings saved locally!');
    }
});

async function commitFileToGithub(token, path, content) {
    const baseUrl = `https://api.github.com/repos/jhrahman/shiftmate/contents/${path}`;

    // Get existing file SHA if it exists
    const getRes = await fetch(baseUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    let sha = null;
    if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
    }

    const res = await fetch(baseUrl, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `chore: update encrypted discord config`,
            content: btoa(content),
            sha: sha
        })
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to commit config: ${err}`);
    }
}

async function triggerGithubAction() {
    const token = getGithubToken();
    if (!token) throw new Error("GitHub Token missing");

    // Calculate current offset for the Action
    // GitHub Action script defaults to 1 (next week), so we pass the current offset
    // relative to what we are viewing.
    // If we want the CURRENT view's roster, we need to pass that offset.
    const response = await fetch('https://api.github.com/repos/jhrahman/shiftmate/actions/workflows/weekly-notify.yml/dispatches', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ref: 'main',
            inputs: {
                week_offset: currentOffset.toString()
            }
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`GitHub API Error: ${response.status} ${err}`);
    }
}

async function sendToDiscord(pin) {
    let webhookUrl = getWebhookUrl();
    const githubToken = getGithubToken();

    // If no local config, try to decrypt from public repo file using the PIN
    if (!webhookUrl && !githubToken && pin) {
        webhookUrl = await decryptWebhook(pin);
        if (!webhookUrl) {
            alert('❌ Decryption failed! Please ensure your PIN is correct and sync has been performed.');
            return;
        }
    }

    if (!webhookUrl && !githubToken) {
        alert('Please configure Discord webhook or GitHub Token first');
        return;
    }

    if (!currentTargetMonday) {
        alert('Roster data not loaded');
        return;
    }

    // Modal behavior: Prefer GitHub Action if token is available for "all time"/managed experience
    if (githubToken) {
        try {
            sendDiscordBtn.disabled = true;
            sendDiscordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Triggering Action...';

            await triggerGithubAction();

            alert('🚀 GitHub Action triggered! The roster will be sent to Discord shortly using your secure GitHub Secret.');
        } catch (error) {
            console.error('GH Trigger error:', error);
            alert('❌ Failed to trigger GitHub Action: ' + error.message);
        } finally {
            sendDiscordBtn.disabled = false;
            sendDiscordBtn.innerHTML = '<i class="fa-brands fa-discord"></i> Notify Discord';
            updateDiscordButtonState();
        }
        return;
    }

    // Fallback: Direct Webhook (Backup)
    // Get current roster data
    const dateStr = getDateKey(currentTargetMonday);
    const overrides = getOverrides();
    const overrideId = overrides[dateStr];

    let morningPerson;
    if (overrideId) {
        morningPerson = team.find(p => p.id === parseInt(overrideId));
    }

    if (!morningPerson) {
        const diffTime = currentTargetMonday.getTime() - REFERENCE_MONDAY.getTime();
        const diffWeeks = Math.round(diffTime / ONE_WEEK_MS);
        let morningIndex = diffWeeks % 3;
        if (morningIndex < 0) morningIndex += 3;
        morningPerson = team[morningIndex];
    }

    const eveningPeople = team.filter(p => p.id !== morningPerson.id);

    // Format week range
    const friday = new Date(currentTargetMonday);
    friday.setDate(currentTargetMonday.getDate() + 4);
    const weekRange = `${currentTargetMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    // For Discord embed, we use 12h format for clarity
    const osloOptions = { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', hour12: true };
    const osloFormat = new Intl.DateTimeFormat('en-US', osloOptions);

    const mStart = new Date(currentTargetMonday); mStart.setHours(8, 0);
    const mEnd = new Date(currentTargetMonday); mEnd.setHours(16, 0);
    const eStart = new Date(currentTargetMonday); eStart.setHours(12, 0);
    const eEnd = new Date(currentTargetMonday); eEnd.setHours(20, 0);

    // Create visually rich Discord embed
    const embed = {
        title: "📅 Weekly Roster Schedule",
        description: `**Week:** ${weekRange}\n**Timezone:** Dhaka (UTC+6) & Oslo (CET/CEST)\n\u200B`,
        color: 0x4289F7,
        fields: [
            {
                name: "━━━━━━━━━━━━━━━━━━━━━━━━━━",
                value: "\u200B",
                inline: false
            },
            {
                name: "☀️  MORNING SHIFT",
                value: `⏰ **Dhaka:** 08:00 AM - 04:00 PM\n🌍 **Oslo:** ${osloFormat.format(mStart)} - ${osloFormat.format(mEnd)}\n👤 **Assignee:** **${morningPerson.name}** (\`${morningPerson.short}\`)\n\u200B`,
                inline: false
            },
            {
                name: "━━━━━━━━━━━━━━━━━━━━━━━━━━",
                value: "\u200B",
                inline: false
            },
            {
                name: "🌙  EVENING SHIFT",
                value: `⏰ **Time (Dhaka):** 12:00 PM - 08:00 PM\n🌍 **Time (Oslo):** ${osloFormat.format(eStart)} - ${osloFormat.format(eEnd)}\n👤 **Assignees:**\n${eveningPeople.map(p => `• **${p.name}** (\`${p.short}\`)`).join('\n')}`,
                inline: false
            }
        ],
        footer: {
            text: "ShiftMate • Automated Roster System",
            icon_url: "https://jhrahman.github.io/shiftmate/logo.png"
        },
        timestamp: new Date().toISOString(),
        thumbnail: {
            url: "https://jhrahman.github.io/shiftmate/logo.png"
        }
    };

    const payload = {
        content: "@everyone 📢 **New Weekly Roster Available!**",
        embeds: [embed]
    };

    try {
        sendDiscordBtn.disabled = true;
        sendDiscordBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok || response.status === 204) {
            alert('✅ Roster sent to Discord successfully!');
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Discord send error:', error);
        alert('❌ Failed to send to Discord. Please check your webhook URL.');
    } finally {
        sendDiscordBtn.disabled = false;
        sendDiscordBtn.innerHTML = '<i class="fa-brands fa-discord"></i> Notify Discord';
        updateDiscordButtonState();
    }
}

sendDiscordBtn.addEventListener('click', () => checkPin(sendToDiscord));

// Init
async function init() {
    await fetchPublicConfig();
    updateDiscordButtonState();
    await syncSettingsFromGithub();
    updateRoster();
}

init();
