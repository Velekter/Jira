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
  console.log('Account: userId from localStorage:', userId);
  console.log('Account: userId length:', userId.length);
  
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
    console.log('Projects changed:', projects.length, 'projects');
    console.log('Projects:', projects.map(p => ({ id: p.id, name: p.name })));
    console.log('isInitialized:', isInitialized);
    console.log('Current userId in Account:', userId);
    
    if (isInitialized && projects.length === 0) {
      console.log('Showing create project modal (no projects)');
      setShowCreateProject(true);
    } else if (isInitialized && projects.length > 0) {
      console.log('Hiding create project modal (projects exist)');
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

        console.log('Real-time tasks update:', tasksData);
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

        console.log('Real-time boards update:', boardsData);
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
    console.log('Dropping task:', taskId, 'to status:', newStatus);

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
      console.log('Account: Received task create event:', e.detail.newTask);

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
      console.log('Account: Normalized task:', normalizedTask);

      createTask({
        ...normalizedTask,
        projectId: activeProject.id,
        createdAt: Date.now(),
      })
        .then(id => {
          console.log('Account: Task created with ID:', id);
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

    if (activeProject) {
      const currentBoards = [...boards];
      const [dragged] = currentBoards.splice(draggedIndex, 1);
      currentBoards.splice(dropIndex, 0, dragged);
      const boardOrder = currentBoards.map(b => b.id);
      console.log('Saving board order to database:', boardOrder);
      updateBoardOrder(activeProject.id, boardOrder).catch(error => {
        console.error('Failed to update board order in database:', error);
      });
    }
  };

  console.log('Account: Current states - isLoading:', isLoading, 'projectsLoading:', projectsLoading, 'isInitialized:', isInitialized);
  console.log('Account: Projects count:', projects.length);
  console.log('Account: isError:', isError, 'error:', error);

  if (!userId) {
    console.log('Account: No userId found, redirecting to login');
    return <p>No user ID found. Please log in.</p>;
  }

  if (isLoading) {
    console.log('Account: User data loading');
    return <p>Loading user data...</p>;
  }
  
  if (projectsLoading) {
    console.log('Account: Projects loading');
    return <p>Loading projects...</p>;
  }
  
  if (isError) {
    console.log('Account: User data error');
    return <p>Error: {error?.message}</p>;
  }

  if (!isInitialized) {
    console.log('Account: Projects not initialized yet');
    return <p>Initializing projects...</p>;
  }

  console.log('Account: All loading checks passed, rendering content');
  console.log('Account: Projects count:', projects.length);
  console.log('Account: Show create project:', showCreateProject);

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
