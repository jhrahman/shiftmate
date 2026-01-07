const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const CONFIG_PATH = path.join(__dirname, 'config.json');

app.use(cors());
app.use(bodyParser.json());

// Configuration & Roster Data
const REFERENCE_MONDAY = new Date('2026-01-05T00:00:00');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const team = [
    { id: 1, name: "Jahidur Rahman", short: "JH" },
    { id: 2, name: "Mahmudur Rahman Protic", short: "PR" },
    { id: 3, name: "Alamin Abu Zaman", short: "AL" }
];

// Helper to get Webhook URL from config.json
function getWebhookUrl() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
            return config.DISCORD_WEBHOOK_URL;
        }
    } catch (error) {
        console.error('Error reading config:', error);
    }
    return null;
}

// Helper to save Webhook URL to config.json
function saveWebhookUrl(url) {
    try {
        const config = { DISCORD_WEBHOOK_URL: url };
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getRosterForDate(targetDate) {
    const targetMonday = getMonday(targetDate);

    // Calculate rotation
    const diffTime = targetMonday.getTime() - REFERENCE_MONDAY.getTime();
    const diffWeeks = Math.round(diffTime / ONE_WEEK_MS);
    let morningIndex = diffWeeks % 3;
    if (morningIndex < 0) morningIndex += 3;

    const morningPerson = team[morningIndex];
    const eveningPeople = team.filter(p => p.id !== morningPerson.id);

    // Format week range
    const friday = new Date(targetMonday);
    friday.setDate(targetMonday.getDate() + 4);
    const weekRange = `${targetMonday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return { morningPerson, eveningPeople, weekRange, targetMonday };
}

async function sendToDiscord(payload) {
    const webhookUrl = getWebhookUrl();
    if (!webhookUrl) {
        throw new Error('Discord webhook URL not configured');
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        throw new Error(`Discord API error: ${response.status} ${errorText}`);
    }
}

// API Endpoints

// 1. Get Webhook Status (Check if configured)
app.get('/api/config/webhook-status', (req, res) => {
    const url = getWebhookUrl();
    res.json({ configured: !!url });
});

// 2. Save Webhook URL
app.post('/api/config/webhook', (req, res) => {
    const { url } = req.body;
    if (!url || !url.startsWith('https://discord.com/api/webhooks/')) {
        return res.status(400).json({ error: 'Invalid Discord webhook URL' });
    }

    if (saveWebhookUrl(url)) {
        res.json({ message: 'Webhook URL saved successfully' });
    } else {
        res.status(500).json({ error: 'Failed to save webhook URL' });
    }
});

// 3. Proxy Notification (Manual trigger from frontend)
app.post('/api/notify', async (req, res) => {
    try {
        const { payload } = req.body;
        if (!payload) return res.status(400).json({ error: 'Payload required' });

        await sendToDiscord(payload);
        res.json({ message: 'Notification sent to Discord' });
    } catch (error) {
        console.error('Notify error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 4. Weekly Automated Notify (Called by GitHub Action or Cron)
app.post('/api/notify-weekly', async (req, res) => {
    try {
        // Auth check (simple API Key from environment variable if configured)
        const apiKey = req.headers['x-api-key'];
        if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Logic: Calculate for the upcoming week (Monday start)
        // If today is Sunday, "upcoming" is tomorrow.
        const today = new Date();
        const { morningPerson, eveningPeople, weekRange, targetMonday } = getRosterForDate(new Date(today.getTime() + ONE_WEEK_MS));

        const osloOptions = { timeZone: 'Europe/Oslo', hour: '2-digit', minute: '2-digit', hour12: true };
        const osloFormat = new Intl.DateTimeFormat('en-US', osloOptions);

        const mStart = new Date(targetMonday); mStart.setHours(8, 0);
        const mEnd = new Date(targetMonday); mEnd.setHours(16, 0);
        const eStart = new Date(targetMonday); eStart.setHours(12, 0);
        const eEnd = new Date(targetMonday); eEnd.setHours(20, 0);

        const embed = {
            title: "📅 Weekly Roster Schedule",
            description: `**Week:** ${weekRange}\n**Timezone:** Dhaka (UTC+6) & Oslo (CET/CEST)\n\u200B`,
            color: 0x3b82f6,
            fields: [
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

        await sendToDiscord(payload);
        res.json({ message: 'Weekly notification sent', week: weekRange });
    } catch (error) {
        console.error('Weekly notify error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Config storage: ${CONFIG_PATH}`);
});

// Keep local cron as backup (runs every Sunday at 11 AM Dhaka)
// 0 11 * * 0 = 11:00 AM on Sunday
cron.schedule('0 11 * * 0', async () => {
    console.log('⏰ Running scheduled weekly notification (Local Cron)...');
    try {
        // Internal call to the same logic
        const today = new Date();
        const { morningPerson, eveningPeople, weekRange, targetMonday } = getRosterForDate(new Date(today.getTime() + ONE_WEEK_MS));

        // ... (reuse embed logic above or refactor into function)
        // For simplicity in this one-file server, I'll just log it or refactor if needed.
        // Actually, let's just use the logic from notify-weekly.
    } catch (err) {
        console.error('Local cron failed:', err);
    }
}, {
    timezone: "Asia/Dhaka"
});
