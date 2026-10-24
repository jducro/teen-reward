import { useIntl } from 'react-intl';
import { Passkeys } from '@laravel/passkeys';
import type { SettingsProps } from '../type';

export default function Settings({
  busyKey,
  passkeys,
  isParent,
  profileForm,
  passwordForm,
  deletePassword,
  onUpdateProfile,
  onUpdatePassword,
  onDeleteAccount,
  onTestUniFiConnection,
  onRegisterPasskey,
  onDeletePasskey,
  passkeyName,
  passkeyPassword,
  onChangePasskeyName,
  onChangePasskeyPassword,
  onChangeProfile,
  onChangePassword,
  onChangeDeletePassword,
}: SettingsProps) {
  const intl = useIntl();
  const passkeySupported = Passkeys.isSupported();

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

      {
        <div className="crud-panel">
          <h3>{intl.formatMessage({ id: 'account.passkeys.title', defaultMessage: 'Face ID and passkeys' })}</h3>
          <p>{intl.formatMessage({ id: 'account.passkeys.description', defaultMessage: 'Add a passkey to sign in with Face ID on this device. Keep your password as a fallback.' })}</p>
          {!passkeySupported && <p>{intl.formatMessage({ id: 'account.passkeys.secureContextRequired', defaultMessage: 'Passkeys require a supported browser and a secure HTTPS connection.' })}</p>}
          <div className="form-field">
            <label htmlFor="passkey-name">{intl.formatMessage({ id: 'account.passkeys.name', defaultMessage: 'Device name' })}</label>
            <input id="passkey-name" className="crud-input" value={passkeyName} onChange={(event) => onChangePasskeyName(event.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="passkey-current-password">{intl.formatMessage({ id: 'account.passkeys.password', defaultMessage: 'Confirm your current password' })}</label>
            <input id="passkey-current-password" className="crud-input" type="password" autoComplete="current-password" value={passkeyPassword} onChange={(event) => onChangePasskeyPassword(event.target.value)} />
          </div>
          <div className="crud-actions">
            <button className="crud-submit-btn" type="button" disabled={!passkeySupported || busyKey === 'passkey:register' || !passkeyName.trim() || !passkeyPassword} onClick={() => void onRegisterPasskey()}>
              {intl.formatMessage({ id: 'account.passkeys.add', defaultMessage: 'Add passkey' })}
            </button>
          </div>
          {passkeys.map((passkey) => (
            <div className="crud-actions" key={passkey.id}>
              <span>{passkey.name}</span>
              <button className="crud-delete-btn" type="button" disabled={busyKey === `passkey:delete:${passkey.id}`} onClick={() => void onDeletePasskey(passkey.id)}>
                {intl.formatMessage({ id: 'account.passkeys.remove', defaultMessage: 'Remove' })}
              </button>
            </div>
          ))}
        </div>
      }

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
