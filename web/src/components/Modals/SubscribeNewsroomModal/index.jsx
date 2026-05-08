import React, { useState } from 'react';
import { X, Bell, Mail, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import './styles.scss';

const SubscribeNewsroomModal = ({ isOpen, onClose, onSuccess, resourceId, domain, category, userEmail, subscriptionId, isUnsubscribing = false }) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);
      if (isUnsubscribing) {
        await subscriptionService.unsubscribe(subscriptionId);
      } else {
        // High-fidelity signature: (resourceId, domain, category, userId, userEmail)
        await subscriptionService.subscribe(resourceId, domain, category, userEmail, userEmail);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Subscription action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const resourceName = resourceId === 'news-releases' ? 'USCIS News Releases' : 'USCIS Announcements';

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
          <h2>{isUnsubscribing ? `Unsubscribe from ${resourceName}` : `Subscribe to ${resourceName}`}</h2>
          <p className="formTarget">USCIS Intelligence Center</p>
        </div>

        <div className="modalBody">
          {isUnsubscribing ? (
            <div className="unsubWarning">
              <p>You will no longer receive real-time updates for these {resourceName.toLowerCase()}. You might miss:</p>
              <ul>
                <li>Critical regulatory changes and sudden policy shifts.</li>
                <li>Important official communications and press releases.</li>
                <li>Direct email alerts for immediate compliance deadlines.</li>
              </ul>
            </div>
          ) : (
            <div className="subBenefits">
              <p>By subscribing, you will receive high-fidelity tracking and instant alerts for:</p>
              <div className="benefitGrid">
                <div className="benefitItem">
                  <Shield size={20} />
                  <div>
                    <strong>Policy Tracking</strong>
                    <span>Instant notification when USCIS publishes new {resourceName.toLowerCase()}.</span>
                  </div>
                </div>
                <div className="benefitItem">
                  <Mail size={20} />
                  <div>
                    <strong>Email Alerts</strong>
                    <span>Direct notifications sent to {userEmail}.</span>
                  </div>
                </div>
                <div className="benefitItem">
                  <CheckCircle size={20} />
                  <div>
                    <strong>Compliance Sync</strong>
                    <span>Real-time analysis of regulatory changes and deadlines.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modalFooter">
          <button className="cancelBtn" onClick={onClose} disabled={loading}>Cancel</button>
          <button
            className={`confirmBtn ${isUnsubscribing ? 'unsub' : 'sub'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <div className="mini-spinner"></div> : (isUnsubscribing ? 'Stop Monitoring' : 'Start Monitoring')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscribeNewsroomModal;
