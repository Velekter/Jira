import type { ProjectRole, ProjectMember } from '../hooks/useProjects';

export const ROLE_HIERARCHY: Record<ProjectRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const ROLE_LABELS: Record<ProjectRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const ROLE_DESCRIPTIONS: Record<ProjectRole, string> = {
  owner: 'Full control over the project',
  admin: 'Can manage members and settings',
  editor: 'Can create and edit tasks',
  viewer: 'Can only view tasks',
};

export const ROLE_COLORS: Record<ProjectRole, string> = {
  owner: '#ef4444',
  admin: '#f59e0b',
  editor: '#3b82f6',
  viewer: '#6b7280',
};

export function getUserRole(
  project: { memberRoles: ProjectMember[] },
  userId: string
): ProjectRole | null {
  const member = project.memberRoles.find(m => m.userId === userId);
  return member?.role || null;
}

export function hasPermission(userRole: ProjectRole | null, requiredRole: ProjectRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export function canManageMembers(userRole: ProjectRole | null): boolean {
  return hasPermission(userRole, 'admin');
}

export function canEditProject(userRole: ProjectRole | null): boolean {
  return hasPermission(userRole, 'editor');
}

export function canDeleteProject(userRole: ProjectRole | null): boolean {
  return hasPermission(userRole, 'owner');
}

export function canLeaveProject(userRole: ProjectRole | null): boolean {
  return userRole !== 'owner';
}

export function getAvailableRoles(currentUserRole: ProjectRole): ProjectRole[] {
  const roles: ProjectRole[] = ['viewer', 'editor', 'admin'];
  if (currentUserRole === 'owner') {
    roles.push('owner');
  }
  return roles;
}
