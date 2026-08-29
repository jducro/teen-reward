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
                <AuthenticatedApp
                    page={app.page}
                    setPage={app.setPage}
                    notice={app.notice}
                    panelError={app.panelError}
                    busyKey={app.busyKey}
                    payload={app.payload}
                    user={app.user}
                    coins={app.coins}
                    level={app.level}
                    isTeen={app.isTeen}
                    isParent={app.isParent}
                    onLogout={app.logout}
                    onClaim={app.claimChore}
                    onApproveClaim={app.approveClaim}
                    onRejectClaim={app.rejectClaim}
                    onCreateChore={app.createChore}
                    onUpdateChore={app.updateChore}
                    onDeleteChore={app.deleteChore}
                    onRedeemReward={app.redeemReward}
                    onCreateReward={app.createReward}
                    onUpdateReward={app.updateReward}
                    onDeleteReward={app.deleteReward}
                    onCreateTeen={app.createTeen}
                    onUpdateTeen={app.updateTeen}
                    onDeleteTeen={app.deleteTeen}
                    profileForm={app.profileForm}
                    passwordForm={app.passwordForm}
                    deletePassword={app.deletePassword}
                    onUpdateProfile={app.updateProfile}
                    onUpdatePassword={app.updatePassword}
                    onDeleteAccount={app.deleteAccount}
                    onChangeProfile={app.updateProfileField}
                    onChangePassword={app.updatePasswordField}
                    onChangeDeletePassword={app.setDeletePassword}
                />
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
