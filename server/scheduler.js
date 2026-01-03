const cron = require('node-cron');
const fetch = require('node-fetch');

// Configuration
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1457044858693751078/aWE9WieKwx02Q0etBPW-baDaa_-zFogd7CIQhCCxulFWHZWs_6W-2vQUzJlxKlltDSLY';
const REFERENCE_MONDAY = new Date('2026-01-05T00:00:00');
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const team = [
    { id: 1, name: "Jahidur Rahman", short: "JH" },
    { id: 2, name: "Mahmudur Rahman Protic", short: "PR" },
    { id: 3, name: "Alamin Abu Zaman", short: "AL" }
];

function getMonday(d) {
    d = new Date(d);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getNextWeekRoster() {
    // Get next Monday (the week we're notifying about)
    const today = new Date();
    const daysUntilMonday = (8 - today.getDay()) % 7 || 7;
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    const targetMonday = getMonday(nextMonday);

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

    return { morningPerson, eveningPeople, weekRange };
}

async function sendDiscordNotification() {
    if (!DISCORD_WEBHOOK_URL || DISCORD_WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
        console.error('❌ Discord webhook URL not configured!');
        console.log('Set DISCORD_WEBHOOK_URL environment variable or edit scheduler.js');
        return;
    }

    try {
        const { morningPerson, eveningPeople, weekRange } = getNextWeekRoster();

        console.log(`📅 Sending roster for week: ${weekRange}`);
        console.log(`☀️ Morning: ${morningPerson.name}`);
        console.log(`🌙 Evening: ${eveningPeople.map(p => p.name).join(', ')}`);

        const embed = {
            title: "📅 Weekly Roster Schedule",
            description: `**Week:** ${weekRange}\n**Timezone:** Dhaka (UTC+6) • Monday - Friday\n\u200B`,
            color: 0x3b82f6,
            fields: [
                {
                    name: "\u200B",
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
                    name: "\u200B",
                    value: "\u200B",
                    inline: false
                },
                {
                    name: "\u200B",
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
                text: "ShiftMate • Automated Roster System"
            },
            timestamp: new Date().toISOString(),
            thumbnail: {
                url: "https://em-content.zobj.net/thumbs/120/twitter/348/calendar_1f4c5.png"
            }
        };

        const payload = {
            content: "@everyone 📢 **New Weekly Roster Available!**",
            embeds: [embed]
        };

        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok || response.status === 204) {
            console.log('✅ Roster sent to Discord successfully!');
        } else {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
    } catch (error) {
        console.error('❌ Failed to send Discord notification:', error.message);
    }
}

// Schedule: Every Saturday at 10:30 PM (Dhaka time, UTC+6)
// Cron format: minute hour day-of-month month day-of-week
// 30 22 * * 6 = 10:30 PM on Saturday (day 6)
const cronSchedule = '30 22 * * 6';

console.log('🚀 Roster Scheduler Started');
console.log(`📅 Scheduled to run: Every Saturday at 10:30 PM (UTC+6)`);
console.log(`⏰ Next run will be calculated by cron`);
console.log('');

// Schedule the job
cron.schedule(cronSchedule, () => {
    const now = new Date();
    console.log(`\n⏰ Triggered at: ${now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })} (Dhaka time)`);
    sendDiscordNotification();
}, {
    timezone: "Asia/Dhaka"
});

// Optional: Send a test notification on startup (comment out in production)
// console.log('🧪 Sending test notification...');
// sendDiscordNotification();

console.log('✅ Scheduler is running. Press Ctrl+C to stop.');
