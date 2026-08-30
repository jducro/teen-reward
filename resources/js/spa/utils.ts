import type { ApiError, AuthForm, BootstrapPayload } from '../type';

export const EMPTY_PAYLOAD: BootstrapPayload = {
    user: null,
    teens: [],
    chores: [],
    claims: [],
    claimHistory: [],
    rewards: [],
    redemptions: [],
    stats: {
        availableChores: 0,
        pendingClaims: 0,
        rewardsRedeemed: 0,
    },
};

export const INITIAL_AUTH_FORM: AuthForm = {
    email: '',
    password: '',
};

export function resolveErrorMessage(error: unknown) {
    const apiError = error as ApiError | undefined;

    if (apiError?.errors) {
        const firstKey = Object.keys(apiError.errors)[0];
        const firstMessage = firstKey ? apiError.errors[firstKey]?.[0] : '';

        if (firstMessage) {
            return firstMessage;
        }
    }

    return apiError?.message ?? 'Une erreur est survenue.';
}

export function levelFromCoins(coins: number) {
    if (coins >= 1400) {
        return 6;
    }

    if (coins >= 900) {
        return 5;
    }

    if (coins >= 500) {
        return 4;
    }

    if (coins >= 250) {
        return 3;
    }

    if (coins >= 100) {
        return 2;
    }

    return 1;
}
