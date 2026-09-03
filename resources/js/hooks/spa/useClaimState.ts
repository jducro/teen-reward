import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload } from '../../type';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type ClaimStateOptions = {
    refresh: () => Promise<void>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useClaimState({
    refresh,
    setBusyKey,
    setPanelError,
    setNotice,
}: ClaimStateOptions) {
    const updateClaim = useCallback(async (claimId: number, action: 'approve' | 'reject') => {
        const result = await runSpaAction({
            busyKey: `claim:${action}:${claimId}`,
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request(`/api/claims/${claimId}/${action}`, {
                    method: 'POST',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();

                return true;
            },
        });

        return result ?? false;
    }, [refresh, setBusyKey, setNotice, setPanelError]);

    const approveClaim = useCallback((claimId: number) => updateClaim(claimId, 'approve'), [updateClaim]);
    const rejectClaim = useCallback((claimId: number) => updateClaim(claimId, 'reject'), [updateClaim]);

    return {
        approveClaim,
        rejectClaim,
    };
}
