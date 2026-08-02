import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AppIcon from '../components/AppIcon';
import IconPicker from '../components/IconPicker';
import { rewardIconOptions } from '../spa/iconOptions';
import type { PurchasedReward, Reward, RewardDraft, ShopProps } from '../type';

export default function Shop({
  rewards,
  coins,
  canRedeem,
  canManage,
  busyKey,
  onRedeem,
  onCreate,
  onUpdate,
  onDelete,
}: ShopProps) {
  const [purchased, setPurchased] = useState<PurchasedReward | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RewardDraft>({
    name: '',
    pointsCost: 50,
    durationMinutes: 60,
    emoji: 'mi:card_giftcard',
  });

  async function buy(reward: Reward) {
    if (coins < reward.pointsCost || !canRedeem) {
      return;
    }

    const result = await onRedeem(reward.id);

    if (!result.ok) {
      return;
    }

    setPurchased({
      name: reward.name,
      emoji: reward.emoji || emojiForReward(reward.name),
      voucherCode: result.voucherCode,
    });
    setTimeout(() => setPurchased(null), 3000);
  }

  function startEdit(reward: Reward) {
    setEditingId(reward.id);
    setForm({
      name: reward.name,
      pointsCost: reward.pointsCost,
      durationMinutes: reward.durationMinutes,
      emoji: reward.emoji,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: '',
      pointsCost: 50,
      durationMinutes: 60,
      emoji: 'mi:card_giftcard',
    });
  }

  async function submitParentForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: RewardDraft = {
      name: form.name.trim(),
      pointsCost: form.pointsCost,
      durationMinutes: form.durationMinutes,
      emoji: form.emoji.trim(),
    };

    const success = editingId
      ? await onUpdate(editingId, payload)
      : await onCreate(payload);

    if (success) {
      resetForm();
    }
  }

  async function removeReward(rewardId: number) {
    const success = await onDelete(rewardId);

    if (success && editingId === rewardId) {
      resetForm();
    }
  }

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h2>🛍 Boutique</h2>
        <div className="shop-coins">
          {canManage ? 'Gestion des récompenses' : `💰 ${coins} ChoreCoins`}
        </div>
      </div>

      {canManage ? (
        <form className="crud-panel" onSubmit={submitParentForm}>
          <div className="form-field">
            <label>Icône</label>
            <IconPicker
              value={form.emoji}
              options={rewardIconOptions}
              onChange={(nextIcon) => setForm((current) => ({ ...current, emoji: nextIcon }))}
            />
          </div>

          <div className="crud-row">
            <div className="form-field">
              <label htmlFor="reward-name">Nom de la récompense</label>
              <input
                id="reward-name"
                className="crud-input"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="reward-cost">Coût points</label>
              <input
                id="reward-cost"
                className="crud-input"
                type="number"
                min={0}
                value={form.pointsCost}
                onChange={(event) =>
                  setForm((current) => ({ ...current, pointsCost: Number(event.target.value) || 0 }))
                }
                required
              />
            </div>
          </div>
          <div className="crud-row">
            <div className="form-field">
              <label htmlFor="reward-duration">Durée (minutes)</label>
              <input
                id="reward-duration"
                className="crud-input"
                type="number"
                min={1}
                value={form.durationMinutes}
                onChange={(event) =>
                  setForm((current) => ({ ...current, durationMinutes: Number(event.target.value) || 1 }))
                }
                required
              />
            </div>
          </div>
          <div className="crud-actions">
            <button
              type="submit"
              className="crud-submit-btn"
              disabled={busyKey === 'reward:create' || (editingId !== null && busyKey === `reward:update:${editingId}`)}
            >
              {editingId ? 'Mettre à jour' : 'Ajouter récompense'}
            </button>
            {editingId ? (
              <button type="button" className="crud-cancel-btn" onClick={resetForm}>
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      <div className="shop-grid">
        {rewards.map((reward, i) => {
          const isRedeemBusy = busyKey === `redeem:${reward.id}`;
          const canTeenRedeem = canRedeem && coins >= reward.pointsCost && !isRedeemBusy;
          const isDeleteBusy = busyKey === `reward:delete:${reward.id}`;

          return (
            <motion.div
              key={reward.id}
              className={`reward-card ${canTeenRedeem || canManage ? 'affordable' : ''}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={canTeenRedeem || canManage ? { scale: 1.05 } : {}}
              whileTap={canTeenRedeem ? { scale: 0.95 } : {}}
            >
              <div className="reward-emoji">
                <AppIcon
                  value={reward.emoji}
                  fallback={emojiForReward(reward.name)}
                  className="reward-icon-glyph"
                />
              </div>
              <div className="reward-name">{reward.name}</div>
              <div className="reward-cost">💰 {reward.pointsCost}</div>
              <p className="reward-duration">{reward.durationMinutes} min</p>

              {canManage ? (
                <div className="reward-admin-actions">
                  <button
                    type="button"
                    className="task-admin-btn"
                    onClick={() => startEdit(reward)}
                    disabled={isDeleteBusy}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="task-admin-btn danger"
                    onClick={() => void removeReward(reward.id)}
                    disabled={isDeleteBusy}
                  >
                    {isDeleteBusy ? '…' : '🗑'}
                  </button>
                </div>
              ) : (
                <motion.button
                  className="reward-btn"
                  disabled={!canTeenRedeem}
                  onClick={() => void buy(reward)}
                  whileTap={canTeenRedeem ? { scale: 0.9 } : {}}
                >
                  {isRedeemBusy
                    ? '…'
                    : canRedeem
                      ? (coins >= reward.pointsCost ? 'échanger' : 'pas assez')
                      : 'réservé ado'}
                </motion.button>
              )}
            </motion.div>
          );
        })}
      </div>

      {!canRedeem && !canManage ? <p className="role-tip">Accès non disponible.</p> : null}

      <AnimatePresence>
        {purchased && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal"
              initial={{ scale: 0, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            >
              <motion.div
                className="modal-emoji"
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                🎁
              </motion.div>
              <h3>Échange réussi !</h3>
              <p style={{ color: '#666', marginTop: 4 }}>Tu as obtenu :</p>
              <div style={{ margin: '12px 0' }}>
                <AppIcon value={purchased.emoji} className="modal-reward-icon" />
              </div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{purchased.name}</div>
              <p className="voucher-code">Code: {purchased.voucherCode}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function emojiForReward(name: string) {
  const value = name.toLowerCase();

  if (value.includes('écran') || value.includes('screen')) return '📱';
  if (value.includes('dessert')) return '🍰';
  if (value.includes('parc')) return '🎢';
  if (value.includes('film') || value.includes('popcorn')) return '🎬';
  if (value.includes('dîner') || value.includes('pizza')) return '🍕';
  if (value.includes('voucher') || value.includes('bon')) return '🎟️';
  if (value.includes('sleep')) return '😴';

  return '🎁';
}
