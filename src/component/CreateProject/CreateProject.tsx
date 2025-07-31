import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { createProjectHooks } from '../../hooks/useProjects';
import { useProjectContext } from '../../context/ProjectContext';
import './createProject.scss';

interface Friend {
  id: string;
  fullName: string;
  email: string;
}

interface CreateProjectProps {
  userId: string;
  setShowCreateProject: (show: boolean) => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({ userId, setShowCreateProject }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const { refreshProjects } = useProjectContext();

  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDocRef, async docSnap => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
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

        setFriends(friendsData.filter(Boolean) as Friend[]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    await createProjectHooks(userId, projectName, selectedFriends);

    await refreshProjects();

    setShowCreateProject(false);
  };

  if (loading) {
    return (
      <div className="create-project">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="create-project">
      <h2>Create a New Project</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="Project name"
        />

        <h3>Select Friends</h3>
        {friends.length === 0 ? (
          <div className="no-friends">
            <p>You don't have any friends yet.</p>
            <p>Add friends first to collaborate on projects!</p>
          </div>
        ) : (
          <div className="friends-list">
            {friends.map(friend => (
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

        <button type="submit" disabled={!projectName.trim()}>
          Create Project
        </button>
      </form>
    </div>
  );
};

export default CreateProject;
