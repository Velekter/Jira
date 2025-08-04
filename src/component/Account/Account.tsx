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
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getUserRole, canEditProject, canManageMembers } from '../../lib/roles';

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
  
  const { projects, activeProject, isLoading: projectsLoading, isInitialized } = useProjectContext();
  const { isLoading, isError, error } = useUserData(userId);

  const [showCreateProject, setShowCreateProject] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [boards, setBoards] = useState<{ id: string; name: string; color?: string }[]>([]);
  const [mode, setMode] = useState<'current' | 'upcoming'>('current');
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null);
  const [unsubscribeTasks, setUnsubscribeTasks] = useState<(() => void) | null>(null);
  const [unsubscribeBoards, setUnsubscribeBoards] = useState<(() => void) | null>(null);

  const modalTaskRef = useRef<TaskModalRef>(null);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const openEditModal = (task?: Task, defaultStatus?: string) => {
    const userRole = activeProject ? getUserRole(activeProject, userId) : null;
    const isReadOnly = !canEditProject(userRole);
    modalTaskRef.current?.open(task, defaultStatus, isReadOnly);
  };

  useEffect(() => {
    if (isInitialized && projects.length === 0) {
      setShowCreateProject(true);
    } else if (isInitialized && projects.length > 0) {
      setShowCreateProject(false);
    }
  }, [projects.length, projects, isInitialized, userId]);

  const projectId = activeProject?.id;

  useEffect(() => {
    if (!projectId || !userId) return;

    if (unsubscribeTasks) {
      unsubscribeTasks();
    }
    if (unsubscribeBoards) {
      unsubscribeBoards();
    }

    const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));

    const tasksUnsubscribe = onSnapshot(
      tasksQuery,
      snapshot => {
        const tasksData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Task[];

        setTasks(tasksData);
      },
      error => {
        console.error('Error listening to tasks:', error);
      }
    );

    setUnsubscribeTasks(() => tasksUnsubscribe);

    const boardsQuery = query(collection(db, `projects/${projectId}/boards`));

    const boardsUnsubscribe = onSnapshot(
      boardsQuery,
      snapshot => {
        const boardsData = snapshot.docs
          .map(
            doc =>
              ({
                id: doc.id,
                ...doc.data(),
              }) as { id: string; name: string; color?: string; order?: number }
          )
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        setBoards(boardsData);
        setStatuses(boardsData.map(b => b.name));
      },
      error => {
        console.error('Error listening to boards:', error);
      }
    );

    setUnsubscribeBoards(() => boardsUnsubscribe);

    return () => {
      if (tasksUnsubscribe) {
        tasksUnsubscribe();
      }
      if (boardsUnsubscribe) {
        boardsUnsubscribe();
      }
    };
  }, [projectId, userId]);

  const handleDrop = async (taskId: string, newStatus: string) => {

    if (!activeProject?.id) {
      console.error('Account: No active project ID');
      return;
    }

    const userRole = getUserRole(activeProject, userId);
    if (!canEditProject(userRole)) {
      alert('Error: You do not have permission to move tasks. You need Editor or higher role.');
      return;
    }

    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task in database:', error);
    }
  };

  useEffect(() => {
    function handleTaskSave(e: CustomEvent) {
      const { id, updatedTask } = e.detail;

      if (!activeProject?.id) {
        console.error('Account: No active project ID');
        alert('Error: No project selected');
        return;
      }

      const userRole = getUserRole(activeProject, userId);
      if (!canEditProject(userRole)) {
        alert('Error: You do not have permission to edit tasks. You need Editor or higher role.');
        return;
      }

      const normalizedTask = normalizeUpcomingTask(updatedTask);

      updateTask(id, normalizedTask);
    }

    function handleTaskCreate(e: CustomEvent) {

      if (!activeProject?.id) {
        console.error('Account: No active project ID');
        alert('Error: No project selected');
        return;
      }

      const userRole = getUserRole(activeProject, userId);
      if (!canEditProject(userRole)) {
        alert('Error: You do not have permission to create tasks. You need Editor or higher role.');
        return;
      }

      const normalizedTask = normalizeUpcomingTask(e.detail.newTask);

      createTask({
        ...normalizedTask,
        projectId: activeProject.id,
        createdAt: Date.now(),
      })
        .then(id => {
        })
        .catch(error => {
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

    const userRole = getUserRole(activeProject, userId);
    if (!canManageMembers(userRole)) {
      alert('Error: You do not have permission to create boards. You need Admin or higher role.');
      return;
    }

    await addBoard(activeProject.id, boardName, color);
  };

  const handleDeleteBoard = async (status: string) => {
    if (!activeProject) return;

    const userRole = getUserRole(activeProject, userId);
    if (!canManageMembers(userRole)) {
      alert('Error: You do not have permission to delete boards. You need Admin or higher role.');
      return;
    }

    const confirmDelete = window.confirm(`Delete board "${status}" and its tasks?`);
    if (confirmDelete) {
      const boardToDelete = boards.find(b => b.name === status);
      if (boardToDelete) {
        await deleteBoard(activeProject.id, boardToDelete.id);
      }
    }
  };

  const handleUpdateBoard = async (oldStatus: string, newName: string, newColor: string) => {
    if (!activeProject) return;

    const userRole = getUserRole(activeProject, userId);
    if (!canManageMembers(userRole)) {
      alert('Error: You do not have permission to edit boards. You need Admin or higher role.');
      return;
    }

    const boardToUpdate = boards.find(b => b.name === oldStatus);
    if (!boardToUpdate) return;

    await updateBoard(activeProject.id, boardToUpdate.id, {
      name: newName,
      color: newColor,
    });

  };

  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedColumnIndex(index);
    e.dataTransfer.setData('draggedColumnIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragEnd = () => {
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  };

  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();

    const draggedIndexStr = e.dataTransfer.getData('draggedColumnIndex');

    if (!draggedIndexStr) {
      return;
    }

    const draggedIndex = Number(draggedIndexStr);

    if (draggedIndex === dropIndex) {
      return;
    }

    if (activeProject) {
      const currentBoards = [...boards];
      const [dragged] = currentBoards.splice(draggedIndex, 1);
      currentBoards.splice(dropIndex, 0, dragged);
      const boardOrder = currentBoards.map(b => b.id);
      updateBoardOrder(activeProject.id, boardOrder).catch(error => {
        console.error('Failed to update board order in database:', error);
      });
    }
  };

  if (!userId) {
    return <p>No user ID found. Please log in.</p>;
  }

  if (isLoading) {
    return <p>Loading user data...</p>;
  }
  
  if (projectsLoading) {
    return <p>Loading projects...</p>;
  }
  
  if (isError) {
    return <p>Error: {error?.message}</p>;
  }

  if (!isInitialized) {
    return <p>Initializing projects...</p>;
  }

  const upcomingTasks = tasks.filter(
    t => t.status === 'upcoming' && typeof t.deadline === 'number' && t.deadline > Date.now()
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
      <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />
        <div className="container">
          {mode === 'current' ? (
            <>
                             {showCreateProject ? (
                 <CreateProject userId={userId} isManualOpen={false} setShowCreateProject={setShowCreateProject} />
               ) : (
                <div className="kanban">
                  {statuses.map((status, index) => {
                    const board = boards.find(b => b.name === status);
                    const color = board?.color || '#ccc';
                    const filteredTasks = currentTasks.filter(task => task.status === status);
                    const userRole = activeProject ? getUserRole(activeProject, userId) : null;
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
                        userRole={userRole}
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
        <TaskModal
          ref={modalTaskRef}
          statuses={statuses}
          statusLabels={statusLabels}
          mode={mode}
          readOnly={!canEditProject(activeProject ? getUserRole(activeProject, userId) : null)}
        />
      </div>
    </>
  );
};

export default Account;
