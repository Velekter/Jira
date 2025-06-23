import React, { useState } from 'react';
import './sidebar.scss';
import menuIcon from './img/menu.png'; 

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(prev => !prev);
  };

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