import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IntlProvider } from 'react-intl';
import Tasks from '../pages/Tasks';
import type { Chore } from '../type';
import frenchMessages from '../i18n/fr.json';

afterEach(cleanup);

const chores: Chore[] = [
    { id: 1, title: 'Quick mission', description: null, pointsValue: 50, category: 'quick', emoji: '🧹' },
    { id: 2, title: 'Big mission', description: null, pointsValue: 5, category: 'big', emoji: '🧹' },
];

function renderTasks(canManage = false, locale = 'en', messages: Record<string, string> = {}) {
    const onCreate = vi.fn().mockResolvedValue(true);
    render(
        <IntlProvider locale={locale} messages={messages}>
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

    it('lets a parent set a custom recurrence interval', () => {
        const { onCreate } = renderTasks(true);
        fireEvent.change(screen.getByLabelText('Mission title'), { target: { value: 'Water plants' } });
        fireEvent.change(screen.getByLabelText('Frequency'), { target: { value: 'custom' } });
        fireEvent.change(screen.getByLabelText('Repeat every'), { target: { value: '2' } });
        fireEvent.change(screen.getByLabelText('Unit'), { target: { value: 'weeks' } });
        fireEvent.click(screen.getByRole('button', { name: 'Add mission' }));

        expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Water plants',
            recurrenceType: 'custom',
            recurrenceInterval: 2,
            recurrenceUnit: 'weeks',
        }));
    });

    it('shows the no-limit recurrence choice in French', () => {
        renderTasks(true, 'fr', frenchMessages);

        expect(screen.getByRole('option', { name: 'Sans limite' })).toBeTruthy();
        expect(screen.getByText(frenchMessages['tasks.form.recurrenceHelp'])).toBeTruthy();
    });
});
