import { motion } from 'framer-motion'
import { useIntl } from 'react-intl'
import type { AppPage } from '../type'

export type Tab = { id: AppPage, emoji: string, labelId: string, defaultLabel: string }

const defaultTabs: Tab[] = [
  { id: 'home', emoji: '🏠', labelId: 'nav.home', defaultLabel: 'Home' },
  { id: 'tasks', emoji: '🧹', labelId: 'nav.tasks', defaultLabel: 'Tasks' },
  { id: 'shop', emoji: '🛍', labelId: 'nav.shop', defaultLabel: 'Shop' },
  { id: 'activity', emoji: '📋', labelId: 'nav.activity', defaultLabel: 'Activity' },
  { id: 'devices', emoji: '📱', labelId: 'nav.devices', defaultLabel: 'Devices' },
  { id: 'settings', emoji: '⚙️', labelId: 'nav.settings', defaultLabel: 'Account' },
];

const parentTabs: Tab[] = [
  ...defaultTabs
    .filter((tab) => tab.id !== 'devices')
    .map((tab) => tab.id === 'tasks'
      ? { ...tab, emoji: '✅', labelId: 'nav.approvals', defaultLabel: 'To review' }
      : tab),
  { id: 'teens', emoji: '🧑‍🎓', labelId: 'nav.teens', defaultLabel: 'Teens' },
];

export default function Navbar({
  setPage,
  activePage,
  isParent,
  pendingActionCount,
}: {
  setPage: (page: Tab['id']) => void;
  activePage: AppPage;
  isParent: boolean;
  pendingActionCount: number;
}) {
  const intl = useIntl();
  const tabs = isParent ? parentTabs : defaultTabs;

  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => setPage(tab.id)}
          className={activePage === tab.id ? 'active' : ''}
          title={intl.formatMessage({ id: tab.labelId, defaultMessage: tab.defaultLabel })}
          aria-label={isParent && tab.id === 'tasks' && pendingActionCount > 0
            ? intl.formatMessage(
              { id: 'nav.pendingApprovals', defaultMessage: '{label}, {count} items to review' },
              { label: intl.formatMessage({ id: tab.labelId, defaultMessage: tab.defaultLabel }), count: pendingActionCount },
            )
            : intl.formatMessage({ id: tab.labelId, defaultMessage: tab.defaultLabel })}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          {tab.emoji}
          {isParent && tab.id === 'tasks' && pendingActionCount > 0 && (
            <span className="navbar-badge" aria-hidden="true">{pendingActionCount > 99 ? '99+' : pendingActionCount}</span>
          )}
        </motion.button>
      ))}
    </nav>
  )
}
