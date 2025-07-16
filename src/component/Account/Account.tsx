import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import type { Task } from '../../lib/tasks';
import { getTasksByUser, createTask, updateTask, deleteTask } from '../../lib/tasks';

import './account.scss';
import TaskModal from '../TaskModal/TaskModal';
import type { TaskModalRef } from '../TaskModal/TaskModal';

const statuses: Task['status'][] = ['todo', 'inProgress', 'done'];

const statusLabels: Record<Task['status'], string> = {
  todo: 'TO DO',
  inProgress: 'IN PROGRESS',
  done: 'DONE',
};

const Account: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError, error } = useUserData(userId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState('');

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const modalTaskRef = useRef<TaskModalRef>(null);

  const openEditModal = (task: Task) => {
    modalTaskRef.current?.open(task);
  };

  useEffect(() => {
    if (userId) {
      getTasksByUser(userId).then(setTasks);
    }
  }, [userId]);

  const handleAddTask = async () => {
    if (!newTitle.trim()) return;

    const newTask: Omit<Task, 'id'> = {
      title: newTitle,
      status: 'todo',
      createdAt: Date.now(),
      userId,
    };

    const id = await createTask(newTask);
    setTasks(prev => [...prev, { ...newTask, id }]);
    setNewTitle('');
  };

  const handleDrop = async (taskId: string, newStatus: Task['status']) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
    await updateTask(taskId, { status: newStatus });
  };

  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />

      <div className="container">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleAddTask();
          }}
          className="add-task"
        >
          <input
            placeholder="New task title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <button type="submit" disabled={!newTitle.trim()}>
            Add
          </button>
        </form>

        <div className="kanban">
          {statuses.map(status => (
            <div
              key={status}
              className={`kanban-column ${status}`}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const taskId = e.dataTransfer.getData('task-id');
                handleDrop(taskId, status);
              }}
            >
              <h3>{statusLabels[status]}</h3>
              {tasks
                .filter(task => task.status === status)
                .map(task => (
                  <div
                    key={task.id}
                    className="kanban-task"
                    draggable
                    onDragStart={e => e.dataTransfer.setData('task-id', task.id!)}
                  >
                    <span onClick={() => openEditModal(task)}>
                      {task.title}
                      {task.deadline && (
                        <div className="deadline">
                          {new Date(task.deadline).toLocaleDateString()}
                        </div>
                      )}
                    </span>
                    <button className="delete-button" onClick={() => handleDeleteTask(task.id!)}>
                      ✕
                    </button>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <TaskModal ref={modalTaskRef} />
    </div>
  );
};

export default Account;
