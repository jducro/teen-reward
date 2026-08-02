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
        createChore,
        updateChore,
        deleteChore,
        createReward,
        updateReward,
        deleteReward,
        createTeen,
        updateTeen,
        redeemReward,
        updateAuthForm,
    };
}
