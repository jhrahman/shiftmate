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
    var day = d.getDay();
    // If Sat (6) or Sun (0), we treat it as part of the upcoming week's cycle
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);

    // UI behavior: Saturday and Sunday shift 'Current' to the next Monday
    if (day === 6 || day === 0) {
        // We add 7 days to the 'standard' Monday calculation
        diff += 7;
    }

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
        // Calculate for the target week
        // Default to current/active week (offset 0)
        const offset = parseInt(process.argv[2]) || 0;
        console.log(`ℹ️ Using week offset: ${offset}`);

        const today = new Date();
        const targetDate = new Date(today.getTime() + (offset * ONE_WEEK_MS));
        const { morningPerson, eveningPeople, weekRange, targetMonday } = getRosterForDate(targetDate);

        let footerText = "ShiftMate • Automated Roster System";
        const eventName = process.env.GITHUB_EVENT_NAME;
        if (eventName === 'schedule') {
            footerText += "\n🔁 Automation triggered by GitHub Actions";
        } else if (eventName === 'workflow_dispatch') {
            footerText += "\n▶️ Manually triggered from the web app";
        }

        const embed = {
            title: "📅 Weekly Roster Schedule",
            description: `**Week:** ${weekRange}\n**Timezone:** Dhaka (UTC+6)\n\u200B`,
            color: 0x4289F7,
            fields: [
                {
                    name: "☀️  MORNING SHIFT",
                    value: `⏰ **Dhaka:** 08:00 AM - 04:00 PM\n👤 **Assignee:** **${morningPerson.name}** (\`${morningPerson.short}\`)\n\u200B`,
                    inline: false
                },
                {
                    name: "━━━━━━━━━━━━━━━━━━━━━━━━━━",
                    value: "\u200B",
                    inline: false
                },
                {
                    name: "🌙  EVENING SHIFT",
                    value: `⏰ **Time (Dhaka):** 12:00 PM - 08:00 PM\n👤 **Assignees:**\n${eveningPeople.map(p => `• **${p.name}** (\`${p.short}\`)`).join('\n')}`,
                    inline: false
                }
            ],
            footer: {
                text: footerText,
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
