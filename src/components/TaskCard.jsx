import { toast } from 'react-toastify';
import { TASK_TYPES, formatTime, getTimeUntil } from '../utils/taskHelpers';
import './TaskCard.css';

const TaskCard = ({ task, onComplete, onDelete, onEdit, onToggleLock }) => {
  const handleComplete = () => {
    onComplete(task.id);
    toast.success('Task completed! 🎉');
  };

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
          {task.locked && (
            <span className="task-badge locked-badge">
              <i className="fas fa-lock"></i>
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
              {new Date(task.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          )}
        </div>
        
        <button
          className="complete-btn"
          onClick={handleComplete}
        >
          <i className="fas fa-check"></i>
          Complete
        </button>
      </div>
    </div>
  );
};

export default TaskCard;
