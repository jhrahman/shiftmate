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

// State
let currentOffset = 0; // Weeks from current week

// Logic: If today is Saturday (6) or Sunday (0), show the NEXT week by default
const _today = new Date();
if (_today.getDay() === 6 || _today.getDay() === 0) {
    currentOffset = 1;
}

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
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
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
    const editBtn = document.getElementById('editShiftBtn');
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
    const friStr = fri.toLocaleDateString('en-US', options);

    document.getElementById('weekRange').textContent = `${monStr} - ${friStr}`;

    if (currentOffset === 0) {
        document.getElementById('weekTitle').textContent = "Current Week";
    } else if (currentOffset === 1) {
        document.getElementById('weekTitle').textContent = "Next Week";
    } else if (currentOffset === -1) {
        document.getElementById('weekTitle').textContent = "Last Week";
    } else {
        const absOffset = Math.abs(currentOffset);
        const direction = currentOffset > 0 ? "Weeks from Now" : "Weeks Ago";
        document.getElementById('weekTitle').textContent = `${absOffset} ${direction}`;
    }
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

document.getElementById('editShiftBtn').addEventListener('click', () => openModal('morning'));
document.getElementById('editEveningBtn').addEventListener('click', () => openModal('evening')); // New listener

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

function updateTimeDisplay() {
    if (is24Hour) {
        morningTimeDisplay.textContent = "08:00 - 16:00";
        eveningTimeDisplay.textContent = "12:00 - 20:00";
    } else {
        morningTimeDisplay.textContent = "08:00 AM - 04:00 PM";
        eveningTimeDisplay.textContent = "12:00 PM - 08:00 PM";
    }
}

function updateRoster() {
    _internalUpdateRoster();
    updateTimeDisplay();
    updateDiscordButtonState();
}

// Discord Integration
const DISCORD_WEBHOOK_KEY = 'discord_webhook_url';
const DEFAULT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1457044858693751078/aWE9WieKwx02Q0etBPW-baDaa_-zFogd7CIQhCCxulFWHZWs_6W-2vQUzJlxKlltDSLY';

const discordConfigModal = document.getElementById('discordConfigModal');
const configDiscordBtn = document.getElementById('configDiscordBtn');
const closeDiscordConfigBtn = document.getElementById('closeDiscordConfigBtn');
const saveWebhookBtn = document.getElementById('saveWebhookBtn');
const webhookUrlInput = document.getElementById('webhookUrlInput');
const sendDiscordBtn = document.getElementById('sendDiscordBtn');

function getWebhookUrl() {
    const stored = localStorage.getItem(DISCORD_WEBHOOK_KEY);
    return stored ? stored : DEFAULT_WEBHOOK_URL;
}

function saveWebhookUrl(url) {
    // If user saves the specific default URL, just clear storage to use default logic
    if (url === DEFAULT_WEBHOOK_URL) {
        localStorage.removeItem(DISCORD_WEBHOOK_KEY);
    } else {
        localStorage.setItem(DISCORD_WEBHOOK_KEY, url);
    }
}

function updateDiscordButtonState() {
    // Button is always enabled now because we have a default
    sendDiscordBtn.disabled = false;
    sendDiscordBtn.title = "Send to Discord";
}

// Password Protection
const CONFIG_PASSWORD = 'Shiftmate123!@#';

function openDiscordConfig() {
    const userPass = prompt("🔒 Enter admin password to configure webhook:");
    if (userPass === CONFIG_PASSWORD) {
        webhookUrlInput.value = getWebhookUrl();
        // Determine what to show in the input so specific default URL is hidden from view unless explicitly set
        // Actually, user wants to see it if they are configuring it.
        // But if it's default, maybe we show placeholder?
        // Let's just show whatever getWebhookUrl returns (which is default) so they know what follows.

        discordConfigModal.classList.remove('hidden');
        discordConfigModal.style.display = 'flex';
    } else if (userPass !== null) {
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
    if (url && url.startsWith('https://discord.com/api/webhooks/')) {
        saveWebhookUrl(url);
        closeDiscordConfig();
        updateDiscordButtonState();
        alert('Discord webhook saved successfully!');
    } else {
        alert('Please enter a valid Discord webhook URL');
    }
});

async function sendToDiscord() {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
        alert('Please configure Discord webhook first');
        return;
    }

    if (!currentTargetMonday) {
        alert('Roster data not loaded');
        return;
    }

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

    // Create visually rich Discord embed
    const embed = {
        title: "📅 Weekly Roster Schedule",
        description: `**Week:** ${weekRange}\n**Timezone:** Dhaka (UTC+6) • Monday - Friday\n\u200B`, // Zero-width space for spacing
        color: 0x3b82f6, // Blue color
        fields: [
            {
                name: "\u200B", // Spacing
                value: "```ansi\n\u001b[0;33m☀️ MORNING SHIFT\u001b[0m\n```",
                inline: false
            },
            {
                name: "⏰ Time",
                value: "```\n08:00 AM - 04:00 PM\n```",
                inline: true
            },
            {
                name: "👤 Assignee",
                value: `**${morningPerson.name}**\n\`${morningPerson.short}\``,
                inline: true
            },
            {
                name: "\u200B", // Spacing
                value: "\u200B",
                inline: false
            },
            {
                name: "\u200B", // Spacing
                value: "```ansi\n\u001b[0;34m🌙 EVENING SHIFT\u001b[0m\n```",
                inline: false
            },
            {
                name: "⏰ Time",
                value: "```\n12:00 PM - 08:00 PM\n```",
                inline: true
            },
            {
                name: "👥 Assignees",
                value: eveningPeople.map(p => `**${p.name}**\n\`${p.short}\``).join('\n\n'),
                inline: true
            }
        ],
        footer: {
            text: "ShiftMate • Automated Roster System",
            icon_url: "https://cdn.discordapp.com/emojis/1234567890.png" // Optional: Add your icon URL
        },
        timestamp: new Date().toISOString(),
        thumbnail: {
            url: "https://em-content.zobj.net/thumbs/120/twitter/348/calendar_1f4c5.png" // Calendar emoji
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

sendDiscordBtn.addEventListener('click', sendToDiscord);

// Init
updateRoster();
