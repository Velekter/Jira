import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useProjectContext } from '../../context/ProjectContext';
import type { ProjectRole, ProjectMember } from '../../hooks/useProjects';
import {
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
  getUserRole,
  canManageMembers,
  canDeleteProject,
  canLeaveProject,
} from '../../lib/roles';
import { useNavigate } from 'react-router-dom';
import './projectSettings.scss';

interface ProjectSettingsProps {
  onClose: () => void;
}

interface Friend {
  id: string;
  fullName: string;
  email: string;
}

interface MemberWithRole {
  userId: string;
  fullName: string;
  email: string;
  role: ProjectRole;
  addedAt: number;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = () => {
  const { activeProject, refreshProjects } = useProjectContext();
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userId') ?? '';
  const userRole = activeProject ? getUserRole(activeProject, currentUserId) : null;
  const [projectName, setProjectName] = useState('');
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: ProjectRole }>({});
  const [currentMembers, setCurrentMembers] = useState<MemberWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (!activeProject) {
      alert('Error: No project selected');
      navigate('/account');
      return;
    }

    if (activeProject) {
      setProjectName(activeProject.name);
      loadCurrentMembers();
      if (canManageMembers(userRole)) {
        loadAvailableFriends();
      }
    }
  }, [activeProject, userRole, navigate]);

  useEffect(() => {
    const filtered = availableFriends.filter(
      friend =>
        friend.fullName.toLowerCase().includes(friendSearch.toLowerCase()) ||
        friend.email.toLowerCase().includes(friendSearch.toLowerCase())
    );
    setFilteredFriends(filtered);
  }, [availableFriends, friendSearch]);

  const loadCurrentMembers = async () => {
    if (!activeProject) return;

    try {
      const membersData = await Promise.all(
        activeProject.memberRoles.map(async member => {
          const userDoc = await getDoc(doc(db, 'users', member.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return {
              userId: member.userId,
              fullName: userData.fullName || 'Unknown User',
              email: userData.email || 'unknown@email.com',
              role: member.role,
              addedAt: member.addedAt,
            } as MemberWithRole;
          }
          return null;
        })
      );

      setCurrentMembers(membersData.filter(Boolean) as MemberWithRole[]);
    } catch (error) {
      console.error('Error loading current members:', error);
    }
  };

  const loadAvailableFriends = async () => {
    if (!activeProject) return;

    try {
      setLoading(true);
      const userId = localStorage.getItem('userId') ?? '';
      const userDoc = await getDoc(doc(db, 'users', userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const friendsObj = userData.friends || {};
        const friendsIds = Object.keys(friendsObj);

        const friendsData = await Promise.all(
          friendsIds.map(async friendId => {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              return { id: friendDoc.id, ...friendDoc.data() } as Friend;
            }
            return null;
          })
        );

        const validFriends = friendsData.filter(Boolean) as Friend[];
        const currentMembers = activeProject.members || [];

        setAvailableFriends(validFriends.filter(friend => !currentMembers.includes(friend.id)));
        setSelectedFriends([]);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );

    if (!selectedFriends.includes(friendId)) {
      setSelectedRoles(prev => ({
        ...prev,
        [friendId]: 'viewer',
      }));
    } else {
      setSelectedRoles(prev => {
        const newRoles = { ...prev };
        delete newRoles[friendId];
        return newRoles;
      });
    }
  };

  const updateFriendRole = (friendId: string, role: ProjectRole) => {
    setSelectedRoles(prev => ({
      ...prev,
      [friendId]: role,
    }));
  };

  const updateMemberRole = async (memberId: string, newRole: ProjectRole) => {
    if (!activeProject) return;

    try {
      const projectRef = doc(db, 'projects', activeProject.id);
      const updatedMemberRoles = activeProject.memberRoles.map(member =>
        member.userId === memberId ? { ...member, role: newRole } : member
      );

      await updateDoc(projectRef, { memberRoles: updatedMemberRoles });
      await refreshProjects();
      await loadCurrentMembers();
    } catch (error) {
      console.error('Error updating member role:', error);
      alert('Error updating member role. Please try again.');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!activeProject) return;

    const memberToRemove = activeProject.memberRoles.find(member => member.userId === memberId);
    if (memberToRemove?.role === 'owner') {
      alert('Cannot remove the project owner. The owner can only delete the project.');
      return;
    }

    const confirmRemove = window.confirm('Are you sure you want to remove this member?');
    if (!confirmRemove) return;

    try {
      const projectRef = doc(db, 'projects', activeProject.id);
      const updatedMembers = activeProject.members.filter(id => id !== memberId);
      const updatedMemberRoles = activeProject.memberRoles.filter(
        member => member.userId !== memberId
      );

      await updateDoc(projectRef, {
        members: updatedMembers,
        memberRoles: updatedMemberRoles,
      });
      await refreshProjects();
      await loadCurrentMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      alert('Error removing member. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!activeProject || !projectName.trim()) return;

    try {
      setSaving(true);
      const projectRef = doc(db, 'projects', activeProject.id);

      const updates: any = { name: projectName.trim() };

      if (selectedFriends.length > 0) {
        const currentMembers = activeProject.members || [];
        const currentMemberRoles = activeProject.memberRoles || [];

        const newMembers = [...currentMembers, ...selectedFriends];
        const newMemberRoles = [
          ...currentMemberRoles,
          ...selectedFriends.map(friendId => ({
            userId: friendId,
            role: selectedRoles[friendId] || 'viewer',
            addedAt: Date.now(),
          })),
        ];

        updates.members = newMembers;
        updates.memberRoles = newMemberRoles;
      }

      await updateDoc(projectRef, updates);
      await refreshProjects();
      setSaveMessage('Project updated successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!activeProject) return;

    if (!canLeaveProject(userRole)) {
      alert(
        'Error: You cannot leave this project because you are the owner. You can only delete the project.'
      );
      return;
    }

    const confirmLeave = window.confirm(
      'Are you sure you want to leave this project? You will lose access to it.'
    );

    if (!confirmLeave) return;

    try {
      setLeaving(true);
      const projectRef = doc(db, 'projects', activeProject.id);

      const updatedMembers = activeProject.members.filter(id => id !== currentUserId);
      const updatedMemberRoles = activeProject.memberRoles.filter(
        member => member.userId !== currentUserId
      );

      await updateDoc(projectRef, {
        members: updatedMembers,
        memberRoles: updatedMemberRoles,
      });

      await refreshProjects();
      navigate('/account');
    } catch (error) {
      console.error('Error leaving project:', error);
      alert('Error leaving project. Please try again.');
    } finally {
      setLeaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeProject) return;

    if (!canDeleteProject(userRole)) {
      alert(
        'Error: You do not have permission to delete this project. Only the project owner can delete it.'
      );
      return;
    }

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this project? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      const projectRef = doc(db, 'projects', activeProject.id);
      await deleteDoc(projectRef);
      
      localStorage.removeItem('activeProjectId');
      await refreshProjects();
      
      navigate('/account');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (!activeProject) {
    return null;
  }

  return (
    <div className="project-settings-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => (window.location.href = '/account')}>
          ← Back
        </button>
        <h1>{canManageMembers(userRole) ? 'Project Settings' : 'Project Information'}</h1>
      </div>
      {saveMessage && <div className="save-message">{saveMessage}</div>}
      <div className="page-content">
        {canManageMembers(userRole) && (
          <>
            <div className="setting-section">
              <h3>Project Name</h3>
              <input
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="project-name-input"
              />
            </div>

            <div className="setting-section">
              <h3>Current Members</h3>
              <div className="members-list">
                {currentMembers.map(member => (
                  <div key={member.userId} className="member-item">
                    <div className="member-info">
                      <span className="member-name">{member.fullName}</span>
                      <span className="member-email">{member.email}</span>
                    </div>
                    <div className="member-actions">
                      <select
                        value={member.role}
                        onChange={e =>
                          updateMemberRole(member.userId, e.target.value as ProjectRole)
                        }
                        disabled={
                          member.userId === currentUserId ||
                          !canManageMembers(getUserRole(activeProject, currentUserId))
                        }
                        className="role-select"
                      >
                        {Object.entries(ROLE_LABELS).map(([role, label]) => (
                          <option key={role} value={role}>
                            {label}
                          </option>
                        ))}
                      </select>
                      {member.userId !== currentUserId &&
                        member.role !== 'owner' &&
                        canManageMembers(getUserRole(activeProject, currentUserId)) && (
                          <button
                            onClick={() => removeMember(member.userId)}
                            className="remove-member-btn"
                          >
                            Remove
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-section">
              <h3>Add Friends</h3>
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading friends...</p>
                </div>
              ) : availableFriends.length === 0 ? (
                <p className="no-friends">No available friends to add</p>
              ) : (
                <>
                  <div className="friends-search">
                    <input
                      type="text"
                      placeholder="Search friends by name or email..."
                      value={friendSearch}
                      onChange={e => setFriendSearch(e.target.value)}
                      className="search-input"
                    />
                    <div className="search-stats">
                      {filteredFriends.length} of {availableFriends.length} friends
                    </div>
                  </div>

                  {filteredFriends.length === 0 ? (
                    <p className="no-results">No friends match your search</p>
                  ) : (
                    <div className="friends-list">
                      {filteredFriends.map(friend => (
                        <div key={friend.id} className="friend-item">
                          <label className="friend-checkbox">
                            <input
                              type="checkbox"
                              checked={selectedFriends.includes(friend.id)}
                              onChange={() => toggleFriend(friend.id)}
                            />
                            <div className="friend-info">
                              <span className="friend-name">{friend.fullName}</span>
                              <span className="friend-email">{friend.email}</span>
                            </div>
                          </label>
                          {selectedFriends.includes(friend.id) && (
                            <select
                              value={selectedRoles[friend.id] || 'viewer'}
                              onChange={e =>
                                updateFriendRole(friend.id, e.target.value as ProjectRole)
                              }
                              className="role-select"
                            >
                              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                                <option key={role} value={role}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFriends.length > 0 && (
                    <div className="selected-summary">
                      <h4>Selected Friends ({selectedFriends.length})</h4>
                      <div className="selected-friends">
                        {selectedFriends.map(friendId => {
                          const friend = availableFriends.find(f => f.id === friendId);
                          const role = selectedRoles[friendId] || 'viewer';
                          return friend ? (
                            <div key={friendId} className="selected-friend">
                              <span className="friend-name">{friend.fullName}</span>
                              <span
                                className="role-badge"
                                style={{ backgroundColor: ROLE_COLORS[role] }}
                              >
                                {ROLE_LABELS[role]}
                              </span>
                              <button
                                onClick={() => toggleFriend(friendId)}
                                className="remove-selected-btn"
                              >
                                ×
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {!canManageMembers(userRole) && (
          <>
            <div className="setting-section">
              <h3>Project Information</h3>
              <div className="project-info-readonly">
                <p>
                  <strong>Project Name:</strong> {activeProject.name}
                </p>
                <p>
                  <strong>Your Role:</strong>
                  <span
                    className="role-badge"
                    style={{ backgroundColor: ROLE_COLORS[userRole || 'viewer'] }}
                  >
                    {ROLE_LABELS[userRole || 'viewer']}
                  </span>
                </p>
                <p>
                  <strong>Role Description:</strong> {ROLE_DESCRIPTIONS[userRole || 'viewer']}
                </p>
              </div>
            </div>

            <div className="setting-section">
              <h3>Project Members</h3>
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading members...</p>
                </div>
              ) : (
                <div className="members-list">
                  {currentMembers.map(member => (
                    <div key={member.userId} className="member-item">
                      <div className="member-info">
                        <span className="member-name">
                          {member.userId === currentUserId ? 'You' : member.fullName}
                        </span>
                        <span className="member-email">
                          {member.userId === currentUserId ? 'Your email' : member.email}
                        </span>
                      </div>
                      <div className="member-actions">
                        <span
                          className="role-badge"
                          style={{ backgroundColor: ROLE_COLORS[member.role] }}
                        >
                          {ROLE_LABELS[member.role]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {canLeaveProject(userRole) && (
          <div className="setting-section">
            <h3>Leave Project</h3>
            <div className="leave-project-zone">
              <p>You will lose access to this project and all its tasks.</p>
              <button className="leave-project-btn" onClick={handleLeaveProject} disabled={leaving}>
                {leaving ? (
                  <>
                    <div className="spinner"></div>
                    Leaving...
                  </>
                ) : (
                  'Leave Project'
                )}
              </button>
            </div>
          </div>
        )}

        {canDeleteProject(userRole) && (
          <div className="setting-section">
            <h3>Danger Zone</h3>
            <div className="danger-zone">
              <p>Once you delete a project, there is no going back. Please be certain.</p>
              <button className="delete-project-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? (
                  <>
                    <div className="spinner"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Project'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="page-footer">
          <button className="cancel-btn" onClick={() => (window.location.href = '/account')}>
            {canManageMembers(userRole) ? 'Cancel' : 'Back'}
          </button>
          {canManageMembers(userRole) && (
            <button
              className="save-btn"
              onClick={handleSave}
              disabled={saving || !projectName.trim()}
            >
              {saving ? (
                <>
                  <div className="spinner"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings;
