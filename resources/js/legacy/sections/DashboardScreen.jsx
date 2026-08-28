import { motion } from 'framer-motion';
import SummaryCards from '../components/SummaryCards';
import ActionCenter from './dashboard/ActionCenter';
import AccountSettingsPanel from './dashboard/AccountSettingsPanel';
import ChoreBoard from './dashboard/ChoreBoard';
import ParentChoreForm from './dashboard/ParentChoreForm';
import ParentRewardForm from './dashboard/ParentRewardForm';
import TeenActivityPanel from './dashboard/TeenActivityPanel';

function DashboardScreen({
    beginEditChore,
    bootstrapped,
    busyKey,
    choreErrors,
    choreForm,
    deleteAccount,
    deleteErrors,
    deletePassword,
    editingChoreId,
    editingRewardId,
    passwordErrors,
    passwordForm,
    profileErrors,
    profileForm,
    rewardErrors,
    rewardForm,
    resetChoreForm,
    runAction,
    setChoreForm,
    setRewardForm,
    setDeletePassword,
    setPasswordForm,
    setProfileForm,
    submitChore,
    submitReward,
    summaryCards,
    updateForm,
    updatePassword,
    updateProfile,
    user,
}) {
    const chores = bootstrapped?.chores ?? [];
    const claims = bootstrapped?.claims ?? [];
    const rewards = bootstrapped?.rewards ?? [];
    const redemptions = bootstrapped?.redemptions ?? [];

    return (
        <motion.main
            key="dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
        >
            <SummaryCards summaryCards={summaryCards} />

            {user.role === 'parent' && (
                <section className="grid gap-8 xl:grid-cols-[1fr,1fr]">
                    <ChoreBoard
                        busyKey={busyKey}
                        chores={chores}
                        editingChoreId={editingChoreId}
                        beginEditChore={beginEditChore}
                        resetChoreForm={resetChoreForm}
                        runAction={runAction}
                        user={user}
                    />

                    <ParentRewardForm
                        busyKey={busyKey}
                        rewardErrors={rewardErrors}
                        rewardForm={rewardForm}
                        editingRewardId={editingRewardId}
                        setRewardForm={setRewardForm}
                        submitReward={submitReward}
                        updateForm={updateForm}
                        rewards={rewards}
                        runAction={runAction}
                    />
                </section>
            )}

            {user.role === 'teen' && (
                <section className="grid gap-8 xl:grid-cols-[1.1fr,0.9fr]">
                    <ChoreBoard
                        busyKey={busyKey}
                        chores={chores}
                        editingChoreId={editingChoreId}
                        beginEditChore={beginEditChore}
                        resetChoreForm={resetChoreForm}
                        runAction={runAction}
                        user={user}
                    />

                    <TeenActivityPanel claims={claims} redemptions={redemptions} />
                </section>
            )}

            <section className="grid gap-8 xl:grid-cols-[1fr,0.9fr]">
                <ActionCenter
                    busyKey={busyKey}
                    claims={claims}
                    rewards={rewards}
                    runAction={runAction}
                    user={user}
                />
                <AccountSettingsPanel
                    busyKey={busyKey}
                    deleteAccount={deleteAccount}
                    deleteErrors={deleteErrors}
                    deletePassword={deletePassword}
                    passwordErrors={passwordErrors}
                    passwordForm={passwordForm}
                    profileErrors={profileErrors}
                    profileForm={profileForm}
                    runAction={runAction}
                    setDeletePassword={setDeletePassword}
                    setPasswordForm={setPasswordForm}
                    setProfileForm={setProfileForm}
                    updateForm={updateForm}
                    updatePassword={updatePassword}
                    updateProfile={updateProfile}
                />
            </section>
        </motion.main>
    );
}

export default DashboardScreen;
