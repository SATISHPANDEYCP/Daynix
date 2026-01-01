import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import PreferenceCard from './components/PreferenceCard';
import { getTasks, addTask, updateTask, deleteTask, getPreferences, savePreferences, exportData, importData, getSettings, saveSettings, clearAllData } from './utils/storage';
import { categorizeTasks, autoMoveTask, shouldCreateDailyInstance, createDailyInstance, TASK_TYPES, formatTime, getTimeUntil } from './utils/taskHelpers';
import './App.css';

// Stopwatch Component for Running Tasks
const Stopwatch = ({ task }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let startTime;

    // Calculate start time based on task type
    if (task.type === TASK_TYPES.TIME_BOUND && task.time && task.date) {
      startTime = new Date(task.date + 'T' + task.time);
    } else if (task.type === TASK_TYPES.TIME_RANGE && task.startTime && task.date) {
      startTime = new Date(task.date + 'T' + task.startTime);
    } else {
      // For floating tasks or if no time, use current time
      startTime = new Date();
    }

    const updateTimer = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedTime(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [task]);

  const formatElapsedTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="stopwatch">
      <div className="stopwatch-icon">
        <i className="fas fa-stopwatch"></i>
      </div>
      <div className="stopwatch-time">{formatElapsedTime(elapsedTime)}</div>
      <div className="stopwatch-label">Elapsed Time</div>
    </div>
  );
};

// ActivityCard Component (for office/study auto-generated activities)
const ActivityCard = ({ title, startTime, endTime, icon, type }) => {
  const getMotivationalQuote = () => {
    if (type === 'office') {
      return "When you have free time, consider reading something to expand your knowledge.";
    }

    if (type === 'study') {
      const studyQuotes = [
        "Success is the sum of small efforts repeated day in and day out.",
        "The expert in anything was once a beginner. Keep going!",
        "Education is not preparation for life; education is life itself.",
        "The more that you read, the more things you will know.",
        "Learning never exhausts the mind. Stay curious!",
        "Don't stop when you're tired. Stop when you're done.",
        "The beautiful thing about learning is that no one can take it away from you.",
        "Every accomplishment starts with the decision to try.",
        "Strive for progress, not perfection.",
        "The future depends on what you do today.",
        "Believe you can and you're halfway there.",
        "Your limitation—it's only your imagination.",
        "Push yourself, because no one else is going to do it for you.",
        "Great things never come from comfort zones.",
        "Dream it. Wish it. Do it.",
        "Success doesn't just find you. You have to go out and get it.",
        "The harder you work for something, the greater you'll feel when you achieve it.",
        "Dream bigger. Do bigger.",
        "Don't wait for opportunity. Create it.",
        "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
        "The key to success is to focus on goals, not obstacles.",
        "Dedication and hard work will always beat talent without effort.",
        "Study while others are sleeping; work while others are loafing.",
        "Small daily improvements are the key to staggering long-term results.",
        "You don't have to be great to start, but you have to start to be great.",
        "Focus on being productive instead of busy.",
        "The only way to do great work is to love what you do.",
        "Excellence is not a destination; it is a continuous journey.",
        "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.",
        "The difference between ordinary and extraordinary is that little extra."
      ];

      // Use current date + start time to generate unique quote per day
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
      const [hours, minutes] = startTime.split(':').map(Number);
      const timeIndex = hours * 60 + minutes;
      // Combine date and time for unique daily quote per session
      const quoteIndex = (dayOfYear + timeIndex) % studyQuotes.length;

      return studyQuotes[quoteIndex];
    }

    return null;
  };

  const quote = getMotivationalQuote();

  return (
    <div className="activity-card">
      <div className="activity-header">
        <div className="activity-icon">
          <i className={`fas fa-${icon}`}></i>
        </div>
        <div className="activity-info">
          <h3 className="activity-title">{title}</h3>
          <span className="activity-badge">
            <i className="fas fa-circle-dot"></i> Active Now
          </span>
        </div>
      </div>
      {quote && (
        <div className="activity-quote">
          <i className="fas fa-quote-left"></i>
          <p>{quote}</p>
        </div>
      )}
      <div className="activity-time">
        <i className="fas fa-clock"></i>
        {formatTime(startTime)} - {formatTime(endTime)}
      </div>
      <Stopwatch task={{ type: 'timeRange', startTime, date: new Date().toISOString().split('T')[0] }} />
    </div>
  );
};

