import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import Tasks from '../pages/Tasks';
import type { Chore } from '../type';

afterEach(cleanup);

const chores: Chore[] = [
    { id: 1, title: 'Quick mission', description: null, pointsValue: 50, category: 'quick', emoji: '🧹' },
    { id: 2, title: 'Big mission', description: null, pointsValue: 5, category: 'big', emoji: '🧹' },
];

function renderTasks(canManage = false) {
    const onCreate = vi.fn().mockResolvedValue(true);
    render(
        <IntlProvider locale="en" messages={{}}>
            <Tasks
                chores={chores}
                claims={[]}
                coins={0}
                busyKey=""
                canClaim={!canManage}
                canManage={canManage}
                teens={[]}
                onClaim={vi.fn().mockResolvedValue(true)}
                onClaimForTeen={vi.fn().mockResolvedValue(true)}
                onApproveClaim={vi.fn().mockResolvedValue(true)}
                onRejectClaim={vi.fn().mockResolvedValue(true)}
                onCreate={onCreate}
                onUpdate={vi.fn().mockResolvedValue(true)}
                onDelete={vi.fn().mockResolvedValue(true)}
            />
        </IntlProvider>,
    );

    return { onCreate };
}

describe('Tasks categories', () => {
    it('filters missions by their configured category instead of point value', async () => {
        renderTasks();

        fireEvent.click(screen.getByRole('button', { name: /Quick/ }));

        expect(screen.getByText('Quick mission')).toBeTruthy();
        await waitFor(() => expect(screen.queryByText('Big mission')).toBeNull());
    });

    it('lets a parent choose a category when creating a mission', () => {
        const { onCreate } = renderTasks(true);
        fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: 'Vacuum room' } });
        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'big' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add mission' }));

        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ title: 'Vacuum room', category: 'big' }));
    });
});
