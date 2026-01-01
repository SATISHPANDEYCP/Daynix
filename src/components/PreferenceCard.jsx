import { formatTime } from '../utils/taskHelpers';
const PreferenceCard = ({ title, startTime, endTime, days, icon }) => {
  if (!startTime || !endTime) return null;

  return (
    <div className="task-card preference-card">
      <div className="task-card-header">
        <div className="task-title-section">
          <h3 className="task-title">{title}</h3>
          <span className="task-badge daily-badge">
            <i className="fas fa-sliders-h"></i> Preference
          </span>
        </div>
      </div>

      <div className="task-description">
        <i className="fas fa-clock"></i>{' '}
        {formatTime(startTime)} – {formatTime(endTime)}
      </div>

      {Array.isArray(days) && days.length > 0 && (
        <div className="days-selector">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <span
              key={index}
              className={`day-btn ${days.includes(index) ? 'active' : ''}`}
              style={{ cursor: 'default' }}
            >
              {day}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
export default PreferenceCard;