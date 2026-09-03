import { useCallback, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload, AuthForm, AppPage } from '../../type';
import { INITIAL_AUTH_FORM } from '../../spa/utils';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type AuthStateOptions = {
    refresh: () => Promise<void>;
    setPage: Dispatch<SetStateAction<AppPage>>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useAuthState({
    refresh,
    setPage,
    setBusyKey,
    setPanelError,
    setNotice,
}: AuthStateOptions) {
    const [authForm, setAuthForm] = useState<AuthForm>(INITIAL_AUTH_FORM);

    const login = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await runSpaAction({
            busyKey: 'login',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request('/api/login', {
                    method: 'POST',
                    body: authForm,
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                setAuthForm(INITIAL_AUTH_FORM);
                await refresh();
            },
        });
    }, [authForm, refresh, setBusyKey, setNotice, setPanelError]);

    const logout = useCallback(async () => {
        await runSpaAction({
            busyKey: 'logout',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request('/api/logout', {
                    method: 'POST',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                setPage('home');
                await refresh();
            },
        });
    }, [refresh, setBusyKey, setNotice, setPage, setPanelError]);

    const updateAuthForm = useCallback((field: keyof AuthForm, value: string) => {
        setAuthForm((current) => ({ ...current, [field]: value }));
    }, []);

    return {
        authForm,
        login,
        logout,
        updateAuthForm,
    };
}
