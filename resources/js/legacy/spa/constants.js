export const defaultChoreForm = {
    title: '',
    description: '',
    points_value: 10,
    recurrence_type: 'weekly',
    recurrence_interval: 1,
    recurrence_unit: 'weeks',
    active: true,
};

export const defaultRewardForm = {
    name: '',
    type: 'physical',
    pointsCost: 10,
    durationMinutes: 60,
    emoji: '🎁',
};

export const defaultAuthForm = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'teen',
};

export const defaultPasswordForm = {
    current_password: '',
    password: '',
    password_confirmation: '',
};

export const spaHighlights = [
    {
        id: 'auth.highlight.motion',
        defaultMessage: 'Motion-driven transitions with framer-motion.',
    },
    {
        id: 'auth.highlight.api',
        defaultMessage: 'JSON-only Laravel endpoints for auth, chores, claims, rewards, and profile updates.',
    },
    {
        id: 'auth.highlight.dashboard',
        defaultMessage: 'A single-page dashboard that adapts for parents and teens.',
    },
];
