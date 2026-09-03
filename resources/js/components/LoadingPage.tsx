import { motion } from 'framer-motion';
import { useIntl } from 'react-intl';

export default function LoadingPage() {
    const intl = useIntl();

    return (
        <div className="page loading-page">
            <motion.div
                className="balance-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="balance-label">{intl.formatMessage({ id: 'common.loading', defaultMessage: 'Loading' })}</p>
                <div className="balance-amount">…</div>
            </motion.div>
        </div>
    );
}
