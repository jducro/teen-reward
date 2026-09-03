import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload, ChoreDraft } from '../../type';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type ChoreStateOptions = {
    refresh: () => Promise<void>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useChoreState({
    refresh,
    setBusyKey,
    setPanelError,
    setNotice,
}: ChoreStateOptions) {
    const claimChore = useCallback(async (choreId: number) => {
        const result = await runSpaAction({
            busyKey: `claim:${choreId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(`/api/chores/${choreId}/claim`, {
                    method: 'POST',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return true;
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const claimChoreForTeen = useCallback(async (choreId: number, teenId: number) => {
        const result = await runSpaAction({
            busyKey: `claim-for-teen:${choreId}:${teenId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(`/api/chores/${choreId}/claim-for-teen`, {
                    method: 'POST',
                    body: { teen_id: teenId },
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return true;
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const createChore = useCallback(async (input: ChoreDraft) => {
        const result = await runSpaAction({
            busyKey: 'chore:create',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
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
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const updateChore = useCallback(async (choreId: number, input: ChoreDraft) => {
        const result = await runSpaAction({
            busyKey: `chore:update:${choreId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
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
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const deleteChore = useCallback(async (choreId: number) => {
        const result = await runSpaAction({
            busyKey: `chore:delete:${choreId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(`/api/chores/${choreId}`, {
                    method: 'DELETE',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return true;
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    return {
        claimChore,
        claimChoreForTeen,
        createChore,
        updateChore,
        deleteChore,
    };
}
