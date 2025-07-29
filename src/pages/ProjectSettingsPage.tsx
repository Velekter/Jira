import React from 'react';
import ProjectSettings from '../component/ProjectSettings/ProjectSettings';

const ProjectSettingsPage: React.FC = () => {
  return <ProjectSettings onClose={() => window.history.back()} />;
};

export default ProjectSettingsPage; 