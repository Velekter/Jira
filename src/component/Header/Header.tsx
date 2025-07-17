import React from 'react';
import './header.scss';

interface HeaderProps {
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen }) => {
  return (
    <header className={`dashboard-header ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <h1>Kanban Dashboard</h1>
      <div className="kanban-header__buttons">
        <button>Upcoming Tasks</button>
        <button>Current Task</button>
      </div>
    </header>
  );
};

export default Header;
