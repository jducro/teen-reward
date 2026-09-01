import { motion } from 'framer-motion';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import SummaryCards from '../components/SummaryCards';
import ActionCenter from './dashboard/ActionCenter';
import AccountSettingsPanel from './dashboard/AccountSettingsPanel';
import ChoreBoard from './dashboard/ChoreBoard';
import ParentChoreForm from './dashboard/ParentChoreForm';
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
    passwordErrors,
    passwordForm,
    profileErrors,
    profileForm,
    resetChoreForm,
    runAction,
    setChoreForm,
    setDeletePassword,
    setPasswordForm,
    setProfileForm,
    submitChore,
    summaryCards,
    updateForm,
    updatePassword,
    updateProfile,
    user,
}) {
    const intl = useIntl();
    const [selectedTeenId, setSelectedTeenId] = useState(null);

    const chores = bootstrapped?.chores ?? [];
    const claims = bootstrapped?.claims ?? [];
    const rewards = bootstrapped?.rewards ?? [];
    const redemptions = bootstrapped?.redemptions ?? [];
    const teens = bootstrapped?.teens ?? [];
    const availableChoresByTeen = bootstrapped?.availableChoresByTeen ?? {};

    // For parent view: default to first teen if not selected
    const displayedTeenId = user.role === 'parent' && teens.length > 0
        ? selectedTeenId || teens[0].id
        : null;

    const selectedTeen = displayedTeenId
        ? teens.find(t => t.id === displayedTeenId)
        : null;

    // Filter data for selected teen if parent
    let displayedClaims = claims;
    let displayedRedemptions = redemptions;
    let availableChores = [];

    if (user.role === 'parent' && selectedTeen) {
        availableChores = availableChoresByTeen[selectedTeen.id] ?? [];
        displayedClaims = claims.filter(c => c.user?.id === selectedTeen.id);
        displayedRedemptions = redemptions.filter(r => r.user?.id === selectedTeen.id);
    }

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
                <section className="space-y-8">
                    {teens.length > 0 && (
                        <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
                            <label className="block text-sm font-medium text-slate-200">
                                {intl.formatMessage({
                                    id: 'parent.selectTeen',
                                    defaultMessage: 'View teen:',
                                })}
                            </label>
                            <select
                                value={displayedTeenId || ''}
                                onChange={(e) => setSelectedTeenId(Number(e.target.value))}
                                className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none"
                            >
                                {teens.map(teen => (
                                    <option key={teen.id} value={teen.id}>
                                        {teen.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {selectedTeen && (
                        <TeenActivityPanel
                            availableChores={availableChores}
                            busyKey={busyKey}
                            claims={displayedClaims}
                            isParentView
                            redemptions={displayedRedemptions}
                            runAction={runAction}
                            teen={selectedTeen}
                        />
                    )}

                    <div className="grid gap-8 xl:grid-cols-[1fr,1fr]">
                        <ChoreBoard
                            busyKey={busyKey}
                            chores={chores}
                            editingChoreId={editingChoreId}
                            beginEditChore={beginEditChore}
                            resetChoreForm={resetChoreForm}
                            runAction={runAction}
                            user={user}
                        />
                    </div>
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

                    <TeenActivityPanel
                        claims={displayedClaims}
                        redemptions={displayedRedemptions}
                    />
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
