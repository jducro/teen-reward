import LoadingPage from './components/LoadingPage';
import { useSpaAppState } from './hooks/useSpaAppState';
import AuthenticatedApp from './pages/AuthenticatedApp';
import Login from './pages/Login';

export default function App() {
    const app = useSpaAppState();

    return (
        <div className="app-container">
            {app.loading ? (
                <LoadingPage />
            ) : app.user ? (
                <AuthenticatedApp app={app} />
            ) : (
                <Login
                    authForm={app.authForm}
                    busy={app.busyKey === 'login'}
                    error={app.panelError}
                    onChange={app.updateAuthForm}
                    onSubmit={app.login}
                />
            )}
        </div>
    );
}
