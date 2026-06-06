import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Shield, Calendar, LogOut, Users, Layers, ExternalLink } from 'lucide-react';
import Button from '../../components/Button';
import axiosInstance from '../../services/axiosInstance';
import resourceSyncService from '../../services/resourceSyncService';
import './styles.scss';
import LogoutConfirmationModal from '../../components/Modals/LogoutConfirmationModal';
import { formatDateTime } from '../../utils/dateUtils';

const Profile = () => {
  const { user, logout } = useAuth();
  const [teams, setTeams] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [followedSources, setFollowedSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const userId = user?.email || user?.username;

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch teams and users in parallel
      const [teamsRes, usersRes] = await Promise.all([
        axiosInstance.get(`/api/teams?userId=${userId}`).catch(() => ({ data: [] })),
        axiosInstance.get('/api/users').catch(() => ({ data: [] }))
      ]);

      setTeams(teamsRes.data || []);
      setTeamMembers(usersRes.data || []);

      // Fetch all sources to determine followed feeds
      const [formsData, alertsData, releasesData, policyData, visaData, procData] = await Promise.allSettled([
        resourceSyncService.getAllFormStatuses(userId),
        resourceSyncService.getNewsroomStatus('newsroom-alerts', userId),
        resourceSyncService.getNewsroomStatus('news-releases', userId),
        resourceSyncService.getPolicyManualStatus('policy-updates', userId),
        resourceSyncService.getVisaBulletinStatus('filing-charts', userId),
        resourceSyncService.getAllProcessingTimesStatuses(userId),
      ]);

      const flatSources = [
        // Forms
        ...(formsData.status === 'fulfilled' ? formsData.value.map(item => ({
          id: item.id,
          title: `Form ${item.id}`,
          subtitle: item.displayName?.replace(/^USCIS Form /i, '').trim() || 'USCIS Form',
          category: 'forms',
          categoryLabel: 'USCIS Form',
          status: item.status,
          subscribed: item.subscribed,
          path: `/form/${item.id}`
        })) : []),

        // Newsroom & Announcements
        ...(alertsData.status === 'fulfilled' && alertsData.value ? [{
          id: 'newsroom-alerts',
          title: 'Announcements',
          subtitle: 'USCIS Announcements & Alerts',
          category: 'newsroom',
          categoryLabel: 'Newsroom Alerts',
          status: alertsData.value.enabled ? 'Active' : 'Inactive',
          subscribed: alertsData.value.subscribed,
          path: '/newsroom/newsroom-alerts'
        }] : []),

        ...(releasesData.status === 'fulfilled' && releasesData.value ? [{
          id: 'news-releases',
          title: 'News Releases',
          subtitle: 'USCIS Press & Media Releases',
          category: 'newsroom',
          categoryLabel: 'News Releases',
          status: releasesData.value.enabled ? 'Active' : 'Inactive',
          subscribed: releasesData.value.subscribed,
          path: '/newsroom/news-releases'
        }] : []),

        ...(policyData.status === 'fulfilled' && policyData.value ? [{
          id: 'policy-updates',
          title: 'Policy Manual',
          subtitle: 'USCIS Substantive Guidance Updates',
          category: 'newsroom',
          categoryLabel: 'Policy Updates',
          status: policyData.value.enabled ? 'Active' : 'Inactive',
          subscribed: policyData.value.subscribed,
          path: '/newsroom/policy-updates'
        }] : []),

        // Visa Bulletins
        ...(visaData.status === 'fulfilled' && visaData.value ? [{
          id: 'visa-bulletin',
          title: 'Visa Bulletin',
          subtitle: 'Adjustment of Status Filing Charts',
          category: 'bulletins',
          categoryLabel: 'Filing Determinations',
          status: visaData.value.enabled ? 'Active' : 'Inactive',
          subscribed: visaData.value.subscribed,
          path: '/newsroom/visa-bulletin'
        }] : []),

        // Processing Times
        ...(procData.status === 'fulfilled' ? procData.value.map(item => ({
          id: item.resourceId,
          title: `Processing Times ${item.resourceId}`,
          subtitle: item.displayName || 'USCIS Backlog Wait Times',
          category: 'bulletins',
          categoryLabel: 'USCIS Wait Times',
          status: item.enabled ? 'Active' : 'Inactive',
          subscribed: item.subscribed,
          path: `/processing-times/${item.resourceId}`
        })) : [])
      ];

      // Only show the ones that the user has subscribed to
      setFollowedSources(flatSources.filter(s => s.subscribed));
    } catch (err) {
      console.error('Error fetching profile dashboard details:', err);
      setError('Failed to fetch teams or followed streams.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  if (!user) return null;

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : (user?.username || user?.email || 'U').slice(0, 2).toUpperCase();

  return (
    <div className="profilePage">
      <div className="profileHeading">
        <h1 className="profileTitle">User Profile</h1>
        <p className="profileSubtitle">
          Manage your personal details, workspace authorization, and monitored feeds.
        </p>
      </div>

      <div className="profileLayout">
        {/* Left Column: Profile Card */}
        <div className="profileSidebar">
          <div className="profileCard">
            <div className="profileHeader">
              <div className="avatarLarge">
                {initials}
              </div>
              <div className="headerInfo">
                <h2>{user.fullName}</h2>
                <p className="usernameTag">@{user.username}</p>
              </div>
            </div>

            <div className="profileContent">
              <div className="infoSection">
                <div className="infoItem">
                  <div className="iconBox">
                    <Mail size={18} />
                  </div>
                  <div className="details">
                    <label>Email Address</label>
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="infoItem">
                  <div className="iconBox">
                    <Shield size={18} />
                  </div>
                  <div className="details">
                    <label>Assigned Roles</label>
                    <div className="roleTags">
                      {user.roles?.map(role => (
                        <span key={role} className={`roleTag role-${role.toLowerCase()}`}>{role}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="infoItem">
                  <div className="iconBox">
                    <Calendar size={18} />
                  </div>
                  <div className="details">
                    <label>Member Since</label>
                    <span>{user.createdAt ? formatDateTime(user.createdAt) : 'Founding Member'}</span>
                  </div>
                </div>
              </div>

              <div className="actionSection">
                <Button variant="danger" onClick={() => setIsLogoutModalOpen(true)} icon={<LogOut size={16} />} className="logoutAction">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Teams and Followed Sources */}
        <div className="profileDashboard">
          {/* Teams Section */}
          <div className="dashboardCard">
            <div className="cardHeader">
              <Users size={20} className="cardIcon" />
              <h3>Assigned Workspaces & Teams</h3>
            </div>
            
            <div className="cardBody">
              {loading ? (
                <div className="skeletonList">
                  <div className="skeletonItem"></div>
                  <div className="skeletonItem"></div>
                </div>
              ) : error ? (
                <p className="errorText">{error}</p>
              ) : teams.length === 0 ? (
                <div className="emptyStateText">
                  <p>You are not currently assigned to any teams.</p>
                  <p className="subtext">Ask your Super Administrator to map your account to a team.</p>
                </div>
              ) : (
                <div className="teamsList">
                  {teams.map(team => (
                    <div key={team.id || team._id} className="profileTeamItem">
                      <div className="teamInfo">
                        <div className="teamHeaderRow">
                          <h4 className="teamName">{team.name}</h4>
                          <span className={`statusBadge ${team.status === 'ACTIVE' || team.active ? 'active' : 'inactive'}`}>
                            {team.status || 'ACTIVE'}
                          </span>
                        </div>
                        {team.description && <p className="teamDescription">{team.description}</p>}
                        <p className="orgName">Organization: {team.organization?.name || 'Default Organization'}</p>
                      </div>

                      {/* Team members sub-section */}
                      <div className="profileTeamMembers">
                        <h5>Team Members</h5>
                        <div className="memberTags">
                          {teamMembers.filter(member => member.teamId === team.id).map(member => (
                            <div key={member.id} className="memberTag">
                              <span className="memberName">{member.fullName || member.username}</span>
                              <span className="memberEmail">({member.email})</span>
                            </div>
                          ))}
                          {teamMembers.filter(member => member.teamId === team.id).length === 0 && (
                            <span className="noMembers">No other team members assigned.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Followed Sources Section */}
          <div className="dashboardCard">
            <div className="cardHeader">
              <Layers size={20} className="cardIcon" />
              <h3>Followed Streams & Sources</h3>
            </div>
            
            <div className="cardBody">
              {loading ? (
                <div className="skeletonList">
                  <div className="skeletonItem"></div>
                  <div className="skeletonItem"></div>
                </div>
              ) : followedSources.length === 0 ? (
                <div className="emptyStateText">
                  <p>You are not currently monitoring any regulatory streams.</p>
                  <Link to="/sources" className="profileNavigateLink">
                    Explore & Subscribe to Monitored Sources <ExternalLink size={14} />
                  </Link>
                </div>
              ) : (
                <div className="followedSourcesList">
                  {followedSources.map(source => (
                    <Link to={source.path} key={source.id} className="profileSourceItem">
                      <div className="sourceMeta">
                        <span className="sourceCategoryBadge">{source.categoryLabel}</span>
                        <h4 className="sourceTitle">{source.title}</h4>
                        <p className="sourceSubtitle">{source.subtitle}</p>
                      </div>
                      <div className="sourceLinkArrow">
                        <ExternalLink size={16} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
};

export default Profile;
