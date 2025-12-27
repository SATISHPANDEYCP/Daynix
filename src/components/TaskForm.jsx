import { useState } from 'react';
import { toast } from 'react-toastify';
import { TASK_TYPES } from '../utils/taskHelpers';
import './TaskForm.css';

const TaskForm = ({ onSubmit, onCancel, initialTask = null }) => {
  const [task, setTask] = useState(initialTask || {
    title: '',
    description: '',
    type: TASK_TYPES.FLOATING,
    date: new Date().toISOString().split('T')[0],
    time: '',
    startTime: '',
    endTime: '',
    locked: false,
    isDaily: false
  });

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

export default TaskForm;
