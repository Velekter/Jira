import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useProjectContext } from '../../context/ProjectContext';
import './projectSettings.scss';

interface ProjectSettingsProps {
  onClose: () => void;
}

interface Friend {
  id: string;
  fullName: string;
  email: string;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ onClose }) => {
  const { activeProject, refreshProjects } = useProjectContext();
  const [projectName, setProjectName] = useState('');
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (activeProject) {
      setProjectName(activeProject.name);
      loadAvailableFriends();
    }
  }, [activeProject]);

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
          friendsIds.map(async (friendId) => {
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
  };

  const handleSave = async () => {
    if (!activeProject || !projectName.trim()) return;

    try {
      setSaving(true);
      const projectRef = doc(db, 'projects', activeProject.id);
      
      const updates: any = { name: projectName.trim() };
      
      if (selectedFriends.length > 0) {
        const currentMembers = activeProject.members || [];
        updates.members = [...currentMembers, ...selectedFriends];
      }

      await updateDoc(projectRef, updates);
      await refreshProjects();
      window.location.href = '/account';
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeProject) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this project? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    try {
      setDeleting(true);
      const projectRef = doc(db, 'projects', activeProject.id);
      await deleteDoc(projectRef);
      await refreshProjects();
      window.location.href = '/account';
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
        <button className="back-btn" onClick={() => window.location.href = '/account'}>
          ← Back
        </button>
        <h1>Project Settings</h1>
      </div>
      <div className="page-content">
          <div className="setting-section">
            <h3>Project Name</h3>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              className="project-name-input"
            />
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
              <div className="friends-list">
                {availableFriends.map(friend => (
                  <label key={friend.id} className="friend-item">
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
                ))}
              </div>
            )}
          </div>

          <div className="setting-section">
            <h3>Danger Zone</h3>
            <div className="danger-zone">
              <p>Once you delete a project, there is no going back. Please be certain.</p>
              <button 
                className="delete-project-btn" 
                onClick={handleDelete}
                disabled={deleting}
              >
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

        <div className="page-footer">
          <button className="cancel-btn" onClick={() => window.location.href = '/account'}>
            Cancel
          </button>
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
        </div>
      </div>
    </div>
  );
};

export default ProjectSettings; 