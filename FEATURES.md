# FlowDay - Feature Documentation

## Complete Feature List

### ✅ Core Features Implemented

#### 1. Task Management
- ✅ Create tasks with title and description
- ✅ Three task types:
  - **Time-Bound**: Specific time (e.g., 10:00 AM)
  - **Time-Range**: Flexible window (e.g., 10:00 AM - 2:00 PM)
  - **Floating**: No specific time (anytime)
- ✅ Edit existing tasks
- ✅ Delete tasks with confirmation
- ✅ Complete tasks
- ✅ Lock/unlock tasks to prevent auto-moving
- ✅ Daily recurring tasks

#### 2. Smart Task Categorization
- ✅ **Running Now**: Tasks happening within ±15 min for time-bound, or within range for time-range
- ✅ **Upcoming**: Future tasks sorted by time
- ✅ **Past Tasks**: Tasks whose time has passed
- ✅ **Completed**: Finished tasks (shows last 5)
- ✅ Auto-recategorization every minute
- ✅ Time countdown display ("in 2h 30m")

#### 3. Flexible Time Control
- ✅ Wake-up time setting
- ✅ Office hours (optional, start/end)
- ✅ Multiple study time slots with add/remove
- ✅ Break duration customization (5-60 min)
- ✅ Break frequency customization (30-240 min)
- ✅ Sleep target hours
- ✅ All preferences editable anytime

#### 4. Data Management
- ✅ LocalStorage/IndexedDB for offline storage
- ✅ Export data as JSON backup
- ✅ Import data from JSON file
- ✅ Auto-backup preferences (daily/weekly/monthly)
- ✅ Clear all data option
- ✅ Last backup timestamp tracking

#### 5. User Interface
- ✅ Clean, minimal, calm design
- ✅ Dark/Light mode toggle
- ✅ Theme persistence across sessions
- ✅ Mobile responsive design
- ✅ Header with branding and actions
- ✅ Footer with privacy notice
- ✅ Toast notifications (non-judgmental)
- ✅ Font Awesome icons throughout
- ✅ Empty state messaging

