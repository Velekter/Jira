import React from 'react';
import type { Task } from '../../lib/tasks/tasks';
import './boardColumn.scss';

interface BoardColumnProps {
  status: string;
  color: string;
  tasks: Task[];
  statusLabel: string;
  onDrop: (taskId: string, newStatus: string) => void;
  onOpenTaskModal: (task?: Task) => void;
  onDeleteBoard: (status: string) => void;
}

const statusColors: Record<string, string> = {
  todo: '#ffaf3e',
  inProgress: '#4285f4',
  done: '#34a853',
};

const BoardColumn: React.FC<BoardColumnProps> = ({
  status,
  color,
  tasks,
  statusLabel,
  onDrop,
  onOpenTaskModal,
  onDeleteBoard,
}) => {
  return (
    <div
      className="kanban-column"
      style={{ borderTop: `6px solid ${color}` }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        const taskId = e.dataTransfer.getData('task-id');
        onDrop(taskId, status);
      }}
    >
      <h3>
        {statusLabel}
        <span className="kanban-column-buttons">
          <button className="add-btn" onClick={() => onOpenTaskModal()}>
            🞧
          </button>
          <button className="delete-btn" onClick={() => onDeleteBoard(status)}>
            🞨
          </button>
        </span>
      </h3>

      {tasks.map(task => (
        <div
          key={task.id}
          className="kanban-task"
          draggable
          onDragStart={e => e.dataTransfer.setData('task-id', task.id!)}
        >
          <div className="task-content" onClick={() => onOpenTaskModal(task)}>
            <div className="task-header">
              <span className="task-title">{task.title}</span>
              <span
                className="status-indicator"
                style={{ backgroundColor: color }}
              />
            </div>
            <div className="task-meta">
              {task.deadline && (
                <span className="task-deadline">
                  {new Date(task.deadline).toLocaleDateString()}
                </span>
              )}
              {task.priority && (
                <span className={`task-priority ${task.priority}`}>{task.priority}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BoardColumn;
