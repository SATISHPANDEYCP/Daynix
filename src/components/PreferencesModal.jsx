import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getPreferences, savePreferences } from '../utils/storage';
import './PreferencesModal.css';

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

export default PreferencesModal;
