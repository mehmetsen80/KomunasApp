import React from 'react';
import { X, LogOut, ShieldAlert } from 'lucide-react';
import './styles.scss';

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent logoutModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="iconWrapper logout">
            <LogOut size={32} />
          </div>
          <h2>Confirm Logout</h2>
          <p className="subtitle">Are you sure you want to end your session?</p>
        </div>

        <div className="modalBody">
          <div className="infoBox">
            <ShieldAlert size={20} />
            <p>You will need to log back in to access your monitored intelligence and real-time feeds.</p>
          </div>
        </div>

        <div className="modalFooter">
          <button className="cancelBtn" onClick={onClose}>Stay Logged In</button>
          <button className="confirmBtn logout" onClick={onConfirm}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmationModal;
