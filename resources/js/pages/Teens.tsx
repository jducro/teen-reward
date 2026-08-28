import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { Teen, TeenDraft } from '../type';

type TeensProps = {
  teens: Teen[];
  busyKey: string;
  canManage: boolean;
  onCreateTeen: (input: TeenDraft) => Promise<boolean>;
  onUpdateTeen: (teenId: number, input: TeenDraft) => Promise<boolean>;
  onDeleteTeen?: (teenId: number) => Promise<void>;
};

const defaultForm: TeenDraft = {
  name: '',
  email: '',
  pointsBalance: 0,
  password: '',
  passwordConfirmation: '',
};

export default function Teens({
  teens,
  busyKey,
  canManage,
  onCreateTeen,
  onUpdateTeen,
  onDeleteTeen,
}: TeensProps) {
  const [editingTeenId, setEditingTeenId] = useState<number | null>(null);
  const [confirmDeleteTeenId, setConfirmDeleteTeenId] = useState<number | null>(null);
  const [form, setForm] = useState<TeenDraft>(defaultForm);

  const orderedTeens = useMemo(
    () => [...teens].sort((left, right) => left.name.localeCompare(right.name)),
    [teens],
  );

  const totalPoints = useMemo(
    () => orderedTeens.reduce((sum, teen) => sum + teen.pointsBalance, 0),
    [orderedTeens],
  );

  function beginEditTeen(teen: Teen) {
    setEditingTeenId(teen.id);
    setForm({
      name: teen.name,
      email: teen.email,
      pointsBalance: teen.pointsBalance,
      password: '',
      passwordConfirmation: '',
    });
  }

  function resetForm() {
    setEditingTeenId(null);
    setForm(defaultForm);
  }

  async function submitTeenForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const payload: TeenDraft = {
      name: form.name.trim(),
      email: form.email.trim(),
      pointsBalance: Number(form.pointsBalance) || 0,
      password: form.password,
      passwordConfirmation: form.passwordConfirmation,
    };

    const success = editingTeenId
      ? await onUpdateTeen(editingTeenId, payload)
      : await onCreateTeen(payload);

    if (success) {
      resetForm();
    }
  }

  async function handleDeleteTeen(teenId: number) {
    if (!onDeleteTeen) return;
    try {
      await onDeleteTeen(teenId);
      setConfirmDeleteTeenId(null);
    } catch (error) {
      console.error('Failed to delete teen:', error);
    }
  }

  if (!canManage) {
    return (
      <div className="teens-page">
        <p className="role-tip">Accès parent uniquement.</p>
      </div>
    );
  }

  return (
    <div className="teens-page">
      <header className="teens-header">
        <h2>🧑‍🎓 Gestion des ados</h2>
        <p>{orderedTeens.length} compte(s) ado • {totalPoints} points cumulés</p>
      </header>

      <form className="crud-panel" onSubmit={submitTeenForm}>
        <div className="crud-row">
          <div className="form-field">
            <label htmlFor="teen-name-input">Nom</label>
            <input
              id="teen-name-input"
              className="crud-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="teen-email-input">Email</label>
            <input
              id="teen-email-input"
              className="crud-input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </div>
        </div>

        <div className="crud-row">
          <div className="form-field">
            <label htmlFor="teen-points-input">Points</label>
            <input
              id="teen-points-input"
              className="crud-input"
              type="number"
              min={0}
              step={1}
              value={form.pointsBalance}
              onChange={(event) =>
                setForm((current) => ({ ...current, pointsBalance: Number(event.target.value) || 0 }))
              }
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="teen-password-input">
              {editingTeenId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}
            </label>
            <input
              id="teen-password-input"
              className="crud-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              required={editingTeenId === null}
            />
          </div>
          <div className="form-field">
            <label htmlFor="teen-password-confirmation-input">
              {editingTeenId ? 'Confirmation (si mot de passe modifié)' : 'Confirmation mot de passe'}
            </label>
            <input
              id="teen-password-confirmation-input"
              className="crud-input"
              type="password"
              value={form.passwordConfirmation}
              onChange={(event) => setForm((current) => ({ ...current, passwordConfirmation: event.target.value }))}
              required={editingTeenId === null || form.password.length > 0}
            />
          </div>
        </div>

        <div className="crud-actions">
          <button
            type="submit"
            className="crud-submit-btn"
            disabled={busyKey === 'teen:create' || (editingTeenId !== null && busyKey === `teen:update:${editingTeenId}`)}
          >
            {editingTeenId === null ? 'Ajouter un ado' : 'Mettre à jour l’ado'}
          </button>
          {editingTeenId !== null ? (
            <>
              <button type="button" className="crud-cancel-btn" onClick={resetForm}>
                Annuler
              </button>
              <button
                type="button"
                className="crud-delete-btn"
                disabled={busyKey === `teen:delete:${editingTeenId}`}
                onClick={() => setConfirmDeleteTeenId(editingTeenId)}
              >
                {busyKey === `teen:delete:${editingTeenId}` ? '…' : 'Supprimer'}
              </button>
            </>
          ) : null}
        </div>
      </form>

      {orderedTeens.length === 0 ? (
        <p className="role-tip">Aucun compte ado trouvé.</p>
      ) : (
        <div className="teens-list">
          {orderedTeens.map((teen, index) => {
            const isBusy = busyKey === `teen:update:${teen.id}`;
            const isDeleting = busyKey === `teen:delete:${teen.id}`;

            return (
              <motion.article
                key={teen.id}
                className="teen-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="teen-details">
                  <h3>{teen.name}</h3>
                  <p>{teen.email}</p>
                  <p className="teen-points-label">{teen.pointsBalance} points</p>
                </div>

                <div className="teen-actions">
                  <button
                    type="button"
                    className="teen-save-btn"
                    disabled={isBusy}
                    onClick={() => beginEditTeen(teen)}
                  >
                    {isBusy ? '…' : 'Modifier'}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog - shown when editing */}
      {confirmDeleteTeenId !== null && editingTeenId === confirmDeleteTeenId && (
        <div className="confirmation-modal-overlay">
          <motion.div
            className="confirmation-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <h3>
              Supprimer le compte de {orderedTeens.find((t) => t.id === editingTeenId)?.name} ?
            </h3>
            <p>Cette action est irréversible. Le compte et toutes les données associées seront supprimés.</p>
            <div className="confirmation-modal-actions">
              <button
                type="button"
                className="confirmation-modal-cancel"
                onClick={() => setConfirmDeleteTeenId(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="confirmation-modal-confirm"
                disabled={busyKey === `teen:delete:${editingTeenId}`}
                onClick={() => handleDeleteTeen(editingTeenId)}
              >
                {busyKey === `teen:delete:${editingTeenId}` ? 'Suppression…' : 'Supprimer le compte'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
