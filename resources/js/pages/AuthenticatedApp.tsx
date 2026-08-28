import { AnimatePresence, motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import type { AppPage, BootstrapPayload, ChoreDraft, RedeemResult, RewardDraft, TeenDraft, User } from '../type';
import Dashboard from './Dashboard';
import Shop from './Shop';
import Teens from './Teens';
import Tasks from './Tasks';

type AuthenticatedAppProps = {
    page: AppPage;
    setPage: (page: AppPage) => void;
    notice: string;
    panelError: string;
    busyKey: string;
    payload: BootstrapPayload;
    user: User;
    coins: number;
    level: number;
    isTeen: boolean;
    isParent: boolean;
    onLogout: () => Promise<void>;
    onClaim: (choreId: number) => Promise<boolean>;
    onCreateChore: (input: ChoreDraft) => Promise<boolean>;
    onUpdateChore: (choreId: number, input: ChoreDraft) => Promise<boolean>;
    onDeleteChore: (choreId: number) => Promise<boolean>;
    onRedeemReward: (rewardId: number) => Promise<RedeemResult>;
    onCreateReward: (input: RewardDraft) => Promise<boolean>;
    onUpdateReward: (rewardId: number, input: RewardDraft) => Promise<boolean>;
    onDeleteReward: (rewardId: number) => Promise<boolean>;
    onCreateTeen: (input: TeenDraft) => Promise<boolean>;
    onUpdateTeen: (teenId: number, input: TeenDraft) => Promise<boolean>;
    onDeleteTeen: (teenId: number) => Promise<void>;
};

export default function AuthenticatedApp({
    page,
    setPage,
    notice,
    panelError,
    busyKey,
    payload,
    user,
    coins,
    level,
    isTeen,
    isParent,
    onLogout,
    onClaim,
    onCreateChore,
    onUpdateChore,
    onDeleteChore,
    onRedeemReward,
    onCreateReward,
    onUpdateReward,
    onDeleteReward,
    onCreateTeen,
    onUpdateTeen,
    onDeleteTeen,
}: AuthenticatedAppProps) {
    return (
        <>
            {(notice || panelError) && (
                <div className={`app-alert ${panelError ? 'error' : 'success'}`}>
                    {panelError || notice}
                </div>
            )}

            <div className="app-actions">
                <button
                    type="button"
                    className="logout-btn"
                    onClick={() => void onLogout()}
                    disabled={busyKey === 'logout'}
                >
                    Déconnexion
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={page}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="page"
                >
                    {page === 'home' && (
                        <Dashboard
                            coins={coins}
                            level={level}
                            userName={user.name}
                            role={user.role}
                            pendingClaims={payload.stats.pendingClaims}
                            availableChores={payload.stats.availableChores}
                        />
                    )}

                    {page === 'tasks' && (
                        <Tasks
                            chores={payload.chores}
                            claims={payload.claims}
                            coins={coins}
                            busyKey={busyKey}
                            canClaim={isTeen}
                            canManage={isParent}
                            onClaim={onClaim}
                            onCreate={onCreateChore}
                            onUpdate={onUpdateChore}
                            onDelete={onDeleteChore}
                        />
                    )}

                    {page === 'shop' && (
                        <Shop
                            rewards={payload.rewards}
                            coins={coins}
                            canRedeem={isTeen}
                            canManage={isParent}
                            busyKey={busyKey}
                            onRedeem={onRedeemReward}
                            onCreate={onCreateReward}
                            onUpdate={onUpdateReward}
                            onDelete={onDeleteReward}
                        />
                    )}

                    {page === 'teens' && (
                        <Teens
                            teens={payload.teens}
                            busyKey={busyKey}
                            canManage={isParent}
                            onCreateTeen={onCreateTeen}
                            onUpdateTeen={onUpdateTeen}
                            onDeleteTeen={onDeleteTeen}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
            <Navbar setPage={setPage} activePage={page} isParent={isParent} />
        </>
    );
}
