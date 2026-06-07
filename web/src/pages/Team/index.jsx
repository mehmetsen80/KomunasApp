import React, { useState, useEffect } from 'react';
import { Users, Info, Shield, Activity, Calendar, Trash2, Edit2, Check, X, Search, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../services/axiosInstance';
import { isSuperAdmin } from '../../utils/roleUtils';
import { toast } from 'react-toastify';
import EditUserModal from '../../components/Modals/EditUserModal';
import DeleteUserModal from '../../components/Modals/DeleteUserModal';
import './styles.scss';

const Team = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'teams' for admin
  
  // Normal User states
  const [myTeams, setMyTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  
  // Admin states
  const [users, setUsers] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const userId = user?.email || user?.username;
  const adminMode = isSuperAdmin(user);

  useEffect(() => {
    if (adminMode) {
      fetchAdminData();
    } else {
      fetchUserTeamsAndMembers();
    }
  }, [userId, adminMode]);

  const fetchUserTeamsAndMembers = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const [teamsRes, membersRes] = await Promise.all([
        axiosInstance.get(`/api/teams?userId=${userId}`),
        axiosInstance.get('/api/users')
      ]);
      setMyTeams(teamsRes.data || []);
      setTeamMembers(membersRes.data || []);
    } catch (err) {
      console.error('Error fetching user teams and members:', err);
      setError('Failed to fetch assigned teams and registry list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersRes, teamsRes] = await Promise.all([
        axiosInstance.get('/api/users'),
        axiosInstance.get('/api/users/teams')
      ]);
      setUsers(usersRes.data || []);
      setAllTeams(teamsRes.data || []);
    } catch (err) {
      console.error('Error fetching admin registry:', err);
      setError('Error retrieving data. You may not have administrative permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (targetUser) => {
    setEditingUser(targetUser);
    setSelectedRoles(targetUser.roles || []);
    setSelectedTeamId(targetUser.teamId || '');
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      await axiosInstance.put(`/api/users/${editingUser.id}`, null, {
        params: {
          roles: selectedRoles.join(','),
          teamId: selectedTeamId || ''
        }
      });
      toast.success(`Personnel profile for "${editingUser.username}" updated.`);
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchAdminData(); // Refresh list
    } catch (err) {
      console.error('Failed to update user registry:', err);
      toast.error('Failed to update user profile. Please try again.');
    }
  };

  const handleDeleteClick = (targetUser) => {
    setDeletingUser(targetUser);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await axiosInstance.delete(`/api/users/${deletingUser.id}`);
      toast.success(`User "${deletingUser.username}" removed from registry.`);
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      fetchAdminData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      toast.error('Failed to delete user account.');
    }
  };

  const handleRoleCheckboxChange = (role) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const filteredUsers = users.filter(u => {
    const query = searchQuery.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query)) ||
      (u.fullName && u.fullName.toLowerCase().includes(query))
    );
  });

  if (loading) {
    return (
      <div className="teamPageLoading">
        <div className="loadingSpinner"></div>
        <p>{adminMode ? 'Loading Personnel & Gateway Registry...' : 'Fetching your assigned teams...'}</p>
      </div>
    );
  }

  // --- Render Normal User View ---
  if (!adminMode) {
    return (
      <div className="teamPage">
        <div className="pageHeader">
          <div className="headerContent">
            <div className="titleArea">
              <div className="badge">
                <Users size={14} />
                <span>Registry & Team Control</span>
              </div>
              <h1 className="teamTitle">My Teams</h1>
              <p className="subtitle">
                Assigned workspaces, route access permissions, and organization groups fetched from the gateway.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="errorBanner">
            <Info size={16} />
            <span>{error}</span>
          </div>
        )}

        {myTeams.length === 0 ? (
          <div className="noTeamsCard">
            <div className="noTeamsIcon">
              <Users size={48} />
            </div>
            <h3>No Assigned Teams</h3>
            <p>
              You are not currently assigned to any organizations or teams. Ask your Super Administrator to map your account in Linqra.
            </p>
          </div>
        ) : (
          <div className="teamsGrid">
            {myTeams.map((team) => (
              <div key={team.id || team._id} className="teamCard">
                <div className="cardHeader">
                  <div className="teamAvatar">
                    <span>{(team.name || 'T').substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="teamMeta">
                    <h3 className="teamName">{team.name}</h3>
                    <span className="orgId">ID: {team.organization?.name || 'Default Organization'}</span>
                  </div>
                  <span className={`statusBadge ${team.status === 'ACTIVE' || team.active ? 'active' : 'inactive'}`}>
                    {team.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="cardBody">
                  {team.description && (
                    <p className="teamDescription">{team.description}</p>
                  )}

                  <div className="teamDetailItem">
                    <Shield size={14} />
                    <span>Role: <strong>{team.roles?.join(', ') || 'Member'}</strong></span>
                  </div>

                  {team.lastActiveAt && (
                    <div className="teamDetailItem">
                      <Activity size={14} />
                      <span>Last active: {new Date(team.lastActiveAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Team Members List */}
                  <div className="teamMembersSection" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                      Team Members
                    </h4>
                    <div className="membersList" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {teamMembers.filter(member => member.teamId === team.id).map(member => (
                        <div key={member.id} className="teamMemberRow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                            {member.fullName || member.username}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {member.email}
                          </span>
                        </div>
                      ))}
                      {teamMembers.filter(member => member.teamId === team.id).length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>No members in this team</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Render Super Admin View ---
  return (
    <div className="teamPage adminMode">
      <div className="pageHeader">
        <div className="headerContent">
          <div className="titleArea">
            <div className="badge">
              <Users size={14} />
              <span>Registry & Team Control</span>
            </div>
            <h1 className="teamTitle">Registry Control & Teams</h1>
            <p className="subtitle">
              Manage multi-tenant team assignments, view gateway roles, and audit organization workspaces.
            </p>
          </div>

          <div className="adminTabs">
            <button 
              className={`tabButton ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              👥 User Registry ({users.length})
            </button>
            <button 
              className={`tabButton ${activeTab === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              🏢 Organization Teams ({allTeams.length})
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="errorBanner">
          <Info size={16} />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'users' ? (
        <div className="registryContainer card animate-fade-in">
          <div className="registrySearchHeader">
            <div className="searchBox">
              <Search size={16} className="searchIcon" />
              <input 
                type="text" 
                placeholder="Search registry by name, email, or username..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="tableWrapper">
            <table className="registryTable">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Gateway Roles</th>
                  <th>Assigned Team / Org</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="interactiveRow" onClick={() => handleEditClick(u)}>
                    <td className="font-medium">{u.username}</td>
                    <td>{u.fullName}</td>
                    <td className="emailCell">{u.email}</td>
                    <td>
                      <div className="roleBadges">
                        {u.roles && u.roles.map(role => (
                          <span key={role} className={`roleBadge role-${role.toLowerCase()}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="mappingCell">
                        <span className="orgName">{u.organizationName || 'No Organization'}</span>
                        <span className="teamName">{u.teamName || 'No Team Assignment'}</span>
                      </div>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="actionButtons">
                        <button className="editBtn" onClick={() => handleEditClick(u)}>
                          <Edit2 size={13} />
                          <span>Edit</span>
                        </button>
                        <button 
                          className="deleteBtn" 
                          onClick={() => handleDeleteClick(u)}
                          disabled={u.username === user?.username}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="teamsGrid">
          {allTeams.map((team) => (
            <div key={team.id || team._id} className="teamCard">
              <div className="cardHeader">
                <div className="teamAvatar">
                  <span>{(team.name || 'T').substring(0, 2).toUpperCase()}</span>
                </div>
                <div className="teamMeta">
                  <h3 className="teamName">{team.name}</h3>
                  <span className="orgId">ID: {team.organization?.name || 'Default Organization'}</span>
                </div>
                <span className={`statusBadge ${team.status === 'ACTIVE' || team.active ? 'active' : 'inactive'}`}>
                  {team.status || 'ACTIVE'}
                </span>
              </div>

              <div className="cardBody">
                {team.description && (
                  <p className="teamDescription">{team.description}</p>
                )}

                <div className="teamDetailItem">
                  <Shield size={14} />
                  <span>Available Roles: <strong>{team.roles?.join(', ') || 'USER'}</strong></span>
                </div>

                {team.lastActiveAt && (
                  <div className="teamDetailItem">
                    <Activity size={14} />
                    <span>Last active: {new Date(team.lastActiveAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit User Registry Modal */}
      <EditUserModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        allTeams={allTeams}
        selectedTeamId={selectedTeamId}
        setSelectedTeamId={setSelectedTeamId}
        selectedRoles={selectedRoles}
        handleRoleCheckboxChange={handleRoleCheckboxChange}
        onSave={handleSaveUser}
      />

      {/* Delete Confirmation Modal */}
      <DeleteUserModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingUser(null);
        }}
        onConfirm={handleConfirmDelete}
        user={deletingUser}
      />
    </div>
  );
};

export default Team;
