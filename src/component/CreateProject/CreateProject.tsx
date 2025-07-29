import React, { useState } from 'react';
import { createProjectHooks } from '../../hooks/useProjects';
import { useProjectContext } from '../../context/ProjectContext';
import './createProject.scss';

interface CreateProjectProps {
  userId: string;
  setShowCreateProject: (show: boolean) => void;
}

const CreateProject: React.FC<CreateProjectProps> = ({ userId, setShowCreateProject }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

  const { refreshProjects } = useProjectContext();

  const friends = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Alex Brown' },
  ];

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
        <div className="friends-list">
          {friends.map(friend => (
            <label key={friend.id}>
              <input
                type="checkbox"
                checked={selectedFriends.includes(friend.id)}
                onChange={() => toggleFriend(friend.id)}
              />
              {friend.name}
            </label>
          ))}
        </div>

        <button type="submit">Create Project</button>
      </form>
    </div>
  );
};

export default CreateProject;
