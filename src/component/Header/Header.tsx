import React, { useRef } from 'react';
import type { ModalRef } from '../Modal/Modal';
import './header.scss';
import AddBoardModal from '../AddBoaedModal/AddBoardModal';

interface HeaderProps {
  isSidebarOpen: boolean;
  onCreateBoard: (boardName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, onCreateBoard }) => {
  const modalRef = useRef<ModalRef>(null);

  const handleAddBoardClick = () => {
    modalRef.current?.open();
  };

  return (
    <header className={`dashboard-header ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <h1>Kanban Dashboard</h1>
      <div className="kanban-header__buttons">
        <button>Upcoming Tasks</button>
        <button>Current Task</button>
        <button className="add-board-btn" onClick={handleAddBoardClick}> + Add Board</button>
      </div>

      <AddBoardModal ref={modalRef} onCreateBoard={onCreateBoard} />
    </header>
  );
};

export default Header;
