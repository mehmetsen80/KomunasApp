import React, { useState } from 'react';
import { X, Bell, Mail, Shield, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import Button from '../../Button';
import './styles.scss';

const SubscribeProcessingTimesModal = ({ isOpen, onClose, onSuccess, resourceId, domain, category, userEmail, subscriptionId, isUnsubscribing = false }) => {
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
      console.error('Processing Times subscription action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const resourceName = `Form ${resourceId} Processing Times`;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent ptModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className={`iconWrapper ${isUnsubscribing ? 'unsub' : 'sub'}`}>
            {isUnsubscribing ? <AlertTriangle size={32} /> : <Clock size={32} />}
          </div>
          <h2>{isUnsubscribing ? `Stop Tracking ${resourceId}` : `Monitor ${resourceId} Backlog`}</h2>
          <p className="formTarget">USCIS Intelligence Center • Backlog Analysis</p>
        </div>

        <div className="modalBody">
          {isUnsubscribing ? (
            <div className="unsubWarning">
              <p>You will no longer receive real-time alerts for {resourceId} wait time shifts. You might miss:</p>
              <ul>
                <li>Sudden spikes in processing backlogs.</li>
                <li>Improvements in estimated wait time ranges.</li>
                <li>AI analysis of historical trend shifts.</li>
              </ul>
            </div>
          ) : (
            <div className="subBenefits">
              <p>Receive high-fidelity tracking for estimated wait times and backlog trends:</p>
              <div className="benefitGrid">
                <div className="benefitItem">
                  <TrendingUp size={20} />
                  <div>
                    <strong>Trend Monitoring</strong>
                    <span>Real-time tracking of wait-time increases or decreases.</span>
                  </div>
                </div>
                <div className="benefitItem">
                  <Mail size={20} />
                  <div>
                    <strong>Email Alerts</strong>
                    <span>Direct notifications sent to {userEmail} when data shifts.</span>
                  </div>
                </div>
                <div className="benefitItem">
                  <Shield size={20} />
                  <div>
                    <strong>Backlog Analysis</strong>
                    <span>AI-driven intelligence on substantive impact and Visa Bulletin correlations.</span>
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

export default SubscribeProcessingTimesModal;
