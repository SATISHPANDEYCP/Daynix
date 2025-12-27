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
  studySlots: [], // Array of {start, end}
  breakDuration: 15, // minutes
  breakFrequency: 120, // minutes (every 2 hours)
  theme: 'light'
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
    autoBackup: false,
    backupFrequency: 'weekly',
    lastBackup: null
  };
};

export const saveSettings = async (settings) => {
  await settingsStore.setItem('appSettings', settings);
};

// Export/Import functionality
export const exportData = async () => {
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
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
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
        
        if (data.tasks) await saveTasks(data.tasks);
        if (data.preferences) await savePreferences(data.preferences);
        if (data.settings) await saveSettings(data.settings);
        
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
