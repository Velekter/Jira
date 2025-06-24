import React from 'react';
import './sidebar.scss';
import menuIcon from './img/menu.png';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        <img src={menuIcon} alt="menu" />
      </button>

      <div className="sidebar">
        <ul>
          <li>Dashboard</li>
          <li>Tasks</li>
          <li>Settings</li>
          <li>Logout</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
