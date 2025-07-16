import { useRef, useImperativeHandle, useState, forwardRef } from 'react';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';
import type { Task } from '../../lib/tasks';
import './taskModal.scss';

export type TaskModalRef = {
  open: (task: Task) => void;
  close: () => void;
};

const TaskModal = forwardRef<TaskModalRef>((_, ref) => {
  const modalRef = useRef<ModalRef>(null);

  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState<Task['status']>('todo');
  const [deadline, setDeadline] = useState('');

  useImperativeHandle(ref, () => ({
    open: (task: Task) => {
      setTask(task);
      setTitle(task.title);
      setDesc(task.description ?? '');
      setStatus(task.status);
      setDeadline(task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '');
      modalRef.current?.open();
    },
    close: () => {
      modalRef.current?.close();
      setTask(null);
    },
  }));

  const handleSave = () => {
    if (!task) return;
    const updated = {
      title,
      description: desc,
      status,
      deadline: deadline ? new Date(deadline).getTime() : undefined,
    };

    window.dispatchEvent(
      new CustomEvent('task-save', {
        detail: { id: task.id, updatedTask: updated },
      })
    );
    modalRef.current?.close();
    setTask(null);
  };

  return (
    <Modal ref={modalRef}>
      <h2>Edit Task</h2>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" />
      <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      <select value={status} onChange={e => setStatus(e.target.value as Task['status'])}>
        <option value="todo">To Do</option>
        <option value="inProgress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <div className="buttons">
        <button onClick={handleSave}>Save</button>
        <button className="cancel" onClick={() => modalRef.current?.close()}>
          Cancel
        </button>
      </div>
    </Modal>
  );
});

export default TaskModal;
