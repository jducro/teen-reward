import type { Dispatch, SetStateAction } from 'react';
import { resolveErrorMessage } from '../../spa/utils';

type SpaActionOptions<T> = {
    busyKey: string;
    action: () => Promise<T>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
    rethrowError?: boolean;
};

export async function runSpaAction<T>({
    busyKey,
    action,
    setBusyKey,
    setPanelError,
    setNotice,
    rethrowError = false,
}: SpaActionOptions<T>): Promise<T | null> {
    setBusyKey(busyKey);
    setPanelError('');
    setNotice('');

    try {
        return await action();
    } catch (error) {
        setPanelError(resolveErrorMessage(error));

        if (rethrowError) {
            throw error;
        }

        return null;
    } finally {
        setBusyKey('');
    }
}
