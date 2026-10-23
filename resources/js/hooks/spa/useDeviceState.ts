import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { apiRequest } from '../../spa/api';
import type { ApiSuccessPayload } from '../../type';
import { runSpaAction } from './runSpaAction';

const request = apiRequest as (url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>;

type DeviceStateOptions = {
    refresh: () => Promise<void>;
    setBusyKey: Dispatch<SetStateAction<string>>;
    setPanelError: Dispatch<SetStateAction<string>>;
    setNotice: Dispatch<SetStateAction<string>>;
};

export function useDeviceState({ refresh, setBusyKey, setPanelError, setNotice }: DeviceStateOptions) {
    const run = useCallback(async (key: string, url: string, method: string, body?: unknown) => runSpaAction({
        busyKey: key,
        setBusyKey,
        setPanelError,
        setNotice,
        action: async () => {
            const response = await request(url, { method, body }) as ApiSuccessPayload;
            setNotice(response.message ?? '');
            await refresh();
            return true;
        },
    }), [refresh, setBusyKey, setPanelError, setNotice]);

    const registerDevice = useCallback((macAddress: string, name: string) => run('device:create', '/api/devices', 'POST', {
        mac_address: macAddress,
        name: name || undefined,
    }), [run]);

    const unregisterDevice = useCallback((deviceId: number) => run(`device:delete:${deviceId}`, `/api/devices/${deviceId}`, 'DELETE'), [run]);
    const approveDevice = useCallback((deviceId: number) => run(`device:approve:${deviceId}`, `/api/devices/${deviceId}/approve`, 'PUT'), [run]);
    const rejectDevice = useCallback((deviceId: number) => run(`device:reject:${deviceId}`, `/api/devices/${deviceId}/reject`, 'PUT'), [run]);

    return { registerDevice, unregisterDevice, approveDevice, rejectDevice };
}
