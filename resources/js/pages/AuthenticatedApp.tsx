import { AnimatePresence, motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import Navbar from '../components/Navbar';
import type { SpaAppState } from '../hooks/useSpaAppState';
import Dashboard from './Dashboard';
import Activity from './Activity';
import Shop from './Shop';
import Settings from './Settings';
import Teens from './Teens';
import Tasks from './Tasks';

type AuthenticatedAppProps = {
    app: SpaAppState;
};

export default function AuthenticatedApp({ app }: AuthenticatedAppProps) {
    const intl = useIntl();

    // `app.user` is guaranteed non-null here: SpaApp only renders AuthenticatedApp once authenticated.
    if (!app.user) {
        return null;
    }

    return (
        <>
            {(app.notice || app.panelError) && (
                <div className={`app-alert ${app.panelError ? 'error' : 'success'}`}>
                    {app.panelError || app.notice}
                </div>
            )}

            <div className="app-actions">
                <button
                    type="button"
                    className="logout-btn"
                    onClick={() => void app.logout()}
                    disabled={app.busyKey === 'logout'}
                >
                    {intl.formatMessage({ id: 'auth.action.logout', defaultMessage: 'Log out' })}
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={app.page}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="page"
                >
                    {app.page === 'home' && (
                        <Dashboard
                            coins={app.coins}
                            level={app.level}
                            userName={app.user.name}
                            role={app.user.role}
                            pendingClaims={app.payload.stats.pendingClaims}
                            availableChores={app.payload.stats.availableChores}
                            rewardsRedeemed={app.payload.stats.rewardsRedeemed}
                        />
                    )}

                    {app.page === 'tasks' && (
                        <Tasks
                            chores={app.payload.chores}
                            claims={app.payload.claims}
                            coins={app.coins}
                            busyKey={app.busyKey}
                            canClaim={app.isTeen}
                            canManage={app.isParent}
                            teens={app.payload.teens}
                            availableChoresByTeen={app.payload.availableChoresByTeen}
                            onClaim={app.claimChore}
                            onClaimForTeen={app.claimChoreForTeen}
                            onApproveClaim={app.approveClaim}
                            onRejectClaim={app.rejectClaim}
                            onCreate={app.createChore}
                            onUpdate={app.updateChore}
                            onDelete={app.deleteChore}
                        />
                    )}

                    {app.page === 'shop' && (
                        <Shop
                            rewards={app.payload.rewards}
                            coins={app.coins}
                            canRedeem={app.isTeen}
                            canManage={app.isParent}
                            busyKey={app.busyKey}
                            onRedeem={app.redeemReward}
                            onCreate={app.createReward}
                            onUpdate={app.updateReward}
                            onDelete={app.deleteReward}
                        />
                    )}

                    {app.page === 'settings' && (
                        <Settings
                            busyKey={app.busyKey}
                            isParent={app.isParent}
                            profileForm={app.profileForm}
                            passwordForm={app.passwordForm}
                            deletePassword={app.deletePassword}
                            onUpdateProfile={app.updateProfile}
                            onUpdatePassword={app.updatePassword}
                            onDeleteAccount={app.deleteAccount}
                            onTestUniFiConnection={app.testUniFiConnection}
                            onChangeProfile={app.updateProfileField}
                            onChangePassword={app.updatePasswordField}
                            onChangeDeletePassword={app.setDeletePassword}
                        />
                    )}

                    {app.page === 'activity' && (
                        <Activity claims={app.payload.claimHistory} redemptions={app.payload.redemptions} />
                    )}

                    {app.page === 'teens' && (
                        <Teens
                            teens={app.payload.teens}
                            busyKey={app.busyKey}
                            canManage={app.isParent}
                            onCreateTeen={app.createTeen}
                            onUpdateTeen={app.updateTeen}
                            onDeleteTeen={app.deleteTeen}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
            <Navbar setPage={app.setPage} activePage={app.page} isParent={app.isParent} />
        </>
    );
}
