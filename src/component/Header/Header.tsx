import React, { useRef } from 'react';
import type { ModalRef } from '../Modal/Modal';
import type { TaskModalRef } from '../TaskModal/TaskModal';
import './header.scss';
import AddBoardModal from '../AddBoardModal/AddBoardModal';
import TaskModal from '../TaskModal/TaskModal';

interface HeaderProps {
  isSidebarOpen: boolean;
  onCreateBoard: (boardName: string, color: string) => void;
  mode: 'current' | 'upcoming';
  setMode: (mode: 'current' | 'upcoming') => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onCreateBoard, mode, setMode }) => {
  const modalRef = useRef<ModalRef>(null);
  const modalTaskRef = useRef<TaskModalRef>(null);

  const handleClick = () => {
    if (mode === 'upcoming') {
      modalTaskRef.current?.open();
    } else {
      modalRef.current?.open();
    }
  };

  return (
    <header className={`dashboard-header ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <h1>Kanban Dashboard</h1>
      <div className="kanban-header__buttons">
        <button className={mode === 'upcoming' ? 'active' : ''} onClick={() => setMode('upcoming')}>
          Upcoming Tasks
        </button>
        <button className={mode === 'current' ? 'active' : ''} onClick={() => setMode('current')}>
          Current Task
        </button>
        <button className="add-board-btn" onClick={handleClick}>
          {mode === 'upcoming' ? '+ Add Task' : '+ Add Board'}
        </button>
      </div>
      <AddBoardModal ref={modalRef} onCreateBoard={onCreateBoard} />
      <TaskModal ref={modalTaskRef} statuses={mode === 'upcoming' ? [] : ['todo', 'inProgress', 'done']} statusLabels={{
        todo: 'To Do',
        inProgress: 'In Progress',
        done: 'Done',
      }} mode={mode} />
    </header>
  );
};

export default Header;
