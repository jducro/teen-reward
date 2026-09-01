import { motion } from 'framer-motion'
import { useIntl } from 'react-intl'
import type { DashboardProps } from '../type'

export default function Dashboard({
  coins,
  level,
  userName,
  role,
  pendingClaims,
  availableChores,
  rewardsRedeemed,
}: DashboardProps) {
  const intl = useIntl()

  const levelNameIds = [
    'dashboard.level.1',
    'dashboard.level.2',
    'dashboard.level.3',
    'dashboard.level.4',
    'dashboard.level.5',
    'dashboard.level.6',
  ] as const

  const levelNameDefaults = [
    'Broom Novice',
    'Vacuum Apprentice',
    'Ninja Apprentice 🏆',
    'Master of Magnificent',
    'Cleanliness Champion',
    'Trash Legend',
  ]

  const previousLevelAt = thresholdForLevel(level - 1)
  const nextLevelAt = thresholdForLevel(level)
  const pct = level >= 6
    ? 100
    : Math.min(((coins - previousLevelAt) / Math.max(nextLevelAt - previousLevelAt, 1)) * 100, 100)
  const nameId = levelNameIds[level - 1]
  const nameDefault = levelNameDefaults[level - 1] ?? 'Novice'
  const name = nameId
    ? intl.formatMessage({ id: nameId, defaultMessage: nameDefault })
    : intl.formatMessage({ id: 'dashboard.level.default', defaultMessage: 'Novice' })
  const remaining = Math.max(nextLevelAt - coins, 0)

  return (
    <div className="dashboard">
      <motion.p
        className="greeting"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {intl.formatMessage({ id: 'dashboard.greeting', defaultMessage: 'Hey little ninja 👋' })}
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
        <p className="balance-label">{intl.formatMessage({ id: 'dashboard.currentPoints', defaultMessage: 'Current points' })}</p>
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
            {intl.formatMessage({ id: 'dashboard.nextLevelIn', defaultMessage: 'Next level in {remaining} coins' }, { remaining })}
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
          {level < 6
            ? intl.formatMessage({ id: 'dashboard.progressPercent', defaultMessage: '{pct}% toward level {next}' }, { pct: Math.round(pct), next: level + 1 })
            : intl.formatMessage({ id: 'dashboard.maxLevel', defaultMessage: 'Maximum level reached 🎉' })}
        </p>
      </motion.div>

      <motion.div
        className="bonus-banner"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        {role === 'teen'
          ? intl.formatMessage({ id: 'dashboard.banner.teen', defaultMessage: '🎁 Available missions: {count}' }, { count: availableChores })
          : intl.formatMessage({ id: 'dashboard.banner.parent', defaultMessage: '🧾 Pending requests: {count}' }, { count: pendingClaims })}
      </motion.div>

      <motion.div
        className="dashboard-summary-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
      >
        <SummaryCard icon="🧹" label={intl.formatMessage({ id: 'summary.availableChores', defaultMessage: 'Available chores' })} value={availableChores} tone="teal" />
        <SummaryCard icon="📝" label={intl.formatMessage({ id: 'summary.pendingApprovals', defaultMessage: 'Pending approvals' })} value={pendingClaims} tone="violet" />
        <SummaryCard icon="🎁" label={intl.formatMessage({ id: 'summary.rewardsRedeemed', defaultMessage: 'Rewards redeemed' })} value={rewardsRedeemed} tone="amber" />
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
