import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import type { Task } from '../../lib/tasks/tasks';
import { getTasksByUser, createTask, updateTask } from '../../lib/tasks/tasks';

import './account.scss';
import TaskModal from '../TaskModal/TaskModal';
import type { TaskModalRef } from '../TaskModal/TaskModal';
import Header from '../Header/Header';

import { addBoard, getBoards, deleteBoard } from '../../lib/boards';

const statusLabels: Record<string, string> = {
  todo: 'TO DO',
  inProgress: 'IN PROGRESS',
  done: 'DONE',
};

const DEFAULT_COLORS = ['#F87171', '#FBBF24', '#4ADE80']; // базові кольори для перших 3х

const Account: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError, error } = useUserData(userId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string; color?: string }[]>([]);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const modalTaskRef = useRef<TaskModalRef>(null);

  const openEditModal = (task?: Task) => {
    modalTaskRef.current?.open(task);
  };

  useEffect(() => {
    if (!userId) return;

    async function initializeBoards() {
      const boardsData = await getBoards(userId);

      if (boardsData.length === 0) {
        const defaultBoards = ['todo', 'inProgress', 'done'];
        const createdBoards = [];

        for (let i = 0; i < defaultBoards.length; i++) {
          const name = defaultBoards[i];
          const color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          const id = await addBoard(userId, name, color);
          createdBoards.push({ id, name, color });
        }

        setBoards(createdBoards);
        setStatuses(createdBoards.map(b => b.name));
      } else {
        setBoards(boardsData);
        setStatuses(boardsData.map(b => b.name));
      }
    }

    initializeBoards();
    getTasksByUser(userId).then(setTasks);
  }, [userId]);

  const handleDrop = async (taskId: string, newStatus: string) => {
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

  const addBoardAndSave = async (boardName: string, color: string) => {
    if (boardName && !statuses.includes(boardName)) {
      const newBoardId = await addBoard(userId, boardName, color);
      setBoards(prev => [...prev, { id: newBoardId, name: boardName, color }]);
      setStatuses(prev => [...prev, boardName]);
    } else {
      alert('Invalid or existing board name');
    }
  };

  const handleDeleteBoard = async (status: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the board "${status}"? All tasks with this status will be lost.`
    );
    if (confirmDelete) {
      const boardToDelete = boards.find(b => b.name === status);
      if (boardToDelete) {
        await deleteBoard(userId, boardToDelete.id);
        setBoards(prev => prev.filter(b => b.id !== boardToDelete.id));
      }
      setStatuses(prev => prev.filter(s => s !== status));
      setTasks(prev => prev.filter(task => task.status !== status));
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <>
      <Header isSidebarOpen={isSidebarOpen} onCreateBoard={addBoardAndSave} />
      <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />

        <div className="container">
          <div className="kanban">
            {statuses.map(status => {
              const board = boards.find(b => b.name === status);
              const color = board?.color || '#ccc';

              return (
                <div
                  key={status}
                  className="kanban-column"
                  style={{ borderTop: `6px solid ${color}` }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    const taskId = e.dataTransfer.getData('task-id');
                    handleDrop(taskId, status);
                  }}
                >
                  <h3>
                    {statusLabels[status] || status}
                    <span className="kanban-column-buttons">
                      <button className="add-btn" onClick={() => openEditModal()}>🞧</button>
                      <button className="delete-btn" onClick={() => handleDeleteBoard(status)}>🞨</button>
                    </span>
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
              );
            })}
          </div>
        </div>

        <TaskModal ref={modalTaskRef} statuses={statuses} statusLabels={statusLabels} />
      </div>
    </>
  );
};

export default Account;
