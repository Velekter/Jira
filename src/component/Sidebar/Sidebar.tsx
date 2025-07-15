import React from 'react';
import './sidebar.scss';

import menuIcon from './img/menu.png';
import UserAvatar from '../UserAvatar/UserAvatar';
import { Link } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  logoutUser: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, logoutUser }) => {
  return (
    <div className={`sidebar-container ${isOpen ? 'open' : 'collapsed'}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        <img src={menuIcon} alt="menu" />
      </button>

      <div className={`sidebar ${isOpen ? 'open' : 'collapsed-sid'}`}>
        <ul>
          <li>Dashboard</li>
          <li>Tasks</li>
          <li>Settings</li>
          <li>
            <button onClick={logoutUser}>Logout</button>
          </li>
          <li>
            <Link to='/account/friend' >Friend</Link>
          </li>
        </ul>

        <UserAvatar collapsed={!isOpen} />
      </div>
    </div>
  );
};

export default Sidebar;
