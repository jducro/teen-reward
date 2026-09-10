import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FormEvent, ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Login from '../pages/Login';

vi.mock('framer-motion', async () => {
    const React = await import('react');
    const motionProps = new Set([
        'initial',
        'animate',
        'exit',
        'transition',
        'variants',
        'whileHover',
        'whileTap',
        'whileInView',
        'layout',
    ]);

    const motion = new Proxy(
        {},
        {
            get: (_, tag: string) => {
                return ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => {
                    const htmlProps = Object.fromEntries(
                        Object.entries(props).filter(([propName]) => !motionProps.has(propName)),
                    );

                    return React.createElement(tag, htmlProps, children);
                };
            },
        },
    );

    return { motion };
});

function renderLogin({
    busy = false,
    error = '',
}: {
    busy?: boolean;
    error?: string;
} = {}) {
    const onChange = vi.fn();
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    });

    render(
        <IntlProvider locale="en" messages={{}}>
            <Login
                authForm={{ email: '', password: '' }}
                busy={busy}
                error={error}
                onChange={onChange}
                onSubmit={onSubmit}
            />
        </IntlProvider>,
    );

    return { onChange, onSubmit };
}

afterEach(() => {
    cleanup();
});

describe('Login', () => {
    it('forwards field updates to the parent handler', () => {
        const { onChange } = renderLogin();

        fireEvent.change(screen.getByLabelText('Email'), {
            target: { value: 'teen@example.com' },
        });
        fireEvent.change(screen.getByLabelText('Password'), {
            target: { value: 'password' },
        });

        expect(onChange).toHaveBeenNthCalledWith(1, 'email', 'teen@example.com');
        expect(onChange).toHaveBeenNthCalledWith(2, 'password', 'password');
    });

    it('submits the form through the provided callback', () => {
        const { onSubmit } = renderLogin();
        const submitButton = screen.getByRole('button', { name: 'Sign in' });
        const form = submitButton.closest('form');

        if (!form) {
            throw new Error('Expected submit button to be inside a form element.');
        }

        fireEvent.submit(form);

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('shows busy and error states', () => {
        renderLogin({
            busy: true,
            error: 'Invalid credentials.',
        });

        const submitButton = screen.getByRole('button', { name: /Signing in/ });

        expect(submitButton.hasAttribute('disabled')).toBe(true);
        expect(screen.getByText('Invalid credentials.')).toBeTruthy();
    });
});
