import { useEffect, useMemo, useState } from 'react';
import AppIcon from './AppIcon';

export type IconOption = {
  value: string;
  label: string;
};

type IconPickerProps = {
  value: string;
  options: IconOption[];
  onChange: (value: string) => void;
};

export default function IconPicker({ value, options, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const displayedOptions = useMemo(() => {
    if (!value || options.some((option) => option.value === value)) {
      return options;
    }

    return [{ value, label: 'Icône actuelle' }, ...options];
  }, [options, value]);

  const selectedOption = useMemo(
    () => displayedOptions.find((option) => option.value === value) ?? null,
    [displayedOptions, value],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return displayedOptions;
    }

    return displayedOptions.filter((option) => {
      const normalizedLabel = option.label.toLowerCase();
      const normalizedValue = option.value.replace('mi:', '').replaceAll('_', ' ').toLowerCase();

      return normalizedLabel.includes(normalizedQuery) || normalizedValue.includes(normalizedQuery);
    });
  }, [displayedOptions, normalizedQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  function closeModal() {
    setIsOpen(false);
  }

  function openModal() {
    setQuery('');
    setIsOpen(true);
  }

  function selectIcon(iconValue: string) {
    onChange(iconValue);
    closeModal();
  }

  return (
    <>
      <button
        type="button"
        className="icon-picker-trigger"
        onClick={openModal}
      >
        <span className="icon-picker-trigger-current">
          <AppIcon value={value} className="icon-picker-trigger-glyph" />
        </span>
        <span className="icon-picker-trigger-label">
          {selectedOption?.label ?? 'Choisir une icône'}
        </span>
        <span className="icon-picker-trigger-action">Ouvrir la galerie</span>
      </button>

      {isOpen ? (
        <div className="modal-overlay icon-picker-modal-overlay" onClick={closeModal}>
          <div className="icon-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="icon-picker-modal-header">
              <h3>Galerie d&apos;icônes</h3>
              <button type="button" className="icon-picker-modal-close" onClick={closeModal} aria-label="Fermer">
                ×
              </button>
            </div>

            <div className="icon-picker-modal-search-wrap">
              <label htmlFor="icon-picker-search">Recherche</label>
              <input
                id="icon-picker-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="crud-input"
                placeholder="Ex: sport, cadeau, cuisine..."
                autoFocus
              />
              <p className="icon-picker-modal-count">{filteredOptions.length} icône(s)</p>
            </div>

            <div className="icon-picker-grid icon-picker-modal-grid" role="radiogroup" aria-label="Choix de l'icône">
              {filteredOptions.map((option) => {
                const active = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`icon-picker-option ${active ? 'active' : ''}`.trim()}
                    title={option.label}
                    aria-label={option.label}
                    aria-checked={active}
                    role="radio"
                    onClick={() => selectIcon(option.value)}
                  >
                    <AppIcon value={option.value} className="icon-picker-option-glyph" />
                  </button>
                );
              })}
            </div>

            {filteredOptions.length === 0 ? (
              <p className="icon-picker-modal-empty">Aucune icône ne correspond à cette recherche.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
