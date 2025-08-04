import React, { useRef, useState } from 'react';
import type { Task } from '../../lib/tasks';
import AddBoardModal from '../AddBoardModal/AddBoardModal';
import type { ModalRef } from '../Modal/Modal';
import { getUserRole, canEditProject, canManageMembers } from '../../lib/roles';
import type { ProjectRole } from '../../hooks/useProjects';
import './boardColumn.scss';

interface BoardColumnProps {
  status: string;
  color: string;
  tasks: Task[];
  statusLabel: string;
  onDrop: (taskId: string, newStatus: string) => void;
  onOpenTaskModal: (task?: Task, defaultStatus?: string) => void;
  onDeleteBoard: (status: string) => void;
  onUpdateBoard: (status: string, newName: string, newColor: string) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDropColumn?: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  userRole?: ProjectRole | null;
}

const BoardColumn: React.FC<BoardColumnProps> = ({
  status,
  color,
  tasks,
  statusLabel,
  onDrop,
  onOpenTaskModal,
  onDeleteBoard,
  onUpdateBoard,
  draggable,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDropColumn,
  isDragging: externalIsDragging,
  isDragOver: externalIsDragOver,
  userRole,
}) => {
  const modalRef = useRef<ModalRef>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const openEditModal = () => {
    modalRef.current?.open();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const h3Element = target.closest('h3');
    const buttonsElement = target.closest('.kanban-column-buttons');
    const dragHandleElement = target.closest('.drag-handle');
    const isHeaderDrag = h3Element || buttonsElement || dragHandleElement;
    const isTaskDrag = target.closest('.kanban-task');

    if (isHeaderDrag || (!isTaskDrag && target.closest('.kanban-column'))) {
      setIsDragging(true);
      if (onDragStart) {
        onDragStart(e);
      }
    } else if (!isTaskDrag) {
      e.preventDefault();
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const draggedColumnIndex = e.dataTransfer.getData('draggedColumnIndex');

    if (draggedColumnIndex && onDropColumn) {
      onDropColumn(e);
      return;
    }

    const taskId = e.dataTransfer.getData('task-id');

    if (taskId) {
      onDrop(taskId, status);
    }
  };

  return (
    <div
      className={`kanban-column ${isDragging || externalIsDragging ? 'dragging' : ''} ${isDragOver || externalIsDragOver ? 'drag-over' : ''}`}
      style={{ borderTop: `6px solid ${color}` }}
      draggable={draggable && canManageMembers(userRole || null)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h3 title="Drag the header to reorder columns">
        <span
          style={{ cursor: canManageMembers(userRole || null) ? 'pointer' : 'default' }}
          onClick={() => {
            if (canManageMembers(userRole || null)) {
              openEditModal();
            }
          }}
          title={canManageMembers(userRole || null) ? 'Edit board' : 'No permission to edit'}
        >
          {statusLabel}
        </span>
        <span className="kanban-column-buttons">
          <span className="drag-handle" title="Drag to reorder">
            ⋮⋮
          </span>
          {canEditProject(userRole || null) && (
            <button
              className="add-btn"
              onClick={() => {
                onOpenTaskModal(undefined, status);
              }}
            >
              🞧
            </button>
          )}
          {canManageMembers(userRole || null) && (
            <button className="delete-btn" onClick={() => onDeleteBoard(status)}>
              🞨
            </button>
          )}
        </span>
      </h3>

      <div className="kanban-column-content">
        {tasks.map(task => (
          <div
            key={task.id}
            className="kanban-task"
            draggable={canEditProject(userRole || null)}
            onDragStart={e => {
              if (!canEditProject(userRole || null)) {
                e.preventDefault();
                return;
              }
              e.dataTransfer.setData('task-id', task.id!);
              e.stopPropagation();
            }}
            onDragEnd={() => setIsDragging(false)}
          >
            <div
              className="task-content"
              onClick={() => {
                onOpenTaskModal(task);
              }}
            >
              <div className="task-header">
                <span className="task-title">{task.title}</span>
                <span className="status-indicator" style={{ backgroundColor: color }} />
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

      <AddBoardModal
        ref={modalRef}
        isEdit={true}
        initialName={statusLabel}
        initialColor={color}
        onUpdateBoard={(newName, newColor) => onUpdateBoard(status, newName, newColor)}
      />
    </div>
  );
};

export default BoardColumn;
