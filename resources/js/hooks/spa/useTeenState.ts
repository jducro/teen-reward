import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload, TeenDraft } from '../../type';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type TeenStateOptions = {
    refresh: () => Promise<void>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useTeenState({
    refresh,
    setBusyKey,
    setPanelError,
    setNotice,
}: TeenStateOptions) {
    const saveTeen = useCallback(async (teenId: number | null, input: TeenDraft) => {
        const method = teenId === null ? 'POST' : 'PUT';
        const url = teenId === null ? '/api/teens' : `/api/teens/${teenId}`;
        const busyKey = teenId === null ? 'teen:create' : `teen:update:${teenId}`;
        const result = await runSpaAction({
            busyKey,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(url, {
                    method,
                    body: {
                        name: input.name,
                        email: input.email,
                        points_balance: input.pointsBalance,
                        password: teenId === null ? input.password : input.password || undefined,
                        password_confirmation: input.password
                            ? input.passwordConfirmation
                            : teenId === null
                                ? input.passwordConfirmation
                                : undefined,
                    },
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return true;
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const createTeen = useCallback((input: TeenDraft) => saveTeen(null, input), [saveTeen]);
    const updateTeen = useCallback((teenId: number, input: TeenDraft) => saveTeen(teenId, input), [saveTeen]);

    const deleteTeen = useCallback(async (teenId: number) => {
        await runSpaAction({
            busyKey: `teen:delete:${teenId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            rethrowError: true,
            action: async () => {
                const response = (await request(`/api/teens/${teenId}`, {
                    method: 'DELETE',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();
            },
        });
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    return {
        createTeen,
        updateTeen,
        deleteTeen,
    };
}
