import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Header from './Header';

const mockProjectContext: {
  activeProject: any;
} = {
  activeProject: null,
};

vi.mock('../../context/ProjectContext', () => ({
  useProjectContext: () => mockProjectContext,
}));

vi.mock('../../lib/roles', () => ({
  getUserRole: vi.fn(() => 'admin'),
  canManageMembers: vi.fn(() => true),
  canEditProject: vi.fn(() => true),
}));

vi.mock('../AddBoardModal/AddBoardModal', () => ({
  default: ({ ref }: any) => {
    if (ref) {
      ref.current = {
        open: vi.fn(),
        close: vi.fn(),
      };
    }
    return <div data-testid="add-board-modal" />;
  },
}));

vi.mock('../TaskModal/TaskModal', () => ({
  default: ({ ref }: any) => {
    if (ref) {
      ref.current = {
        open: vi.fn(),
        close: vi.fn(),
      };
    }
    return <div data-testid="task-modal" />;
  },
}));

const renderHeader = (props = {}) => {
  const defaultProps = {
    isSidebarOpen: false,
    onCreateBoard: vi.fn(),
    mode: 'current' as const,
    setMode: vi.fn(),
    ...props,
  };

  return render(
    <MemoryRouter>
      <Header {...defaultProps} />
    </MemoryRouter>
  );
};

describe('Header component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-user-id'),
      },
      writable: true,
    });
  });

  describe('basic rendering', () => {
    test('renders dashboard title', () => {
      renderHeader();
      expect(screen.getByText('Kanban Dashboard')).toBeInTheDocument();
    });

    test('renders mode buttons', () => {
      renderHeader();
      expect(screen.getByRole('button', { name: /upcoming tasks/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /current task/i })).toBeInTheDocument();
    });

    test('renders add board button', () => {
      renderHeader();
      expect(screen.getByRole('button', { name: /add board/i })).toBeInTheDocument();
    });
  });

  describe('settings button (dots)', () => {
    test('does not render settings button when no active project', () => {
      mockProjectContext.activeProject = null;
      renderHeader();
      expect(screen.queryByText('⋯')).not.toBeInTheDocument();
    });

    test('renders settings button when active project exists', () => {
      mockProjectContext.activeProject = {
        id: 'test-project-id',
        name: 'Test Project',
      };
      renderHeader();
      expect(screen.getByText('⋯')).toBeInTheDocument();
    });

    test('settings button links to settings page', () => {
      mockProjectContext.activeProject = {
        id: 'test-project-id',
        name: 'Test Project',
      };
      renderHeader();
      const settingsButton = screen.getByText('⋯');
      expect(settingsButton.closest('a')).toHaveAttribute('href', '/account/settings');
    });
  });

  describe('mode switching', () => {
    test('upcoming tasks button is active when mode is upcoming', () => {
      renderHeader({ mode: 'upcoming' });
      const upcomingButton = screen.getByRole('button', { name: /upcoming tasks/i });
      expect(upcomingButton).toHaveClass('active');
    });

    test('current task button is active when mode is current', () => {
      renderHeader({ mode: 'current' });
      const currentButton = screen.getByRole('button', { name: /current task/i });
      expect(currentButton).toHaveClass('active');
    });

    test('calls setMode when upcoming tasks button is clicked', async () => {
      const setMode = vi.fn();
      const user = userEvent.setup();
      renderHeader({ setMode });

      await user.click(screen.getByRole('button', { name: /upcoming tasks/i }));
      expect(setMode).toHaveBeenCalledWith('upcoming');
    });

    test('calls setMode when current task button is clicked', async () => {
      const setMode = vi.fn();
      const user = userEvent.setup();
      renderHeader({ setMode });

      await user.click(screen.getByRole('button', { name: /current task/i }));
      expect(setMode).toHaveBeenCalledWith('current');
    });
  });

  describe('add button functionality', () => {
    beforeEach(() => {
      mockProjectContext.activeProject = {
        id: 'test-project-id',
        name: 'Test Project',
      };
    });

    test('shows "Add Task" when mode is upcoming', () => {
      renderHeader({ mode: 'upcoming' });
      expect(screen.getByRole('button', { name: /add task/i })).toBeInTheDocument();
    });

    test('shows "Add Board" when mode is current', () => {
      renderHeader({ mode: 'current' });
      expect(screen.getByRole('button', { name: /add board/i })).toBeInTheDocument();
    });
  });

  describe('sidebar state', () => {
    test('applies sidebar-open class when sidebar is open', () => {
      renderHeader({ isSidebarOpen: true });
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('sidebar-open');
    });

    test('does not apply sidebar-open class when sidebar is closed', () => {
      renderHeader({ isSidebarOpen: false });
      const header = screen.getByRole('banner');
      expect(header).not.toHaveClass('sidebar-open');
    });
  });

  describe('modal components', () => {
    test('renders AddBoardModal', () => {
      renderHeader();
      expect(screen.getByTestId('add-board-modal')).toBeInTheDocument();
    });

    test('renders TaskModal', () => {
      renderHeader();
      expect(screen.getByTestId('task-modal')).toBeInTheDocument();
    });
  });
}); 