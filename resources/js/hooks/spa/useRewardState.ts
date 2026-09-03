import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload, RedeemResult, RewardDraft } from '../../type';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type RewardStateOptions = {
    refresh: () => Promise<void>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useRewardState({
    refresh,
    setBusyKey,
    setPanelError,
    setNotice,
}: RewardStateOptions) {
    const redeemReward = useCallback(async (rewardId: number): Promise<RedeemResult> => {
        const result = await runSpaAction({
            busyKey: `redeem:${rewardId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(`/api/rewards/${rewardId}/redeem`, {
                    method: 'POST',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return {
                    ok: true,
                    voucherCode: response.voucherCode ?? '',
                };
            },
        });

        return result ?? {
            ok: false,
            voucherCode: '',
        };
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const saveReward = useCallback(async (rewardId: number | null, input: RewardDraft) => {
        const method = rewardId === null ? 'POST' : 'PUT';
        const url = rewardId === null ? '/api/rewards' : `/api/rewards/${rewardId}`;
        const busyKey = rewardId === null ? 'reward:create' : `reward:update:${rewardId}`;
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
                        type: input.type,
                        points_cost: input.pointsCost,
                        duration_minutes: input.durationMinutes,
                        emoji: input.emoji,
                    },
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return true;
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const createReward = useCallback((input: RewardDraft) => saveReward(null, input), [saveReward]);
    const updateReward = useCallback((rewardId: number, input: RewardDraft) => saveReward(rewardId, input), [saveReward]);

    const deleteReward = useCallback(async (rewardId: number) => {
        const result = await runSpaAction({
            busyKey: `reward:delete:${rewardId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(`/api/rewards/${rewardId}`, {
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
        redeemReward,
        createReward,
        updateReward,
        deleteReward,
    };
}
