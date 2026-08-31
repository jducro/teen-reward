import { motion } from 'framer-motion';
import type { ActivityProps } from '../type';

export default function Activity({ claims, redemptions }: ActivityProps) {
  return (
    <div className="activity-page">
      <motion.section className="activity-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="activity-title">📋 Claim history</h2>
        {claims.length === 0 ? (
          <p className="activity-empty">No chore claims yet.</p>
        ) : (
          <div className="activity-list">
            {claims.map((claim) => (
              <div key={claim.id} className="activity-card">
                <div>
                  <div className="activity-name">{claim.chore?.title ?? 'Mission'}</div>
                  <div className="activity-meta">{claim.createdAt ?? ''}</div>
                </div>
                <div className={`activity-status ${claim.status}`}>{claim.status}</div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.section className="activity-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="activity-title">🎁 Voucher history</h2>
        {redemptions.length === 0 ? (
          <p className="activity-empty">No rewards redeemed yet.</p>
        ) : (
          <div className="activity-list">
            {redemptions.map((redemption) => (
              <div key={redemption.id} className="activity-card">
                <div>
                  <div className="activity-name">{redemption.reward?.name ?? 'Reward'}</div>
                  <div className="activity-meta">{redemption.redeemedAt ?? ''}</div>
                </div>
                <div>
                  <div className={`activity-status ${redemption.status}`}>{redemption.status}</div>
                  {redemption.voucherCode && (
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
                      {redemption.voucherCode}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>
    </div>
  );
}
