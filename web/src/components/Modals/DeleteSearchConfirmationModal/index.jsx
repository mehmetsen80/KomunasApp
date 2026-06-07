import React from 'react';
import { X, Trash2, ShieldAlert } from 'lucide-react';
import Button from '../../Button';
import './styles.scss';

const DeleteSearchConfirmationModal = ({ isOpen, onClose, onConfirm, query }) => {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent deleteSearchModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <div className="iconWrapper delete">
            <Trash2 size={32} />
          </div>
          <h2>Delete Saved Search</h2>
          <p className="subtitle">Are you sure you want to remove this search query?</p>
        </div>

        <div className="modalBody">
          <div className="queryValueCard">
            <span className="queryLabel">Query</span>
            <span className="queryText">"{query}"</span>
          </div>

          <div className="infoBox">
            <ShieldAlert size={20} />
            <p>This will remove the saved search from your monitored dashboard. This action cannot be undone.</p>
          </div>
        </div>

        <div className="modalFooter">
          <Button variant="cancel" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSearchConfirmationModal;
