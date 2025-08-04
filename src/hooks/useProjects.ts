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

  const userProjects = allProjects.filter(project => project.members.includes(userId));

  return userProjects;
};

export const createProjectHooks = async (
  userId: string,
  name: string,
  friends: string[] = [],
  friendRoles: { [key: string]: ProjectRole } = {}
) => {

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

  const projectRef = await addDoc(collection(db, 'projects'), projectData);
  const projectId = projectRef.id;

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



  return projectId;
};
