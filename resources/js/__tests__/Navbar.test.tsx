import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import Navbar from '../components/Navbar';

afterEach(cleanup);

function renderNavbar(isParent: boolean, pendingActionCount = 0) {
    return render(
        <IntlProvider locale="en" messages={{}}>
            <Navbar setPage={vi.fn()} activePage="home" isParent={isParent} pendingActionCount={pendingActionCount} />
        </IntlProvider>,
    );
}

describe('Navbar', () => {
    it('combines parent request and device approvals and shows their pending count', () => {
        renderNavbar(true, 4);

        expect(screen.getByRole('button', { name: 'To review, 4 items to review' })).toBeTruthy();
        expect(screen.getByText('4')).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Devices' })).toBeNull();
    });

    it('keeps the device page in teen navigation without a parent approval badge', () => {
        renderNavbar(false, 3);

        expect(screen.getByRole('button', { name: 'Devices' })).toBeTruthy();
        expect(screen.queryByText('3')).toBeNull();
    });
});
