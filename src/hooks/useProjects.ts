import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';

export type ProjectRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface ProjectMember {
  userId: string;
  role: ProjectRole;
  addedAt: number;
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  members: string[];
  memberRoles: ProjectMember[];
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
  const allProjects = projectsSnapshot.docs.map(doc => {
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

  console.log('All projects from collection:', allProjects);

  const userProjects = allProjects.filter(project => project.members.includes(userId));

  console.log('User projects:', userProjects);

  return userProjects;
};

export const createProjectHooks = async (
  userId: string,
  name: string,
  friends: string[] = [],
  friendRoles: { [key: string]: ProjectRole } = {}
) => {
  console.log('Creating project with:', { userId, name, friends, friendRoles });

  const now = Date.now();
  const memberRoles: ProjectMember[] = [{ userId, role: 'owner', addedAt: now }];

  friends.forEach(friendId => {
    memberRoles.push({
      userId: friendId,
      role: friendRoles[friendId] || 'viewer',
      addedAt: now,
    });
  });

  const projectData = {
    name,
    owner: userId,
    members: [userId, ...friends],
    memberRoles,
    createdAt: now,
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
