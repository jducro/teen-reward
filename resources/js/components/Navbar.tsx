import { motion } from 'framer-motion'
import type { AppPage } from '../type'

export type Tab = { id: AppPage, emoji: string, label: string }

const defaultTabs: Tab[] = [
  { id: 'home', emoji: '🏠', label: 'Accueil' },
  { id: 'tasks', emoji: '🧹', label: 'Missions' },
  { id: 'shop', emoji: '🛍', label: 'Boutique' },
  { id: 'activity', emoji: '📋', label: 'Activité' },
];

const parentTabs: Tab[] = [
  ...defaultTabs,
  { id: 'teens', emoji: '🧑‍🎓', label: 'Ados' },
  { id: 'settings', emoji: '⚙️', label: 'Compte' },
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
  const tabs = isParent ? parentTabs : defaultTabs;

  return (
    <nav className="navbar">
      {tabs.map((tab) => (
        <motion.button
          key={tab.id}
          onClick={() => setPage(tab.id)}
          className={activePage === tab.id ? 'active' : ''}
          title={tab.label}
          aria-label={tab.label}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          {tab.emoji}
        </motion.button>
      ))}
    </nav>
  )
}
