import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import ProjectSettings from './ProjectSettings';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ProjectContext
const mockRefreshProjects = vi.fn();
const mockProjectContext: {
  activeProject: any;
  refreshProjects: any;
} = {
  activeProject: null,
  refreshProjects: mockRefreshProjects,
};

vi.mock('../../context/ProjectContext', () => ({
  useProjectContext: () => mockProjectContext,
}));

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => true, data: () => ({ fullName: 'Test User', email: 'test@example.com' }) })),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

// Mock roles
vi.mock('../../lib/roles', () => ({
  ROLE_LABELS: {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  },
  ROLE_DESCRIPTIONS: {
    owner: 'Full control over the project',
    admin: 'Can manage members and settings',
    editor: 'Can create and edit tasks',
    viewer: 'Can only view tasks',
  },
  ROLE_COLORS: {
    owner: '#ef4444',
    admin: '#f59e0b',
    editor: '#3b82f6',
    viewer: '#6b7280',
  },
  getUserRole: vi.fn(() => 'admin'),
  canManageMembers: vi.fn(() => true),
  canDeleteProject: vi.fn(() => false),
  canLeaveProject: vi.fn(() => true),
}));

const renderProjectSettings = () =>
  render(
    <MemoryRouter>
      <ProjectSettings onClose={() => {}} />
    </MemoryRouter>
  );

describe('ProjectSettings component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockRefreshProjects.mockClear();
    vi.clearAllMocks();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-user-id'),
      },
      writable: true,
    });
  });

  describe('when no active project', () => {
    test('shows alert and navigates to account', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockProjectContext.activeProject = null;

      renderProjectSettings();

      expect(alertSpy).toHaveBeenCalledWith('Error: No project selected');
      expect(mockNavigate).toHaveBeenCalledWith('/account');
      alertSpy.mockRestore();
    });
  });

  describe('when user is admin/owner', () => {
    beforeEach(() => {
      mockProjectContext.activeProject = {
        id: 'test-project-id',
        name: 'Test Project',
        members: ['test-user-id', 'other-user-id'],
        memberRoles: [
          { userId: 'test-user-id', role: 'admin', addedAt: Date.now() },
          { userId: 'other-user-id', role: 'viewer', addedAt: Date.now() },
        ],
      };
    });

    test('renders project settings title', () => {
      renderProjectSettings();
      expect(screen.getByText('Project Settings')).toBeInTheDocument();
    });

    test('renders project name input', () => {
      renderProjectSettings();
      expect(screen.getByDisplayValue('Test Project')).toBeInTheDocument();
    });

    test('renders current members section', () => {
      renderProjectSettings();
      expect(screen.getByText('Current Members')).toBeInTheDocument();
    });

    test('renders add friends section', () => {
      renderProjectSettings();
      expect(screen.getByText('Add Friends')).toBeInTheDocument();
    });

    test('renders save changes button', () => {
      renderProjectSettings();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    test('renders cancel button', () => {
      renderProjectSettings();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
}); 