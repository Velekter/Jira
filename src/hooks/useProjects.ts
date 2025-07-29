import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

export interface Project {
  id: string;
  name: string;
  owner: string;
  members: string[];
  createdAt: number;
}

const DEFAULT_BOARDS = [
  { name: 'todo', color: '#f8d471ff' },
  { name: 'inProgress', color: '#5224fbff' },
  { name: 'done', color: '#4ADE80' },
];

export const fetchProjects = async (userId: string): Promise<Project[]> => {
  console.log('Fetching projects for user:', userId);
  
  
  const projectsSnapshot = await getDocs(collection(db, 'projects'));
  const allProjects = projectsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as { name: string; owner: string; members: string[]; createdAt: number }),
  }));
  
  console.log('All projects from collection:', allProjects);

  
  const userProjects = allProjects.filter(project => 
    project.members.includes(userId)
  );
    
  console.log('User projects:', userProjects);
  
  return userProjects;
};

export const createProjectHooks = async (userId: string, name: string, friends: string[] = []) => {
  console.log('Creating project with:', { userId, name, friends });
  
  
  const projectData = {
    name,
    owner: userId,
    members: [userId, ...friends],
    createdAt: Date.now(),
  };

  console.log('Project data:', projectData);

  const projectRef = await addDoc(collection(db, 'projects'), projectData);
  const projectId = projectRef.id;
  
  console.log('Created project with ID:', projectId);

  
  const boardsCollection = collection(db, `projects/${projectId}/boards`);
  for (let i = 0; i < DEFAULT_BOARDS.length; i++) {
    const board = DEFAULT_BOARDS[i];
    await addDoc(boardsCollection, {
      name: board.name,
      color: board.color,
      createdAt: Date.now(),
      order: i,
    });
  }

  console.log('Created default boards for project');

  return projectId;
};
