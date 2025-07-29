import React, { useEffect, useRef, useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import type { Task } from '../../lib/tasks';
import { createTask, updateTask, getTasksByProject } from '../../lib/tasks';
import './account.scss';
import TaskModal from '../TaskModal/TaskModal';
import type { TaskModalRef } from '../TaskModal/TaskModal';
import Header from '../Header/Header';
import { addBoard, getBoards, deleteBoard, updateBoard, updateBoardOrder } from '../../lib/boards';
import BoardColumn from '../BoardColumn/BoardColumn';
import UpcomingTasks from '../UpcomingTasks/UpcomingTasks';
import { useProjectContext } from '../../context/ProjectContext';
import CreateProject from '../CreateProject/CreateProject';

const statusLabels: Record<string, string> = {
  todo: 'TO DO',
  inProgress: 'IN PROGRESS',
  done: 'DONE',
  upcoming: 'UPCOMING',
};

const normalizeUpcomingTask = (task: Task) => {
  if (task.status === 'upcoming' && task.deadline && task.deadline <= Date.now()) {
    return { ...task, status: 'todo' };
  }
  return task;
};

const Account: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { projects, activeProject } = useProjectContext();
  const { isLoading, isError, error } = useUserData(userId);

  const [showCreateProject, setShowCreateProject] = useState(projects.length === 0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [mode, setMode] = useState<'current' | 'upcoming'>('current');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null);

  const modalTaskRef = useRef<TaskModalRef>(null);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const openEditModal = (task?: Task, defaultStatus?: string) => modalTaskRef.current?.open(task, defaultStatus);

  useEffect(() => {
    if (projects.length > 0) {
      setShowCreateProject(false);
    } else {
      setShowCreateProject(true);
    }
  }, [projects]);

  const projectId = activeProject?.id;

  useEffect(() => {
    if (!projectId || !userId) return;

    async function loadBoards() {
      const id = projectId as string;
      console.log('Loading boards for project:', id);
      const boardsData = await getBoards(id);
      console.log('Loaded boards:', boardsData);

      setBoards(boardsData);
      setStatuses(boardsData.map(b => b.name));
    }

    async function loadTasks() {
      const tasksData = await getTasksByProject(projectId as string);
      console.log('Loaded tasks:', tasksData);
      setTasks(tasksData);
    }

    loadBoards();
    loadTasks();
  }, [projectId, userId]);

  const handleDrop = async (taskId: string, newStatus: string) => {
    console.log('Dropping task:', taskId, 'to status:', newStatus);
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task in database:', error);
      setTasks(prev =>
        prev.map(task => (task.id === taskId ? { ...task, status: task.status } : task))
      );
    }
  };

  useEffect(() => {
    function handleTaskSave(e: CustomEvent) {
      const { id, updatedTask } = e.detail;
      const normalizedTask = normalizeUpcomingTask(updatedTask);

      setTasks(prev => prev.map(task => (task.id === id ? { ...task, ...normalizedTask } : task)));
      updateTask(id, normalizedTask);
    }

    function handleTaskCreate(e: CustomEvent) {
      console.log('Account: Received task create event:', e.detail.newTask);
      const normalizedTask = normalizeUpcomingTask(e.detail.newTask);
      console.log('Account: Normalized task:', normalizedTask);

      if (!activeProject?.id) {
        console.error('Account: No active project ID');
        alert('Error: No project selected');
        return;
      }

      createTask({
        ...normalizedTask,
        projectId: activeProject.id,
        createdAt: Date.now(),
      }).then(id => {
        console.log('Account: Task created with ID:', id);
        setTasks(prev => [...prev, { ...normalizedTask, id, createdAt: Date.now() }]);
      }).catch(error => {
        console.error('Account: Failed to create task:', error);
      });
    }

    window.addEventListener('task-save', handleTaskSave as EventListener);
    window.addEventListener('task-create', handleTaskCreate as EventListener);
    return () => {
      window.removeEventListener('task-save', handleTaskSave as EventListener);
      window.removeEventListener('task-create', handleTaskCreate as EventListener);
    };
  }, [activeProject]);

  const addBoardAndSave = async (boardName: string, color: string) => {
    if (!activeProject) return;
    const newBoardId = await addBoard(activeProject.id, boardName, color);
    setBoards(prev => [...prev, { id: newBoardId, name: boardName, color }]);
    setStatuses(prev => [...prev, boardName]);
  };

  const handleDeleteBoard = async (status: string) => {
    if (!activeProject) return;
    const confirmDelete = window.confirm(`Delete board "${status}" and its tasks?`);
    if (confirmDelete) {
      const boardToDelete = boards.find(b => b.name === status);
      if (boardToDelete) {
        await deleteBoard(activeProject.id, boardToDelete.id);
        setBoards(prev => prev.filter(b => b.id !== boardToDelete.id));
      }
      setStatuses(prev => prev.filter(s => s !== status));
      setTasks(prev => prev.filter(task => task.status !== status));
    }
  };

  const handleUpdateBoard = async (oldStatus: string, newName: string, newColor: string) => {
    if (!activeProject) return;
    const boardToUpdate = boards.find(b => b.name === oldStatus);
    if (!boardToUpdate) return;

    await updateBoard(activeProject.id, boardToUpdate.id, {
      name: newName,
      color: newColor,
    });

    setBoards(prev =>
      prev.map(b => (b.id === boardToUpdate.id ? { ...b, name: newName, color: newColor } : b))
    );

    setStatuses(prev => prev.map(s => (s === oldStatus ? newName : s)));

    setTasks(prev => prev.map(t => (t.status === oldStatus ? { ...t, status: newName } : t)));
  };

  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    console.log('Starting drag for column:', index);
    setDraggedColumnIndex(index);
    e.dataTransfer.setData('draggedColumnIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    console.log('Column drag data set:', index.toString());
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    console.log('Column drag over');
  };

  const handleColumnDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    console.log('Column drop event triggered for index:', dropIndex);
    
    const draggedIndexStr = e.dataTransfer.getData('draggedColumnIndex');
    console.log('Dragged column index string:', draggedIndexStr);
    
    if (!draggedIndexStr) {
      console.log('No dragged column index found');
      return;
    }

    const draggedIndex = Number(draggedIndexStr);
    console.log('Dragged column index number:', draggedIndex);
    
    if (draggedIndex === dropIndex) {
      console.log('Same column index, no reordering needed');
      return;
    }

    console.log('Reordering columns:', draggedIndex, 'to', dropIndex);

    setStatuses(prev => {
      const newStatuses = [...prev];
      const [dragged] = newStatuses.splice(draggedIndex, 1);
      newStatuses.splice(dropIndex, 0, dragged);
      console.log('New statuses order:', newStatuses);
      return newStatuses;
    });

    setBoards(prev => {
      const newBoards = [...prev];
      const [dragged] = newBoards.splice(draggedIndex, 1);
      newBoards.splice(dropIndex, 0, dragged);
      console.log('New boards order:', newBoards);

      if (activeProject) {
        const boardOrder = newBoards.map(b => b.id);
        console.log('Saving board order to database:', boardOrder);
        updateBoardOrder(activeProject.id, boardOrder).catch(error => {
          console.error('Failed to update board order in database:', error);
        });
      }
      
      return newBoards;
    });
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  const upcomingTasks = tasks.filter(
    t => t.status === 'upcoming' && typeof t.deadline === 'number' && t.deadline > Date.now()
  );
  const currentTasks = tasks.filter(task => task.status !== 'upcoming');

  console.log('Current tasks:', currentTasks);
  console.log('Upcoming tasks:', upcomingTasks);

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
            <>
              {showCreateProject ? (
                <CreateProject userId={userId} setShowCreateProject={setShowCreateProject} />
              ) : (
                <div className="kanban">
                  {statuses.map((status, index) => {
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
                        onUpdateBoard={handleUpdateBoard}
                        draggable
                        onDragStart={e => handleColumnDragStart(e, index)}
                        onDragEnd={handleColumnDragEnd}
                        onDragOver={handleColumnDragOver}
                        onDropColumn={e => handleColumnDrop(e, index)}
                        isDragging={draggedColumnIndex === index}
                        isDragOver={dragOverColumnIndex === index}
                      />
                    );
                  })}
                </div>
              )}
            </>
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
