import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchProjects } from '../hooks/useProjects';
import type { Project, ProjectRole, ProjectMember } from '../hooks/useProjects';
import { getBoards } from '../lib/boards';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ProjectWithBoards extends Project {
  boards?: { id: string; name: string; color?: string }[];
}

interface ProjectContextType {
  projects: ProjectWithBoards[];
  activeProject: ProjectWithBoards | null;
  setActiveProject: (project: ProjectWithBoards) => void;
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => void;
  reorderProjects: (draggedIndex: number, dropIndex: number) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ userId: string; children: React.ReactNode }> = ({
  userId,
  children,
}) => {
  const [projects, setProjects] = useState<ProjectWithBoards[]>([]);
  const [activeProject, setActiveProjectState] = useState<ProjectWithBoards | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unsubscribeProjects, setUnsubscribeProjects] = useState<(() => void) | null>(null);

  const refreshProjects = () => {
    if (!userId) return;

    if (unsubscribeProjects) {
      unsubscribeProjects();
    }

    try {
      setIsLoading(true);

      const projectsQuery = query(
        collection(db, 'projects'),
        where('members', 'array-contains', userId)
      );

      const unsubscribe = onSnapshot(
        projectsQuery,
        async snapshot => {
          const fetched = snapshot.docs.map(doc => {
            const data = doc.data() as {
              name: string;
              owner: string;
              members: string[];
              memberRoles?: ProjectMember[];
              createdAt: number;
            };
            return {
              id: doc.id,
              ...data,
              memberRoles: data.memberRoles || [
                { userId: data.owner, role: 'owner', addedAt: data.createdAt },
              ],
            };
          });

          const savedOrder = localStorage.getItem('projectOrder');
          let orderedProjects = fetched;

          if (savedOrder) {
            try {
              const orderArray = JSON.parse(savedOrder);
              orderedProjects = orderArray
                .map((id: string) => fetched.find(p => p.id === id))
                .filter(Boolean);

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
          setIsLoading(false);
        },
        error => {
          console.error('Error listening to projects:', error);
          setError(error.message);
          setIsLoading(false);
        }
      );

      setUnsubscribeProjects(() => unsubscribe);
    } catch (e: any) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProjects();

    return () => {
      if (unsubscribeProjects) {
        unsubscribeProjects();
      }
    };
  }, [userId]);

  const selectProject = async (project: ProjectWithBoards) => {
    console.log('Selecting project:', project.id);
    const boards = await getBoards(project.id);
    console.log('Loaded boards for project:', project.id, boards);
    const updatedProject = { ...project, boards };
    setActiveProjectState(updatedProject);
    localStorage.setItem('activeProjectId', project.id);
  };

  const reorderProjects = (draggedIndex: number, dropIndex: number) => {
    console.log('reorderProjects called with:', draggedIndex, dropIndex);
    setProjects(prev => {
      console.log('Previous projects:', prev);
      const newProjects = [...prev];
      const [dragged] = newProjects.splice(draggedIndex, 1);
      newProjects.splice(dropIndex, 0, dragged);

      console.log('New projects order:', newProjects);

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
