import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchProjects } from '../hooks/useProjects';
import { getBoards } from '../lib/boards';

export interface Project {
  id: string;
  name: string;
  boards?: { id: string; name: string; color?: string }[];
}

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  reorderProjects: (draggedIndex: number, dropIndex: number) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({
  userId,
  children,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Завантаження проєктів
  const refreshProjects = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const fetched = await fetchProjects(userId);

      // Завантажуємо збережений порядок проектів
      const savedOrder = localStorage.getItem('projectOrder');
      let orderedProjects = fetched;

      if (savedOrder) {
        try {
          const orderArray = JSON.parse(savedOrder);
          // Сортуємо проекти за збереженим порядком
          orderedProjects = orderArray
            .map((id: string) => fetched.find(p => p.id === id))
            .filter(Boolean);
          
          // Додаємо нові проекти, які не були в збереженому порядку
          const newProjects = fetched.filter(p => !orderArray.includes(p.id));
          orderedProjects = [...orderedProjects, ...newProjects];
        } catch (e) {
          console.error('Error parsing project order:', e);
        }
      }

      setProjects(orderedProjects);

      const lastId = localStorage.getItem('activeProjectId');
      const found = orderedProjects.find(p => p.id === lastId) || orderedProjects[0] || null;

      if (found) {
        await selectProject(found);
      } else {
        setActiveProjectState(null);
      }

      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();
  }, [userId]);

  // Вибір проекту з завантаженням дощок
  const selectProject = async (project: Project) => {
    const userId = localStorage.getItem('userId'); // або передай з пропсів
    if (!userId) {
      console.error('❌ UserId not found in localStorage');
      return;
    }

    const boards = await getBoards(userId, project.id); // передаємо два аргументи!
    const updatedProject = { ...project, boards };
    setActiveProjectState(updatedProject);
    localStorage.setItem('activeProjectId', project.id);
  };

  // Зміна порядку проектів
  const reorderProjects = (draggedIndex: number, dropIndex: number) => {
    console.log('reorderProjects called with:', draggedIndex, dropIndex);
    setProjects(prev => {
      console.log('Previous projects:', prev);
      const newProjects = [...prev];
      const [dragged] = newProjects.splice(draggedIndex, 1);
      newProjects.splice(dropIndex, 0, dragged);
      
      console.log('New projects order:', newProjects);
      
      // Зберігаємо порядок в localStorage
      const projectOrder = newProjects.map(p => p.id);
      localStorage.setItem('projectOrder', JSON.stringify(projectOrder));
      
      return newProjects;
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject: selectProject,
        isLoading,
        error,
        refreshProjects,
        reorderProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjectContext = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjectContext must be used within ProjectProvider');
  return context;
};
