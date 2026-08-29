import { motion } from 'framer-motion'
import type { DashboardProps } from '../type'

const levelNames = [
  'Novice du balai',      // 1
  'Aspirateur en herbe',  // 2
  'Apprenti Ninja 🏆',    // 3
  'Maître du Magnifique',// 4
  'Champion du Propre',   // 5
  'Légende Ordure',       // 6
]

export default function Dashboard({
  coins,
  level,
  userName,
  role,
  pendingClaims,
  availableChores,
  rewardsRedeemed,
}: DashboardProps) {
  const previousLevelAt = thresholdForLevel(level - 1)
  const nextLevelAt = thresholdForLevel(level)
  const pct = level >= 6
    ? 100
    : Math.min(((coins - previousLevelAt) / Math.max(nextLevelAt - previousLevelAt, 1)) * 100, 100)
  const name = levelNames[level - 1] || 'Novice'
  const remaining = Math.max(nextLevelAt - coins, 0)

  return (
    <div className="dashboard">
      <motion.p
        className="greeting"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Salut petit ninja 👋
      </motion.p>
      <motion.h1
        className="username"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {userName}
      </motion.h1>

      <motion.div
        className="balance-card"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="balance-label">Points actuels</p>
        <motion.div
          className="balance-amount"
          key={coins}
          initial={{ scale: 1.4 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {coins}
        </motion.div>
        <span className="level-badge">
          ⭐ {name}
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        {level < 6 ? (
          <p style={{ fontSize: 13, color: '#999', marginBottom: 6 }}>
            Prochain niveau dans {remaining} coins
          </p>
        ) : null}
        <div className="level-progress">
          <motion.div
            className="level-progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </div>
        <p className="progress-text">
          {level < 6 ? `${Math.round(pct)}% vers le niveau ${level + 1}` : 'Niveau maximum atteint 🎉'}
        </p>
      </motion.div>

      <motion.div
        className="bonus-banner"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {role === 'teen'
          ? `🎁 Missions disponibles : ${availableChores}`
          : `🧾 Demandes en attente : ${pendingClaims}`}
      </motion.div>

      <motion.div
        className="dashboard-summary-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <SummaryCard icon="🧹" label="Tâches disponibles" value={availableChores} tone="teal" />
        <SummaryCard icon="📝" label="Demandes en attente" value={pendingClaims} tone="violet" />
        <SummaryCard icon="🎁" label="Récompenses échangées" value={rewardsRedeemed} tone="amber" />
      </motion.div>
    </div>
  )
}

type SummaryCardProps = {
  icon: string
  label: string
  value: number
  tone: 'teal' | 'violet' | 'amber'
}

function SummaryCard({ icon, label, value, tone }: SummaryCardProps) {
  return (
    <div className={`summary-card summary-card-${tone}`}>
      <div className="summary-card-icon">{icon}</div>
      <div className="summary-card-value">{value}</div>
      <div className="summary-card-label">{label}</div>
    </div>
  )
}

function thresholdForLevel(level: number) {
  if (level <= 0) {
    return 0
  }

  if (level === 1) {
    return 100
  }

  if (level === 2) {
    return 250
  }

  if (level === 3) {
    return 500
  }

  if (level === 4) {
    return 900
  }

  if (level === 5) {
    return 1400
  }

  return 2000
}
