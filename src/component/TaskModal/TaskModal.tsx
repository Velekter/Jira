import { useRef, useImperativeHandle, useState, forwardRef } from 'react';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';
import type { Task } from '../../lib/tasks';
import { deleteTask } from '../../lib/tasks';
import './taskModal.scss';

export type TaskModalRef = {
  open: (task?: Task, defaultStatus?: string, readOnly?: boolean) => void;
  close: () => void;
};

interface TaskModalProps {
  statuses: string[];
  statusLabels: Record<string, string>;
  mode: 'current' | 'upcoming';
  readOnly?: boolean;
}

const TaskModal = forwardRef<TaskModalRef, TaskModalProps>(
  ({ statuses, statusLabels, mode, readOnly = false }, ref) => {
    const modalRef = useRef<ModalRef>(null);

    const [task, setTask] = useState<Task | null>(null);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [status, setStatus] = useState<Task['status']>('todo');
    const [deadline, setDeadline] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('medium');
    const [isReadOnly, setIsReadOnly] = useState(false);

    useImperativeHandle(ref, () => ({
      open: (taskData?: Task, defaultStatus?: string, readOnlyMode?: boolean) => {
        console.log(
          'TaskModal: Opening with taskData:',
          taskData,
          'defaultStatus:',
          defaultStatus,
          'readOnly:',
          readOnlyMode
        );
        if (taskData) {
          setTask(taskData);
          setTitle(taskData.title);
          setDesc(taskData.description ?? '');
          setStatus(taskData.status);
          setDeadline(
            taskData.deadline ? new Date(taskData.deadline).toISOString().split('T')[0] : ''
          );
          setPriority(taskData.priority ?? 'medium');
        } else {
          setTask(null);
          setTitle('');
          setDesc('');
          setStatus(defaultStatus || (mode === 'upcoming' ? 'upcoming' : 'todo'));
          setDeadline('');
          setPriority('medium');
        }

        if (readOnlyMode !== undefined) {
          setIsReadOnly(readOnlyMode);
        }
        modalRef.current?.open();
      },
      close: () => {
        modalRef.current?.close();
        setTask(null);
      },
    }));

    const handleSave = () => {
      const baseTask = {
        title,
        description: desc,
        status,
        deadline: deadline ? new Date(deadline).getTime() : null,
        priority,
      };

      console.log('TaskModal: Saving task with data:', baseTask);
      console.log('TaskModal: Deadline value:', deadline);
      console.log('TaskModal: Deadline timestamp:', deadline ? new Date(deadline).getTime() : null);

      if (task) {
        window.dispatchEvent(
          new CustomEvent('task-save', {
            detail: { id: task.id, updatedTask: baseTask },
          })
        );
      } else {
        const projectId = localStorage.getItem('activeProjectId') ?? '';
        console.log('TaskModal: Using projectId:', projectId);

        if (!projectId) {
          console.error('TaskModal: No projectId found in localStorage');
          alert('Error: No project selected');
          return;
        }

        const newTask: Task = {
          projectId,
          ...baseTask,
        };

        window.dispatchEvent(
          new CustomEvent('task-create', {
            detail: { newTask },
          })
        );
      }

      modalRef.current?.close();
      setTask(null);
    };

    const handleDelete = async () => {
      if (!task) return;

      try {
        await deleteTask(task.id!);
        window.dispatchEvent(
          new CustomEvent('task-delete', {
            detail: { id: task.id },
          })
        );
        modalRef.current?.close();
        setTask(null);
      } catch (error) {
        console.error('Delete failed', error);
      }
    };

    return (
      <Modal ref={modalRef}>
        <h2>{task ? (isReadOnly ? 'View Task' : 'Edit Task') : 'New Task'}</h2>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title"
          readOnly={isReadOnly}
          className={isReadOnly ? 'readonly' : ''}
        />
        <textarea
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="Description"
          readOnly={isReadOnly}
          className={isReadOnly ? 'readonly' : ''}
        />
        <input
          type="date"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          readOnly={isReadOnly}
          className={isReadOnly ? 'readonly' : ''}
        />

        {mode !== 'upcoming' ? (
          <select
            value={status}
            onChange={e => setStatus(e.target.value as Task['status'])}
            disabled={isReadOnly}
            className={isReadOnly ? 'readonly' : ''}
          >
            {statuses.map(s => (
              <option key={s} value={s}>
                {statusLabels[s] || s}
              </option>
            ))}
          </select>
        ) : (
          <input type="hidden" value="upcoming" />
        )}

        <select
          value={priority}
          onChange={e => setPriority(e.target.value as Task['priority'])}
          disabled={isReadOnly}
          className={isReadOnly ? 'readonly' : ''}
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>

        <div className="buttons">
          {task && !isReadOnly && (
            <button className="delete" onClick={handleDelete}>
              Delete
            </button>
          )}
          <div className="right-buttons">
            {!isReadOnly && <button onClick={handleSave}>{task ? 'Save' : 'Create'}</button>}
            <button className="cancel" onClick={() => modalRef.current?.close()}>
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
);

export default TaskModal;
