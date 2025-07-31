import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import { getUserRole } from '../../lib/roles';
import ProjectSettings from '../ProjectSettings/ProjectSettings';

const ProtectedProjectSettings: React.FC = () => {
  const { activeProject } = useProjectContext();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId') ?? '';

  useEffect(() => {
    if (!activeProject) {
      alert('Error: No project selected');
      navigate('/account');
      return;
    }

    // Перевіряємо, чи користувач є учасником проекту
    const userRole = getUserRole(activeProject, userId);
    if (!userRole) {
      alert('Error: You are not a member of this project.');
      navigate('/account');
      return;
    }
  }, [activeProject, userId, navigate]);

  if (!activeProject) {
    return <div>Loading...</div>;
  }

  const userRole = getUserRole(activeProject, userId);
  if (!userRole) {
    return <div>Access denied - You are not a member of this project</div>;
  }

  return <ProjectSettings onClose={() => navigate('/account')} />;
};

export default ProtectedProjectSettings;
