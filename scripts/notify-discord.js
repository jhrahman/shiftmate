const https = require('https');

// Configuration data from script.js
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

function getRosterForDate(targetDate) {
    const targetMonday = getMonday(targetDate);

    // Calculate rotation
    const diffTime = targetMonday.getTime() - REFERENCE_MONDAY.getTime();
    const diffWeeks = Math.round(diffTime / ONE_WEEK_MS);
    let morningIndex = diffWeeks % 3;
    if (morningIndex < 0) morningIndex += 3;

    const morningPerson = team[morningIndex];
    const eveningPeople = team.filter(p => p.id !== morningPerson.id);

    // Format week range (Dhaka Time style)
    const options = { month: 'short', day: 'numeric' };
    const monStr = targetMonday.toLocaleDateString('en-US', options);
    const friday = new Date(targetMonday);
    friday.setDate(targetMonday.getDate() + 4);
    const friStr = friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const weekRange = `${monStr} - ${friStr}`;

    return { morningPerson, eveningPeople, weekRange, targetMonday };
}

async function sendToDiscord(payload, webhookUrl) {
    return new Promise((resolve, reject) => {
        const url = new URL(webhookUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = https.request(options, (res) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve();
            } else {
                reject(new Error(`Status Code: ${res.statusCode}`));
            }
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(JSON.stringify(payload));
        req.end();
    });
}

async function main() {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.error('❌ DISCORD_WEBHOOK_URL environment variable is missing!');
        process.exit(1);
    }

    try {
        // Calculate for the upcoming week (Monday start)
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

        await sendToDiscord(payload, webhookUrl);
        console.log(`✅ Weekly notification sent for week: ${weekRange}`);
    } catch (error) {
        console.error('❌ Failed to send notification:', error.message);
        process.exit(1);
    }
}

main();
