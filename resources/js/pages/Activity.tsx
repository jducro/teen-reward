import { motion } from 'framer-motion';
import { useIntl } from 'react-intl';
import type { ActivityProps } from '../type';
import { intlFormat } from 'date-fns';

export default function Activity({ claims, redemptions }: ActivityProps) {
  const intl = useIntl();
  const dateFormat = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' } as const;

  return (
    <div className="activity-page">
      <motion.section className="activity-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="activity-title">{intl.formatMessage({ id: 'claims.history.title', defaultMessage: 'Claim history' })}</h2>
        {claims.length === 0 ? (
          <p className="activity-empty">{intl.formatMessage({ id: 'claims.empty', defaultMessage: 'No chore claims yet.' })}</p>
        ) : (
          <div className="activity-list">
            {claims.map((claim) => (
              <div key={claim.id} className="activity-card">
                <div>
                  <div className="activity-name">{claim.chore?.title ?? 'Mission'}</div>
                  <div className="activity-meta">
                    {claim.user?.name ? `${claim.user.name} • ` : ''}
                    {claim.createdAt ? intlFormat(claim.createdAt, dateFormat) : ''}
                  </div>
                </div>
                <div className={`activity-status ${claim.status}`}>
                  {intl.formatMessage({
                    id: `claim.status.${claim.status}`,
                    defaultMessage: claim.status,
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.section className="activity-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="activity-title">{intl.formatMessage({ id: 'redemptions.history.title', defaultMessage: 'Voucher history' })}</h2>
        {redemptions.length === 0 ? (
          <p className="activity-empty">{intl.formatMessage({ id: 'redemptions.empty', defaultMessage: 'No rewards redeemed yet.' })}</p>
        ) : (
          <div className="activity-list">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="activity-card">
                <div>
                  <div className="activity-name">{redemption.reward?.name ?? 'Reward'}</div>
                  <div className="activity-meta">
                    {redemption.user?.name ? `${redemption.user.name} • ` : ''}
                    {redemption.redeemedAt ? intlFormat(redemption.redeemedAt, dateFormat) : ''}
                  </div>
                </div>
                <div>
                  <div className={`activity-status ${redemption.status}`}>
                    {intl.formatMessage({
                      id: `redemption.status.${redemption.status}`,
                      defaultMessage: redemption.status,
                    })}
                  </div>
                  <div className="activity-voucher-label">
                    {intl.formatMessage({ id: 'redemptions.voucherCode.label', defaultMessage: 'Voucher code' })}
                  </div>
                  <div className="activity-voucher-code" style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#0891b2',
                    marginTop: '8px',
                    padding: '4px 8px',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderRadius: '4px',
                    wordBreak: 'break-all',
                  }}>
                    {redemption.voucherCode ?? intl.formatMessage({ id: 'common.notAvailable', defaultMessage: '—' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
