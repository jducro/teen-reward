import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../spa/api';
import type { AppPage, BootstrapPayload } from '../type';
import { EMPTY_PAYLOAD, levelFromCoins, resolveErrorMessage } from '../spa/utils';
import { useAuthState } from './spa/useAuthState';
import { useChoreState } from './spa/useChoreState';
import { useClaimState } from './spa/useClaimState';
import { useProfileState } from './spa/useProfileState';
import { useRewardState } from './spa/useRewardState';
import { useTeenState } from './spa/useTeenState';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

export function useSpaAppState() {
    const [page, setPage] = useState<AppPage>('home');
    const [loading, setLoading] = useState(true);
    const [busyKey, setBusyKey] = useState('');
    const [notice, setNotice] = useState('');
    const [panelError, setPanelError] = useState('');
    const [payload, setPayload] = useState<BootstrapPayload>(EMPTY_PAYLOAD);

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

    const auth = useAuthState({
        refresh,
        setPage,
        setBusyKey,
        setPanelError,
        setNotice,
    });
    const chores = useChoreState({
        refresh,
        setBusyKey,
        setPanelError,
        setNotice,
    });
    const claims = useClaimState({
        refresh,
        setBusyKey,
        setPanelError,
        setNotice,
    });
    const rewards = useRewardState({
        refresh,
        setBusyKey,
        setPanelError,
        setNotice,
    });
    const teens = useTeenState({
        refresh,
        setBusyKey,
        setPanelError,
        setNotice,
    });
    const profile = useProfileState({
        user,
        refresh,
        setBusyKey,
        setPanelError,
        setNotice,
    });

    return {
        page,
        setPage,
        loading,
        busyKey,
        notice,
        panelError,
        payload,
        user,
        isTeen,
        isParent,
        coins,
        level,
        ...auth,
        ...chores,
        ...claims,
        ...rewards,
        ...teens,
        ...profile,
    };
}

export type SpaAppState = ReturnType<typeof useSpaAppState>;
