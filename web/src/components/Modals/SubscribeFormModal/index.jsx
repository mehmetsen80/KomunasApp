import React, { useState } from 'react';
import { X, Bell, Mail, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import Button from '../../Button';
import './styles.scss';

const SubscribeFormModal = ({ isOpen, onClose, onSuccess, formId, domain, category, userEmail, subscriptionId, isUnsubscribing = false }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      if (isUnsubscribing) {
        await subscriptionService.unsubscribe(subscriptionId);
      } else {
        // High-fidelity signature: (resourceId, domain, category, userId, userEmail)
        await subscriptionService.subscribe(formId, domain, category, userEmail, userEmail);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Subscription action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className={`iconWrapper ${isUnsubscribing ? 'unsub' : 'sub'}`}>
            {isUnsubscribing ? <AlertTriangle size={32} /> : <Bell size={32} />}
          </div>
          <h2>{isUnsubscribing ? 'Unsubscribe from Updates' : 'Confirm Subscription'}</h2>
          <p className="formTarget">Form {formId}</p>
        </div>

        <div className="modalBody">
          {isUnsubscribing ? (
            <div className="unsubWarning">
              <p>You will no longer receive real-time updates for this form. You might miss:</p>
              <ul>
                <li>Critical edition changes and expiration dates.</li>
                <li>Filing fee updates and instruction modifications.</li>
                <li>Direct email alerts for document modifications.</li>
              </ul>
            </div>
          ) : (
            <div className="subBenefits">
              <p>By subscribing, you will receive high-fidelity tracking and instant alerts for:</p>
              <div className="benefitGrid">
                <div className="benefitItem">
                  <Shield size={20} />
                  <div>
                    <strong>Edition Tracking</strong>
                    <span>Instant notification when USCIS releases a new form version.</span>
                  </div>
                </div>
                <div className="benefitItem">
                  <Mail size={20} />
                  <div>
                    <strong>Email Alerts</strong>
                    <span>Direct notifications sent to your registered email address.</span>
                  </div>
                </div>
                <div className="benefitItem">
                  <CheckCircle size={20} />
                  <div>
                    <strong>Filing Fee Sync</strong>
                    <span>Real-time analysis of fee changes and instruction updates.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modalFooter">
          <Button variant="cancel" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant={isUnsubscribing ? 'danger' : 'success'}
            onClick={handleConfirm}
            loading={loading}
          >
            {isUnsubscribing ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscribeFormModal;
