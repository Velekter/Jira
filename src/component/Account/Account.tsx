import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import type { Task } from '../../lib/tasks';
import { getTasksByUser, createTask, updateTask } from '../../lib/tasks';

import './account.scss';
import TaskModal from '../TaskModal/TaskModal';
import type { TaskModalRef } from '../TaskModal/TaskModal';
import Header from '../Header/Header';

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

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const modalTaskRef = useRef<TaskModalRef>(null);

  const openEditModal = (task?: Task) => {
    modalTaskRef.current?.open(task);
  };

  useEffect(() => {
    if (userId) {
      getTasksByUser(userId).then(setTasks);
    }
  }, [userId]);

  const handleDrop = async (taskId: string, newStatus: Task['status']) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
    await updateTask(taskId, { status: newStatus });
  };

  useEffect(() => {
    function handleTaskSave(e: CustomEvent) {
      const { id, updatedTask } = e.detail;
      setTasks(prev => prev.map(task => (task.id === id ? { ...task, ...updatedTask } : task)));
      updateTask(id, updatedTask);
    }

    function handleTaskCreate(e: CustomEvent) {
      const { newTask } = e.detail;
      createTask({
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        deadline: newTask.deadline,
        priority: newTask.priority,
        createdAt: Date.now(),
        userId: newTask.userId,
      }).then(id => {
        setTasks(prev => [...prev, { ...newTask, id, createdAt: Date.now() }]);
      });
    }

    window.addEventListener('task-save', handleTaskSave as EventListener);
    window.addEventListener('task-create', handleTaskCreate as EventListener);

    return () => {
      window.removeEventListener('task-save', handleTaskSave as EventListener);
      window.removeEventListener('task-create', handleTaskCreate as EventListener);
    };
  }, [setTasks]);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <>
      <Header isSidebarOpen={isSidebarOpen} />
      <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />

        <div className="container">
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
                <h3>
                  {statusLabels[status]}
                  <button onClick={() => openEditModal()}>+</button>
                </h3>
                {tasks
                  .filter(task => task.status === status)
                  .map(task => (
                    <div
                      key={task.id}
                      className="kanban-task"
                      draggable
                      onDragStart={e => e.dataTransfer.setData('task-id', task.id!)}
                    >
                      <div className="task-content" onClick={() => openEditModal(task)}>
                        <div className="task-header">
                          <span className="task-title">{task.title}</span>
                          <span className={`status-indicator ${task.status}`} />
                        </div>
                        <div className="task-meta">
                          {task.deadline && (
                            <span className="task-deadline">
                              {new Date(task.deadline).toLocaleDateString()}
                            </span>
                          )}
                          {task.priority && (
                            <span className={`task-priority ${task.priority}`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ))}
          </div>
        </div>

        <TaskModal ref={modalTaskRef} />
      </div>
    </>
  );
};

export default Account;
