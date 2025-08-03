import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import ProtectedProjectSettings from './ProtectedProjectSettings';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockProjectContext: {
  activeProject: any;
} = {
  activeProject: null,
};

vi.mock('../../context/ProjectContext', () => ({
  useProjectContext: () => mockProjectContext,
}));

vi.mock('../../lib/roles', () => ({
  getUserRole: vi.fn(() => 'editor'),
}));

vi.mock('../ProjectSettings/ProjectSettings', () => ({
  default: () => <div data-testid="project-settings">Project Settings Component</div>,
}));

const renderProtectedProjectSettings = () =>
  render(
    <MemoryRouter>
      <ProtectedProjectSettings />
    </MemoryRouter>
  );

describe('ProtectedProjectSettings component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-user-id'),
      },
      writable: true,
    });

    Object.defineProperty(window, 'alert', {
      value: vi.fn(),
      writable: true,
    });
  });

  describe('when no active project', () => {
    test('shows alert and navigates to account', async () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      mockProjectContext.activeProject = null;

      await act(async () => {
        renderProtectedProjectSettings();
      });

      expect(alertSpy).toHaveBeenCalledWith('Error: No project selected');
      expect(mockNavigate).toHaveBeenCalledWith('/account');
      alertSpy.mockRestore();
    });

    test('shows loading state', async () => {
      mockProjectContext.activeProject = null;
      await act(async () => {
        renderProtectedProjectSettings();
      });
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('when user is a member of the project', () => {
    beforeEach(() => {
      mockProjectContext.activeProject = {
        id: 'test-project-id',
        name: 'Test Project',
        members: ['test-user-id', 'other-user-id'],
        memberRoles: [
          { userId: 'test-user-id', role: 'editor', addedAt: Date.now() },
          { userId: 'other-user-id', role: 'admin', addedAt: Date.now() },
        ],
      };
    });

    test('renders ProjectSettings component', async () => {
      await act(async () => {
        renderProtectedProjectSettings();
      });
      expect(screen.getByTestId('project-settings')).toBeInTheDocument();
    });

    test('does not show loading state', async () => {
      await act(async () => {
        renderProtectedProjectSettings();
      });
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
