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
import { addBoard, getBoards, deleteBoard, updateBoard } from '../../lib/boards';
import BoardColumn from '../BoardColumn/BoardColumn';
import UpcomingTasks from '../UpcomingTasks/UpcomingTasks';

const statusLabels: Record<string, string> = {
  todo: 'TO DO',
  inProgress: 'IN PROGRESS',
  done: 'DONE',
  upcoming: 'UPCOMING',
};

const DEFAULT_COLORS = ['#f8d471ff', '#5224fbff', '#4ADE80'];

const Account: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError, error } = useUserData(userId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [mode, setMode] = useState<'current' | 'upcoming'>('current');

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
        const updatedBoards = await Promise.all(
          boardsData.map(async (board, i) => {
            if (!board.color) {
              const color = DEFAULT_COLORS[i % DEFAULT_COLORS.length];
              await updateBoard(userId, board.id, { color });
              return { ...board, color };
            }
            return board;
          })
        );

        setBoards(updatedBoards);
        setStatuses(updatedBoards.map(b => b.name));
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

      if (
        updatedTask.status === 'upcoming' &&
        updatedTask.deadline !== undefined &&
        updatedTask.deadline <= Date.now()
      ) {
        updatedTask.status = 'todo';
      }

      setTasks(prev => prev.map(task => (task.id === id ? { ...task, ...updatedTask } : task)));
      updateTask(id, updatedTask);
    }

    function handleTaskCreate(e: CustomEvent) {
      let { newTask } = e.detail;

      if (
        newTask.status === 'upcoming' &&
        newTask.deadline !== undefined &&
        newTask.deadline <= Date.now()
      ) {
        newTask = { ...newTask, status: 'todo' };
      }

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

  const upcomingTasks = tasks.filter(
    task =>
      task.status === 'upcoming' && typeof task.deadline === 'number' && task.deadline > Date.now()
  );

  const currentTasks = tasks.filter(task => task.status !== 'upcoming');

  return (
    <>
      <Header
        isSidebarOpen={isSidebarOpen}
        onCreateBoard={addBoardAndSave}
        mode={mode}
        setMode={setMode}
      />
      <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />

        <div className="container">
          {mode === 'current' ? (
            <div className="kanban">
              {statuses.map(status => {
                const board = boards.find(b => b.name === status);
                const color = board?.color || '#ccc';
                const filteredTasks = currentTasks.filter(task => task.status === status);
                return (
                  <BoardColumn
                    key={status}
                    status={status}
                    color={color}
                    tasks={filteredTasks}
                    statusLabel={statusLabels[status] || status}
                    onDrop={handleDrop}
                    onOpenTaskModal={openEditModal}
                    onDeleteBoard={handleDeleteBoard}
                  />
                );
              })}
            </div>
          ) : (
            <UpcomingTasks
              tasks={upcomingTasks}
              onOpenTaskModal={openEditModal}
              statuses={statuses}
            />
          )}
        </div>

        <TaskModal ref={modalTaskRef} statuses={statuses} statusLabels={statusLabels} mode={mode} />
      </div>
    </>
  );
};

export default Account;
