import { motion } from 'framer-motion';
import type { LoginProps } from '../type';

export default function Login({ authForm, busy, error, onChange, onSubmit }: LoginProps) {
    return (
        <div className="page">
            <div className="dashboard login-page">
                <motion.p
                    className="greeting"
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    Salut petit ninja 👋
                </motion.p>
                <motion.h1
                    className="username"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    Connexion
                </motion.h1>

                <motion.div
                    className="balance-card login-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <p className="balance-label">Compte teen-reward</p>
                    <div className="balance-amount">🔐</div>
                    <form className="login-form" onSubmit={onSubmit}>
                        <div className="form-field">
                            <label htmlFor="login-email">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                value={authForm.email}
                                onChange={(event) => onChange('email', event.target.value)}
                                className="login-input"
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="login-password">Mot de passe</label>
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
                            {busy ? 'Connexion…' : 'Se connecter'}
                        </button>
                    </form>
                </motion.div>

                {error ? <p className="login-error">{error}</p> : null}

                <motion.div
                    className="bonus-banner"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    🧪 Test local : teen@example.com / password
                </motion.div>
            </div>
        </div>
    );
}
