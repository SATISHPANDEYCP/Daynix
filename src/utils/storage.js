import localforage from 'localforage';

// Configure storage instances
const tasksStore = localforage.createInstance({
  name: 'FlowDay',
  storeName: 'tasks'
});

const settingsStore = localforage.createInstance({
  name: 'FlowDay',
  storeName: 'settings'
});

const preferencesStore = localforage.createInstance({
  name: 'FlowDay',
  storeName: 'preferences'
});

// Default preferences
export const DEFAULT_PREFERENCES = {
  wakeUpTime: '07:00',
  sleepTime: '23:00',
  sleepTargetHours: 8,
  officeStartTime: null,
  officeEndTime: null,
  officeDays: [], // Array of day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
  studySlots: [], // Array of {start, end, days: []}
  breakDuration: 15, // minutes
  breakFrequency: 120, // minutes (every 2 hours)
  theme: 'dark'
};

// Task Management
export const saveTasks = async (tasks) => {
  await tasksStore.setItem('allTasks', tasks);
};

export const getTasks = async () => {
  const tasks = await tasksStore.getItem('allTasks');
  return tasks || [];
};

export const addTask = async (task) => {
  const tasks = await getTasks();
  const newTask = {
    ...task,
    id: Date.now() + Math.random(),
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
};

export const updateTask = async (taskId, updates) => {
  const tasks = await getTasks();
  const index = tasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    await saveTasks(tasks);
    return tasks[index];
  }
  return null;
};

export const deleteTask = async (taskId) => {
  const tasks = await getTasks();
  const filtered = tasks.filter(t => t.id !== taskId);
  await saveTasks(filtered);
};

// Preferences Management
export const getPreferences = async () => {
  const prefs = await preferencesStore.getItem('userPreferences');
  return prefs || DEFAULT_PREFERENCES;
};

export const savePreferences = async (preferences) => {
  await preferencesStore.setItem('userPreferences', preferences);
};

export const updatePreference = async (key, value) => {
  const prefs = await getPreferences();
  prefs[key] = value;
  await savePreferences(prefs);
};

// Settings Management (for backup preferences, etc.)
export const getSettings = async () => {
  const settings = await settingsStore.getItem('appSettings');
  return settings || {
    backupLocation: null,
    backupHandle: null,
    lastBackup: null
  };
};

export const saveSettings = async (settings) => {
  // Store the directory handle separately using IndexedDB's native support
  const { backupHandle, ...otherSettings } = settings;
  await settingsStore.setItem('appSettings', otherSettings);
  
  // Store handle separately if it exists
  if (backupHandle) {
    await settingsStore.setItem('backupHandle', backupHandle);
  }
};

export const getBackupHandle = async () => {
  return await settingsStore.getItem('backupHandle');
};

export const clearBackupHandle = async () => {
  await settingsStore.removeItem('backupHandle');
};

// Export/Import functionality
export const exportData = async (returnData = false) => {
  const tasks = await getTasks();
  const preferences = await getPreferences();
  const settings = await getSettings();
  
  const data = {
    tasks,
    preferences,
    settings,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };
  
  const jsonString = JSON.stringify(data, null, 2);
  
  // If returnData is true, just return the JSON string for manual file operations
  if (returnData) {
    return jsonString;
  }
  
  // Otherwise, trigger download
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daynix-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  // Update last backup time
  const currentSettings = await getSettings();
  currentSettings.lastBackup = new Date().toISOString();
  await saveSettings(currentSettings);
};

export const importData = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Merge tasks instead of replacing
        if (data.tasks) {
          const existingTasks = await getTasks();
          const backupTasks = data.tasks;
          
          // Create a map of existing task IDs
          const existingIds = new Set(existingTasks.map(t => t.id));
          
          // Only add tasks from backup that don't already exist
          const tasksToAdd = backupTasks.filter(t => !existingIds.has(t.id));
          
          // Merge: keep existing tasks + add non-duplicate tasks from backup
          const mergedTasks = [...existingTasks, ...tasksToAdd];
          await saveTasks(mergedTasks);
        }
        
        // For preferences, restore from backup
        if (data.preferences) await savePreferences(data.preferences);
        
        // For settings, merge but keep current backup location
        if (data.settings) {
          const currentSettings = await getSettings();
          const mergedSettings = {
            ...data.settings,
            // Preserve current backup location and handle (don't overwrite with backup's old location)
            backupLocation: currentSettings.backupLocation || data.settings.backupLocation,
            backupHandle: currentSettings.backupHandle // File handle cannot be serialized, keep current one
          };
          await saveSettings(mergedSettings);
        }
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Clear all data
export const clearAllData = async () => {
  await tasksStore.clear();
  await settingsStore.clear();
  await preferencesStore.clear();
};
