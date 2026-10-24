import { motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import { usePasskeyVerify } from '@laravel/passkeys/react';
import type { LoginProps } from '../type';

export default function Login({ authForm, busy, error, onChange, onSubmit }: LoginProps) {
    const intl = useIntl();
    const passkey = usePasskeyVerify({
        onSuccess: (response) => {
            if (response.redirect) {
                window.location.assign(response.redirect);
            }
        },
    });

    return (
        <div className="page">
            <div className="dashboard login-page">
                <motion.p
                    className="greeting"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {intl.formatMessage({ id: 'dashboard.greeting', defaultMessage: 'Hey little ninja 👋' })}
                </motion.p>
                <motion.h1
                    className="username"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    {intl.formatMessage({ id: 'auth.tab.login', defaultMessage: 'Sign in' })}
                </motion.h1>

                <motion.div
                    className="balance-card login-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="balance-label">{intl.formatMessage({ id: 'login.appLabel', defaultMessage: 'teen-reward account' })}</p>
                    <div className="balance-amount">🔐</div>
                    <form className="login-form" onSubmit={onSubmit}>
                        <div className="form-field">
                            <label htmlFor="login-email">{intl.formatMessage({ id: 'auth.label.email', defaultMessage: 'Email' })}</label>
                            <input
                                id="login-email"
                                type="email"
                                value={authForm.email}
                                onChange={(event) => onChange('email', event.target.value)}
                                className="login-input"
                                autoComplete="username webauthn"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="login-password">{intl.formatMessage({ id: 'auth.label.password', defaultMessage: 'Password' })}</label>
                            <input
                                id="login-password"
                                type="password"
                                value={authForm.password}
                                onChange={(event) => onChange('password', event.target.value)}
                                className="login-input"
                                autoComplete="current-password"
                                required
                            />
                        </div>
                        <button type="submit" className="primary-btn login-btn" disabled={busy}>
                            {busy
                                ? intl.formatMessage({ id: 'login.signingIn', defaultMessage: 'Signing in…' })
                                : intl.formatMessage({ id: 'auth.action.login', defaultMessage: 'Sign in' })}
                        </button>
                    </form>
                    {passkey.isSupported && (
                        <button
                            type="button"
                            className="login-btn passkey-login-btn"
                            onClick={() => void passkey.verify()}
                            disabled={passkey.isLoading || busy}
                        >
                            {passkey.isLoading
                                ? intl.formatMessage({ id: 'login.passkeyLoading', defaultMessage: 'Waiting for passkey…' })
                                : intl.formatMessage({ id: 'auth.action.passkey', defaultMessage: 'Continue with Face ID or passkey' })}
                        </button>
                    )}
                    {passkey.error && <p className="login-error">{intl.formatMessage({ id: 'login.passkeyError', defaultMessage: 'Passkey sign in failed. You can still use your password.' })}</p>}
                </motion.div>

                {error ? <p className="login-error">{error}</p> : null}

                {import.meta.env.DEV ? (
                    <motion.div
                        className="bonus-banner"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        {intl.formatMessage({ id: 'login.demoHint', defaultMessage: '🧪 Local test: teen@example.com / password' })}
                    </motion.div>
                ) : null}
            </div>
        </div>
    );
}
