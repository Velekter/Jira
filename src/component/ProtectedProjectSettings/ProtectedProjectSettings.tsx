import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import { getUserRole, canManageMembers } from '../../lib/roles';
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

    const userRole = getUserRole(activeProject, userId);
    if (!canManageMembers(userRole)) {
      alert(
        'Error: You do not have permission to access project settings. You need Admin or higher role.'
      );
      navigate('/account');
      return;
    }
  }, [activeProject, userId, navigate]);

  if (!activeProject) {
    return <div>Loading...</div>;
  }

  const userRole = getUserRole(activeProject, userId);
  if (!canManageMembers(userRole)) {
    return <div>Access denied</div>;
  }

  return <ProjectSettings onClose={() => navigate('/account')} />;
};

export default ProtectedProjectSettings;
