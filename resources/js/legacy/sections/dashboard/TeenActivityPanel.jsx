import { motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import { apiRequest } from '../../spa/api';
import { cardVariants, formatDate } from '../../spa/utils';

function TeenActivityPanel({
    availableChores = [],
    busyKey,
    claims,
    isParentView = false,
    redemptions,
    runAction,
    teen,
}) {
    const intl = useIntl();
    const redemptionStatusMessageIds = {
        pending: 'redemption.status.pending',
        fulfilled: 'redemption.status.fulfilled',
        failed: 'redemption.status.failed',
    };

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={cardVariants(0.15)}
            className="space-y-8"
        >
            {isParentView && availableChores.length > 0 && (
                <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
                    <h2 className="text-2xl font-bold text-white">
                        {intl.formatMessage({
                            id: 'claims.availableChores',
                            defaultMessage: 'Available chores to claim',
                        })}
                    </h2>
                    <div className="mt-5 space-y-3">
                        {availableChores.map((chore) => (
                            <div key={chore.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            {chore.emoji && <span className="text-xl">{chore.emoji}</span>}
                                            <p className="font-semibold text-white">{chore.title}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {intl.formatMessage(
                                                {
                                                    id: 'chore.points.label',
                                                    defaultMessage: '{points} points',
                                                },
                                                { points: chore.pointsValue },
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            runAction(`chore:claim-for-teen:${chore.id}`, () =>
                                                apiRequest(`/api/chores/${chore.id}/claim-for-teen`, {
                                                    method: 'POST',
                                                    body: JSON.stringify({ teen_id: teen.id }),
                                                }),
                                            )
                                        }
                                        disabled={busyKey === `chore:claim-for-teen:${chore.id}`}
                                        className="rounded-full bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/25 disabled:opacity-50"
                                    >
                                        {intl.formatMessage({
                                            id: 'claims.action.claimForTeen',
                                            defaultMessage: 'Claim',
                                        })}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
                <h2 className="text-2xl font-bold text-white">
                    {intl.formatMessage({
                        id: 'claims.history.title',
                        defaultMessage: 'Claim history',
                    })}
                </h2>
                <div className="mt-5 space-y-3">
                    {claims.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            {intl.formatMessage({
                                id: 'claims.empty',
                                defaultMessage: 'No chore claims yet.',
                            })}
                        </p>
                    ) : (
                        claims.map((claim) => (
                            <div key={claim.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="font-semibold text-white">{claim.chore?.title}</p>
                                        <p className="mt-1 text-sm text-slate-400">
                                            {intl.formatMessage(
                                                {
                                                    id: 'claims.submittedAt',
                                                    defaultMessage: 'Submitted {date}',
                                                },
                                                { date: formatDate(intl, claim.createdAt) },
                                            )}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
                                        {intl.formatMessage(
                                            {
                                                id: `claim.status.${claim.status}`,
                                                defaultMessage: claim.status,
                                            },
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur">
                <h2 className="text-2xl font-bold text-white">
                    {intl.formatMessage({
                        id: 'redemptions.history.title',
                        defaultMessage: 'Voucher history',
                    })}
                </h2>
                <div className="mt-5 space-y-3">
                    {redemptions.length === 0 ? (
                        <p className="text-sm text-slate-400">
                            {intl.formatMessage({
                                id: 'redemptions.empty',
                                defaultMessage: 'No rewards redeemed yet.',
                            })}
                        </p>
                    ) : (
                        redemptions.map((redemption) => (
                            <div key={redemption.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                                <p className="font-semibold text-white">{redemption.reward?.name}</p>
                                <p className="mt-1 text-sm text-slate-400">{formatDate(intl, redemption.redeemedAt)}</p>
                                <p className="mt-2 text-xs uppercase tracking-wide text-slate-300">
                                    {intl.formatMessage(
                                        {
                                            id: redemptionStatusMessageIds[redemption.status] ?? 'redemption.status.unknown',
                                            defaultMessage: redemption.status ?? 'unknown',
                                        },
                                    )}
                                </p>
                                <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">
                                    {intl.formatMessage({
                                        id: 'redemptions.voucherCode.label',
                                        defaultMessage: 'Voucher code',
                                    })}
                                </p>
                                <p className="mt-1 font-mono text-cyan-300">
                                    {redemption.voucherCode || intl.formatMessage({
                                        id: 'common.notAvailable',
                                        defaultMessage: '—',
                                    })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.section>
    );
}

export default TeenActivityPanel;
