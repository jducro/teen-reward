import { motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import Input from '../../components/forms/Input';
import Textarea from '../../components/forms/Textarea';
import { cardVariants, firstError } from '../../spa/utils';

function ParentRewardForm({
    busyKey,
    rewardErrors,
    rewardForm,
    editingRewardId,
    setRewardForm,
    submitReward,
    updateForm,
    rewards,
    runAction,
}) {
    const intl = useIntl();

    return (
        <motion.section
            initial="hidden"
            animate="visible"
            variants={cardVariants(0.15)}
            className="rounded-[2rem] border border-white/10 bg-slate-900/70 p-6 backdrop-blur"
        >
            <h2 className="text-2xl font-bold text-white">
                {intl.formatMessage(
                    editingRewardId
                        ? { id: 'rewards.form.title.edit', defaultMessage: 'Edit reward' }
                        : { id: 'rewards.form.title.create', defaultMessage: 'Create a reward' },
                )}
            </h2>

            {/* Rewards List */}
            {!editingRewardId && rewards.length > 0 && (
                <div className="mb-6 mt-6">
                    <h3 className="mb-3 text-lg font-semibold text-slate-300">
                        {intl.formatMessage({
                            id: 'rewards.list.title',
                            defaultMessage: 'Your rewards',
                        })}
                    </h3>
                    <div className="space-y-2">
                        {rewards.map((reward) => (
                            <div
                                key={reward.id}
                                className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-950/50 p-3"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{reward.emoji}</span>
                                        <span className="font-medium text-white">{reward.name}</span>
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                                reward.type === 'wifi'
                                                    ? 'bg-cyan-400/20 text-cyan-300'
                                                    : 'bg-amber-400/20 text-amber-300'
                                            }`}
                                        >
                                            {reward.type === 'wifi'
                                                ? intl.formatMessage({
                                                    id: 'rewards.type.wifi',
                                                    defaultMessage: 'WiFi',
                                                })
                                                : intl.formatMessage({
                                                    id: 'rewards.type.physical',
                                                    defaultMessage: 'Physical',
                                                })}
                                        </span>
                                    </div>
                                    <div className="mt-1 flex gap-4 text-sm text-slate-400">
                                        <span>
                                            {intl.formatMessage(
                                                {
                                                    id: 'common.pointsShort',
                                                    defaultMessage: '{value} pts',
                                                },
                                                { value: reward.pointsCost },
                                            )}
                                        </span>
                                        {reward.type === 'wifi' && (
                                            <span>
                                                {intl.formatMessage(
                                                    {
                                                        id: 'rewards.duration',
                                                        defaultMessage: '{value} min',
                                                    },
                                                    { value: reward.durationMinutes },
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRewardForm(reward);
                                        }}
                                        className="rounded-lg bg-cyan-400/20 px-3 py-1 text-sm text-cyan-300 transition hover:bg-cyan-400/30"
                                    >
                                        {intl.formatMessage({
                                            id: 'common.edit',
                                            defaultMessage: 'Edit',
                                        })}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            runAction(`delete-reward:${reward.id}`, async () => {
                                                const response = await fetch(`/api/rewards/${reward.id}`, {
                                                    method: 'DELETE',
                                                });
                                                if (!response.ok) {
                                                    throw new Error(await response.text());
                                                }
                                            })
                                        }
                                        disabled={busyKey === `delete-reward:${reward.id}`}
                                        className="rounded-lg bg-red-400/20 px-3 py-1 text-sm text-red-300 transition hover:bg-red-400/30 disabled:opacity-40"
                                    >
                                        {intl.formatMessage({
                                            id: 'common.delete',
                                            defaultMessage: 'Delete',
                                        })}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reward Form */}
            <form className="mt-6 space-y-4" onSubmit={submitReward}>
                <Input
                    label={intl.formatMessage({
                        id: 'field.name',
                        defaultMessage: 'Reward name',
                    })}
                    placeholder={intl.formatMessage({
                        id: 'rewards.form.placeholder.name',
                        defaultMessage: 'e.g., WiFi Voucher',
                    })}
                    value={rewardForm.name}
                    error={firstError(rewardErrors, 'name')}
                    onChange={(event) => updateForm(setRewardForm, 'name', event.target.value)}
                />

                <div>
                    <label className="block text-sm font-medium text-slate-300">
                        {intl.formatMessage({
                            id: 'rewards.form.type',
                            defaultMessage: 'Reward type',
                        })}
                    </label>
                    <div className="mt-2 flex gap-3">
                        {[
                            {
                                value: 'physical',
                                label: intl.formatMessage({
                                    id: 'rewards.type.physical',
                                    defaultMessage: 'Physical',
                                }),
                                description: intl.formatMessage({
                                    id: 'rewards.type.physical.desc',
                                    defaultMessage: 'Gift card, toy, coupon, etc.',
                                }),
                            },
                            {
                                value: 'wifi',
                                label: intl.formatMessage({
                                    id: 'rewards.type.wifi',
                                    defaultMessage: 'WiFi Voucher',
                                }),
                                description: intl.formatMessage({
                                    id: 'rewards.type.wifi.desc',
                                    defaultMessage: 'Time-limited guest access',
                                }),
                            },
                        ].map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => updateForm(setRewardForm, 'type', type.value)}
                                className={`flex-1 rounded-lg border-2 px-3 py-2 text-left transition ${
                                    rewardForm.type === type.value
                                        ? 'border-cyan-400 bg-cyan-400/10'
                                        : 'border-slate-600 bg-slate-950/50 hover:border-slate-500'
                                }`}
                            >
                                <div className="font-semibold text-white">{type.label}</div>
                                <div className="text-xs text-slate-400">{type.description}</div>
                            </button>
                        ))}
                    </div>
                    {firstError(rewardErrors, 'type') && (
                        <p className="mt-1 text-sm text-red-400">{firstError(rewardErrors, 'type')}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={intl.formatMessage({
                            id: 'rewards.form.pointsCost',
                            defaultMessage: 'Points cost',
                        })}
                        type="number"
                        min="0"
                        value={rewardForm.pointsCost}
                        error={firstError(rewardErrors, 'points_cost')}
                        onChange={(event) =>
                            updateForm(setRewardForm, 'pointsCost', parseInt(event.target.value) || 0)
                        }
                    />
                    {rewardForm.type === 'wifi' && (
                        <Input
                            label={intl.formatMessage({
                                id: 'rewards.form.duration',
                                defaultMessage: 'Duration (minutes)',
                            })}
                            type="number"
                            min="1"
                            value={rewardForm.durationMinutes}
                            error={firstError(rewardErrors, 'duration_minutes')}
                            onChange={(event) =>
                                updateForm(
                                    setRewardForm,
                                    'durationMinutes',
                                    parseInt(event.target.value) || 60,
                                )
                            }
                        />
                    )}
                </div>

                <Input
                    label={intl.formatMessage({
                        id: 'field.emoji',
                        defaultMessage: 'Emoji (optional)',
                    })}
                    placeholder="🎁"
                    maxLength={1}
                    value={rewardForm.emoji}
                    error={firstError(rewardErrors, 'emoji')}
                    onChange={(event) => updateForm(setRewardForm, 'emoji', event.target.value)}
                />

                {rewardForm.type === 'wifi' && (
                    <div className="border-t border-white/10 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-slate-300">
                            {intl.formatMessage({
                                id: 'rewards.form.wifiVoucherSettings',
                                defaultMessage: 'WiFi Voucher Settings',
                            })}
                        </h3>

                        <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-200">
                            {intl.formatMessage({
                                id: 'rewards.form.voucherInfo',
                                defaultMessage:
                                    'When a teen redeems this reward, they will receive a WiFi guest voucher valid for the duration above. The voucher can be shared to grant temporary WiFi access.',
                            })}
                        </div>
                    </div>
                )}

                {rewardForm.type === 'physical' && (
                    <div className="border-t border-white/10 pt-4">
                        <h3 className="mb-3 text-sm font-semibold text-slate-300">
                            {intl.formatMessage({
                                id: 'rewards.form.physicalRewardSettings',
                                defaultMessage: 'Physical Reward Details',
                            })}
                        </h3>

                        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
                            {intl.formatMessage({
                                id: 'rewards.form.physicalInfo',
                                defaultMessage:
                                    'When a teen redeems this reward, they will receive a confirmation code. Track physical rewards manually or use the redemption code for fulfillment.',
                            })}
                        </div>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={busyKey === 'save-reward'}
                        className="flex-1 rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-40"
                    >
                        {intl.formatMessage(
                            editingRewardId
                                ? { id: 'common.update', defaultMessage: 'Update reward' }
                                : { id: 'common.create', defaultMessage: 'Create reward' },
                        )}
                    </button>
                    {editingRewardId && (
                        <button
                            type="button"
                            onClick={() =>
                                setRewardForm({
                                    name: '',
                                    pointsCost: 0,
                                    durationMinutes: 60,
                                    emoji: '🎁',
                                    type: 'physical',
                                })
                            }
                            className="rounded-full border border-slate-400 px-4 py-2 font-semibold text-slate-300 transition hover:bg-slate-400/10"
                        >
                            {intl.formatMessage({
                                id: 'common.cancel',
                                defaultMessage: 'Cancel',
                            })}
                        </button>
                    )}
                </div>
            </form>
        </motion.section>
    );
}

export default ParentRewardForm;

