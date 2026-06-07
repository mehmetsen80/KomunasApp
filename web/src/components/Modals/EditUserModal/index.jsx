import React from 'react';
import { X } from 'lucide-react';
import Button from '../../Button';
import './styles.scss';

const EditUserModal = ({
  isOpen,
  onClose,
  user,
  allTeams,
  selectedTeamId,
  setSelectedTeamId,
  selectedRoles,
  handleRoleCheckboxChange,
  onSave
}) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div className="modalContent editUserModal" onClick={(e) => e.stopPropagation()}>
        <button className="closeBtn" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="modalHeader">
          <h2 className="modalTitle">Edit Personnel Mapping</h2>
          <p className="modalSubtitle">Assign team workspace and adjust gateway access roles.</p>
        </div>

        <div className="modalBody">
          <div className="formGroup">
            <label>User Context</label>
            <div className="userInfoDisplay">
              <strong>{user.fullName}</strong>
              <span>@{user.username} | {user.email}</span>
            </div>
          </div>

          <div className="formGroup">
            <label>Team assignment (Linqra Gateway)</label>
            <select
              className="formSelect"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              <option value="">No Team Assignment</option>
              {allTeams.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.organization?.name || 'Default Org'})</option>
              ))}
            </select>
          </div>

          <div className="formGroup">
            <label>Access Roles</label>
            <div className="rolesSelectionGrid">
              {['USER', 'gateway_admin', 'gateway_admin_realm', 'SUPER_ADMIN', 'ADMIN'].map(role => (
                <label key={role} className="checkboxLabel">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleCheckboxChange(role)}
                  />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modalFooter">
          <Button variant="cancel" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
