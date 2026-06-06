import React from 'react';
import { X, Trash2, Info } from 'lucide-react';
import Button from '../../Button';
import './styles.scss';

const DeleteUserModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent deleteUserModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="iconWrapper danger">
            <Trash2 size={32} />
          </div>
          <h2>Delete User Account?</h2>
          <p className="subtitle">This will permanently remove user <strong>{user.username}</strong> from the system.</p>
        </div>

        <div className="modalBody">
          <div className="warningBox">
            <Info size={18} />
            <p>This action will delete user logs, saved search histories, and local subscriptions. It cannot be undone.</p>
          </div>
        </div>

        <div className="modalFooter">
          <Button variant="cancel" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>Delete User</Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
