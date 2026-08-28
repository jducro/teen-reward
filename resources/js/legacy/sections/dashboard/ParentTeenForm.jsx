import { motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import { useState } from 'react';
import { cardVariants } from '../../spa/utils';

function ParentTeenForm({ busyKey, bootstrapped, runAction }) {
    const intl = useIntl();
    const [confirmDeleteTeenId, setConfirmDeleteTeenId] = useState(null);
    const teens = bootstrapped?.teens ?? [];

    const handleDeleteTeen = (teenId) => {
        runAction(`delete-teen:${teenId}`, async () => {
            const response = await fetch(`/api/teens/${teenId}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error(await response.text());
            }
            setConfirmDeleteTeenId(null);
        });
    };

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={cardVariants(0.15)}
            className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur"
        >
            <h2 className="text-2xl font-bold text-white">
                {intl.formatMessage({
                    id: 'teens.management.title',
                    defaultMessage: 'Manage teens',
                })}
            </h2>

            <div className="mt-6 space-y-2">
                {teens.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        {intl.formatMessage({
                            id: 'teens.list.empty',
                            defaultMessage: 'No teen accounts yet.',
                        })}
                    </p>
                ) : (
                    teens.map((teen) => (
                        <div
                            key={teen.id}
                            className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/50 p-3"
                        >
                            <div className="flex-1">
                                <p className="font-medium text-white">{teen.name}</p>
                                <p className="text-sm text-slate-400">{teen.email}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                                    {intl.formatMessage(
                                        {
                                            id: 'common.pointsShort',
                                            defaultMessage: '{value} pts',
                                        },
                                        { value: teen.pointsBalance },
                                    )}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setConfirmDeleteTeenId(teen.id)}
                                    disabled={busyKey === `delete-teen:${teen.id}`}
                                    className="rounded-lg bg-red-400/20 px-3 py-1 text-sm text-red-300 transition hover:bg-red-400/30 disabled:opacity-40"
                                >
                                    {intl.formatMessage({
                                        id: 'common.delete',
                                        defaultMessage: 'Delete',
                                    })}
                                </button>
                            </div>

                            {/* Delete Confirmation Dialog */}
                            {confirmDeleteTeenId === teen.id && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                                    <motion.div
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0.95, opacity: 0 }}
                                        className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-xl"
                                    >
                                        <h3 className="text-xl font-bold text-white">
                                            {intl.formatMessage({
                                                id: 'teens.delete.confirmation.title',
                                                defaultMessage: 'Delete teen account?',
                                            })}
                                        </h3>
                                        <p className="mt-2 text-slate-400">
                                            {intl.formatMessage(
                                                {
                                                    id: 'teens.delete.confirmation.message',
                                                    defaultMessage:
                                                        'Are you sure you want to delete {name}\'s account? This action cannot be undone.',
                                                },
                                                { name: teen.name },
                                            )}
                                        </p>
                                        <div className="mt-6 flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteTeenId(null)}
                                                className="flex-1 rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:bg-white/5"
                                            >
                                                {intl.formatMessage({
                                                    id: 'common.cancel',
                                                    defaultMessage: 'Cancel',
                                                })}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteTeen(teen.id)}
                                                disabled={busyKey === `delete-teen:${teen.id}`}
                                                className="flex-1 rounded-full bg-red-500/80 px-4 py-2 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                                            >
                                                {intl.formatMessage({
                                                    id: 'teens.delete.confirmation.confirm',
                                                    defaultMessage: 'Delete account',
                                                })}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </motion.section>
    );
}

export default ParentTeenForm;
