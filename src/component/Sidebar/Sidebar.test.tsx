import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Sidebar from './Sidebar';

const mockProjects = [
  { id: '1', name: 'Project 1', owner: 'user1' },
  { id: '2', name: 'Project 2', owner: 'user2' },
  { id: '3', name: 'Project 3', owner: 'user1' },
];

const mockActiveProject = mockProjects[0];

const mockProjectContext = {
  projects: mockProjects,
  activeProject: mockActiveProject,
  setActiveProject: vi.fn(),
  reorderProjects: vi.fn(),
};

vi.mock('../../context/ProjectContext', () => ({
  useProjectContext: () => mockProjectContext,
}));

vi.mock('../UserAvatar/UserAvatar', () => ({
  default: () => <div data-testid="user-avatar">User Avatar</div>,
}));

vi.mock('../CreateProject/CreateProject', () => ({
  default: () => <div data-testid="create-project">Create Project</div>,
}));

vi.mock('../Modal/Modal', () => ({
  default: ({ children, ref }: any) => {
    if (ref) {
      ref.current = {
        open: vi.fn(),
        close: vi.fn(),
      };
    }
    return <div data-testid="modal">{children}</div>;
  },
}));

vi.mock('../../lib/roles', () => ({
  getUserRole: vi.fn(() => 'admin'),
  canManageMembers: vi.fn(() => true),
}));

const renderSidebar = (props = {}) => {
  const defaultProps = {
    isOpen: false,
    toggleSidebar: vi.fn(),
    logoutUser: vi.fn(),
    ...props,
  };

  return render(
    <MemoryRouter>
      <Sidebar {...defaultProps} />
    </MemoryRouter>
  );
};

describe('Sidebar component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'user1'),
      },
      writable: true,
    });
  });

  test('renders toggle button', () => {
    renderSidebar();
    
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  test('calls toggleSidebar when toggle button is clicked', () => {
    const toggleSidebar = vi.fn();
    renderSidebar({ toggleSidebar });
    
    fireEvent.click(screen.getByRole('button', { name: /menu/i }));
    expect(toggleSidebar).toHaveBeenCalled();
  });

  test('renders navigation menu items', () => {
    renderSidebar({ isOpen: true });
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Friends')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  test('renders add project button', () => {
    renderSidebar({ isOpen: true });
    
    expect(screen.getByText('Add Project')).toBeInTheDocument();
  });

  test('renders project list when projects exist', () => {
    renderSidebar({ isOpen: true });
    
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
    expect(screen.getByText('Project 3')).toBeInTheDocument();
  });

  test('shows owned/shared labels for projects', () => {
    renderSidebar({ isOpen: true });
    
    expect(screen.getAllByText('Owned')).toHaveLength(2);
    expect(screen.getByText('Shared')).toBeInTheDocument();
  });

  test('calls setActiveProject when project is clicked', () => {
    renderSidebar({ isOpen: true });
    
    fireEvent.click(screen.getByText('Project 2'));
    expect(mockProjectContext.setActiveProject).toHaveBeenCalledWith(mockProjects[1]);
  });

  test('calls logoutUser when logout button is clicked', () => {
    const logoutUser = vi.fn();
    renderSidebar({ isOpen: true, logoutUser });
    
    fireEvent.click(screen.getByText('Logout'));
    expect(logoutUser).toHaveBeenCalled();
  });

  test('applies correct CSS classes based on open state', () => {
    const { rerender } = renderSidebar({ isOpen: false });
    
    let sidebar = screen.getByTestId('user-avatar').closest('.sidebar');
    expect(sidebar).toHaveClass('collapsed-sid');
    
    rerender(
      <MemoryRouter>
        <Sidebar isOpen={true} toggleSidebar={vi.fn()} logoutUser={vi.fn()} />
      </MemoryRouter>
    );
    
    sidebar = screen.getByTestId('user-avatar').closest('.sidebar');
    expect(sidebar).toHaveClass('open');
  });

  test('renders user avatar', () => {
    renderSidebar();
    
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  test('renders create project modal', () => {
    renderSidebar();
    
    expect(screen.getByTestId('create-project')).toBeInTheDocument();
  });

  test('handles drag and drop events', () => {
    renderSidebar({ isOpen: true });
    
    const projectElement = screen.getByText('Project 2').closest('li');
    const getDataMock = vi.fn(() => '0');
    
    fireEvent.dragStart(projectElement!, {
      dataTransfer: {
        setData: vi.fn(),
        effectAllowed: '',
      },
    });
    fireEvent.dragOver(projectElement!, {
      dataTransfer: {
        dropEffect: '',
      },
    });
    fireEvent.drop(projectElement!, {
      dataTransfer: {
        getData: getDataMock,
      },
    });
    
    expect(mockProjectContext.reorderProjects).toHaveBeenCalledWith(0, 1);
  });

  test('shows settings link when active project exists', () => {
    renderSidebar({ isOpen: true });
    
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('does not show settings link when no active project', () => {
    mockProjectContext.activeProject = null;
    renderSidebar({ isOpen: true });
    
    expect(screen.queryByText('Settings')).not.toBeInTheDocument();
  });
}); 