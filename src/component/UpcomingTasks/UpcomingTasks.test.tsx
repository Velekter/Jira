import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import UpcomingTasks from './UpcomingTasks';
import type { Task } from '../../lib/tasks';

vi.mock('../../lib/tasks', () => ({
  moveTaskToCurrent: vi.fn(),
}));

const mockTasks: Task[] = [
  {
    id: '1',
    projectId: 'project-1',
    title: 'Upcoming Task 1',
    description: 'Description 1',
    status: 'upcoming',
    priority: 'high',
    deadline: Date.now() + 86400000, // Tomorrow
  },
  {
    id: '2',
    projectId: 'project-1',
    title: 'Upcoming Task 2',
    description: 'Description 2',
    status: 'upcoming',
    priority: 'medium',
    deadline: Date.now() + 172800000, // Day after tomorrow
  },
];

const mockStatuses = ['todo', 'in-progress', 'done'];

const renderUpcomingTasks = (props = {}) => {
  const defaultProps = {
    tasks: mockTasks,
    onOpenTaskModal: vi.fn(),
    statuses: mockStatuses,
    ...props,
  };

  return render(<UpcomingTasks {...defaultProps} />);
};

describe('UpcomingTasks component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'dispatchEvent', {
      value: vi.fn(),
      writable: true,
    });
  });

  test('renders upcoming tasks title', () => {
    renderUpcomingTasks();
    expect(screen.getByText('Upcoming Tasks')).toBeInTheDocument();
  });

  test('renders all upcoming tasks', () => {
    renderUpcomingTasks();
    
    expect(screen.getByText('Upcoming Task 1')).toBeInTheDocument();
    expect(screen.getByText('Upcoming Task 2')).toBeInTheDocument();
  });

  test('shows no upcoming tasks message when no tasks', () => {
    renderUpcomingTasks({ tasks: [] });
    expect(screen.getByText('No upcoming tasks.')).toBeInTheDocument();
  });

  test('filters out tasks with past deadlines', () => {
    const tasksWithPastDeadline: Task[] = [
      {
        id: '1',
        projectId: 'project-1',
        title: 'Past Task',
        description: 'Past task',
        status: 'upcoming',
        priority: 'high',
        deadline: Date.now() - 86400000, // Yesterday
      },
      {
        id: '2',
        projectId: 'project-1',
        title: 'Future Task',
        description: 'Future task',
        status: 'upcoming',
        priority: 'high',
        deadline: Date.now() + 86400000, // Tomorrow
      },
    ];

    renderUpcomingTasks({ tasks: tasksWithPastDeadline });
    
    expect(screen.queryByText('Past Task')).not.toBeInTheDocument();
    expect(screen.getByText('Future Task')).toBeInTheDocument();
  });

  test('displays deadline dates correctly', () => {
    renderUpcomingTasks();
    
    const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString();
    const dayAfterTomorrow = new Date(Date.now() + 172800000).toLocaleDateString();
    
    expect(screen.getByText(tomorrow)).toBeInTheDocument();
    expect(screen.getByText(dayAfterTomorrow)).toBeInTheDocument();
  });

  test('calls onOpenTaskModal when task is clicked', async () => {
    const mockOnOpenTaskModal = vi.fn();
    renderUpcomingTasks({ onOpenTaskModal: mockOnOpenTaskModal });

    const taskElement = screen.getByText('Upcoming Task 1');
    
    await act(async () => {
      fireEvent.click(taskElement);
    });

    expect(mockOnOpenTaskModal).toHaveBeenCalledWith(mockTasks[0]);
  });

  test('handles move to current button click', async () => {
    const { moveTaskToCurrent } = await import('../../lib/tasks');
    renderUpcomingTasks();

    const moveButtons = screen.getAllByText('Move to Current');
    
    await act(async () => {
      fireEvent.click(moveButtons[0]);
    });

    expect(moveTaskToCurrent).toHaveBeenCalledWith('1', 'todo');
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task-save',
        detail: expect.objectContaining({
          id: '1',
          updatedTask: expect.objectContaining({
            status: 'todo',
            deadline: null,
          }),
        }),
      })
    );
  });

  test('handles multiple move to current button clicks', async () => {
    const { moveTaskToCurrent } = await import('../../lib/tasks');
    renderUpcomingTasks();

    const moveButtons = screen.getAllByText('Move to Current');
    
    await act(async () => {
      fireEvent.click(moveButtons[0]);
      fireEvent.click(moveButtons[1]);
    });

    expect(moveTaskToCurrent).toHaveBeenCalledTimes(2);
    expect(moveTaskToCurrent).toHaveBeenNthCalledWith(1, '1', 'todo');
    expect(moveTaskToCurrent).toHaveBeenNthCalledWith(2, '2', 'todo');
  });

  test('handles tasks without deadline', () => {
    const tasksWithoutDeadline: Task[] = [
      {
        id: '1',
        projectId: 'project-1',
        title: 'Task without deadline',
        description: 'No deadline',
        status: 'upcoming',
        priority: 'high',
      },
    ];

    renderUpcomingTasks({ tasks: tasksWithoutDeadline });
    
    expect(screen.getByText('No upcoming tasks.')).toBeInTheDocument();
  });

  test('handles tasks with null deadline', () => {
    const tasksWithNullDeadline: Task[] = [
      {
        id: '1',
        projectId: 'project-1',
        title: 'Task with null deadline',
        description: 'Null deadline',
        status: 'upcoming',
        priority: 'high',
        deadline: null,
      },
    ];

    renderUpcomingTasks({ tasks: tasksWithNullDeadline });
    
    expect(screen.getByText('No upcoming tasks.')).toBeInTheDocument();
  });

  test('uses first status from statuses array for move operation', async () => {
    const { moveTaskToCurrent } = await import('../../lib/tasks');
    const customStatuses = ['backlog', 'todo', 'done'];
    
    renderUpcomingTasks({ statuses: customStatuses });

    const moveButtons = screen.getAllByText('Move to Current');
    
    await act(async () => {
      fireEvent.click(moveButtons[0]);
    });

    expect(moveTaskToCurrent).toHaveBeenCalledWith('1', 'backlog');
  });
}); 