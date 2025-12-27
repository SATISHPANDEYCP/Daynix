import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import TaskCard from './components/TaskCard';
import TaskForm from './components/TaskForm';
import SettingsModal from './components/SettingsModal';
import PreferencesModal from './components/PreferencesModal';
import { getTasks, addTask, updateTask, deleteTask, getPreferences } from './utils/storage';
import { categorizeTasks, autoMoveTask, shouldCreateDailyInstance, createDailyInstance } from './utils/taskHelpers';
import './App.css';

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
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    loadData();
    
    // Re-categorize tasks every minute
    const interval = setInterval(() => {
      if (tasks.length > 0) {
        const categorized = categorizeTasks(tasks);
        setCategorizedTasks(categorized);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      const categorized = categorizeTasks(tasks);
      setCategorizedTasks(categorized);
      handleDailyTasks();
    }
  }, [tasks]);

  useEffect(() => {
    document.body.className = theme === 'dark' ? 'dark-mode' : '';
  }, [theme]);

  const loadData = async () => {
    const loadedTasks = await getTasks();
    const prefs = await getPreferences();
    setTasks(loadedTasks);
    setPreferences(prefs);
    setTheme(prefs.theme || 'light');
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
      const { savePreferences } = await import('./utils/storage');
      await savePreferences(updatedPrefs);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <i className="fas fa-water"></i>
            <h1>FlowDay</h1>
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
                onSubmit={editingTask ? handleUpdateTask : handleAddTask}
                onCancel={() => {
                  setShowTaskForm(false);
                  setEditingTask(null);
                }}
              />
            )}
          </div>

          {categorizedTasks.running.length > 0 && (
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
          )}

          {categorizedTasks.upcoming.length > 0 && (
            <section className="task-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-clock"></i>
                  Upcoming
                </h2>
                <span className="task-count">{categorizedTasks.upcoming.length}</span>
              </div>
              <div className="task-list">
                {categorizedTasks.upcoming.map(task => (
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

          {categorizedTasks.old.length > 0 && (
            <section className="task-section old-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-history"></i>
                  Past Tasks
                </h2>
                <span className="task-count">{categorizedTasks.old.length}</span>
                <button
                  className="move-tasks-btn"
                  onClick={handleAutoMoveOldTasks}
                >
                  <i className="fas fa-arrow-right"></i>
                  Move to Tomorrow
                </button>
              </div>
              <div className="task-list">
                {categorizedTasks.old.map(task => (
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

          {categorizedTasks.completed.length > 0 && (
            <section className="task-section completed-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-check-circle"></i>
                  Completed
                </h2>
                <span className="task-count">{categorizedTasks.completed.length}</span>
              </div>
              <div className="task-list">
                {categorizedTasks.completed.slice(0, 5).map(task => (
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
        </div>
      </main>

      <footer className="app-footer">
        <p>
          <i className="fas fa-heart"></i>
          FlowDay - Your flexible companion
        </p>
        <p className="privacy-text">
          <i className="fas fa-shield-alt"></i>
          All data stays on your device
        </p>
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
        theme={theme}
      />
    </div>
  );
}

export default App;
