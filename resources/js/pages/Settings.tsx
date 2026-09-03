import { useIntl } from 'react-intl';
import type { SettingsProps } from '../type';

export default function Settings({
  busyKey,
  isParent,
  profileForm,
  passwordForm,
  deletePassword,
  onUpdateProfile,
  onUpdatePassword,
  onDeleteAccount,
  onTestUniFiConnection,
  onChangeProfile,
  onChangePassword,
  onChangeDeletePassword,
}: SettingsProps) {
  const intl = useIntl();

  return (
    <div className="settings-page">
      <h2 className="settings-title">⚙️ {intl.formatMessage({ id: 'account.title', defaultMessage: 'Account settings' })}</h2>

      <form className="crud-panel" onSubmit={onUpdateProfile}>
        <div className="form-field">
          <label htmlFor="account-name">{intl.formatMessage({ id: 'auth.label.name', defaultMessage: 'Name' })}</label>
          <input
            id="account-name"
            className="crud-input"
            value={profileForm.name}
            onChange={(event) => onChangeProfile('name', event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="account-email">{intl.formatMessage({ id: 'auth.label.email', defaultMessage: 'Email' })}</label>
          <input
            id="account-email"
            className="crud-input"
            type="email"
            value={profileForm.email}
            onChange={(event) => onChangeProfile('email', event.target.value)}
            required
          />
        </div>
        <div className="crud-actions">
          <button className="crud-submit-btn" type="submit" disabled={busyKey === 'profile:update'}>
            {intl.formatMessage({ id: 'account.action.saveProfile', defaultMessage: 'Save profile' })}
          </button>
        </div>
      </form>

      <form className="crud-panel" onSubmit={onUpdatePassword}>
        <div className="form-field">
          <label htmlFor="current-password">{intl.formatMessage({ id: 'account.label.currentPassword', defaultMessage: 'Current password' })}</label>
          <input
            id="current-password"
            className="crud-input"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(event) => onChangePassword('currentPassword', event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="new-password">{intl.formatMessage({ id: 'account.label.newPassword', defaultMessage: 'New password' })}</label>
          <input
            id="new-password"
            className="crud-input"
            type="password"
            value={passwordForm.password}
            onChange={(event) => onChangePassword('password', event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="confirm-password">{intl.formatMessage({ id: 'account.label.confirmPassword', defaultMessage: 'Confirm password' })}</label>
          <input
            id="confirm-password"
            className="crud-input"
            type="password"
            value={passwordForm.passwordConfirmation}
            onChange={(event) => onChangePassword('passwordConfirmation', event.target.value)}
            required
          />
        </div>
        <div className="crud-actions">
          <button className="crud-submit-btn" type="submit" disabled={busyKey === 'profile:password'}>
            {intl.formatMessage({ id: 'account.action.updatePassword', defaultMessage: 'Update password' })}
          </button>
        </div>
      </form>

      <form className="crud-panel" onSubmit={onDeleteAccount}>
        <div className="form-field">
          <label htmlFor="delete-password">{intl.formatMessage({ id: 'account.label.deletePassword', defaultMessage: 'Confirm password to delete account' })}</label>
          <input
            id="delete-password"
            className="crud-input"
            type="password"
            value={deletePassword}
            onChange={(event) => onChangeDeletePassword(event.target.value)}
            required
          />
        </div>
        <div className="crud-actions">
          <button className="crud-delete-btn" type="submit" disabled={busyKey === 'profile:delete'}>
            {intl.formatMessage({ id: 'account.action.deleteAccount', defaultMessage: 'Delete account' })}
          </button>
        </div>
      </form>

      {isParent && (
        <div className="crud-panel">
          <h3>{intl.formatMessage({ id: 'account.unifi.title', defaultMessage: 'UniFi integration' })}</h3>
          <p>{intl.formatMessage({ id: 'account.unifi.description', defaultMessage: 'Test UniFi controller credentials and connectivity.' })}</p>
          <div className="crud-actions">
            <button
              className="crud-submit-btn"
              type="button"
              disabled={busyKey === 'unifi:test-connection'}
              onClick={() => void onTestUniFiConnection()}
            >
              {intl.formatMessage({ id: 'account.unifi.testConnection', defaultMessage: 'Test UniFi connection' })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
