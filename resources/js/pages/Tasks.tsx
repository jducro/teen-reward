import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
  onClaim,
  onCreate,
  onUpdate,
  onDelete,
}: TasksProps) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('tous');
  const [doneTask, setDoneTask] = useState<DoneTask | null>(null);
  const [burstPos, setBurstPos] = useState({ x: 0, y: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
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
        <h2>🧹 Mes Missions</h2>
        <p style={{ color: '#999', marginTop: 6 }}>
          {canManage ? 'Crée, modifie et supprime les missions' : `${coins} ChoreCoins accumulés`}
        </p>
      </div>

      {canManage ? (
        <form className="crud-panel" onSubmit={submitParentForm}>
          <div className="form-field">
            <label>Icône</label>
            <IconPicker
              value={form.emoji}
              options={choreIconOptions}
              onChange={(nextIcon) => setForm((current) => ({ ...current, emoji: nextIcon }))}
            />
          </div>

          <div className="crud-row">
            <div className="form-field">
              <label htmlFor="task-title">Titre de la mission</label>
              <input
                id="task-title"
                className="crud-input"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="task-points">Points</label>
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
            <label htmlFor="task-description">Description (optionnelle)</label>
            <textarea
              id="task-description"
              className="crud-textarea"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div className="crud-actions">
            <button type="submit" className="crud-submit-btn" disabled={busyKey === 'chore:create' || (editingId !== null && busyKey === `chore:update:${editingId}`)}>
              {editingId ? 'Mettre à jour' : 'Ajouter mission'}
            </button>
            {editingId ? (
              <button type="button" className="crud-cancel-btn" onClick={resetForm}>
                Annuler
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
            {f === 'tous' ? '✨ Tous' : f === 'rapide' ? '⚡ Rapide' : f === 'fun' ? '🎮 Fun' : '💪 Gros gain'}
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
                      <span className="task-status available">Gestion parent</span>
                    ) : (
                      <span className={`task-status ${status ?? 'available'}`}>{statusLabel(status)}</span>
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

      {!canClaim && !canManage ? <p className="role-tip">Accès non disponible.</p> : null}

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
              <h3>Demande envoyée !</h3>
              <p>Mission soumise :</p>
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
              <p style={{ color: '#999', fontSize: 13 }}>En attente de validation parentale ✅</p>
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

function statusLabel(status: Claim['status'] | undefined) {
  if (status === 'pending') {
    return 'En attente';
  }

  if (status === 'approved') {
    return 'Validée';
  }

  if (status === 'rejected') {
    return 'Refusée';
  }

  return 'Disponible';
}
