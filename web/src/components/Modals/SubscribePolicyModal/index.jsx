import React, { useState } from 'react';
import { X, Bell, Mail, Shield, CheckCircle, AlertTriangle, BookOpen } from 'lucide-react';
import subscriptionService from '../../../services/subscriptionService';
import './styles.scss';

const SubscribePolicyModal = ({ isOpen, onClose, onSuccess, resourceId, domain, category, userEmail, subscriptionId, isUnsubscribing = false }) => {
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
      console.error('Policy subscription action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const resourceName = 'USCIS Policy Manual Updates';

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent policyModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className={`iconWrapper ${isUnsubscribing ? 'unsub' : 'sub'}`}>
            {isUnsubscribing ? <AlertTriangle size={32} /> : <BookOpen size={32} />}
          </div>
          <h2>{isUnsubscribing ? `Stop Tracking ${resourceName}` : `Track ${resourceName}`}</h2>
          <p className="formTarget">USCIS Intelligence Center • Legal Corpus</p>
        </div>

        <div className="modalBody">
          {isUnsubscribing ? (
            <div className="unsubWarning">
              <p>You will no longer receive real-time alerts for policy guidance shifts. You might miss:</p>
              <ul>
                <li>Critical adjudicative standard updates.</li>
                <li>Changes to eligibility chapters and technical guidance.</li>
                <li>Direct alerts for new policy manual publications.</li>
              </ul>
            </div>
          ) : (
            <div className="subBenefits">
              <p>Receive high-fidelity tracking for legal and procedural updates:</p>
              <div className="benefitGrid">
                <div className="benefitItem">
                  <Shield size={20} />
                  <div>
                    <strong>Chapter Tracking</strong>
                    <span>Deep-structure monitoring of affected policy manual chapters.</span>
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
                    <strong>Legal Intelligence</strong>
                    <span>Real-time AI analysis of substantive guidance revisions.</span>
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

export default SubscribePolicyModal;
