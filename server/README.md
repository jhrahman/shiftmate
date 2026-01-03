# Roster Scheduler

Automated Discord notifications for weekly roster schedules.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Discord Webhook
1. Go to your Discord server
2. Navigate to: Server Settings → Integrations → Webhooks
3. Create a new webhook or use an existing one
4. Copy the webhook URL
5. Set it as an environment variable:

**Windows (PowerShell):**
```powershell
$env:DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"
```

**Linux/Mac:**
```bash
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN"
```

**Or edit `scheduler.js` directly** and replace `YOUR_WEBHOOK_URL_HERE` with your actual webhook URL.

### 3. Run the Scheduler
```bash
npm start
```

## ⏰ Schedule

The scheduler runs **every Saturday at 10:30 PM (Dhaka time, UTC+6)** and sends the roster for the upcoming week (Monday-Friday).

## 🧪 Testing

To test the notification immediately, uncomment these lines in `scheduler.js`:
```javascript
// console.log('🧪 Sending test notification...');
// sendDiscordNotification();
```

Then run:
```bash
npm start
```

## 🔄 Running 24/7

### Option 1: Keep Terminal Open
Just run `npm start` and keep the terminal window open.

### Option 2: Use PM2 (Recommended for production)
```bash
npm install -g pm2
pm2 start scheduler.js --name roster-scheduler
pm2 save
pm2 startup
```

### Option 3: Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task that runs on system startup
3. Action: Start a program
4. Program: `node`
5. Arguments: `C:\PetProjects\Playout\server\scheduler.js`
6. Start in: `C:\PetProjects\Playout\server`

### Option 4: Linux systemd service
Create `/etc/systemd/system/roster-scheduler.service`:
```ini
[Unit]
Description=Roster Discord Scheduler
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/Playout/server
Environment="DISCORD_WEBHOOK_URL=your_webhook_url"
ExecStart=/usr/bin/node scheduler.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable roster-scheduler
sudo systemctl start roster-scheduler
```

## 📝 Customization

### Change Schedule Time
Edit the cron schedule in `scheduler.js`:
```javascript
const cronSchedule = '30 22 * * 6'; // minute hour * * day-of-week
```

Cron format:
- `30` = minute (30)
- `22` = hour (10 PM in 24-hour format)
- `*` = any day of month
- `*` = any month
- `6` = Saturday (0=Sunday, 6=Saturday)

### Change Timezone
Edit the timezone in `scheduler.js`:
```javascript
cron.schedule(cronSchedule, () => {
    // ...
}, {
    timezone: "Asia/Dhaka" // Change this
});
```

## 🛠️ Troubleshooting

**Scheduler not sending notifications:**
1. Check that the webhook URL is correct
2. Verify the server is running: `ps aux | grep scheduler` (Linux/Mac) or Task Manager (Windows)
3. Check the console logs for errors

**Wrong time:**
- Ensure the timezone is set to "Asia/Dhaka"
- Verify your system time is correct

**Dependencies not installing:**
- Make sure Node.js is installed: `node --version`
- Try: `npm install --legacy-peer-deps`

## 📦 Dependencies

- `node-cron`: Cron job scheduler
- `node-fetch`: HTTP client for Discord API
- `nodemon` (dev): Auto-restart on file changes
