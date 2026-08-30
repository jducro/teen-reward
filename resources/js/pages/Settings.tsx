import type { SettingsProps } from '../type';

export default function Settings({
  busyKey,
  profileForm,
  passwordForm,
  deletePassword,
  onUpdateProfile,
  onUpdatePassword,
  onDeleteAccount,
  onChangeProfile,
  onChangePassword,
  onChangeDeletePassword,
}: SettingsProps) {
  return (
    <div className="settings-page">
      <h2 className="settings-title">⚙️ Account settings</h2>

      <form className="crud-panel" onSubmit={onUpdateProfile}>
        <div className="form-field">
          <label htmlFor="account-name">Name</label>
          <input
            id="account-name"
            className="crud-input"
            value={profileForm.name}
            onChange={(event) => onChangeProfile('name', event.target.value)}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="account-email">Email</label>
          <input
            id="account-email"
            className="crud-input"
            type="email"
            value={profileForm.email}
            onChange={(event) => onChangeProfile('email', event.target.value)}
            required
          />
        </div>
        <button className="crud-submit-btn" type="submit" disabled={busyKey === 'profile:update'}>
          Save profile
        </button>
      </form>

      <form className="crud-panel" onSubmit={onUpdatePassword}>
        <div className="form-field">
          <label htmlFor="current-password">Current password</label>
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
          <label htmlFor="new-password">New password</label>
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
          <label htmlFor="confirm-password">Confirm password</label>
          <input
            id="confirm-password"
            className="crud-input"
            type="password"
            value={passwordForm.passwordConfirmation}
            onChange={(event) => onChangePassword('passwordConfirmation', event.target.value)}
            required
          />
        </div>
        <button className="crud-submit-btn" type="submit" disabled={busyKey === 'profile:password'}>
          Update password
        </button>
      </form>

      <form className="crud-panel" onSubmit={onDeleteAccount}>
        <div className="form-field">
          <label htmlFor="delete-password">Confirm password to delete account</label>
          <input
            id="delete-password"
            className="crud-input"
            type="password"
            value={deletePassword}
            onChange={(event) => onChangeDeletePassword(event.target.value)}
            required
          />
        </div>
        <button className="crud-delete-btn" type="submit" disabled={busyKey === 'profile:delete'}>
          Delete account
        </button>
      </form>
    </div>
  );
}
