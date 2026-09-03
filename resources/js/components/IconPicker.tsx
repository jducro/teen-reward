import { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
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
  const intl = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const localizedOptions = useMemo(
    () => options.map((option) => ({
      ...option,
      label: intl.formatMessage({
        id: `icon.${option.value.replace('mi:', '').replaceAll('_', '.')}`,
        defaultMessage: option.label,
      }),
    })),
    [intl, options],
  );

  const displayedOptions = useMemo(() => {
    if (!value || localizedOptions.some((option) => option.value === value)) {
      return localizedOptions;
    }

    return [{
      value,
      label: intl.formatMessage({ id: 'iconPicker.currentIcon', defaultMessage: 'Current icon' }),
    }, ...localizedOptions];
  }, [intl, localizedOptions, value]);

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
          {selectedOption?.label ?? intl.formatMessage({ id: 'iconPicker.selectIcon', defaultMessage: 'Choose an icon' })}
        </span>
        <span className="icon-picker-trigger-action">
          {intl.formatMessage({ id: 'iconPicker.openGallery', defaultMessage: 'Open gallery' })}
        </span>
      </button>

      {isOpen ? (
        <div className="modal-overlay icon-picker-modal-overlay" onClick={closeModal}>
          <div className="icon-picker-modal" onClick={(event) => event.stopPropagation()}>
            <div className="icon-picker-modal-header">
              <h3>{intl.formatMessage({ id: 'iconPicker.title', defaultMessage: 'Icon gallery' })}</h3>
              <button
                type="button"
                className="icon-picker-modal-close"
                onClick={closeModal}
                aria-label={intl.formatMessage({ id: 'common.action.close', defaultMessage: 'Close' })}
              >
                ×
              </button>
            </div>

            <div className="icon-picker-modal-search-wrap">
              <label htmlFor="icon-picker-search">
                {intl.formatMessage({ id: 'iconPicker.search', defaultMessage: 'Search' })}
              </label>
              <input
                id="icon-picker-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="crud-input"
                placeholder={intl.formatMessage({
                  id: 'iconPicker.searchPlaceholder',
                  defaultMessage: 'E.g. sport, gift, cooking...',
                })}
                autoFocus
              />
              <p className="icon-picker-modal-count">
                {intl.formatMessage(
                  { id: 'iconPicker.resultCount', defaultMessage: '{count} icon(s)' },
                  { count: filteredOptions.length },
                )}
              </p>
            </div>

            <div
              className="icon-picker-grid icon-picker-modal-grid"
              role="radiogroup"
              aria-label={intl.formatMessage({ id: 'iconPicker.choice', defaultMessage: 'Icon choice' })}
            >
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
              <p className="icon-picker-modal-empty">
                {intl.formatMessage({
                  id: 'iconPicker.noResults',
                  defaultMessage: 'No icons match this search.',
                })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
