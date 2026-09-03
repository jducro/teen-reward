import { motion } from 'framer-motion'
import { useIntl } from 'react-intl'
import type { AppPage } from '../type'

export type Tab = { id: AppPage, emoji: string, labelId: string, defaultLabel: string }

const defaultTabs: Tab[] = [
  { id: 'home', emoji: '🏠', labelId: 'nav.home', defaultLabel: 'Home' },
  { id: 'tasks', emoji: '🧹', labelId: 'nav.tasks', defaultLabel: 'Tasks' },
  { id: 'shop', emoji: '🛍', labelId: 'nav.shop', defaultLabel: 'Shop' },
  { id: 'activity', emoji: '📋', labelId: 'nav.activity', defaultLabel: 'Activity' },
  { id: 'settings', emoji: '⚙️', labelId: 'nav.settings', defaultLabel: 'Account' },
];

const parentTabs: Tab[] = [
  ...defaultTabs,
  { id: 'teens', emoji: '🧑‍🎓', labelId: 'nav.teens', defaultLabel: 'Teens' },
];

export default function Navbar({
  setPage,
  activePage,
  isParent,
}: {
  setPage: (page: Tab['id']) => void;
  activePage: AppPage;
  isParent: boolean;
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
          aria-label={intl.formatMessage({ id: tab.labelId, defaultMessage: tab.defaultLabel })}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          {tab.emoji}
        </motion.button>
      ))}
    </nav>
  )
}
