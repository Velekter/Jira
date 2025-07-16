import React, { useEffect, useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import './account.scss';
import {
  getTasksByUser,
  createTask,
  updateTask,
} from '../../lib/tasks';
import type { Task } from '../../lib/tasks';
 
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

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />

      <div className="container">
        <div className="add-task">
          <input
            placeholder="New task title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
          />
          <button onClick={handleAddTask}>Add</button>
        </div>

        <div className="kanban">
          {statuses.map(status => (
            <div
              key={status}
              className="kanban-column"
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
                    {task.title}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Account;
