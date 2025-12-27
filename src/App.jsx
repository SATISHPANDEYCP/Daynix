import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { getTasks, addTask, updateTask, deleteTask, getPreferences, savePreferences, exportData, importData, getSettings, saveSettings, clearAllData } from './utils/storage';
import { categorizeTasks, autoMoveTask, shouldCreateDailyInstance, createDailyInstance, TASK_TYPES, formatTime, getTimeUntil } from './utils/taskHelpers';
import './App.css';

// TaskCard Component
const TaskCard = ({ task, onComplete, onDelete, onEdit, onToggleLock }) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [undoTimer, setUndoTimer] = useState(null);

  const handleComplete = () => {
    setIsCompleting(true);
    toast.info('Task will be marked complete in 5 seconds. Click Undo to cancel.');
    
    const timer = setTimeout(() => {
      onComplete(task.id);
      setIsCompleting(false);
      toast.success('Task completed! 🎉');
    }, 5000);
    
    setUndoTimer(timer);
  };

  const handleUndo = () => {
    if (undoTimer) {
      clearTimeout(undoTimer);
      setUndoTimer(null);
    }
    setIsCompleting(false);
    toast.info('Completion cancelled');
  };

  useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
    };
  }, [undoTimer]);

  const handleDelete = () => {
    if (window.confirm('Delete this task?')) {
      onDelete(task.id);
      toast.info('Task removed');
    }
  };

  const getTaskTimeDisplay = () => {
    if (task.type === TASK_TYPES.FLOATING) {
      return 'Anytime';
    }

    if (task.type === TASK_TYPES.TIME_BOUND) {
      const timeUntil = getTimeUntil(task.time);
      return (
        <span className="time-display">
          {formatTime(task.time)}
          {timeUntil && <span className="time-until">{timeUntil}</span>}
        </span>
      );
    }

    if (task.type === TASK_TYPES.TIME_RANGE) {
      return `${formatTime(task.startTime)} - ${formatTime(task.endTime)}`;
    }
  };

  return (
    <div className={`task-card ${task.locked ? 'locked' : ''}`}>
      <div className="task-card-header">
        <div className="task-title-section">
          <h3 className="task-title">{task.title}</h3>
          {task.isDaily && (
            <span className="task-badge daily-badge">
              <i className="fas fa-redo"></i> Daily
            </span>
          )}
          {task.movedCount > 0 && (
            <span className="task-badge moved-badge">
              Moved {task.movedCount}x
            </span>
          )}
        </div>
        <div className="task-actions">
          <button
            className="task-action-btn"
            onClick={() => onToggleLock(task.id)}
            title={task.locked ? 'Unlock task' : 'Lock task'}
          >
            <i className={`fas fa-${task.locked ? 'lock' : 'lock-open'}`}></i>
          </button>
          <button
            className="task-action-btn"
            onClick={() => onEdit(task)}
            title="Edit task"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            className="task-action-btn delete-btn"
            onClick={handleDelete}
            title="Delete task"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-footer">
        <div className="task-meta">
          <span className="task-time">
            <i className="fas fa-clock"></i>
            {getTaskTimeDisplay()}
          </span>
          {task.date && (
            <span className="task-date">
              <i className="fas fa-calendar"></i>
              {task.endDate && task.endDate !== task.date ? (
                <>
                  {new Date(task.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                  {' - '}
                  {new Date(task.endDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}
                </>
              ) : (
                new Date(task.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              )}
            </span>
          )}
        </div>

        {!task.completed && (
          <>
            {!isCompleting ? (
              <button
                className="complete-btn"
                onClick={handleComplete}
              >
                <i className="fas fa-check"></i>
                Complete
              </button>
            ) : (
              <button
                className="undo-btn"
                onClick={handleUndo}
              >
                <i className="fas fa-undo"></i>
                Undo
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// TaskForm Component
const TaskForm = ({ onSubmit, onCancel, initialTask = null, allTasks = [] }) => {
  const [task, setTask] = useState(initialTask || {
    title: '',
    description: '',
    type: TASK_TYPES.FLOATING,
    date: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    time: '',
    startTime: '',
    endTime: '',
    locked: false,
    isDaily: false
  });

  const checkTimeConflicts = (newTask) => {
    if (newTask.type === TASK_TYPES.FLOATING) return [];

    const conflicts = [];
    const newStart = newTask.type === TASK_TYPES.TIME_BOUND 
      ? new Date(newTask.date + 'T' + newTask.time)
      : new Date(newTask.date + 'T' + newTask.startTime);
    const newEnd = newTask.type === TASK_TYPES.TIME_BOUND
      ? new Date(newStart.getTime() + 60 * 60 * 1000) // Assume 1 hour duration
      : new Date((newTask.endDate || newTask.date) + 'T' + newTask.endTime);

    allTasks.forEach(existingTask => {
      // Skip if it's the same task (editing)
      if (initialTask && existingTask.id === initialTask.id) return;
      // Skip completed tasks
      if (existingTask.completed) return;
      // Skip floating tasks
      if (existingTask.type === TASK_TYPES.FLOATING) return;

      let existingStart, existingEnd;

      if (existingTask.type === TASK_TYPES.TIME_BOUND) {
        existingStart = new Date(existingTask.date + 'T' + existingTask.time);
        existingEnd = new Date(existingStart.getTime() + 60 * 60 * 1000);
      } else if (existingTask.type === TASK_TYPES.TIME_RANGE) {
        existingStart = new Date(existingTask.date + 'T' + existingTask.startTime);
        existingEnd = new Date((existingTask.endDate || existingTask.date) + 'T' + existingTask.endTime);
      }

      // Check if times overlap
      if (newStart < existingEnd && newEnd > existingStart) {
        conflicts.push(existingTask);
      }
    });

    return conflicts;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!task.title.trim()) {
      toast.info('Please add a task title');
      return;
    }

    if (task.type === TASK_TYPES.TIME_BOUND && !task.time) {
      toast.info('Please set a time for this task');
      return;
    }

    if (task.type === TASK_TYPES.TIME_RANGE && (!task.startTime || !task.endTime)) {
      toast.info('Please set start and end times');
      return;
    }

    if (task.type === TASK_TYPES.TIME_RANGE) {
      const startDate = new Date(task.date + 'T' + task.startTime);
      const endDate = new Date((task.endDate || task.date) + 'T' + task.endTime);
      
      if (endDate <= startDate) {
        toast.error('End time must be after start time. For overnight tasks, set end date to next day.');
        return;
      }
    }

    // Check for time conflicts
    const conflicts = checkTimeConflicts(task);
    if (conflicts.length > 0) {
      const conflictNames = conflicts.map(t => t.title).join(', ');
      const confirmed = window.confirm(
        `⚠️ Time Conflict Detected!\n\nThis task overlaps with: ${conflictNames}\n\nDo you want to add it anyway?`
      );
      if (!confirmed) {
        return;
      }
    }

    onSubmit(task);
  };

  const handleChange = (field, value) => {
    setTask(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <input
          type="text"
          placeholder="What do you want to do?"
          value={task.title}
          onChange={e => handleChange('title', e.target.value)}
          className="task-title-input"
          autoFocus
        />
      </div>

      <div className="form-group">
        <textarea
          placeholder="Add details (optional)"
          value={task.description}
          onChange={e => handleChange('description', e.target.value)}
          rows="2"
          className="task-description-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Task Type</label>
          <select
            value={task.type}
            onChange={e => handleChange('type', e.target.value)}
          >
            <option value={TASK_TYPES.FLOATING}>Flexible (anytime)</option>
            <option value={TASK_TYPES.TIME_BOUND}>Specific Time</option>
            <option value={TASK_TYPES.TIME_RANGE}>Time Range</option>
          </select>
        </div>

        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={task.date}
            onChange={e => handleChange('date', e.target.value)}
          />
        </div>
      </div>

      {task.type === TASK_TYPES.TIME_BOUND && (
        <div className="form-group">
          <label>Time</label>
          <input
            type="time"
            value={task.time}
            onChange={e => handleChange('time', e.target.value)}
          />
        </div>
      )}

      {task.type === TASK_TYPES.TIME_RANGE && (
        <>
          <div className="form-row">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={task.date}
                onChange={e => handleChange('date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={task.endDate || task.date}
                onChange={e => handleChange('endDate', e.target.value)}
                min={task.date}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={task.startTime}
                onChange={e => handleChange('startTime', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={task.endTime}
                onChange={e => handleChange('endTime', e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      <div className="form-options">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={task.locked}
            onChange={e => handleChange('locked', e.target.checked)}
          />
          <span>
            <i className="fas fa-lock"></i> Lock task (won't auto-move)
          </span>
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={task.isDaily}
            onChange={e => handleChange('isDaily', e.target.checked)}
          />
          <span>
            <i className="fas fa-redo"></i> Repeat daily
          </span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {initialTask ? 'Update Task' : 'Add Task'}
        </button>
      </div>
    </form>
  );
};

// PreferencesModal Component
const PreferencesModal = ({ isOpen, onClose, onUpdate }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    const prefs = await getPreferences();
    setPreferences(prefs);
  };

  const handleChange = (field, value) => {
    setPreferences(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-calculate sleep hours when wake or sleep time changes
      if (field === 'wakeUpTime' || field === 'sleepTime') {
        const wakeTime = field === 'wakeUpTime' ? value : prev.wakeUpTime;
        const sleepTime = field === 'sleepTime' ? value : prev.sleepTime;
        updated.sleepTargetHours = calculateSleepHours(sleepTime, wakeTime);
      }

      return updated;
    });
  };

  const calculateSleepHours = (sleepTime, wakeTime) => {
    if (!sleepTime || !wakeTime) return 8;

    const [sleepHour, sleepMin] = sleepTime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

    let sleepMinutes = sleepHour * 60 + sleepMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;

    // If wake time is earlier in the day than sleep time, it's the next day
    if (wakeMinutes <= sleepMinutes) {
      wakeMinutes += 24 * 60;
    }

    const totalMinutes = wakeMinutes - sleepMinutes;
    const hours = totalMinutes / 60;

    // Return with one decimal place
    return Math.round(hours * 10) / 10;
  };

  const handleStudySlotChange = (index, field, value) => {
    const newSlots = [...preferences.studySlots];
    newSlots[index][field] = value;
    setPreferences(prev => ({ ...prev, studySlots: newSlots }));
  };

  const addStudySlot = () => {
    setPreferences(prev => ({
      ...prev,
      studySlots: [...prev.studySlots, { start: '18:00', end: '20:00' }]
    }));
  };

  const removeStudySlot = (index) => {
    const newSlots = preferences.studySlots.filter((_, i) => i !== index);
    setPreferences(prev => ({ ...prev, studySlots: newSlots }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await savePreferences(preferences);
      toast.success('Your preferences have been updated');
      onUpdate && onUpdate();
      onClose();
    } catch (error) {
      toast.error('Could not save preferences');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !preferences) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content preferences-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Your Preferences</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="preference-section">
            <h3>Daily Schedule</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Sleep Time (Night)</label>
                <input
                  type="time"
                  value={preferences.sleepTime}
                  onChange={e => handleChange('sleepTime', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Wake-up Time (Morning)</label>
                <input
                  type="time"
                  value={preferences.wakeUpTime}
                  onChange={e => handleChange('wakeUpTime', e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Sleep Duration (calculated)</label>
              <div className="calculated-value">
                <i className="fas fa-moon"></i>
                <span>{preferences.sleepTargetHours} hours</span>
              </div>
            </div>
          </div>

          <div className="preference-section">
            <h3>Office Hours (Optional)</h3>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={preferences.officeStartTime || ''}
                  onChange={e => handleChange('officeStartTime', e.target.value || null)}
                />
              </div>

              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={preferences.officeEndTime || ''}
                  onChange={e => handleChange('officeEndTime', e.target.value || null)}
                />
              </div>
            </div>
          </div>

          <div className="preference-section">
            <h3>Study Time Slots</h3>

            {preferences.studySlots.map((slot, index) => (
              <div key={index} className="form-row slot-row">
                <div className="form-group">
                  <label>From</label>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={e => handleStudySlotChange(index, 'start', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>To</label>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={e => handleStudySlotChange(index, 'end', e.target.value)}
                  />
                </div>

                <button
                  className="icon-btn remove-btn"
                  onClick={() => removeStudySlot(index)}
                  title="Remove slot"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
            ))}

            <button className="add-slot-btn" onClick={addStudySlot}>
              <i className="fas fa-plus"></i> Add Study Slot
            </button>
          </div>

          <div className="preference-section">
            <h3>Breaks</h3>

            <div className="form-group">
              <label>Break Duration (minutes)</label>
              <input
                type="number"
                min="5"
                max="60"
                step="5"
                value={preferences.breakDuration}
                onChange={e => handleChange('breakDuration', parseInt(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label>Break Frequency (every X minutes)</label>
              <input
                type="number"
                min="30"
                max="240"
                step="15"
                value={preferences.breakFrequency}
                onChange={e => handleChange('breakFrequency', parseInt(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

// SettingsModal Component
const SettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const appSettings = await getSettings();
    setSettings(appSettings);
  };

  const handleExport = async () => {
    try {
      await exportData();
      toast.success('Your data has been backed up successfully');
    } catch (error) {
      toast.error('Could not export data');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    try {
      await importData(file);
      toast.success('Data restored successfully');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error('Could not restore data. Please check the file.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoBackupChange = async (value) => {
    const newSettings = { ...settings, autoBackup: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    toast.info(value ? 'Auto-backup enabled' : 'Auto-backup disabled');
  };

  const handleBackupFrequencyChange = async (value) => {
    const newSettings = { ...settings, backupFrequency: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleClearData = async () => {
    if (window.confirm('Are you sure? This will delete all your data permanently.')) {
      try {
        await clearAllData();
        toast.info('All data cleared');
        setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        toast.error('Could not clear data');
      }
    }
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="setting-section">
            <h3>Backup & Restore</h3>

            <div className="setting-item">
              <button className="btn btn-primary" onClick={handleExport}>
                <i className="fas fa-download"></i> Create Backup
              </button>
              <p className="setting-description">
                Export all your tasks and preferences
              </p>
            </div>

            <div className="setting-item">
              <label htmlFor="import-file" className="btn btn-secondary">
                <i className="fas fa-upload"></i> Restore Backup
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
                disabled={loading}
              />
              <p className="setting-description">
                Import previously backed up data
              </p>
            </div>

            {settings.lastBackup && (
              <p className="last-backup">
                Last backup: {new Date(settings.lastBackup).toLocaleString()}
              </p>
            )}
          </div>

          <div className="setting-section">
            <h3>Auto-Backup Preferences</h3>

            <div className="setting-item checkbox-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={e => handleAutoBackupChange(e.target.checked)}
                />
                <span>Enable automatic backups</span>
              </label>
            </div>

            {settings.autoBackup && (
              <div className="setting-item">
                <label>Backup Frequency</label>
                <select
                  value={settings.backupFrequency}
                  onChange={e => handleBackupFrequencyChange(e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
          </div>

          <div className="setting-section danger-zone">
            <h3>Danger Zone</h3>

            <div className="setting-item">
              <button className="btn btn-danger" onClick={handleClearData}>
                <i className="fas fa-exclamation-triangle"></i> Clear All Data
              </button>
              <p className="setting-description">
                Permanently delete all tasks and preferences
              </p>
            </div>
          </div>

          <div className="setting-section app-info">
            <h3>About Daynix</h3>
            <p>Version 1.0</p>
            <p>A flexible, adaptive day activity manager that works around your life.</p>
            <p className="privacy-note">
              <i className="fas fa-lock"></i> All data is stored locally on your device. No account required.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const [tasks, setTasks] = useState([]);
  const [categorizedTasks, setCategorizedTasks] = useState({
    running: [],
    upcoming: [],
    old: [],
    completed: []
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(null);
  const [theme, setTheme] = useState(() => {
    // Initialize with dark theme by default
    document.body.classList.add('dark-mode');
    return 'dark';
  });
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'tasks'
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  useEffect(() => {
    loadData();
    requestNotificationPermission();

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      console.log('PWA install prompt available');
      setDeferredPrompt(e);
      setIsInstalled(false); // Ensure we show as installable
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed');
      setIsInstalled(true);
      setDeferredPrompt(null);
      toast.success('Daynix installed!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Re-categorize tasks every minute
    const interval = setInterval(() => {
      if (tasks.length > 0) {
        const categorized = categorizeTasks(tasks);
        setCategorizedTasks(categorized);
      }
    }, 60000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      const categorized = categorizeTasks(tasks);
      setCategorizedTasks(categorized);
      handleDailyTasks();
      scheduleNotifications(tasks);
    }
  }, [tasks]);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', theme === 'dark')
  }, [theme]);

  const loadData = async () => {
    const loadedTasks = await getTasks();
    const prefs = await getPreferences();
    setTasks(loadedTasks);
    setPreferences(prefs);
    setTheme(prefs.theme || 'dark');
  };

  const handleDailyTasks = async () => {
    const dailyTasks = tasks.filter(t => t.isDaily && !t.parentTaskId);
    let hasNewInstances = false;

    for (const task of dailyTasks) {
      if (shouldCreateDailyInstance(task)) {
        const instance = createDailyInstance(task);

        // Save the instance to storage
        await addTask(instance);

        // Update parent task's last instance date
        await updateTask(task.id, {
          lastDailyInstance: new Date().toISOString()
        });

        hasNewInstances = true;
      }
    }

    // Reload all tasks if we created new instances
    if (hasNewInstances) {
      await loadData();
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
      }
    }
  };

  const scheduleNotifications = (tasksList) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    tasksList.forEach(task => {
      if (task.completed) return;

      const now = new Date();
      let taskDateTime = null;

      // Get task start time
      if (task.type === TASK_TYPES.TIME_BOUND && task.time) {
        taskDateTime = new Date(task.date + 'T' + task.time);
      } else if (task.type === TASK_TYPES.TIME_RANGE && task.startTime) {
        taskDateTime = new Date(task.date + 'T' + task.startTime);
      }

      if (!taskDateTime || taskDateTime <= now) return;

      // Schedule notification 10 minutes before
      const reminderTime = new Date(taskDateTime.getTime() - 10 * 60 * 1000);
      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      if (timeUntilReminder > 0 && timeUntilReminder < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification('Task Reminder 🔔', {
            body: `"${task.title}" starts in 10 minutes`,
            icon: '/pwa-192.png',
            tag: `task-${task.id}`,
            requireInteraction: false
          });
        }, timeUntilReminder);
      }

      // Schedule notification at task start
      const timeUntilStart = taskDateTime.getTime() - now.getTime();
      if (timeUntilStart > 0 && timeUntilStart < 24 * 60 * 60 * 1000) {
        setTimeout(() => {
          new Notification('Task Starting Now! 🚀', {
            body: `"${task.title}" is starting now`,
            icon: '/pwa-192.png',
            tag: `task-start-${task.id}`,
            requireInteraction: false
          });
        }, timeUntilStart);
      }
    });
  };

  const handleAddTask = async (taskData) => {
    // If it's a daily task, set lastDailyInstance to today so it doesn't create instance immediately
    if (taskData.isDaily) {
      taskData.lastDailyInstance = new Date().toISOString();
    }
    const newTask = await addTask(taskData);
    setTasks([...tasks, newTask]);
    setShowTaskForm(false);
    toast.success('Task added');
  };

  const handleUpdateTask = async (taskData) => {
    await updateTask(editingTask.id, taskData);
    const updatedTasks = tasks.map(t =>
      t.id === editingTask.id ? { ...t, ...taskData } : t
    );
    setTasks(updatedTasks);
    setEditingTask(null);
    setShowTaskForm(false);
    toast.success('Task updated');
  };

  const handleCompleteTask = async (taskId) => {
    await updateTask(taskId, {
      completed: true,
      completedAt: new Date().toISOString()
    });
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
    );
    setTasks(updatedTasks);
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
    setCurrentView('tasks'); // Switch to All Tasks view
  };

  const handleToggleLock = async (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const newLockedState = !task.locked;
    await updateTask(taskId, { locked: newLockedState });
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, locked: newLockedState } : t
    );
    setTasks(updatedTasks);
    toast.info(newLockedState ? 'Task locked' : 'Task unlocked');
  };

  const handleAutoMoveOldTasks = async () => {
    const tasksToMove = categorizedTasks.old.filter(t => !t.locked && !t.completed);

    if (tasksToMove.length === 0) {
      toast.info('No tasks to move');
      return;
    }

    for (const task of tasksToMove) {
      const movedTask = autoMoveTask(task);
      await updateTask(task.id, movedTask);
    }

    await loadData();
    toast.success(`Moved ${tasksToMove.length} task(s) to tomorrow`);
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    if (preferences) {
      const updatedPrefs = { ...preferences, theme: newTheme };
      setPreferences(updatedPrefs);
      await savePreferences(updatedPrefs);
    }
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast.success('Installing...');
    }

    setDeferredPrompt(null);
  };

  const filterTasks = (taskList) => {
    if (!searchQuery.trim()) return taskList;
    
    const query = searchQuery.toLowerCase();
    return taskList.filter(task => 
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query))
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <i className="fas fa-water"></i>
            <h1>Daynix</h1>
          </div>
          <div className="header-actions">
            <button
              className="icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              <i className={`fas fa-${theme === 'light' ? 'moon' : 'sun'}`}></i>
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowPreferences(true)}
              title="Your preferences"
            >
              <i className="fas fa-sliders-h"></i>
            </button>
            <button
              className="icon-btn"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <i className="fas fa-cog"></i>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Navigation Tabs */}
          <div className="view-navigation">
            <button
              className={`nav-tab ${currentView === 'main' ? 'active' : ''}`}
              onClick={() => setCurrentView('main')}
            >
              <i className="fas fa-home"></i>
              Now
            </button>
            <button
              className={`nav-tab ${currentView === 'tasks' ? 'active' : ''}`}
              onClick={() => setCurrentView('tasks')}
            >
              <i className="fas fa-list"></i>
              All Tasks
            </button>
          </div>

          {/* MAIN VIEW - Only Running or Next Upcoming */}
          {currentView === 'main' && (
            <>
              {categorizedTasks.running.length > 0 ? (
                <section className="task-section running-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-play-circle"></i>
                      Running Now
                    </h2>
                    <span className="task-count">{categorizedTasks.running.length}</span>
                  </div>
                  <div className="task-list">
                    {categorizedTasks.running.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onToggleLock={handleToggleLock}
                      />
                    ))}
                  </div>
                </section>
              ) : categorizedTasks.upcoming.length > 0 ? (
                <section className="task-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-clock"></i>
                      Next Up
                    </h2>
                  </div>
                  <div className="task-list">
                    <TaskCard
                      key={categorizedTasks.upcoming[0].id}
                      task={categorizedTasks.upcoming[0]}
                      onComplete={handleCompleteTask}
                      onDelete={handleDeleteTask}
                      onEdit={handleEditTask}
                      onToggleLock={handleToggleLock}
                    />
                  </div>
                </section>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-check-circle"></i>
                  <h3>All caught up!</h3>
                  <p>No tasks running or upcoming right now</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setCurrentView('tasks')}
                    style={{ marginTop: '20px' }}
                  >
                    <i className="fas fa-plus"></i> Add a task
                  </button>
                </div>
              )}
            </>
          )}

          {/* TASKS VIEW - Add Task + All Tasks */}
          {currentView === 'tasks' && (
            <>
              {/* Search Bar */}
              <div className="search-section">
                <div className="search-bar">
                  <i className="fas fa-search"></i>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      className="clear-search-btn"
                      onClick={() => setSearchQuery('')}
                      title="Clear search"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              </div>

              <div className="add-task-section">
                {!showTaskForm ? (
                  <button
                    className="add-task-btn"
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskForm(true);
                    }}
                  >
                    <i className="fas fa-plus"></i>
                    Add a task
                  </button>
                ) : (
                  <TaskForm
                    initialTask={editingTask}
                    allTasks={tasks}
                    onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                    onCancel={() => {
                      setShowTaskForm(false);
                      setEditingTask(null);
                    }}
                  />
                )}
              </div>

              {filterTasks(categorizedTasks.running).length > 0 && (
                <section className="task-section running-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-play-circle"></i>
                      Running Now
                    </h2>
                    <span className="task-count">{filterTasks(categorizedTasks.running).length}</span>
                  </div>
                  <div className="task-list">
                    {filterTasks(categorizedTasks.running).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onToggleLock={handleToggleLock}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filterTasks(categorizedTasks.upcoming).length > 0 && (
                <section className="task-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-clock"></i>
                      Upcoming
                    </h2>
                    <span className="task-count">{filterTasks(categorizedTasks.upcoming).length}</span>
                  </div>
                  <div className="task-list">
                    {filterTasks(categorizedTasks.upcoming).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onToggleLock={handleToggleLock}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filterTasks(categorizedTasks.old).length > 0 && (
                <section className="task-section old-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-history"></i>
                      Past Tasks
                    </h2>
                    <span className="task-count">{filterTasks(categorizedTasks.old).length}</span>
                    <button
                      className="move-tasks-btn"
                      onClick={handleAutoMoveOldTasks}
                    >
                      <i className="fas fa-arrow-right"></i>
                      Move to Tomorrow
                    </button>
                  </div>
                  <div className="task-list">
                    {filterTasks(categorizedTasks.old).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onToggleLock={handleToggleLock}
                      />
                    ))}
                  </div>
                </section>
              )}

              {filterTasks(categorizedTasks.completed).length > 0 && (
                <section className="task-section completed-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-check-circle"></i>
                      Completed
                    </h2>
                    <span className="task-count">{filterTasks(categorizedTasks.completed).length}</span>
                  </div>
                  <div className="task-list">
                    {filterTasks(categorizedTasks.completed).slice(0, 5).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onToggleLock={handleToggleLock}
                      />
                    ))}
                  </div>
                </section>
              )}

              {tasks.length === 0 && (
                <div className="empty-state">
                  <i className="fas fa-leaf"></i>
                  <h3>Your day is yours</h3>
                  <p>Add your first task to get started</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p className="footer-text">
            © Daynix - Your Flexible Companion
          </p>
          <button
            className={`install-btn ${isInstalled || !deferredPrompt ? 'inactive' : 'active'}`}
            onClick={handleInstall}
            disabled={isInstalled || !deferredPrompt}
          >
            <i className="fas fa-download"></i>
            Install App
          </button>
        </div>
      </footer>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onUpdate={loadData}
      />

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </div>
  );
}

export default App;
