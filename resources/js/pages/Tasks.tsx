import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import AppIcon from '../components/AppIcon';
import IconPicker from '../components/IconPicker';
import { choreIconOptions } from '../spa/iconOptions';
import type { Claim, Chore, ChoreDraft, DoneTask, TasksProps } from '../type';

const FILTERS = ['tous', 'rapide', 'fun', 'gros'] as const;
const coinEmojis = ['💰', '🪙', '✨', '⭐', '💎'];

function CoinBurst({ x, y }: { x: number; y: number }) {
  return (
    <div className="coin-burst">
      {coinEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            fontSize: 28,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: (Math.random() - 0.5) * 300,
            y: -200 - Math.random() * 200,
            opacity: 0,
            scale: 0,
            rotate: Math.random() * 360,
          }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          {emoji}
        </motion.div>
      ))}
    </div>
  );
}

export default function Tasks({
  chores,
  claims,
  coins,
  busyKey,
  canClaim,
  canManage,
  teens,
  availableChoresByTeen,
  onClaim,
  onClaimForTeen,
  onApproveClaim,
  onRejectClaim,
  onCreate,
  onUpdate,
  onDelete,
}: TasksProps) {
  const intl = useIntl();
  const [filter, setFilter] = useState<typeof FILTERS[number]>('tous');
  const [doneTask, setDoneTask] = useState<DoneTask | null>(null);
  const [burstPos, setBurstPos] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedTeenId, setSelectedTeenId] = useState<number | null>(null);
  const [form, setForm] = useState<ChoreDraft>({
    title: '',
    description: '',
    pointsValue: 20,
    emoji: 'mi:cleaning_services',
  });

  const latestClaimByChore = useMemo(() => {
    const claimMap = new Map<number, Claim['status']>();

    for (const claim of claims) {
      const choreId = claim.chore?.id;

      if (!choreId || claimMap.has(choreId)) {
        continue;
      }

      claimMap.set(choreId, claim.status);
    }

    return claimMap;
  }, [claims]);

  const filtered = useMemo(
    () => (filter === 'tous' ? chores : chores.filter((task) => categoryForPoints(task.pointsValue) === filter)),
    [chores, filter],
  );

  const teenClaimOptions = useMemo(() => {
    if (!canManage) {
      return [];
    }

    const teen = selectedTeenId ? teens.find((entry) => entry.id === selectedTeenId) : teens[0];
    if (!teen) {
      return [];
    }

    const choreMap = new Map(chores.map((chore) => [chore.id, chore]));
    const available = availableChoresByTeen?.[teen.id] ?? [];

    return available
      .map((chore) => choreMap.get(chore.id) ?? chore)
      .filter((chore): chore is Chore => Boolean(chore));
  }, [availableChoresByTeen, canManage, chores, selectedTeenId, teens]);

  async function complete(task: Chore, event: React.MouseEvent<HTMLButtonElement>) {
    const succeeded = await onClaim(task.id);

    if (!succeeded) {
      return;
    }

    setBurstPos({ x: event.clientX, y: event.clientY });
    setDoneTask({
      id: task.id,
      name: task.title,
      coins: task.pointsValue,
    });
    setTimeout(() => setDoneTask(null), 1600);
  }

  function startEdit(task: Chore) {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description ?? '',
      pointsValue: task.pointsValue,
      emoji: task.emoji,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      title: '',
      description: '',
      pointsValue: 20,
      emoji: 'mi:cleaning_services',
    });
  }

  async function submitParentForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: ChoreDraft = {
      title: form.title.trim(),
      description: form.description.trim(),
      pointsValue: form.pointsValue,
      emoji: form.emoji.trim(),
    };

    const success = editingId
      ? await onUpdate(editingId, payload)
      : await onCreate(payload);

    if (success) {
      resetForm();
    }
  }

  async function removeTask(choreId: number) {
    const success = await onDelete(choreId);

    if (success && editingId === choreId) {
      resetForm();
    }
  }

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h2>🧹 {intl.formatMessage({ id: 'tasks.title', defaultMessage: 'My Missions' })}</h2>
        <p style={{ color: '#999', marginTop: 6 }}>
          {canManage
            ? intl.formatMessage({ id: 'tasks.subtitle.parent', defaultMessage: 'Create, edit and delete missions' })
            : intl.formatMessage({ id: 'tasks.subtitle.teen', defaultMessage: '{coins} ChoreCoins earned' }, { coins })}
        </p>
      </div>

      {canManage ? (
        <motion.section
          className="approval-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <h3 className="approval-panel-title">🧾 {intl.formatMessage({ id: 'tasks.approvals.title', defaultMessage: 'Pending approvals' })}</h3>
          {claims.length === 0 ? (
      <p className="approval-empty">{intl.formatMessage({ id: 'tasks.approvals.empty', defaultMessage: 'No pending claims right now.' })}</p>
          ) : (
      <div className="approval-list">
        {claims.map((claim) => {
        const approveBusy = busyKey === `claim:approve:${claim.id}`;
        const rejectBusy = busyKey === `claim:reject:${claim.id}`;
        const actionBusy = approveBusy || rejectBusy;

        return (
          <div key={claim.id} className="approval-card">
            <div>
              <div className="approval-title">{claim.chore?.title ?? 'Mission'}</div>
              <div className="approval-meta">
                {claim.user?.name ?? 'Teen'} • {claim.chore?.pointsValue ?? 0} pts
              </div>
            </div>
            <div className="approval-actions">
              <button
                type="button"
                className="approval-btn approve"
                disabled={actionBusy}
                onClick={() => {
                  void onApproveClaim(claim.id);
                }}
              >
                {approveBusy ? '…' : intl.formatMessage({ id: 'claims.action.approve', defaultMessage: 'Approve' })}
              </button>
              <button
                type="button"
                className="approval-btn reject"
                disabled={actionBusy}
                onClick={() => {
                  void onRejectClaim(claim.id);
                }}
              >
                {rejectBusy ? '…' : intl.formatMessage({ id: 'claims.action.reject', defaultMessage: 'Reject' })}
              </button>
            </div>
          </div>
        );
        })}
      </div>
          )}
        </motion.section>
      ) : null}

      {canManage ? (
        <motion.section className="approval-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="approval-panel-title">
            🧑‍🎓 {intl.formatMessage({ id: 'claims.parent.quickClaim.title', defaultMessage: 'Claim for a teen' })}
          </h3>
          {teens.length === 0 ? (
            <p className="approval-empty">
              {intl.formatMessage({ id: 'teens.empty', defaultMessage: 'No teen accounts found.' })}
            </p>
          ) : (
            <>
              <div className="form-field">
                <label htmlFor="claim-teen-select">
                  {intl.formatMessage({ id: 'parent.selectTeen', defaultMessage: 'View teen:' })}
                </label>
                <select
                  id="claim-teen-select"
                  className="crud-input"
                  value={selectedTeenId ?? teens[0].id}
                  onChange={(event) => setSelectedTeenId(Number(event.target.value))}
                >
                  {teens.map((teen) => (
                    <option key={teen.id} value={teen.id}>
                      {teen.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="approval-list">
                {teenClaimOptions.length === 0 ? (
                  <p className="approval-empty">
                    {intl.formatMessage({
                      id: 'claims.noAvailableChores',
                      defaultMessage: 'No available chores for this teen.',
                    })}
                  </p>
                ) : (
                  teenClaimOptions.map((chore) => {
                    const targetTeenId = selectedTeenId ?? teens[0].id;
                    const claimBusyKey = `claim-for-teen:${chore.id}:${targetTeenId}`;
                    const isClaimBusy = busyKey === claimBusyKey;

                    return (
                      <div key={chore.id} className="approval-card">
                        <div>
                          <div className="approval-title">{chore.title}</div>
                          <div className="approval-meta">
                            {intl.formatMessage(
                              { id: 'chore.points.label', defaultMessage: '{points} points' },
                              { points: chore.pointsValue },
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="approval-btn approve"
                          disabled={isClaimBusy}
                          onClick={() => {
                            void onClaimForTeen(chore.id, targetTeenId);
                          }}
                        >
                          {isClaimBusy
                            ? '…'
                            : intl.formatMessage({ id: 'claims.action.claimForTeen', defaultMessage: 'Claim' })}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </motion.section>
      ) : null}

      {canManage ? (
        <form className="crud-panel" onSubmit={submitParentForm}>
          <div className="form-field">
            <label>{intl.formatMessage({ id: 'field.icon', defaultMessage: 'Icon' })}</label>
            <IconPicker
              value={form.emoji}
              options={choreIconOptions}
              onChange={(nextIcon) => setForm((current) => ({ ...current, emoji: nextIcon }))}
            />
          </div>

          <div className="crud-row">
            <div className="form-field">
              <label htmlFor="task-title">{intl.formatMessage({ id: 'tasks.form.missionTitle', defaultMessage: 'Mission title' })}</label>
              <input
                id="task-title"
                className="crud-input"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="task-points">{intl.formatMessage({ id: 'field.points', defaultMessage: 'Points' })}</label>
              <input
                id="task-points"
                className="crud-input"
                type="number"
                min={0}
                value={form.pointsValue}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pointsValue: Number(event.target.value) || 0 }))
                }
                required
              />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="task-description">{intl.formatMessage({ id: 'tasks.form.descriptionOptional', defaultMessage: 'Description (optional)' })}</label>
            <textarea
              id="task-description"
              className="crud-textarea"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div className="crud-actions">
            <button type="submit" className="crud-submit-btn" disabled={busyKey === 'chore:create' || (editingId !== null && busyKey === `chore:update:${editingId}`)}>
              {editingId
                ? intl.formatMessage({ id: 'common.action.update', defaultMessage: 'Update' })
                : intl.formatMessage({ id: 'tasks.form.addMission', defaultMessage: 'Add mission' })}
            </button>
            {editingId ? (
              <button type="button" className="crud-cancel-btn" onClick={resetForm}>
                {intl.formatMessage({ id: 'common.action.cancel', defaultMessage: 'Cancel' })}
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`filter-tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
            type="button"
          >
            {f === 'tous'
              ? `✨ ${intl.formatMessage({ id: 'tasks.filter.all', defaultMessage: 'All' })}`
              : f === 'rapide'
                ? `⚡ ${intl.formatMessage({ id: 'tasks.filter.quick', defaultMessage: 'Quick' })}`
                : f === 'fun'
                  ? `🎮 ${intl.formatMessage({ id: 'tasks.filter.fun', defaultMessage: 'Fun' })}`
                  : `💪 ${intl.formatMessage({ id: 'tasks.filter.big', defaultMessage: 'Big reward' })}`}
          </button>
        ))}
      </div>

      <div className="task-list">
        <AnimatePresence>
          {filtered.map((task, i) => {
            const status = latestClaimByChore.get(task.id);
            const isClaimBusy = busyKey === `claim:${task.id}`;
            const isDone = status === 'pending' || status === 'approved';
            const claimDisabled = !canClaim || isDone || isClaimBusy;
            const isUpdateBusy = busyKey === `chore:update:${task.id}`;
            const isDeleteBusy = busyKey === `chore:delete:${task.id}`;

            return (
              <motion.div
                key={task.id}
                className="task-card"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="task-icon">
                  <AppIcon
                    value={task.emoji}
                    fallback={iconForChore(task.title)}
                    className="task-icon-glyph"
                  />
                </div>
                <div className="task-info">
                  <div className="task-name">{task.title}</div>
                  <div className="task-meta">
                    <span className="task-coins">+{task.pointsValue} 💰</span>
                    {canManage ? (
                      <span className="task-status available">{intl.formatMessage({ id: 'tasks.status.parentManage', defaultMessage: 'Parent manage' })}</span>
                    ) : (
                      <span className={`task-status ${status ?? 'available'}`}>{statusLabel(status, intl)}</span>
                    )}
                  </div>
                  {task.description ? <p className="task-description">{task.description}</p> : null}
                </div>

                {canManage ? (
                  <div className="task-admin-actions">
                    <button
                      type="button"
                      className="task-admin-btn"
                      onClick={() => startEdit(task)}
                      disabled={isUpdateBusy || isDeleteBusy}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="task-admin-btn danger"
                      onClick={() => void removeTask(task.id)}
                      disabled={isDeleteBusy}
                    >
                      {isDeleteBusy ? '…' : '🗑'}
                    </button>
                  </div>
                ) : (
                  <motion.button
                    className="task-action"
                    onClick={(event) => void complete(task, event)}
                    whileHover={claimDisabled ? {} : { scale: 1.15 }}
                    whileTap={claimDisabled ? {} : { scale: 0.9 }}
                    disabled={claimDisabled}
                  >
                    {isClaimBusy ? '…' : status === 'pending' ? '⏳' : '✓'}
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {!canClaim && !canManage ? <p className="role-tip">{intl.formatMessage({ id: 'common.accessUnavailable', defaultMessage: 'Access unavailable.' })}</p> : null}

      <AnimatePresence>
        {doneTask && (
          <>
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDoneTask(null)}
            />
            <motion.div
              className="modal"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <motion.div
                className="modal-emoji"
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 1 }}
              >
                🎉
              </motion.div>
              <h3>{intl.formatMessage({ id: 'tasks.modal.sent', defaultMessage: 'Request sent!' })}</h3>
              <p>{intl.formatMessage({ id: 'tasks.modal.submitted', defaultMessage: 'Mission submitted:' })}</p>
              <p style={{ fontWeight: 800, fontSize: 18, marginTop: 6 }}>{doneTask.name}</p>
              <motion.div
                className="modal-coins"
                key={doneTask.id}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                +{doneTask.coins} 💰
              </motion.div>
              <p style={{ color: '#999', fontSize: 13 }}>{intl.formatMessage({ id: 'tasks.modal.awaitingApproval', defaultMessage: 'Awaiting parental approval ✅' })}</p>
            </motion.div>
            <CoinBurst x={burstPos.x} y={burstPos.y} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function categoryForPoints(points: number) {
  if (points <= 15) {
    return 'rapide';
  }

  if (points <= 30) {
    return 'fun';
  }

  return 'gros';
}

function iconForChore(title: string) {
  const value = title.toLowerCase();

  if (value.includes('linge')) return '🧺';
  if (value.includes('poubelle')) return '🗑';
  if (value.includes('vaisselle')) return '🍽';
  if (value.includes('aspir')) return '🧹';
  if (value.includes('vitre')) return '🪟';
  if (value.includes('chambre')) return '🛏';
  if (value.includes('voiture')) return '🚗';

  return '✅';
}

function statusLabel(status: Claim['status'] | undefined, intl: ReturnType<typeof useIntl>) {
  if (status === 'pending') {
    return intl.formatMessage({ id: 'claim.status.pending', defaultMessage: 'Pending' });
  }

  if (status === 'approved') {
    return intl.formatMessage({ id: 'claim.status.approved', defaultMessage: 'Approved' });
  }

  if (status === 'rejected') {
    return intl.formatMessage({ id: 'claim.status.rejected', defaultMessage: 'Rejected' });
  }

  return intl.formatMessage({ id: 'tasks.status.available', defaultMessage: 'Available' });
}