#### 6. Advanced Features
- ✅ Auto-move past tasks to tomorrow (bulk action)
- ✅ Lock protection (locked tasks don't auto-move)
- ✅ Daily task instances (auto-create daily)
- ✅ Task moved counter (tracks auto-moves)
- ✅ Date-based task scheduling
- ✅ Task sorting by time/date

#### 7. Progressive Web App
- ✅ PWA manifest configuration
- ✅ Service worker setup
- ✅ App icons (192x192, 512x512)
- ✅ Installable on mobile devices
- ✅ Offline capability
- ✅ Standalone display mode

#### 8. Accessibility & UX
- ✅ Calm color palette (no harsh red)
- ✅ Supportive messaging
- ✅ Confirmation dialogs for destructive actions
- ✅ Clear visual feedback
- ✅ Keyboard-friendly forms
- ✅ Auto-focus on task title input

## 🎨 Design Philosophy

### Color Scheme
**Light Mode:**
- Primary: #6366f1 (Indigo)
- Background: #ffffff (White)
- Secondary BG: #f8fafc (Light Gray)
- Text: #1e293b (Dark Slate)

**Dark Mode:**
- Primary: #818cf8 (Light Indigo)
- Background: #0f172a (Dark Slate)
- Secondary BG: #1e293b (Slate)
- Text: #f1f5f9 (Light)

### Typography
- System font stack for native feel
- Clear hierarchy (headings, body, meta)
- Readable line heights

### Spacing
- Consistent 8px grid system
- Generous padding for touch targets
- Clear visual separation

## 🔧 Technical Architecture

### Component Structure
```
App.jsx (Main Container)
├── Header
│   ├── Logo
│   ├── Theme Toggle
│   ├── Preferences Button
│   └── Settings Button
├── Main Content
│   ├── TaskForm (conditional)
│   ├── Running Section
│   ├── Upcoming Section
│   ├── Past Tasks Section
│   └── Completed Section
└── Footer

Modals (Overlays)
├── PreferencesModal
└── SettingsModal
```

### Data Flow
1. **Loading**: App loads → Fetch from IndexedDB → Render
2. **Creating**: User creates task → Save to IndexedDB → Update state
3. **Updating**: User edits task → Update IndexedDB → Re-render
4. **Categorizing**: Every minute → Re-categorize all tasks → Update display
5. **Daily Tasks**: On load → Check for new daily instances → Create if needed

### Storage Schema

**Tasks:**
```javascript
{
  id: number,
  title: string,
  description: string,
  type: 'timeBound' | 'timeRange' | 'floating',
  date: string (ISO),
  time: string (HH:mm),
  startTime: string (HH:mm),
  endTime: string (HH:mm),
  locked: boolean,
  isDaily: boolean,
  completed: boolean,
  completedAt: string (ISO),
  createdAt: string (ISO),
  movedCount: number,
  parentTaskId: number (for daily instances),
  lastDailyInstance: string (ISO)
}
```

**Preferences:**
```javascript
{
  wakeUpTime: string (HH:mm),
  sleepTargetHours: number,
  officeStartTime: string | null,
  officeEndTime: string | null,
  studySlots: [{start: string, end: string}],
  breakDuration: number (minutes),
  breakFrequency: number (minutes),
  theme: 'light' | 'dark'
}
```

**Settings:**
```javascript
{
  autoBackup: boolean,
  backupFrequency: 'daily' | 'weekly' | 'monthly',
  lastBackup: string (ISO) | null
}
```

## 🚀 Performance Optimizations

1. **LocalForage**: Better IndexedDB performance
2. **Minute-based Updates**: Not every second (reduces CPU)
3. **Conditional Rendering**: Only show sections with tasks
4. **CSS Transitions**: Hardware-accelerated animations
5. **Lazy Modals**: Only render when open

## 📱 Mobile Considerations

1. **Touch Targets**: Minimum 44x44px
2. **Viewport Meta**: Proper scaling
3. **PWA Manifest**: Native-like experience
4. **Responsive Grid**: Adapts to screen size
5. **Simplified Navigation**: Mobile-friendly layout

## 🔒 Privacy & Security

1. **No Backend**: All local storage
2. **No Analytics**: Zero tracking
3. **No Account**: No login required
4. **Manual Sync**: User controls data
5. **Local Only**: Data never leaves device (unless exported)

## 🎯 Future Enhancement Ideas

These features are NOT currently implemented but could be added:

- **Categories/Tags**: Organize tasks by type
- **Task Templates**: Reusable task patterns
- **Statistics**: Task completion analytics
- **Focus Timer**: Pomodoro-style timer
- **Notifications**: Browser notifications for tasks
- **Themes**: More color schemes
- **Widgets**: Quick add from home screen
- **Voice Input**: Add tasks by voice
- **Collaboration**: Share tasks (would need backend)
- **Calendar View**: Month/week visualization

## 📊 Browser Compatibility

**Fully Supported:**
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

**Features by Browser:**
- PWA Install: Chrome, Edge, Safari (iOS)
- IndexedDB: All modern browsers
- Service Worker: All modern browsers
- Dark Mode: All modern browsers

## 🐛 Known Limitations

1. **No sync**: Data is device-specific
2. **Manual backup**: User must remember to export
3. **Time zones**: Uses device local time
4. **Past midnight**: Tasks don't roll over automatically at midnight (requires page refresh or categorization cycle)

## 📝 Code Quality

- ✅ ESLint configured
- ✅ Component-based architecture
- ✅ Proper prop validation
- ✅ Consistent naming conventions
- ✅ Commented utility functions
- ✅ Modular CSS (component-scoped)
- ✅ No console errors
- ✅ Responsive design tested

---

**Version**: 1.0  
**Last Updated**: December 27, 2025  
**Status**: Production Ready ✅
