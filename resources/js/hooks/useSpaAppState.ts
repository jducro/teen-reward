import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../legacy/spa/api';
import type { ApiSuccessPayload, AppPage, BootstrapPayload, ChoreDraft, RewardDraft, TeenDraft } from '../type';
import { EMPTY_PAYLOAD, INITIAL_AUTH_FORM, levelFromCoins, resolveErrorMessage } from '../spa/utils';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

export function useSpaAppState() {
    const [page, setPage] = useState<AppPage>('home');
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState('');
    const [notice, setNotice] = useState('');
    const [panelError, setPanelError] = useState('');
    const [payload, setPayload] = useState<BootstrapPayload>(EMPTY_PAYLOAD);
    const [authForm, setAuthForm] = useState(INITIAL_AUTH_FORM);
    const [profileForm, setProfileForm] = useState({
        name: '',
        email: '',
    });
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        password: '',
        passwordConfirmation: '',
    });
    const [deletePassword, setDeletePassword] = useState('');

    const refresh = useCallback(async () => {
        setLoading(true);

        try {
            const nextPayload = (await request('/api/bootstrap')) as BootstrapPayload;
            setPayload({
                ...EMPTY_PAYLOAD,
                ...nextPayload,
            });
            setPanelError('');
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const user = payload.user;
    const isTeen = user?.role === 'teen';
    const isParent = user?.role === 'parent';
    const coins = user?.pointsBalance ?? 0;
    const level = useMemo(() => levelFromCoins(coins), [coins]);

    useEffect(() => {
        if (!user) {
            return;
        }

        setProfileForm({
            name: user.name,
            email: user.email,
        });
    }, [user]);

    async function login(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusyKey('login');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/login', {
                method: 'POST',
                body: authForm,
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            setAuthForm(INITIAL_AUTH_FORM);
            await refresh();
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setBusyKey('');
        }
    }

    async function logout() {
        setBusyKey('logout');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/logout', {
                method: 'POST',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            setPage('home');
            await refresh();
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setBusyKey('');
        }
    }

    async function claimChore(choreId: number) {
        setBusyKey(`claim:${choreId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/chores/${choreId}/claim`, {
                method: 'POST',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();
            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function approveClaim(claimId: number) {
        setBusyKey(`claim:approve:${claimId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/claims/${claimId}/approve`, {
                method: 'POST',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function rejectClaim(claimId: number) {
        setBusyKey(`claim:reject:${claimId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/claims/${claimId}/reject`, {
                method: 'POST',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function createChore(input: ChoreDraft) {
        setBusyKey('chore:create');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/chores', {
                method: 'POST',
                body: {
                    title: input.title,
                    description: input.description,
                    points_value: input.pointsValue,
                    emoji: input.emoji,
                    recurrence_type: 'none',
                    active: true,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function updateChore(choreId: number, input: ChoreDraft) {
        setBusyKey(`chore:update:${choreId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/chores/${choreId}`, {
                method: 'PUT',
                body: {
                    title: input.title,
                    description: input.description,
                    points_value: input.pointsValue,
                    emoji: input.emoji,
                    recurrence_type: 'none',
                    active: true,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function deleteChore(choreId: number) {
        setBusyKey(`chore:delete:${choreId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/chores/${choreId}`, {
                method: 'DELETE',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function createReward(input: RewardDraft) {
        setBusyKey('reward:create');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/rewards', {
                method: 'POST',
                body: {
                    name: input.name,
                    points_cost: input.pointsCost,
                    duration_minutes: input.durationMinutes,
                    emoji: input.emoji,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function updateReward(rewardId: number, input: RewardDraft) {
        setBusyKey(`reward:update:${rewardId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/rewards/${rewardId}`, {
                method: 'PUT',
                body: {
                    name: input.name,
                    type: input.type,
                    points_cost: input.pointsCost,
                    duration_minutes: input.durationMinutes,
                    emoji: input.emoji,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function deleteReward(rewardId: number) {
        setBusyKey(`reward:delete:${rewardId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/rewards/${rewardId}`, {
                method: 'DELETE',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function createTeen(input: TeenDraft) {
        setBusyKey('teen:create');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/teens', {
                method: 'POST',
                body: {
                    name: input.name,
                    email: input.email,
                    points_balance: input.pointsBalance,
                    password: input.password,
                    password_confirmation: input.passwordConfirmation,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function updateTeen(teenId: number, input: TeenDraft) {
        setBusyKey(`teen:update:${teenId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/teens/${teenId}`, {
                method: 'PUT',
                body: {
                    name: input.name,
                    email: input.email,
                    points_balance: input.pointsBalance,
                    password: input.password || undefined,
                    password_confirmation: input.password ? input.passwordConfirmation : undefined,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();

            return true;
        } catch (error) {
            setPanelError(resolveErrorMessage(error));

            return false;
        } finally {
            setBusyKey('');
        }
    }

    async function deleteTeen(teenId: number) {
        setBusyKey(`teen:delete:${teenId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/teens/${teenId}`, {
                method: 'DELETE',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
            throw error;
        } finally {
            setBusyKey('');
        }
    }

    async function redeemReward(rewardId: number) {
        setBusyKey(`redeem:${rewardId}`);
        setPanelError('');
        setNotice('');

        try {
            const response = (await request(`/api/rewards/${rewardId}/redeem`, {
                method: 'POST',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();
            return {
                ok: true,
                voucherCode: response.voucherCode ?? '',
            };
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
            return {
                ok: false,
                voucherCode: '',
            };
        } finally {
            setBusyKey('');
        }
    }

    async function updateProfile(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusyKey('profile:update');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/profile', {
                method: 'PATCH',
                body: {
                    name: profileForm.name,
                    email: profileForm.email,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setBusyKey('');
        }
    }

    async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusyKey('profile:password');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/profile/password', {
                method: 'PUT',
                body: {
                    current_password: passwordForm.currentPassword,
                    password: passwordForm.password,
                    password_confirmation: passwordForm.passwordConfirmation,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            setPasswordForm({
                currentPassword: '',
                password: '',
                passwordConfirmation: '',
            });
            await refresh();
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setBusyKey('');
        }
    }

    async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusyKey('profile:delete');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/profile', {
                method: 'DELETE',
                body: {
                    password: deletePassword,
                },
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            setDeletePassword('');
            await refresh();
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setBusyKey('');
        }

    }

    async function testUniFiConnection() {
        setBusyKey('unifi:test-connection');
        setPanelError('');
        setNotice('');

        try {
            const response = (await request('/api/unifi/test-connection', {
                method: 'POST',
            })) as ApiSuccessPayload;
            setNotice(response.message ?? '');
        } catch (error) {
            setPanelError(resolveErrorMessage(error));
        } finally {
            setBusyKey('');
        }
    }

    function updateProfileField(field: 'name' | 'email', value: string) {
        setProfileForm((current) => ({ ...current, [field]: value }));
    }

    function updatePasswordField(field: 'currentPassword' | 'password' | 'passwordConfirmation', value: string) {
        setPasswordForm((current) => ({ ...current, [field]: value }));
    }

    function updateAuthForm(field: 'email' | 'password', value: string) {
        setAuthForm((current) => ({ ...current, [field]: value }));
    }

    return {
        page,
        setPage,
        loading,
        busyKey,
        notice,
        panelError,
        payload,
        authForm,
        user,
        isTeen,
        isParent,
        coins,
        level,
        login,
        logout,
        claimChore,
        approveClaim,
        rejectClaim,
        createChore,
        updateChore,
        deleteChore,
        createReward,
        updateReward,
        deleteReward,
        createTeen,
        updateTeen,
        deleteTeen,
        redeemReward,
        updateAuthForm,
        profileForm,
        passwordForm,
        deletePassword,
        updateProfile,
        updatePassword,
        deleteAccount,
        testUniFiConnection,
        updateProfileField,
        updatePasswordField,
        setDeletePassword,
    };
}
