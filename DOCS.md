# FlowDay - Your Flexible Activity Companion 🌊

A **truly flexible** day activity management app built with React that adapts to your life, not the other way around.

## 🎯 Philosophy

FlowDay is designed with a core principle: **Your life, your rules**. Unlike traditional productivity apps that force rigid schedules, FlowDay adapts to how you actually live.

### Core Principles
- ✅ **Zero Judgment** - No guilt, no red warnings, just supportive guidance
- ✅ **Complete Flexibility** - Customize everything to match your lifestyle
- ✅ **Privacy First** - All data stays on your device, no account required
- ✅ **Calm by Design** - Minimal, peaceful interface that reduces stress

## ✨ Key Features

### 1. **Custom Time Control** (Most Important!)
Define your own schedule:
- Wake-up time
- Office hours (optional)
- Preferred study time slots
- Custom break duration & frequency
- Sleep target hours
- **Everything can be changed anytime**

### 2. **Flexible Task System**
Three types of tasks to match your needs:
- **Time-Bound** - Specific time (e.g., "Meeting at 2 PM")
- **Time-Range** - Flexible window (e.g., "Exercise 6-8 AM")
- **Floating** - Anytime tasks (e.g., "Call mom")

### 3. **Smart Task Organization**
Tasks automatically categorize into:
- 🟢 **Running Now** - Tasks happening right now
- ⏰ **Upcoming** - Future tasks sorted by time
- 📦 **Past Tasks** - Missed tasks (auto-move available)
- ✅ **Completed** - Your achievements

### 4. **Intelligent Features**
- **Lock Tasks** - Prevent auto-moving important tasks
- **Daily Recurrence** - Set tasks to repeat daily
- **Auto-Move** - Unlocked past tasks can move to tomorrow
- **Time Countdown** - See how long until a task starts

### 5. **Offline First & Privacy**
- No backend, no login, no tracking
- Uses LocalStorage/IndexedDB
- Manual backup/restore via JSON export
- Auto-backup options (daily/weekly/monthly)

### 6. **Modern UX**
- 🌓 **Dark/Light Mode** - Easy on your eyes anytime
- 📱 **Mobile Responsive** - Works perfectly on phones
- 📲 **PWA Support** - Install on mobile like a native app
- 🔔 **Toast Notifications** - Calm, non-intrusive messages
- 🎨 **Clean UI** - Font Awesome icons throughout

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project:
```bash
cd "vite-project"
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` folder.

### Preview Production Build

```bash
npm run preview
```

## 📱 Installing as PWA

### On Mobile (Android/iOS)
1. Open FlowDay in your mobile browser
2. Tap the browser menu (⋮ or share icon)
3. Select "Add to Home Screen" or "Install"
4. The app will appear on your home screen like a native app

### On Desktop (Chrome/Edge)
1. Open FlowDay in your browser
2. Look for the install icon in the address bar
3. Click "Install"
4. FlowDay will open in its own window

## 🎨 Customization

### Preferences
Access via the sliders icon in the header:
- Set your wake-up time
- Define office hours
- Add multiple study time slots
- Customize break preferences
- Adjust sleep target

### Settings
Access via the gear icon in the header:
- Export your data (backup)
- Import previous backups
- Enable auto-backup
- Set backup frequency
- Clear all data (danger zone)

## 🔧 Technical Stack

- **React 18** - Modern React with hooks
- **Vite** - Lightning-fast build tool
- **LocalForage** - IndexedDB wrapper for storage
- **React Toastify** - Beautiful toast notifications
- **Font Awesome** - Icon library
- **Vite PWA Plugin** - Progressive Web App support
- **Workbox** - Service worker management

## 📂 Project Structure

```
vite-project/
├── src/
│   ├── components/
│   │   ├── TaskCard.jsx           # Individual task display
│   │   ├── TaskForm.jsx           # Task creation/editing form
│   │   ├── SettingsModal.jsx      # Settings & backup
│   │   ├── PreferencesModal.jsx   # User preferences
│   │   └── *.css                  # Component styles
│   ├── utils/
│   │   ├── storage.js             # IndexedDB operations
│   │   └── taskHelpers.js         # Task categorization logic
│   ├── App.jsx                    # Main application
│   ├── App.css                    # Global styles
│   ├── main.jsx                   # Entry point
│   └── index.css                  # Base styles
├── public/
│   ├── pwa-192x192.png           # PWA icon (small)
│   └── pwa-512x512.png           # PWA icon (large)
├── index.html                     # HTML template
├── vite.config.js                # Vite & PWA configuration
└── package.json                  # Dependencies
```

## 🎯 Usage Examples

### Creating Tasks

**Flexible Task (Anytime):**
- Title: "Read 20 pages"
- Type: Flexible (anytime)
- Date: Today

**Time-Bound Task:**
- Title: "Team Meeting"
- Type: Specific Time
- Time: 2:00 PM
- Lock: Yes (won't auto-move)

**Time-Range Task:**
- Title: "Morning Workout"
- Type: Time Range
- Start: 6:00 AM
- End: 8:00 AM

**Daily Recurring Task:**
- Title: "Take vitamins"
- Type: Specific Time
- Time: 8:00 AM
- Repeat: Daily ✓

### Managing Past Tasks

If tasks become "past tasks" (time has passed):
1. **Complete them** if you did them
2. **Auto-move** unlocked tasks to tomorrow
3. **Lock** important tasks to prevent moving
4. **Delete** if no longer needed

### Backup Your Data

1. Click settings icon (⚙️)
2. Click "Create Backup"
3. A JSON file downloads automatically
4. Store it safely (cloud, email, etc.)

To restore:
1. Click "Restore Backup"
2. Select your JSON file
3. Data will be imported

## 🌟 Why FlowDay?

Most productivity apps are built around assumptions:
- "Work only 9-5"
- "Study only at night"
- "Same routine every day"

**FlowDay breaks these assumptions.** It's built for:
- Freelancers with irregular schedules
- Students with varying class times
- Anyone who wants flexibility
- People tired of rigid productivity systems

## 💡 Tips for Best Use

1. **Start Simple** - Add a few tasks, get comfortable
2. **Set Preferences** - Take 2 minutes to customize your schedule
3. **Use Task Types** - Mix flexible and time-bound tasks
4. **Lock Important Tasks** - Meetings, appointments, etc.
5. **Regular Backups** - Enable auto-backup or export weekly
6. **Install as PWA** - Better experience, works offline

## 🐛 Troubleshooting

**Tasks not showing?**
- Check if they're completed (scroll to completed section)
- Verify the date is correct

**Data lost after browser clear?**
- Always keep backups! Use the export feature regularly
- Enable auto-backup in settings

**PWA not installing?**
- Ensure you're using HTTPS (or localhost)
- Try a different browser
- Check browser's PWA support

---

**Built with ❤️ for flexible thinkers**

*FlowDay - Because your life doesn't fit in a template*
