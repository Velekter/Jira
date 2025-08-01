import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import BoardColumn from './BoardColumn';

const mockTasks = [
  {
    id: '1',
    title: 'Task 1',
    status: 'todo',
    priority: 'high',
    deadline: Date.now() + 86400000,
  },
  {
    id: '2',
    title: 'Task 2',
    status: 'todo',
    priority: 'medium',
  },
];

const defaultProps = {
  status: 'todo',
  color: '#3b82f6',
  tasks: mockTasks,
  statusLabel: 'To Do',
  onDrop: vi.fn(),
  onOpenTaskModal: vi.fn(),
  onDeleteBoard: vi.fn(),
  onUpdateBoard: vi.fn(),
  userRole: 'admin' as const,
};

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

const mockCanEditProject = vi.hoisted(() => vi.fn(() => true));
const mockCanManageMembers = vi.hoisted(() => vi.fn(() => true));

vi.mock('../../lib/roles', () => ({
  getUserRole: vi.fn(() => 'admin'),
  canEditProject: mockCanEditProject,
  canManageMembers: mockCanManageMembers,
}));

const renderBoardColumn = (props = {}) => {
  return render(<BoardColumn {...defaultProps} {...props} />);
};

describe('BoardColumn component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    mockCanEditProject.mockReturnValue(true);
    mockCanManageMembers.mockReturnValue(true);
  });

  test('renders column header with status label', () => {
    renderBoardColumn();
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
  });

  test('renders tasks in the column', () => {
    renderBoardColumn();
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  test('renders task priority', () => {
    renderBoardColumn();
    
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  test('renders task deadline', () => {
    renderBoardColumn();
    
    const deadline = new Date(mockTasks[0].deadline!).toLocaleDateString();
    expect(screen.getByText(deadline)).toBeInTheDocument();
  });

  test('calls onOpenTaskModal when task is clicked', () => {
    const onOpenTaskModal = vi.fn();
    renderBoardColumn({ onOpenTaskModal });
    
    fireEvent.click(screen.getByText('Task 1'));
    expect(onOpenTaskModal).toHaveBeenCalledWith(mockTasks[0]);
  });

  test('calls onOpenTaskModal when add button is clicked', () => {
    const onOpenTaskModal = vi.fn();
    renderBoardColumn({ onOpenTaskModal });
    
    const addButton = screen.getByText('🞧');
    fireEvent.click(addButton);
    expect(onOpenTaskModal).toHaveBeenCalledWith(undefined, 'todo');
  });

  test('calls onDeleteBoard when delete button is clicked', () => {
    const onDeleteBoard = vi.fn();
    renderBoardColumn({ onDeleteBoard });
    
    const deleteButton = screen.getByText('🞨');
    fireEvent.click(deleteButton);
    expect(onDeleteBoard).toHaveBeenCalledWith('todo');
  });

  test('handles task drop correctly', () => {
    const onDrop = vi.fn();
    renderBoardColumn({ onDrop });
    
    const column = screen.getByText('To Do').closest('.kanban-column');
    
    fireEvent.drop(column!, {
      dataTransfer: {
        getData: vi.fn(() => 'task-1'),
      },
    });
    
    expect(onDrop).toHaveBeenCalledWith('task-1', 'todo');
  });

  test('handles column drop correctly', () => {
    const onDropColumn = vi.fn();
    renderBoardColumn({ onDropColumn });
    
    const column = screen.getByText('To Do').closest('.kanban-column');
    
    fireEvent.drop(column!, {
      dataTransfer: {
        getData: vi.fn(() => '0'),
      },
    });
    
    expect(onDropColumn).toHaveBeenCalled();
  });

  test('applies correct border color', () => {
    renderBoardColumn({ color: '#ef4444' });
    
    const column = screen.getByText('To Do').closest('.kanban-column');
    expect(column).toHaveStyle({ borderTop: '6px solid #ef4444' });
  });

  test('shows drag handle when user can manage members', () => {
    renderBoardColumn();
    
    expect(screen.getByText('⋮⋮')).toBeInTheDocument();
  });

  test('does not show add button when user cannot edit project', () => {
    mockCanEditProject.mockReturnValue(false);
    
    renderBoardColumn();
    
    expect(screen.queryByText('🞧')).not.toBeInTheDocument();
  });

  test('does not show delete button when user cannot manage members', () => {
    mockCanManageMembers.mockReturnValue(false);
    
    renderBoardColumn();
    
    expect(screen.queryByText('🞨')).not.toBeInTheDocument();
  });

  test('applies dragging class when isDragging is true', () => {
    renderBoardColumn({ isDragging: true });
    
    const column = screen.getByText('To Do').closest('.kanban-column');
    expect(column).toHaveClass('dragging');
  });

  test('applies drag-over class when isDragOver is true', () => {
    renderBoardColumn({ isDragOver: true });
    
    const column = screen.getByText('To Do').closest('.kanban-column');
    expect(column).toHaveClass('drag-over');
  });

  test('renders empty column when no tasks', () => {
    renderBoardColumn({ tasks: [] });
    
    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  });

  test('handles task with no deadline', () => {
    const tasksWithoutDeadline = [
      { id: '1', title: 'Task 1', status: 'todo', priority: 'high' },
    ];
    
    renderBoardColumn({ tasks: tasksWithoutDeadline });
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  test('handles task with no priority', () => {
    const tasksWithoutPriority = [
      { id: '1', title: 'Task 1', status: 'todo', deadline: Date.now() + 86400000 },
    ];
    
    renderBoardColumn({ tasks: tasksWithoutPriority });
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });
}); 