// TaskCard Component
const TaskCard = ({ task, onComplete, onDelete, onEdit, onToggleLock, showStopwatch = false, allTasks = [] }) => {
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
      // For completed tasks, don't show countdown
      const timeUntil = task.completed ? null : getTimeUntil(task.time, task.date);
      return (
        <span className="time-display">
          {formatTime(task.time)}
          {timeUntil && <span className="time-until">{timeUntil}</span>}
        </span>
      );
    }

    if (task.type === TASK_TYPES.TIME_RANGE) {
      // For completed tasks, don't show countdown
      const timeUntil = task.completed ? null : getTimeUntil(task.startTime, task.date);
      return (
        <span className="time-display">
          {formatTime(task.startTime)} - {formatTime(task.endTime)}
          {timeUntil && <span className="time-until">{timeUntil}</span>}
        </span>
      );
    }
  };

  const getCompletionTime = () => {
    if (!task.completedAt) return null;
    const completedDate = new Date(task.completedAt);
    const now = new Date();
    const diffMs = now - completedDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`task-card ${task.locked ? 'locked' : ''} ${task.completed ? 'completed' : ''}`}>
      <div className="task-card-header">
        <div className="task-title-section">
          <h3 className="task-title">{task.title}</h3>
          {task.completed && (
            <span className="task-badge completed-badge">
              <i className="fas fa-check-circle"></i> Done
            </span>
          )}
          {task.parentTaskId && (
            <span className="task-badge recurring-instance-badge">
              <i className="fas fa-sync-alt"></i> Recurring
            </span>
          )}
          {(task.isDaily || task.recurringType === 'daily') && !task.parentTaskId && (
            <span className="task-badge daily-badge">
              <i className="fas fa-redo"></i> Daily
            </span>
          )}
          {task.recurringType === 'weekly' && task.recurringDays && task.recurringDays.length > 0 && !task.parentTaskId && (
            <span className="task-badge weekly-badge">
              <i className="fas fa-calendar-week"></i> Weekly
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

      {task.parentTaskId && (() => {
        // Find parent task to show recurring pattern
        const parentTask = allTasks.find(t => t.id === task.parentTaskId);
        if (parentTask && parentTask.recurringType === 'weekly' && parentTask.recurringDays && parentTask.recurringDays.length > 0) {
          return (
            <div className="days-selector" style={{ marginTop: '12px', marginBottom: '8px' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <span
                  key={index}
                  className={`day-btn ${parentTask.recurringDays.includes(index) ? 'active' : ''}`}
                  style={{ cursor: 'default', fontSize: '0.85rem', padding: '4px 8px' }}
                >
                  {day}
                </span>
              ))}
            </div>
          );
        }
        return null;
      })()}

      {task.recurringType === 'weekly' && task.recurringDays && task.recurringDays.length > 0 && !task.parentTaskId && (
        <div className="days-selector" style={{ marginTop: '12px', marginBottom: '8px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <span
              key={index}
              className={`day-btn ${task.recurringDays.includes(index) ? 'active' : ''}`}
              style={{ cursor: 'default', fontSize: '0.85rem', padding: '4px 8px' }}
            >
              {day}
            </span>
          ))}
        </div>
      )}

      {showStopwatch && (
        <Stopwatch task={task} />
      )}

      <div className="task-footer">
        <div className="task-meta">
          {task.completed && task.completedAt ? (
            <span className="task-completed-time">
              <i className="fas fa-check-double"></i>
              Completed {getCompletionTime()}
            </span>
          ) : (
            <span className="task-time">
              <i className="fas fa-clock"></i>
              {getTaskTimeDisplay()}
            </span>
          )}
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
  // Helper to get local date string (yyyy-mm-dd)
  function getLocalDateString() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().split('T')[0];
  }

  const [task, setTask] = useState(initialTask || {
    title: '',
    description: '',
    type: TASK_TYPES.FLOATING,
    date: getLocalDateString(),
    endDate: getLocalDateString(),
    time: '',
    startTime: '',
    endTime: '',
    locked: false,
    isDaily: false,
    recurringType: 'none', // 'none', 'daily', 'weekly'
    recurringDays: [] // Array of day indices: 0=Sunday, 1=Monday, ..., 6=Saturday
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

    // Validate weekly recurring tasks
    if (task.recurringType === 'weekly' && (!task.recurringDays || task.recurringDays.length === 0)) {
      toast.info('Please select at least one day for weekly recurring tasks');
      return;
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

        <div className="form-group" style={{ marginTop: '12px' }}>
          <label>Repeat</label>
          <select
            value={task.recurringType || 'none'}
            onChange={e => {
              const newType = e.target.value;
              handleChange('recurringType', newType);
              // Legacy support: sync isDaily
              handleChange('isDaily', newType === 'daily');
              // If changing to weekly, initialize with current day
              if (newType === 'weekly' && (!task.recurringDays || task.recurringDays.length === 0)) {
                const currentDay = new Date(task.date).getDay();
                handleChange('recurringDays', [currentDay]);
              }
            }}
          >
            <option value="none">No repeat</option>
            <option value="daily">Every day</option>
            <option value="weekly">Specific days</option>
          </select>
        </div>

        {task.recurringType === 'weekly' && (
          <div className="form-group" style={{ marginTop: '12px' }}>
            <label>Repeat on</label>
            <div className="days-selector">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <button
                  key={index}
                  type="button"
                  className={`day-btn ${(task.recurringDays || []).includes(index) ? 'active' : ''}`}
                  onClick={() => {
                    const days = task.recurringDays || [];
                    const newDays = days.includes(index)
                      ? days.filter(d => d !== index)
                      : [...days, index].sort();
                    handleChange('recurringDays', newDays);
                  }}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        )}
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
    // No validation needed - overnight sessions are allowed
    // (end time before start time means it continues to next day)

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
    // No validation needed - overnight sessions are allowed
    // (end time before start time means it continues to next day)
    setPreferences(prev => ({ ...prev, studySlots: newSlots }));
  };

  const addStudySlot = () => {
    setPreferences(prev => ({
      ...prev,
      studySlots: [...prev.studySlots, { start: '18:00', end: '20:00', days: [] }]
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

            {preferences.officeStartTime && preferences.officeEndTime ? (
              <>
                <div className="study-slot-container">
                  <div className="form-row slot-row">
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
                      {(() => {
                        const [startH, startM] = preferences.officeStartTime.split(':').map(Number);
                        const [endH, endM] = preferences.officeEndTime.split(':').map(Number);
                        const isOvernight = (endH * 60 + endM) < (startH * 60 + startM);
                        return isOvernight ? (
                          <span className="overnight-badge">
                            <i className="fas fa-moon"></i> Next day
                          </span>
                        ) : null;
                      })()}
                    </div>

                    <button
                      className="icon-btn remove-btn"
                      onClick={() => {
                        handleChange('officeStartTime', null);
                        handleChange('officeEndTime', null);
                        handleChange('officeDays', []);
                      }}
                      title="Remove office hours"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Office Days</label>
                    <div className="days-selector">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`day-btn ${(preferences.officeDays || []).includes(index) ? 'active' : ''}`}
                          onClick={() => {
                            const days = preferences.officeDays || [];
                            const newDays = days.includes(index)
                              ? days.filter(d => d !== index)
                              : [...days, index].sort();
                            handleChange('officeDays', newDays);
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="empty-slots-message">
                <i className="fas fa-info-circle"></i>
                No office hours set. Click below to add your office schedule.
              </p>
            )}

            {!preferences.officeStartTime && !preferences.officeEndTime && (
              <button
                className="add-slot-btn"
                onClick={() => {
                  handleChange('officeStartTime', '09:00');
                  handleChange('officeEndTime', '17:00');
                }}
              >
                <i className="fas fa-plus"></i> Add Office Hours
              </button>
            )}
          </div>

          <div className="preference-section">
            <h3>Study Time Slots</h3>

            {preferences.studySlots && preferences.studySlots.length > 0 ? (
              <>
                {preferences.studySlots.map((slot, index) => {
                  const [startH, startM] = slot.start.split(':').map(Number);
                  const [endH, endM] = slot.end.split(':').map(Number);
                  const startMins = startH * 60 + startM;
                  const endMins = endH * 60 + endM;
                  const isOvernight = endMins < startMins;

                  return (
                    <div key={index} className="study-slot-container">
                      <div className="form-row slot-row">
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
                          {isOvernight && (
                            <span className="overnight-badge">
                              <i className="fas fa-moon"></i> Next day
                            </span>
                          )}
                        </div>

                        <button
                          className="icon-btn remove-btn"
                          onClick={() => removeStudySlot(index)}
                          title="Remove slot"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div className="form-group">
                        <label>Study Days</label>
                        <div className="days-selector">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                            <button
                              key={dayIndex}
                              type="button"
                              className={`day-btn ${(slot.days || []).includes(dayIndex) ? 'active' : ''}`}
                              onClick={() => {
                                const days = slot.days || [];
                                const newDays = days.includes(dayIndex)
                                  ? days.filter(d => d !== dayIndex)
                                  : [...days, dayIndex].sort();
                                handleStudySlotChange(index, 'days', newDays);
                              }}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="empty-slots-message">
                <i className="fas fa-info-circle"></i>
                No study slots set. Click below to add your first study time.
              </p>
            )}

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
  const [backupLocation, setBackupLocation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    const appSettings = await getSettings();
    setSettings(appSettings);
    setBackupLocation(appSettings.backupLocation || null);
  };

  const handleAddBackupLocation = async () => {
    try {
      // Request directory picker (only works in modern browsers)
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker();
        const newSettings = {
          ...settings,
          backupLocation: dirHandle.name
          // Note: backupHandle is stored in state only, not in IndexedDB (can't be serialized)
        };
        setSettings({ ...newSettings, backupHandle: dirHandle });
        await saveSettings(newSettings); // Save without backupHandle
        setBackupLocation(dirHandle.name);
        toast.success('Backup location set: ' + dirHandle.name);
      } else {
        toast.info('Directory picker not supported. Use Download Backup instead.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Could not set backup location');
      }
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await exportData();
      toast.success('Backup downloaded successfully');
    } catch (error) {
      toast.error('Could not download backup');
    }
  };

  const handleForgetLocation = async () => {
    if (window.confirm('Forget backup location preference?')) {
      const newSettings = { ...settings, backupLocation: null, backupHandle: null };
      setSettings(newSettings);
      await saveSettings(newSettings);
      setBackupLocation(null);
      toast.info('Backup location forgotten');
    }
  };

  const handleUpdateBackup = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        let dirHandle = settings.backupHandle;

        // If handle is lost, request permission again
        if (!dirHandle && settings.backupLocation) {
          toast.info('Please select the backup folder again');
          dirHandle = await window.showDirectoryPicker();
          setSettings({ ...settings, backupHandle: dirHandle });
        }

        if (dirHandle) {
          // Save to the stored location
          const data = await exportData(true); // Get data without downloading
          const fileHandle = await dirHandle.getFileHandle(
            `daynix-backup-${new Date().toISOString().split('T')[0]}.json`,
            { create: true }
          );
          const stream = await fileHandle.createWritable();
          await stream.write(data);
          await stream.close();

          const newSettings = { ...settings, lastBackup: new Date().toISOString() };
          await saveSettings(newSettings);
          setSettings({ ...newSettings, backupHandle: dirHandle });
          toast.success('Backup updated successfully');
        } else {
          // Fallback to download
          await handleDownloadBackup();
        }
      } else {
        // Fallback to download
        await handleDownloadBackup();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Could not update backup');
      }
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

            {!backupLocation ? (
              <div className="setting-item">
                <button className="btn btn-primary btn-standard" onClick={handleAddBackupLocation}>
                  <i className="fas fa-folder-plus"></i> Add Backup Location
                </button>
                <p className="setting-description">
                  Set a folder where backups will be saved
                </p>
              </div>
            ) : (
              <div className="setting-item">
                <div className="backup-location-display">
                  <i className="fas fa-folder-open"></i>
                  <span>{backupLocation}</span>
                </div>
                <p className="setting-description">
                  Backup location is set
                </p>
              </div>
            )}

            <div className="setting-item">
              <button className="btn btn-primary btn-standard" onClick={handleDownloadBackup}>
                <i className="fas fa-download"></i> Download Backup
              </button>
              <p className="setting-description">
                Download backup file as JSON to your device
              </p>
            </div>

            {backupLocation && (
              <>
                <div className="setting-item">
                  <button className="btn btn-secondary btn-standard" onClick={handleUpdateBackup}>
                    <i className="fas fa-sync"></i> Update Backup
                  </button>
                  <p className="setting-description">
                    Update the backup file in saved location
                  </p>
                </div>

                <div className="setting-item">
                  <button className="btn btn-secondary btn-standard" onClick={handleForgetLocation}>
                    <i className="fas fa-times-circle"></i> Forget Backup Location
                  </button>
                  <p className="setting-description">
                    Remove saved backup location preference
                  </p>
                </div>
              </>
            )}

            <div className="setting-item">
              <label htmlFor="import-file" className="btn btn-secondary btn-standard">
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
                <i className="fas fa-clock"></i> Last backup: {new Date(settings.lastBackup).toLocaleString()}
              </p>
            )}
          </div>

          <div className="setting-section danger-zone">
            <h3>Danger Zone</h3>

            <div className="setting-item">
              <button className="btn btn-danger btn-standard" onClick={handleClearData}>
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

  useEffect(() => {
    loadData();

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
        // Filter out parent recurring tasks from normal view
        const visibleTasks = tasks.filter(t => 
          !(t.isDaily || t.recurringType === 'daily' || t.recurringType === 'weekly') || 
          t.parentTaskId // Show instances (child tasks)
        );
        const categorized = categorizeTasks(visibleTasks);
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
      // Filter out parent recurring tasks from normal view
      const visibleTasks = tasks.filter(t => 
        !(t.isDaily || t.recurringType === 'daily' || t.recurringType === 'weekly') || 
        t.parentTaskId // Show instances (child tasks)
      );
      const categorized = categorizeTasks(visibleTasks);
      setCategorizedTasks(categorized);
      handleDailyTasks();
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

  const getActiveActivities = () => {
    if (!preferences) return [];

    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const activities = [];

    // Check office hours
    if (preferences.officeStartTime && preferences.officeEndTime) {
      const officeDays = preferences.officeDays || [];
      const yesterdayDay = (currentDay - 1 + 7) % 7;

      const [startH, startM] = preferences.officeStartTime.split(':').map(Number);
      const [endH, endM] = preferences.officeEndTime.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      const isOvernightSession = endMins < startMins;

      let isActive = false;

      if (isOvernightSession) {
        // Overnight session: check if started yesterday or today
        if (officeDays.includes(currentDay) && currentTime >= startMins) {
          isActive = true; // Started today, still going
        } else if (officeDays.includes(yesterdayDay) && currentTime <= endMins) {
          isActive = true; // Started yesterday, ending today
        }
      } else {
        // Same-day session
        if (officeDays.includes(currentDay) && currentTime >= startMins && currentTime <= endMins) {
          isActive = true;
        }
      }

      if (isActive) {
        activities.push({
          id: 'office-session',
          title: 'Office Hours',
          startTime: preferences.officeStartTime,
          endTime: preferences.officeEndTime,
          icon: 'briefcase',
          type: 'office'
        });
      }
    }

    // Check study slots
    if (preferences.studySlots && preferences.studySlots.length > 0) {
      const yesterdayDay = (currentDay - 1 + 7) % 7;

      preferences.studySlots.forEach((slot, index) => {
        const slotDays = slot.days || [];
        const [startH, startM] = slot.start.split(':').map(Number);
        const [endH, endM] = slot.end.split(':').map(Number);
        const startMins = startH * 60 + startM;
        const endMins = endH * 60 + endM;
        const isOvernightSession = endMins < startMins;

        let isActive = false;

        if (isOvernightSession) {
          // Overnight session: check if started yesterday or today
          if (slotDays.includes(currentDay) && currentTime >= startMins) {
            isActive = true; // Started today, still going
          } else if (slotDays.includes(yesterdayDay) && currentTime <= endMins) {
            isActive = true; // Started yesterday, ending today
          }
        } else {
          // Same-day session
          if (slotDays.includes(currentDay) && currentTime >= startMins && currentTime <= endMins) {
            isActive = true;
          }
        }

        if (isActive) {
          activities.push({
            id: `study-session-${index}`,
            title: 'Study Time',
            startTime: slot.start,
            endTime: slot.end,
            icon: 'book',
            type: 'study'
          });
        }
      });
    }

    return activities;
  };

  const handleDailyTasks = async () => {
    // Get all recurring tasks (legacy isDaily or new recurringType)
    const recurringTasks = tasks.filter(t => 
      (t.isDaily || t.recurringType === 'daily' || t.recurringType === 'weekly') && 
      !t.parentTaskId
    );
    let hasNewInstances = false;

    for (const task of recurringTasks) {
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

  const handleAddTask = async (taskData) => {
    // If it's a recurring task, set lastDailyInstance to today so it doesn't create instance immediately
    if (taskData.isDaily || taskData.recurringType === 'daily' || taskData.recurringType === 'weekly') {
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
              {(categorizedTasks.running.length > 0 || getActiveActivities().length > 0) ? (
                <>
                  <section className="task-section running-section">
                    <div className="section-header">
                      <h2>
                        <i className="fas fa-play-circle"></i>
                        Running Now
                      </h2>
                      <span className="task-count">{categorizedTasks.running.length + getActiveActivities().length}</span>
                    </div>
                    <div className="task-list">
                      {/* Show active office/study activities */}
                      {getActiveActivities().map(activity => (
                        <ActivityCard
                          key={activity.id}
                          title={activity.title}
                          startTime={activity.startTime}
                          endTime={activity.endTime}
                          icon={activity.icon}
                          type={activity.type}
                        />
                      ))}
                      {/* Show running tasks */}
                      {categorizedTasks.running.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={handleCompleteTask}
                          onDelete={handleDeleteTask}
                          onEdit={handleEditTask}
                          onToggleLock={handleToggleLock}
                          showStopwatch={true}
                          allTasks={tasks}
                        />
                      ))}
                    </div>
                  </section>

                  {/* Today's Tasks Table - Shows below running tasks */}
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todaysTasks = [...categorizedTasks.upcoming, ...categorizedTasks.old, ...categorizedTasks.completed]
                      .filter(t => t.date === today);
                    
                    // Get all activities for today
                    const todaysActivities = [];
                    
                    // Add office if scheduled today
                    if (preferences.officeStartTime && preferences.officeEndTime) {
                      const currentDay = new Date().getDay();
                      const officeDays = preferences.officeDays || [];
                      if (officeDays.includes(currentDay)) {
                        todaysActivities.push({
                          type: 'office',
                          title: 'Office Hours',
                          startTime: preferences.officeStartTime,
                          endTime: preferences.officeEndTime,
                          icon: 'briefcase',
                          isRecurring: officeDays.length > 1
                        });
                      }
                    }
                    
                    // Add study slots if scheduled today
                    if (preferences.studySlots && preferences.studySlots.length > 0) {
                      const currentDay = new Date().getDay();
                      preferences.studySlots.forEach(slot => {
                        const slotDays = slot.days || [];
                        if (slotDays.includes(currentDay)) {
                          todaysActivities.push({
                            type: 'study',
                            title: 'Study Time',
                            startTime: slot.start,
                            endTime: slot.end,
                            icon: 'book',
                            isRecurring: slotDays.length > 1
                          });
                        }
                      });
                    }
                    
                    const allTodaysItems = [...todaysTasks, ...todaysActivities];
                    
                    if (allTodaysItems.length > 0) {
                      // Sort by time
                      const sortedItems = allTodaysItems.sort((a, b) => {
                        const timeA = a.startTime || a.time || '99:99';
                        const timeB = b.startTime || b.time || '99:99';
                        return timeA.localeCompare(timeB);
                      });
                      
                      return (
                        <section className="task-section today-tasks-section">
                          <div className="section-header">
                            <h2>
                              <i className="fas fa-calendar-day"></i>
                              Today's Schedule
                            </h2>
                            <span className="task-count">{sortedItems.length}</span>
                          </div>
                          <div className="today-tasks-table">
                            <div className="today-table-header">
                              <div className="header-time">Time</div>
                              <div className="header-task">Task</div>
                              <div className="header-status">Status</div>
                            </div>
                            {sortedItems.map((item, index) => {
                              // Check if time has passed
                              const now = new Date();
                              const currentTime = now.getHours() * 60 + now.getMinutes();
                              let timePassed = false;
                              
                              if (item.type === TASK_TYPES.TIME_BOUND && item.time) {
                                const [hours, minutes] = item.time.split(':').map(Number);
                                const taskTime = hours * 60 + minutes;
                                timePassed = currentTime > taskTime;
                              } else if (item.type === TASK_TYPES.TIME_RANGE && item.endTime) {
                                const [hours, minutes] = item.endTime.split(':').map(Number);
                                const taskEndTime = hours * 60 + minutes;
                                timePassed = currentTime > taskEndTime;
                              } else if (item.type && (item.type === 'office' || item.type === 'study') && item.endTime) {
                                const [hours, minutes] = item.endTime.split(':').map(Number);
                                const activityEndTime = hours * 60 + minutes;
                                timePassed = currentTime > activityEndTime;
                              }
                              
                              return (
                              <div 
                                key={item.id || `activity-${item.type}-${index}`} 
                                className={`today-task-row ${timePassed || item.completed ? 'time-passed' : ''}`}
                                onClick={() => item.id ? handleEditTask(item) : null}
                                style={{ cursor: item.id ? 'pointer' : 'default' }}
                              >
                                <div className="today-task-time">
                                  {item.type === TASK_TYPES.FLOATING ? (
                                    <span className="time-flexible">Anytime</span>
                                  ) : item.type === TASK_TYPES.TIME_BOUND ? (
                                    formatTime(item.time)
                                  ) : (
                                    `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
                                  )}
                                </div>
                                <div className="today-task-center">
                                  <i className={`fas fa-${item.icon || 'tasks'}`}></i>
                                  <span>{item.title}</span>
                                </div>
                                <div className="today-task-right">
                                  {(item.parentTaskId || item.isRecurring) && (
                                    <span className="meta-badge">
                                      <i className="fas fa-sync-alt"></i> Recurring
                                    </span>
                                  )}
                                </div>
                              </div>
                            );})}
                          </div>
                        </section>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : categorizedTasks.upcoming.length > 0 ? (
                <>
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
                        allTasks={tasks}
                      />
                    </div>
                  </section>

                  {/* Today's Tasks Table - Shows when no running task */}
                  {(() => {
                    const today = new Date().toISOString().split('T')[0];
                    const todaysTasks = [...categorizedTasks.upcoming, ...categorizedTasks.old, ...categorizedTasks.completed]
                      .filter(t => t.date === today);
                    
                    // Get all activities for today
                    const todaysActivities = [];
                    
                    // Add office if scheduled today
                    if (preferences.officeStartTime && preferences.officeEndTime) {
                      const currentDay = new Date().getDay();
                      const officeDays = preferences.officeDays || [];
                      if (officeDays.includes(currentDay)) {
                        todaysActivities.push({
                          type: 'office',
                          title: 'Office Hours',
                          startTime: preferences.officeStartTime,
                          endTime: preferences.officeEndTime,
                          icon: 'briefcase',
                          isRecurring: officeDays.length > 1
                        });
                      }
                    }
                    
                    // Add study slots if scheduled today
                    if (preferences.studySlots && preferences.studySlots.length > 0) {
                      const currentDay = new Date().getDay();
                      preferences.studySlots.forEach(slot => {
                        const slotDays = slot.days || [];
                        if (slotDays.includes(currentDay)) {
                          todaysActivities.push({
                            type: 'study',
                            title: 'Study Time',
                            startTime: slot.start,
                            endTime: slot.end,
                            icon: 'book',
                            isRecurring: slotDays.length > 1
                          });
                        }
                      });
                    }
                    
                    const allTodaysItems = [...todaysTasks, ...todaysActivities];
                    
                    if (allTodaysItems.length > 1) { // More than just the "Next Up" task
                      // Sort by time
                      const sortedItems = allTodaysItems.sort((a, b) => {
                        const timeA = a.startTime || a.time || '99:99';
                        const timeB = b.startTime || b.time || '99:99';
                        return timeA.localeCompare(timeB);
                      });
                      
                      return (
                        <section className="task-section today-tasks-section">
                          <div className="section-header">
                            <h2>
                              <i className="fas fa-calendar-day"></i>
                              Today's Schedule
                            </h2>
                            <span className="task-count">{sortedItems.length}</span>
                          </div>
                          <div className="today-tasks-table">
                            <div className="today-table-header">
                              <div className="header-time">Time</div>
                              <div className="header-task">Task</div>
                              <div className="header-status">Status</div>
                            </div>
                            {sortedItems.map((item, index) => {
                              // Check if time has passed
                              const now = new Date();
                              const currentTime = now.getHours() * 60 + now.getMinutes();
                              let timePassed = false;
                              
                              if (item.type === TASK_TYPES.TIME_BOUND && item.time) {
                                const [hours, minutes] = item.time.split(':').map(Number);
                                const taskTime = hours * 60 + minutes;
                                timePassed = currentTime > taskTime;
                              } else if (item.type === TASK_TYPES.TIME_RANGE && item.endTime) {
                                const [hours, minutes] = item.endTime.split(':').map(Number);
                                const taskEndTime = hours * 60 + minutes;
                                timePassed = currentTime > taskEndTime;
                              } else if (item.type && (item.type === 'office' || item.type === 'study') && item.endTime) {
                                const [hours, minutes] = item.endTime.split(':').map(Number);
                                const activityEndTime = hours * 60 + minutes;
                                timePassed = currentTime > activityEndTime;
                              }
                              
                              return (
                              <div 
                                key={item.id || `activity-${item.type}-${index}`} 
                                className={`today-task-row ${timePassed || item.completed ? 'time-passed' : ''}`}
                              >
                                <div className="today-task-time">
                                  {item.type === TASK_TYPES.FLOATING ? (
                                    <span className="time-flexible">Anytime</span>
                                  ) : item.type === TASK_TYPES.TIME_BOUND ? (
                                    formatTime(item.time)
                                  ) : (
                                    `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
                                  )}
                                </div>
                                <div className="today-task-center">
                                  <i className={`fas fa-${item.icon || 'tasks'}`}></i>
                                  <span>{item.title}</span>
                                </div>
                                <div className="today-task-right">
                                  {(item.parentTaskId || item.isRecurring) && (
                                    <span className="meta-badge">
                                      <i className="fas fa-sync-alt"></i> Recurring
                                    </span>
                                  )}
                                </div>
                              </div>
                            );})}
                          </div>
                        </section>
                      );
                    }
                    return null;
                  })()}
                </>
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

              {(filterTasks(categorizedTasks.running).length > 0 || getActiveActivities().length > 0) && (
                <section className="task-section running-section">
                  <div className="section-header">
                    <h2>
                      <i className="fas fa-play-circle"></i>
                      Running Now
                    </h2>
                    <span className="task-count">{filterTasks(categorizedTasks.running).length + getActiveActivities().length}</span>
                  </div>
                  <div className="task-list">
                    {/* Show active office/study activities */}
                    {getActiveActivities().map(activity => (
                      <ActivityCard
                        key={activity.id}
                        title={activity.title}
                        startTime={activity.startTime}
                        endTime={activity.endTime}
                        icon={activity.icon}
                        type={activity.type}
                      />
                    ))}
                    {/* Show running tasks */}
                    {filterTasks(categorizedTasks.running).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onComplete={handleCompleteTask}
                        onDelete={handleDeleteTask}
                        onEdit={handleEditTask}
                        onToggleLock={handleToggleLock}
                        showStopwatch={true}
                        allTasks={tasks}
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
                        allTasks={tasks}
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
                        allTasks={tasks}
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
                        allTasks={tasks}
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


              {/* Recurring Tasks Section - Show parent recurring tasks */}
              {(() => {
                const recurringParentTasks = tasks.filter(t => 
                  (t.isDaily || t.recurringType === 'daily' || t.recurringType === 'weekly') && 
                  !t.parentTaskId
                );
                
                if (recurringParentTasks.length === 0) return null;
                
                return (
                  <section className="task-section">
                    <div className="section-header">
                      <h2>
                        <i className="fas fa-sync-alt"></i>
                        Scheduled Recurring Tasks
                      </h2>
                      <span className="task-count">{recurringParentTasks.length}</span>
                    </div>
                    <div className="task-list">
                      {recurringParentTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={handleCompleteTask}
                          onDelete={handleDeleteTask}
                          onEdit={handleEditTask}
                          onToggleLock={handleToggleLock}
                          allTasks={tasks}
                        />
                      ))}
                    </div>
                  </section>
                );
              })()}

              {/* Preference section: Only show if user has at least one preference */}
              {preferences && (
                (preferences.officeStartTime && preferences.officeEndTime) || (preferences.studySlots && preferences.studySlots.length > 0)
              ) && (
                  <section className="task-section">
                    <div className="section-header">
                      <h2>
                        <i className="fas fa-calendar-alt"></i>
                        Your Saved Preferences
                      </h2>
                    </div>

                    <div className="task-list">
                      {/* Office Hours */}
                      {preferences.officeStartTime && preferences.officeEndTime && (
                        <PreferenceCard
                          title="Office Hours"
                          startTime={preferences.officeStartTime}
                          endTime={preferences.officeEndTime}
                          days={preferences.officeDays}
                          icon="briefcase"
                        />
                      )}

                      {/* Study Slots */}
                      {preferences.studySlots?.map((slot, index) => (
                        <PreferenceCard
                          key={index}
                          title={`Study Slot ${index + 1}`}
                          startTime={slot.start}
                          endTime={slot.end}
                          days={slot.days}
                          icon="book"
                        />
                      ))}
                    </div>
                  </section>
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
