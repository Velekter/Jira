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
  isInitialized: boolean;
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
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshProjects = async () => {
    if (!userId || userId.trim() === '') {
      return;
    }

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

          if (orderedProjects.length > 0) {
            const lastId = localStorage.getItem('activeProjectId');
            const found = orderedProjects.find(p => p.id === lastId) || orderedProjects[0] || null;

            if (found) {
              await selectProject(found);
            } else {
              setActiveProjectState(null);
              localStorage.removeItem('activeProjectId');
            }
          } else {
            setActiveProjectState(null);
            localStorage.removeItem('activeProjectId');
          }

          setError(null);
          setIsLoading(false);
          setIsInitialized(true);


        },
        error => {
          console.error('Error listening to projects:', error);
          setError(error.message);
          setIsLoading(false);
          setIsInitialized(true);
        }
      );

      setUnsubscribeProjects(() => unsubscribe);
    } catch (e: any) {
      console.error('Error in refreshProjects:', e);
      setError(e.message);
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  useEffect(() => {
    if (userId && userId.trim() !== '') {
      setIsInitialized(false);
      refreshProjects();
    } else {
      setIsInitialized(true);
      setIsLoading(false);
      setProjects([]);
      setActiveProjectState(null);
      localStorage.removeItem('activeProjectId');
    }

    return () => {
      if (unsubscribeProjects) {
        unsubscribeProjects();
      }
    };
  }, [userId]);

  const selectProject = async (project: ProjectWithBoards) => {
    const boards = await getBoards(project.id);
    const updatedProject = { ...project, boards };
    setActiveProjectState(updatedProject);
    localStorage.setItem('activeProjectId', project.id);
  };

  const reorderProjects = (draggedIndex: number, dropIndex: number) => {
    setProjects(prev => {
      const newProjects = [...prev];
      const [dragged] = newProjects.splice(draggedIndex, 1);
      newProjects.splice(dropIndex, 0, dragged);

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
        isInitialized,
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
