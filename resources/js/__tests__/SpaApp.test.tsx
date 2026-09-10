import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SpaApp from '../SpaApp';

const useSpaAppStateMock = vi.fn();

vi.mock('../hooks/useSpaAppState', () => ({
    useSpaAppState: () => useSpaAppStateMock(),
}));

vi.mock('../components/LoadingPage', () => ({
    default: () => <div>loading-page</div>,
}));

vi.mock('../pages/Login', () => ({
    default: () => <div>login-page</div>,
}));

vi.mock('../pages/AuthenticatedApp', () => ({
    default: () => <div>authenticated-page</div>,
}));

function makeState(overrides: Record<string, unknown> = {}) {
    return {
        loading: false,
        user: null,
        ...overrides,
    };
}

afterEach(() => {
    cleanup();
    useSpaAppStateMock.mockReset();
});

describe('SpaApp', () => {
    it('renders loading page while app is bootstrapping', () => {
        useSpaAppStateMock.mockReturnValue(makeState({ loading: true }));

        render(<SpaApp />);

        expect(screen.getByText('loading-page')).toBeTruthy();
        expect(screen.queryByText('login-page')).toBeNull();
        expect(screen.queryByText('authenticated-page')).toBeNull();
    });

    it('renders login page when there is no authenticated user', () => {
        useSpaAppStateMock.mockReturnValue(makeState());

        render(<SpaApp />);

        expect(screen.getByText('login-page')).toBeTruthy();
        expect(screen.queryByText('loading-page')).toBeNull();
        expect(screen.queryByText('authenticated-page')).toBeNull();
    });

    it('renders authenticated app when a user is present', () => {
        useSpaAppStateMock.mockReturnValue(
            makeState({
                user: {
                    id: 1,
                    name: 'Parent',
                    role: 'parent',
                },
            }),
        );

        render(<SpaApp />);

        expect(screen.getByText('authenticated-page')).toBeTruthy();
        expect(screen.queryByText('loading-page')).toBeNull();
        expect(screen.queryByText('login-page')).toBeNull();
    });
});
