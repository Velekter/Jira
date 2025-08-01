import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import React from 'react';
import TaskModal from './TaskModal';
import type { TaskModalRef } from './TaskModal';

const mockModalRef = {
  current: {
    open: vi.fn(),
    close: vi.fn(),
  },
};

vi.mock('../Modal/Modal', () => ({
  default: ({ children, ref }: any) => {
    if (ref) {
      ref.current = mockModalRef.current;
    }
    return <div data-testid="modal">{children}</div>;
  },
}));

vi.mock('../../lib/tasks', () => ({
  deleteTask: vi.fn(),
}));

const defaultProps = {
  statuses: ['todo', 'in-progress', 'done'],
  statusLabels: {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
  },
  mode: 'current' as const,
};

const renderTaskModal = (props = {}) => {
  const ref = React.createRef<TaskModalRef>();
  const component = <TaskModal ref={ref} {...defaultProps} {...props} />;
  return { ...render(component), ref };
};

describe('TaskModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-project-id'),
      },
      writable: true,
    });

    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true,
    });

    Object.defineProperty(window, 'alert', {
      value: vi.fn(),
      writable: true,
    });
  });

  test('renders new task form by default', () => {
    const { ref } = renderTaskModal();

    act(() => {
      ref.current?.open();
    });

    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('renders edit task form when task is provided', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'high' as const,
      deadline: Date.now(),
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task);
    });

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('renders view task form when readOnly is true', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'high' as const,
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task, undefined, true);
    });

    expect(screen.getByText('View Task')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  test('displays task data when editing', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'in-progress' as const,
      priority: 'high' as const,
      deadline: new Date('2024-01-01').getTime(),
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task);
    });

    expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    
    const statusSelect = screen.getAllByRole('combobox')[0];
    expect(statusSelect).toHaveValue('in-progress');
    
    const prioritySelect = screen.getAllByRole('combobox')[1];
    expect(prioritySelect).toHaveValue('high');
  });

  test('shows delete button when editing existing task', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'medium' as const,
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task);
    });

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  test('does not show delete button for new tasks', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('does not show delete button in readOnly mode', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'medium' as const,
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task, undefined, true);
    });

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  test('dispatches task-create event for new tasks', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const titleInput = screen.getByPlaceholderText('Title');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.click(createButton);
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task-create',
        detail: expect.objectContaining({
          newTask: expect.objectContaining({
            title: 'New Task',
            projectId: 'test-project-id',
          }),
        }),
      })
    );
  });

  test('dispatches task-save event for existing tasks', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Original Task',
      description: 'Original Description',
      status: 'todo' as const,
      priority: 'medium' as const,
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task);
    });

    const titleInput = screen.getByDisplayValue('Original Task');
    const saveButton = screen.getByText('Save');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });
      fireEvent.click(saveButton);
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task-save',
        detail: expect.objectContaining({
          id: '1',
          updatedTask: expect.objectContaining({
            title: 'Updated Task',
          }),
        }),
      })
    );
  });

  test('dispatches task-delete event when deleting task', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'medium' as const,
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task);
    });

    const deleteButton = screen.getByText('Delete');

    await act(async () => {
      fireEvent.click(deleteButton);
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task-delete',
        detail: expect.objectContaining({
          id: '1',
        }),
      })
    );
  });

  test('closes modal after successful operations', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const titleInput = screen.getByPlaceholderText('Title');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.click(createButton);
    });

    expect(mockModalRef.current.close).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const cancelButton = screen.getByText('Cancel');

    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockModalRef.current.close).toHaveBeenCalled();
  });

  test('handles upcoming mode correctly', async () => {
    const { ref } = renderTaskModal({ mode: 'upcoming' });
    
    await act(async () => {
      ref.current?.open();
    });

    const statusInput = screen.getByDisplayValue('upcoming');
    expect(statusInput).toBeInTheDocument();
    expect(screen.getAllByRole('combobox')).toHaveLength(1);
  });

  test('handles current mode correctly', async () => {
    const { ref } = renderTaskModal({ mode: 'current' });
    
    await act(async () => {
      ref.current?.open();
    });

    expect(screen.getAllByRole('combobox')).toHaveLength(2);
  });

  test('sets readonly class on inputs when in readOnly mode', async () => {
    const task = {
      id: '1',
      projectId: 'test-project-id',
      title: 'Test Task',
      description: 'Test Description',
      status: 'todo' as const,
      priority: 'medium' as const,
    };

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open(task, undefined, true);
    });

    const titleInput = screen.getByDisplayValue('Test Task');
    expect(titleInput).toHaveClass('readonly');
    expect(titleInput).toHaveAttribute('readOnly');
  });

  test('handles priority selection', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const prioritySelect = screen.getAllByRole('combobox')[1];
    expect(prioritySelect).toHaveValue('medium');
    
    await act(async () => {
      fireEvent.change(prioritySelect, { target: { value: 'high' } });
    });

    expect(prioritySelect).toHaveValue('high');
  });

  test('handles status selection in current mode', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const statusSelect = screen.getAllByRole('combobox')[0];
    expect(statusSelect).toHaveValue('todo');
    
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: 'in-progress' } });
    });

    expect(statusSelect).toHaveValue('in-progress');
  });

  test('handles deadline input', async () => {
    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const inputs = screen.getAllByDisplayValue('');
    const deadlineInput = inputs.find(input => input.getAttribute('type') === 'date') as HTMLInputElement;
    expect(deadlineInput).toBeTruthy();
    expect(deadlineInput.type).toBe('date');

    await act(async () => {
      fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });
    });

    expect(deadlineInput).toHaveValue('2024-12-31');
  });

  test('shows alert when no project is selected', async () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
      },
      writable: true,
    });

    const { ref } = renderTaskModal();
    
    await act(async () => {
      ref.current?.open();
    });

    const titleInput = screen.getByPlaceholderText('Title');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.click(createButton);
    });

    expect(window.alert).toHaveBeenCalledWith('Error: No project selected');
  });
}); 