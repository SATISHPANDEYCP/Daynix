import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { exportData, importData, getSettings, saveSettings, clearAllData } from '../utils/storage';
import './SettingsModal.css';

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
            <h3>About FlowDay</h3>
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

export default SettingsModal;
