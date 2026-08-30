import type { FormEvent } from 'react';

export type Role = 'parent' | 'teen';
export type AppPage = 'home' | 'tasks' | 'shop' | 'teens' | 'settings' | 'activity';

export type User = {
    id: number;
    name: string;
    email: string;
    role: Role;
    pointsBalance: number;
};

export type Chore = {
    id: number;
    title: string;
    description: string | null;
    pointsValue: number;
    emoji: string;
    active?: boolean;
};

export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export type Claim = {
    id: number;
    status: ClaimStatus;
    createdAt?: string | null;
    user?: {
        id: number;
        name: string;
    } | null;
    chore: {
        id: number;
        title: string;
        pointsValue: number;
        emoji?: string;
    } | null;
};

export type RewardType = 'physical' | 'wifi';

export type Reward = {
    id: number;
    name: string;
    pointsCost: number;
    durationMinutes: number;
    emoji: string;
    type: RewardType;
};

export type Teen = {
    id: number;
    name: string;
    email: string;
    pointsBalance: number;
};

export type TeenDraft = {
    name: string;
    email: string;
    pointsBalance: number;
    password: string;
    passwordConfirmation: string;
};

export type BootstrapPayload = {
    user: User | null;
    teens: Teen[];
    chores: Chore[];
    claims: Claim[];
    rewards: Reward[];
    redemptions: Array<{
        id: number;
        status: string;
        voucherCode: string | null;
        redeemedAt: string | null;
        reward: {
            id: number;
            name: string;
            durationMinutes: number;
        } | null;
    }>;
    stats: {
        availableChores: number;
        pendingClaims: number;
        rewardsRedeemed: number;
    };
};

export type ApiError = {
    message?: string;
    errors?: Record<string, string[]>;
};

export type ApiSuccessPayload = {
    message?: string;
    voucherCode?: string;
};

export type ChoreDraft = {
    title: string;
    description: string;
    pointsValue: number;
    emoji: string;
};

export type RewardDraft = {
    name: string;
    pointsCost: number;
    durationMinutes: number;
    emoji: string;
    type: RewardType;
};

export type RedeemResult = {
    ok: boolean;
    voucherCode: string;
};

export type AuthForm = {
    email: string;
    password: string;
};

export type LoginProps = {
    authForm: AuthForm;
    busy: boolean;
    error: string;
    onChange: (field: keyof AuthForm, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export type LoginHandler = (event: FormEvent<HTMLFormElement>) => Promise<void>;
export type LogoutHandler = () => Promise<void>;

export type DashboardProps = {
    coins: number;
    level: number;
    userName: string;
    role: Role;
    pendingClaims: number;
    availableChores: number;
    rewardsRedeemed: number;
};

export type SettingsProps = {
    busyKey: string;
    profileForm: {
        name: string;
        email: string;
    };
    passwordForm: {
        currentPassword: string;
        password: string;
        passwordConfirmation: string;
    };
    deletePassword: string;
    onUpdateProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    onUpdatePassword: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    onDeleteAccount: (event: FormEvent<HTMLFormElement>) => Promise<void>;
    onChangeProfile: (field: 'name' | 'email', value: string) => void;
    onChangePassword: (field: 'currentPassword' | 'password' | 'passwordConfirmation', value: string) => void;
    onChangeDeletePassword: (value: string) => void;
};

export type ActivityProps = {
    claims: Claim[];
    redemptions: Array<{
        id: number;
        status: string;
        voucherCode: string | null;
        redeemedAt: string | null;
        reward: {
            id: number;
            name: string;
            durationMinutes: number;
        } | null;
    }>;
};

export type TasksProps = {
    chores: Chore[];
    claims: Claim[];
    coins: number;
    busyKey: string;
    canClaim: boolean;
    canManage: boolean;
    onClaim: (choreId: number) => Promise<boolean>;
    onApproveClaim: (claimId: number) => Promise<boolean>;
    onRejectClaim: (claimId: number) => Promise<boolean>;
    onCreate: (input: ChoreDraft) => Promise<boolean>;
    onUpdate: (choreId: number, input: ChoreDraft) => Promise<boolean>;
    onDelete: (choreId: number) => Promise<boolean>;
};

export type ShopProps = {
    rewards: Reward[];
    coins: number;
    canRedeem: boolean;
    canManage: boolean;
    busyKey: string;
    onRedeem: (rewardId: number) => Promise<RedeemResult>;
    onCreate: (input: RewardDraft) => Promise<boolean>;
    onUpdate: (rewardId: number, input: RewardDraft) => Promise<boolean>;
    onDelete: (rewardId: number) => Promise<boolean>;
};

export type DoneTask = {
    id: number;
    name: string;
    coins: number;
};

export type PurchasedReward = {
    name: string;
    emoji: string;
    voucherCode: string;
};
