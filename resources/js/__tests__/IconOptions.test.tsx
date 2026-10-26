import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import IconPicker from '../components/IconPicker';
import { choreIconOptions, rewardIconOptions } from '../spa/iconOptions';

describe('Material Symbols catalog', () => {
  it('makes the complete catalog available for chores and rewards', () => {
    expect(choreIconOptions.length).toBeGreaterThan(4000);
    expect(rewardIconOptions.length).toBe(choreIconOptions.length);
    expect(choreIconOptions).toContainEqual(expect.objectContaining({ value: 'mi:cleaning_services' }));
    expect(choreIconOptions).toContainEqual(expect.objectContaining({ value: 'mi:10k' }));
    expect(rewardIconOptions).toContainEqual(expect.objectContaining({ value: 'mi:card_giftcard' }));
  });

  it('finds icons through aliases and ignores accents in the search', () => {
    render(
      <IntlProvider locale="fr" messages={{}}>
        <IconPicker
          value="mi:cleaning_services"
          options={choreIconOptions}
          onChange={() => undefined}
        />
      </IntlProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: /open gallery/i }));
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'menage' } });

    expect(screen.getByRole('radio', { name: 'Nettoyage' })).toBeTruthy();
    expect(screen.queryByRole('radio', { name: 'Lessive' })).toBeNull();
  });
});
