import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import Devices from '../pages/Devices';

afterEach(cleanup);

describe('Devices', () => {
    it('lets a teen submit a device MAC and explains private address settings', () => {
        const onRegister = vi.fn().mockResolvedValue(true);
        render(
            <IntlProvider locale="en">
                <Devices devices={[]} isParent={false} busyKey="" onRegister={onRegister} onUnregister={vi.fn()} onApprove={vi.fn()} onReject={vi.fn()} />
            </IntlProvider>,
        );

        fireEvent.change(screen.getByLabelText('Device name'), { target: { value: 'Phone' } });
        fireEvent.change(screen.getByLabelText('MAC address'), { target: { value: 'aa:bb:cc:dd:ee:ff' } });
        fireEvent.click(screen.getByRole('button', { name: 'Request registration' }));

        expect(onRegister).toHaveBeenCalledWith('aa:bb:cc:dd:ee:ff', 'Phone');
        expect(screen.getByText(/turn off private or randomized MAC addresses/i)).toBeTruthy();
    });

    it('shows pending device approvals to parents', () => {
        const onApprove = vi.fn();
        render(
            <IntlProvider locale="en">
                <Devices
                    devices={[{ id: 1, macAddress: 'aa:bb:cc:dd:ee:ff', name: 'Phone', status: 'pending_approval', createdAt: null, user: { id: 2, name: 'Teen' } }]}
                    isParent
                    busyKey=""
                    onRegister={vi.fn()}
                    onUnregister={vi.fn()}
                    onApprove={onApprove}
                    onReject={vi.fn()}
                />
            </IntlProvider>,
        );

        expect(screen.getByText(/Teen/)).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Approve' }));
        expect(onApprove).toHaveBeenCalledWith(1);
    });
});
