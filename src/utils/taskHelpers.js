// Task categorization logic based on current time and user preferences

export const TASK_TYPES = {
  TIME_BOUND: 'timeBound', // Specific time (e.g., 10:00 AM)
  TIME_RANGE: 'timeRange', // Time range (e.g., 10:00 AM - 2:00 PM)
  FLOATING: 'floating' // No specific time
};

export const TASK_STATUS = {
  RUNNING: 'running',
  UPCOMING: 'upcoming',
  OLD: 'old',
  COMPLETED: 'completed'
};

// Parse time string to minutes since midnight
export const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Get current time in minutes since midnight
export const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

// Check if current time is within a range
export const isWithinTimeRange = (startTime, endTime) => {
  const current = getCurrentMinutes();
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  
  if (start === null || end === null) return false;
  return current >= start && current <= end;
};

// Check if time has passed
export const hasTimePassed = (time) => {
  const current = getCurrentMinutes();
  const target = timeToMinutes(time);
  
  if (target === null) return false;
  return current > target;
};

// Categorize a single task
export const categorizeTask = (task) => {
  const today = new Date().toDateString();
  const taskDate = task.date ? new Date(task.date).toDateString() : today;
  
  // If task is completed
  if (task.completed) {
    return TASK_STATUS.COMPLETED;
  }
  
  // If task is for a future date
  if (new Date(taskDate) > new Date(today)) {
    return TASK_STATUS.UPCOMING;
  }
  
  // If task is from a past date
  if (new Date(taskDate) < new Date(today)) {
    return TASK_STATUS.OLD;
  }
  
  // Today's tasks - categorize by time
  if (task.type === TASK_TYPES.FLOATING) {
    return TASK_STATUS.UPCOMING; // Floating tasks are always "upcoming" until done
  }
  
  if (task.type === TASK_TYPES.TIME_BOUND) {
    if (!task.time) return TASK_STATUS.UPCOMING;
    
    if (hasTimePassed(task.time)) {
      return TASK_STATUS.OLD;
    }
    
    // Check if within 15 minutes of start time
    const current = getCurrentMinutes();
    const target = timeToMinutes(task.time);
    const diff = target - current;
    
    if (diff >= -15 && diff <= 15) {
      return TASK_STATUS.RUNNING;
    }
    
    return TASK_STATUS.UPCOMING;
  }
  
  if (task.type === TASK_TYPES.TIME_RANGE) {
    if (!task.startTime || !task.endTime) return TASK_STATUS.UPCOMING;
    
    if (isWithinTimeRange(task.startTime, task.endTime)) {
      return TASK_STATUS.RUNNING;
    }
    
    if (hasTimePassed(task.endTime)) {
      return TASK_STATUS.OLD;
    }
    
    return TASK_STATUS.UPCOMING;
  }
  
  return TASK_STATUS.UPCOMING;
};

// Categorize all tasks
export const categorizeTasks = (tasks) => {
  const categorized = {
    running: [],
    upcoming: [],
    old: [],
    completed: []
  };
  
  tasks.forEach(task => {
    const status = categorizeTask(task);
    categorized[status].push(task);
  });
  
  // Sort each category
  categorized.running.sort((a, b) => {
    if (a.type === TASK_TYPES.TIME_BOUND && b.type === TASK_TYPES.TIME_BOUND) {
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    }
    return 0;
  });
  
  categorized.upcoming.sort((a, b) => {
    if (a.date && b.date) {
      const dateCompare = new Date(a.date) - new Date(b.date);
      if (dateCompare !== 0) return dateCompare;
    }
    
    if (a.type === TASK_TYPES.TIME_BOUND && b.type === TASK_TYPES.TIME_BOUND) {
      return timeToMinutes(a.time) - timeToMinutes(b.time);
    }
    
    if (a.type === TASK_TYPES.TIME_RANGE && b.type === TASK_TYPES.TIME_RANGE) {
      return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    }
    
    return 0;
  });
  
  categorized.old.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  categorized.completed.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  
  return categorized;
};

// Auto-move old tasks to next available slot (if not locked)
export const autoMoveTask = (task) => {
  if (task.locked) return task;
  
  // Move to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    ...task,
    date: tomorrow.toISOString().split('T')[0],
    movedCount: (task.movedCount || 0) + 1
  };
};

// Handle daily recurring tasks
export const shouldCreateDailyInstance = (task) => {
  if (!task.isDaily) return false;
  
  const today = new Date().toDateString();
  const lastCreated = task.lastDailyInstance ? new Date(task.lastDailyInstance).toDateString() : null;
  
  return lastCreated !== today;
};

export const createDailyInstance = (task) => {
  return {
    ...task,
    id: Date.now() + Math.random(),
    date: new Date().toISOString().split('T')[0],
    completed: false,
    parentTaskId: task.id,
    isDaily: false // Instance is not daily, only parent is
  };
};

// Format time for display
export const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

// Get time until task
export const getTimeUntil = (timeStr) => {
  if (!timeStr) return null;
  
  const current = getCurrentMinutes();
  const target = timeToMinutes(timeStr);
  
  if (target === null) return null;
  
  const diff = target - current;
  
  if (diff < 0) return 'Started';
  if (diff === 0) return 'Now';
  
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  
  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  }
  return `in ${minutes}m`;
};
