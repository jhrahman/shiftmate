# ShiftMate: Web Application Overview

> **Last Updated:** January 18, 2026  
> **Live URL:** https://jhrahman.github.io/shiftmate/

---

## 📋 Table of Contents

1. [What is ShiftMate?](#what-is-shiftmate)
2. [Team & Schedule](#team--schedule)
3. [Key Features](#key-features)
4. [How It Works](#how-it-works)
5. [Discord Notifications](#discord-notifications)
6. [Automatic Weekly Updates](#automatic-weekly-updates)
7. [Security & Access](#security--access)
8. [Design & User Experience](#design--user-experience)
9. [Technical Summary](#technical-summary)

---

## What is ShiftMate?

**ShiftMate** is a modern web application designed to automatically manage and display weekly shift rotations for a team. It eliminates the need for manual schedule updates by automatically rotating shifts each week, while still allowing authorized team members to make manual changes when needed.

The app runs entirely in your web browser with no installation required, and can send beautiful notifications to Discord to keep the team informed.

---

## Team & Schedule

### Team Members

The ShiftMate system manages shifts for the following team members:

- **Jahidur Rahman (JH)**
- **Mahmudur Rahman Protic (PR)**
- **Alamin Abu Zaman (AL)**
- **Abul Kalam Azad (AK)** - General Shift

### Work Schedule

**Work Days:** Monday through Friday

**Timezone:** All times shown in Dhaka time (UTC+6), with Oslo time also displayed

**Shifts:**
- **General Shift:** Assigned to Abul Kalam Azad (General Hours)
- **Morning Shift:** 8:00 AM to 4:00 PM
- **Evening Shift:** 12:00 PM to 8:00 PM

---

## Key Features

### 1. **Automatic Shift Rotation**

ShiftMate automatically rotates the morning shift assignment each week in a fair, predictable pattern. Each team member takes turns being on the morning shift for an entire week. The two remaining team members are automatically assigned to the evening shift.

**How the rotation works:**
- Week 1: Person A gets morning shift
- Week 2: Person B gets morning shift
- Week 3: Person C gets morning shift
- Week 4: Back to Person A, and the cycle continues

The app calculates which week we're in and automatically shows the correct assignments—no manual updates needed!

### 2. **Manual Override Capability**

Life happens! When someone needs to swap shifts or take time off, authorized users can manually override the automatic schedule for any specific week.

**Features:**
- Change who's on morning or evening shift for any week
- Overrides are saved and persist even when you refresh the page
- The app shows a visual indicator when a week has been manually adjusted
- Easy "reset" option to go back to the automatic schedule

### 3. **Week Navigation**

Browse past, current, and future weeks with simple back and forward buttons.

**Smart date display:**
- During the work week (Monday-Friday): Shows the current week
- On weekends (Saturday-Sunday): Automatically shows the upcoming week
- Clear labels: "Current Week," "Next Week," "Previous Week," or "N Weeks from Now"

### 4. **Time Format Options**

Switch between 12-hour format (8:00 AM - 4:00 PM) and 24-hour format (08:00 - 16:00) with a single click based on your preference.

### 5. **Multi-Timezone Support**

For distributed teams, ShiftMate shows shift times in both:
- **Dhaka time** (primary timezone)
- **Oslo time** (automatically converted, including daylight saving adjustments)

### 6. **Discord Integration**

Send beautiful, formatted notifications to your team's Discord channel with one click. The notification includes:
- The week date range
- All shift assignments
- Shift timings
- Team member names
- Professional formatting with icons and colors

### 7. **Cross-Device Access**

Access ShiftMate from any device—desktop, tablet, or phone. The app works seamlessly across all screen sizes with an optimized mobile layout.

---

## How It Works

### Viewing the Schedule

1. **Open the app** in your web browser
2. **See the current week** displayed automatically
3. **Use arrow buttons** to view past or future weeks
4. **Check shift assignments** for each team member

### Making Manual Changes

1. **Click "Edit Shift"** next to the shift you want to change
2. **Enter your PIN** when prompted (4-digit security code)
3. **Select the person(s)** who should be assigned to that shift
4. **Save** and the schedule updates immediately
5. **Reset** option available if you want to go back to automatic scheduling

### Sending Discord Notifications

1. **Click "Notify Discord"** button
2. **Enter your PIN** when prompted
3. **Notification sent** to the team's Discord channel
4. **Team gets notified** with @everyone mention

---

## Discord Notifications

ShiftMate can notify your team through Discord in three different ways:

### Option 1: Direct Notification
- Fastest method
- Sends immediately from your browser to Discord
- Requires initial setup by an administrator

### Option 2: GitHub Automation
- Uses GitHub to send the notification
- Keeps Discord webhook secure
- Provides an audit trail of all notifications
- Slight delay (a few minutes) while GitHub processes

### Option 3: PIN-Protected Cross-Device
- Enter just your PIN to send notifications
- Works on any device, even in private/incognito mode
- No need to re-configure on each device
- Secure encryption keeps webhook private

### Notification Schedule

The app is configured to automatically send a Discord notification every **Sunday at 11:00 AM Dhaka time** for the upcoming week. Team members can also manually trigger notifications at any time.

### Sample Notification

When a notification is sent to Discord, here's what your team will see:

**Message Header:**
- @everyone 📢 **New Weekly Roster Available!**

**Notification Card (Blue themed with ShiftMate logo):**

---

**📅 Weekly Roster Schedule**

**Week:** Jan 13 - Jan 17, 2026  
**Timezone:** Dhaka (UTC+6)

---

**💼  GENERAL SHIFT**  
⏰ **Dhaka:** General Hours  
👤 **Assignee:** **Abul Kalam Azad** (`AK`)

---

**☀️  MORNING SHIFT**  
⏰ **Dhaka:** 08:00 AM - 04:00 PM  
👤 **Assignee:** **Jahidur Rahman** (`JH`)

---

**🌙  EVENING SHIFT**  
⏰ **Time (Dhaka):** 12:00 PM - 08:00 PM  
👤 **Assignees:**  
• **Mahmudur Rahman Protic** (`PR`)  
• **Alamin Abu Zaman** (`AL`)

---

**Footer:**  
ShiftMate • Automated Roster System  
🔁 Automation triggered by GitHub Actions *(or)* ▶️ Manually triggered from the web app

---

**Visual Features:**
- Professional blue color scheme (#4289F7)
- ShiftMate logo appears as thumbnail
- Clean, easy-to-read formatting
- Icons for visual clarity (calendar, sun, moon, clock, person)
- Bold names for quick scanning
- Timestamp showing when notification was sent

---

## Automatic Weekly Updates

ShiftMate uses GitHub Actions to automatically post the weekly roster to Discord every Sunday morning.

**How it works:**
- Every Sunday at 11:00 AM Dhaka time
- Automatically calculates the upcoming week's roster
- Sends a formatted notification to Discord
- No manual intervention needed

**Manual triggers:**
- Administrators can also trigger the automated notification manually from GitHub
- Useful for testing or sending notifications for specific weeks

---

## Security & Access

### PIN Protection

Certain actions require a 4-digit PIN to prevent unauthorized changes:
- Editing shift assignments (morning or evening)
- Sending Discord notifications

The PIN is securely stored and verified using industry-standard security practices.

### Admin Password

Discord webhook configuration requires an administrator password, ensuring only authorized personnel can modify notification settings.

### Data Storage

- **Shift overrides** are saved in your browser's local storage
- **Discord settings** can be saved locally or synchronized via GitHub
- **Encrypted data** ensures webhook URLs remain secure even when stored publicly

---

## Design & User Experience

### Modern Interface

**ShiftMate features a sleek, dark-themed design with:**
- Professional color scheme (blue, orange, and indigo accents)
- Smooth animations and transitions
- Clear visual hierarchy
- Easy-to-read typography (Outfit font family)
- Icons from FontAwesome for visual clarity

### Responsive Design

The app automatically adapts to your screen size:

**On Desktop:**
- Spacious layout with all information visible
- Hover effects for interactive elements
- Large, easy-to-click buttons

**On Mobile:**
- Compact, vertical layout
- Touch-friendly buttons and controls
- Optimized text sizing
- Scrollable interface

### User-Friendly Features

- **Visual feedback** when hovering over buttons
- **Color-coded badges** for different shifts (orange for morning, purple for evening)
- **Avatar initials** for quick team member identification
- **Clear date ranges** (e.g., "Jan 13 - Jan 17, 2026")
- **Status indicators** showing when shifts have been manually overridden

---

## Technical Summary

For those interested in the technical details:

### Technology Stack

**Frontend:**
- HTML5 for structure
- CSS3 for styling and animations
- Modern JavaScript for functionality
- No frameworks required—pure vanilla code

**Hosting:**
- GitHub Pages (free static hosting)
- No backend server needed

**Integrations:**
- Discord Webhook API for notifications
- GitHub Actions for automation
- GitHub API for cross-device synchronization

### Browser Compatibility

ShiftMate works in all modern web browsers:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari
- Opera
- Mobile browsers (Chrome Mobile, Safari iOS, etc.)

### Performance

- **Fast loading:** Minimal file sizes, no external dependencies
- **Instant updates:** All calculations happen in your browser
- **Offline viewing:** Can view schedules without internet (notifications require connection)
- **No lag:** Smooth animations even on older devices

### File Structure

The application consists of:
- **1 HTML file** (main structure)
- **1 CSS file** (styling and responsive design)
- **1 JavaScript file** (application logic)
- **1 Node.js script** (automated Discord notifications)
- **1 GitHub workflow** (weekly automation)
- **Supporting files** (logo, configuration, documentation)

Total code: Approximately **2,042 lines** of clean, well-organized code

---

## Summary

**ShiftMate** is a comprehensive shift management solution that combines:

✅ **Automation** - Set it and forget it; shifts rotate automatically  
✅ **Flexibility** - Override schedules when life gets in the way  
✅ **Communication** - Keep everyone informed via Discord  
✅ **Accessibility** - Works on any device, anywhere  
✅ **Security** - PIN and password protection for sensitive actions  
✅ **Ease of Use** - Clean, intuitive interface anyone can navigate  
✅ **Zero Cost** - Runs entirely on free platforms (GitHub Pages, Discord)  

The application successfully balances automation with manual control, providing a reliable and user-friendly way to manage team schedules without the complexity of traditional scheduling software.
