# ShiftMate: Automated Team Roster System

ShiftMate is a modern, responsive web application designed to manage and automate weekly shift rotations for a three-person team. It provides a seamless way to track Morning and Evening shifts, handles automated rotations, allows for manual overrides, and integrates with Discord for team notifications.

## 🚀 Core Features

### 1. Automated Weekly Rotation
The app uses a consistent rotation logic based on a reference start date (Jan 5, 2026). 
- **The Team**: Jahidur Rahman, Mahmudur Rahman Protic, and Alamin Abu Zaman.
- **Cycle**: Each person takes a full week of Morning Shift in a predictable `A -> B -> C` sequence.
- **Evening Shift**: Automatically assigned to the two people not on the Morning Shift.

### 2. Manual Shift Overrides
Life happens! ShiftMate allows authorized users to manually change who is on which shift for any specific week.
- **PIN Protection**: Any change to the roster requires a 4-digit security PIN.
- **Persistent Storage**: Overrides are saved in the browser's `localStorage`, ensuring they remain even after a page refresh.
- **Visual Feedback**: The "Edit Shift" button changes color when an override is active for that week.

### 3. Discord Integration
Keep the team informed with one click.
- **Instant Notifications**: Sends a beautifully formatted rich embed to a Discord channel.
- **Admin Security**: Accessing the Discord webhook configuration requires an administrative password.
- **Multi-Timezone Support**: Notifications automatically include shift timings for both **Dhaka (UTC+6)** and **Oslo (CET/CEST)**.

### 4. Smart Date Navigation
- **Default View**: Automatically shows the current week, or the *next* week if viewed on a weekend.
- **History & Future**: Browse past rosters or plan for future weeks using simple navigation arrows.

## 🛠️ Technical Stack

- **Frontend**: HTML5, Vanilla CSS, and Modern JavaScript (ES6+).
- **Icons**: FontAwesome 6.4.
- **Typography**: 'Outfit' from Google Fonts.
- **Security**: SHA-256 Hashing for PIN and Password verification.
- **Architecture**: No backend server required for core logic; calculations are performed client-side based on UTC timestamps to ensure cross-timezone consistency.

## 🌍 Timezone Synchronization
The app is specifically tuned for a distributed team:
- **Primary Time**: Dhaka, Bangladesh.
- **Secondary Time**: Oslo, Norway.
- **Logic**: All timings are dynamically converted to ensure the Oslo team always sees the correct local time for their shifts, including Daylight Saving Time adjustments.

---
*Created for the team to streamline scheduling and communication.*
