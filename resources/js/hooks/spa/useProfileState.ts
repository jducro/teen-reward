import { useCallback, useEffect, useState } from 'react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload, User } from '../../type';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type ProfileStateOptions = {
    user: User | null;
    refresh: () => Promise<void>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useProfileState({
    user,
    refresh,
    setBusyKey,
    setPanelError,
    setNotice,
}: ProfileStateOptions) {
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

    useEffect(() => {
        if (!user) {
            return;
        }

        setProfileForm({
            name: user.name,
            email: user.email,
        });
    }, [user]);

    const updateProfile = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await runSpaAction({
            busyKey: 'profile:update',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request('/api/profile', {
                    method: 'PATCH',
                    body: profileForm,
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                await refresh();
            },
        });
    }, [profileForm, refresh, setBusyKey, setNotice, setPanelError]);

    const updatePassword = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await runSpaAction({
            busyKey: 'profile:password',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
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
            },
        });
    }, [passwordForm, refresh, setBusyKey, setNotice, setPanelError]);

    const deleteAccount = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        await runSpaAction({
            busyKey: 'profile:delete',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request('/api/profile', {
                    method: 'DELETE',
                    body: { password: deletePassword },
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
                setDeletePassword('');
                await refresh();
            },
        });
    }, [deletePassword, refresh, setBusyKey, setNotice, setPanelError]);

    const testUniFiConnection = useCallback(async () => {
        await runSpaAction({
            busyKey: 'unifi:test-connection',
            setBusyKey,
            setPanelError,
            setNotice,
            action: async () => {
                const response = (await request('/api/unifi/test-connection', {
                    method: 'POST',
                })) as ApiSuccessPayload;

                setNotice(response.message ?? '');
            },
        });
    }, [setBusyKey, setNotice, setPanelError]);

    const updateProfileField = useCallback((field: 'name' | 'email', value: string) => {
        setProfileForm((current) => ({ ...current, [field]: value }));
    }, []);

    const updatePasswordField = useCallback((
        field: 'currentPassword' | 'password' | 'passwordConfirmation',
        value: string,
    ) => {
        setPasswordForm((current) => ({ ...current, [field]: value }));
    }, []);

    return {
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
