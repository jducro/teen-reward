import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import AppHeader from './components/AppHeader';
import LoadingScreen from './components/LoadingScreen';
import AuthScreen from './sections/AuthScreen';
import DashboardScreen from './sections/DashboardScreen';
import { apiRequest } from './spa/api';
import { defaultAuthForm, defaultChoreForm, defaultPasswordForm, defaultRewardForm } from './spa/constants';

function App() {
    const intl = useIntl();
    const [bootstrapped, setBootstrapped] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState('login');
    const [authForm, setAuthForm] = useState(defaultAuthForm);
    const [authErrors, setAuthErrors] = useState({});
    const [panelError, setPanelError] = useState('');
    const [notice, setNotice] = useState('');
    const [busyKey, setBusyKey] = useState('');
    const [choreForm, setChoreForm] = useState(defaultChoreForm);
    const [editingChoreId, setEditingChoreId] = useState(null);
    const [choreErrors, setChoreErrors] = useState({});
    const [rewardForm, setRewardForm] = useState(defaultRewardForm);
    const [editingRewardId, setEditingRewardId] = useState(null);
    const [rewardErrors, setRewardErrors] = useState({});
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [profileErrors, setProfileErrors] = useState({});
    const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteErrors, setDeleteErrors] = useState({});

    const refresh = useCallback(async () => {
        setLoading(true);

        try {
            const payload = await apiRequest('/api/bootstrap');
            setBootstrapped(payload);
            setProfileForm({
                name: payload.user?.name ?? '',
                email: payload.user?.email ?? '',
            });
        } catch (error) {
            setPanelError(resolveErrorMessage(error, intl));
        } finally {
            setLoading(false);
        }
    }, [intl]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const user = bootstrapped?.user ?? null;
    const chores = bootstrapped?.chores ?? [];
    const claims = bootstrapped?.claims ?? [];
    const rewards = bootstrapped?.rewards ?? [];
    const redemptions = bootstrapped?.redemptions ?? [];
    const stats = bootstrapped?.stats ?? {};

    const summaryCards = useMemo(() => [
        {
            label: intl.formatMessage({
                id: 'summary.pointsBalance',
                defaultMessage: 'Points balance',
            }),
            value: user ? user.pointsBalance : 0,
        },
        {
            label: intl.formatMessage(
                user?.role === 'parent'
                    ? {
                        id: 'summary.pendingApprovals',
                        defaultMessage: 'Pending approvals',
                    }
                    : {
                        id: 'summary.availableChores',
                        defaultMessage: 'Available chores',
                    },
            ),
            value: user?.role === 'parent' ? stats.pendingClaims ?? 0 : stats.availableChores ?? 0,
        },
        {
            label: intl.formatMessage({
                id: 'summary.rewardsRedeemed',
                defaultMessage: 'Rewards redeemed',
            }),
            value: stats.rewardsRedeemed ?? 0,
        },
    ], [intl, stats, user]);

    async function runAction(key, action, { onSuccess, onError } = {}) {
        setBusyKey(key);
        setPanelError('');
        setNotice('');

        try {
            const payload = await action();

            if (onSuccess) {
                onSuccess(payload);
            }

            await refresh();

            if (payload?.message) {
                setNotice(payload.message);
            }
        } catch (error) {
            if (onError) {
                onError(error);
            } else {
                setPanelError(resolveErrorMessage(error, intl));
            }
        } finally {
            setBusyKey('');
        }
    }

    function updateForm(setter, field, value) {
        setter((current) => ({ ...current, [field]: value }));
    }

    function beginEditChore(chore) {
        setEditingChoreId(chore.id);
        setChoreForm({
            title: chore.title,
            description: chore.description ?? '',
            points_value: chore.pointsValue,
            recurrence_type: chore.recurrenceType,
            recurrence_interval: chore.recurrenceInterval ?? 1,
            recurrence_unit: chore.recurrenceUnit ?? 'weeks',
            active: chore.active,
        });
        setChoreErrors({});
    }

    function resetChoreForm() {
        setEditingChoreId(null);
        setChoreForm(defaultChoreForm);
        setChoreErrors({});
    }

    function toggleAuthMode(mode) {
        setAuthMode(mode);
        setAuthErrors({});
        setPanelError('');
        setAuthForm(defaultAuthForm);
    }

    async function submitAuth(event) {
        event.preventDefault();
        setAuthErrors({});

        await runAction(
            `auth:${authMode}`,
            () =>
                apiRequest(authMode === 'login' ? '/api/login' : '/api/register', {
                    method: 'POST',
                    body:
                        authMode === 'login'
                            ? {
                                email: authForm.email,
                                password: authForm.password,
                            }
                            : authForm,
                }),
            {
                onSuccess: () => {
                    setAuthForm(defaultAuthForm);
                },
                onError: (error) => {
                    setAuthErrors(error.errors);
                    setPanelError(error.message);
                },
            },
        );
    }

    async function submitChore(event) {
        event.preventDefault();
        setChoreErrors({});

        const method = editingChoreId ? 'PUT' : 'POST';
        const url = editingChoreId ? `/api/chores/${editingChoreId}` : '/api/chores';

        await runAction(
            editingChoreId ? `chore:update:${editingChoreId}` : 'chore:create',
            () => apiRequest(url, { method, body: choreForm }),
            {
                onSuccess: () => resetChoreForm(),
                onError: (error) => {
                    setChoreErrors(error.errors);
                    setPanelError(error.message);
                },
            },
        );
    }

    async function submitReward(event) {
        event.preventDefault();
        setRewardErrors({});

        const method = editingRewardId ? 'PUT' : 'POST';
        const url = editingRewardId ? `/api/rewards/${editingRewardId}` : '/api/rewards';

        // Convert camelCase to snake_case for API
        const body = {
            name: rewardForm.name,
            points_cost: rewardForm.pointsCost,
            duration_minutes: rewardForm.durationMinutes,
            emoji: rewardForm.emoji || '🎁',
        };

        await runAction(
            editingRewardId ? `reward:update:${editingRewardId}` : 'reward:create',
            () => apiRequest(url, { method, body }),
            {
                onSuccess: () => {
                    setEditingRewardId(null);
                    setRewardForm(defaultRewardForm);
                },
                onError: (error) => {
                    setRewardErrors(error.errors);
                    setPanelError(error.message);
                },
            },
        );
    }

    async function updateProfile(event) {
        event.preventDefault();
        setProfileErrors({});

        await runAction(
            'profile:update',
            () => apiRequest('/api/profile', { method: 'PATCH', body: profileForm }),
            {
                onError: (error) => {
                    setProfileErrors(error.errors);
                    setPanelError(error.message);
                },
            },
        );
    }

    async function updatePassword(event) {
        event.preventDefault();
        setPasswordErrors({});

        await runAction(
            'profile:password',
            () => apiRequest('/api/profile/password', { method: 'PUT', body: passwordForm }),
            {
                onSuccess: () => {
                    setPasswordForm(defaultPasswordForm);
                },
                onError: (error) => {
                    setPasswordErrors(error.errors);
                    setPanelError(error.message);
                },
            },
        );
    }

    async function deleteAccount(event) {
        event.preventDefault();
        setDeleteErrors({});

        await runAction(
            'profile:delete',
            () => apiRequest('/api/profile', { method: 'DELETE', body: { password: deletePassword } }),
            {
                onSuccess: () => {
                    setDeletePassword('');
                    setBootstrapped((current) => ({ ...(current ?? {}), user: null }));
                },
                onError: (error) => {
                    setDeleteErrors(error.errors);
                    setPanelError(error.message);
                },
            },
        );
    }

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(180deg,_#020617,_#0f172a)]">
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                <AppHeader user={user} notice={notice} panelError={panelError} />

                <AnimatePresence mode="wait">
                    {user ? (
                        <DashboardScreen
                            beginEditChore={beginEditChore}
                            bootstrapped={bootstrapped}
                            busyKey={busyKey}
                            choreErrors={choreErrors}
                            choreForm={choreForm}
                            deleteAccount={deleteAccount}
                            deleteErrors={deleteErrors}
                            deletePassword={deletePassword}
                            editingChoreId={editingChoreId}
                            editingRewardId={editingRewardId}
                            passwordErrors={passwordErrors}
                            passwordForm={passwordForm}
                            profileErrors={profileErrors}
                            profileForm={profileForm}
                            rewardErrors={rewardErrors}
                            rewardForm={rewardForm}
                            resetChoreForm={resetChoreForm}
                            runAction={runAction}
                            setChoreForm={setChoreForm}
                            setRewardForm={setRewardForm}
                            setDeletePassword={setDeletePassword}
                            setPasswordForm={setPasswordForm}
                            setProfileForm={setProfileForm}
                            submitChore={submitChore}
                            submitReward={submitReward}
                            summaryCards={summaryCards}
                            updateForm={updateForm}
                            updatePassword={updatePassword}
                            updateProfile={updateProfile}
                            user={user}
                        />
                    ) : (
                        <AuthScreen
                            authMode={authMode}
                            authErrors={authErrors}
                            authForm={authForm}
                            busyKey={busyKey}
                            setAuthForm={setAuthForm}
                            submitAuth={submitAuth}
                            toggleAuthMode={toggleAuthMode}
                            updateForm={updateForm}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function resolveErrorMessage(error, intl) {
    return error?.message ?? intl.formatMessage({
        id: 'errors.generic',
        defaultMessage: 'Something went wrong.',
    });
}

export default App;
