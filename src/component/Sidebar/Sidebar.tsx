import React, { useRef, useState } from 'react';
import './sidebar.scss';
import UserAvatar from '../UserAvatar/UserAvatar';
import { Link, useLocation } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import CreateProject from '../CreateProject/CreateProject';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';
import { getUserRole, canManageMembers } from '../../lib/roles';
import menuIcon from './img/menu.png';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  logoutUser: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, logoutUser }) => {
  const { projects, activeProject, setActiveProject, reorderProjects } = useProjectContext();
  const modalRef = useRef<ModalRef>(null);
  const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const location = useLocation();

  const userId = localStorage.getItem('userId') ?? '';
  const userRole = activeProject ? getUserRole(activeProject, userId) : null;
  const canAccessSettings = canManageMembers(userRole);

  const handleProjectDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedProjectIndex(index);
    e.dataTransfer.setData('draggedProjectIndex', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleProjectDragEnd = () => {
    setDraggedProjectIndex(null);
    setDragOverIndex(null);
  };

  const handleProjectDragOver = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleProjectDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleProjectDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    e.preventDefault();

    const draggedIndexStr = e.dataTransfer.getData('draggedProjectIndex');

    if (!draggedIndexStr) {
      return;
    }

    const draggedIndex = Number(draggedIndexStr);

    if (draggedIndex === dropIndex) {
      return;
    }

    reorderProjects(draggedIndex, dropIndex);
    setDragOverIndex(null);
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path;
  };
 
  return (
    <div className={`sidebar-container ${isOpen ? 'open' : 'collapsed'}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        <div className={`burger-menu ${isOpen ? 'open' : ''}`}>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
          <span className="burger-line"></span>
        </div>
        <img src={menuIcon} alt="menu" className="menu-icon" />
      </button>

      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

      <div className={`sidebar ${isOpen ? 'open' : 'collapsed-sid'}`}>
        <ul className="navigation-menu">
          <li className={isActiveRoute('/account') ? 'active' : ''}>
            <Link to="/account">
              <span className="nav-icon">📊</span>
              {isOpen && <span className="nav-text">Dashboard</span>}
            </Link>
          </li>
          <li className={isActiveRoute('/account/friend') ? 'active' : ''}>
            <Link to="/account/friend">
              <span className="nav-icon">👥</span>
              {isOpen && <span className="nav-text">Friends</span>}
            </Link>
          </li>
          {activeProject && (
            <li className={isActiveRoute('/account/settings') ? 'active' : ''}>
              <Link to="/account/settings">
                <span className="nav-icon">⚙️</span>
                {isOpen && <span className="nav-text">
                  {canAccessSettings ? 'Settings' : 'Project Info'}
                </span>}
              </Link>
            </li>
          )}
          <li>
            <button onClick={logoutUser} className="logout-btn">
              <span className="nav-icon">🚪</span>
              {isOpen && <span className="nav-text">Logout</span>}
            </button>
          </li>
        </ul>

        <div className="project-list">
          <div className="sidebar-divider" />
          <button className="add-project-btn" onClick={() => {
            modalRef.current?.open();
          }}>
            <span className="btn-icon">+</span>
            {isOpen && <span className="btn-text">Add Project</span>}
          </button>
          {projects.length > 0 && (
            <div className="projects-scroll-container">
              <ul>
                {projects.map((project, index) => (
                  <li
                    key={project.id}
                    className={`${activeProject?.id === project.id ? 'active' : ''} ${
                      draggedProjectIndex === index ? 'dragging' : ''
                    } ${dragOverIndex === index ? 'drag-over' : ''}`}
                    data-project-initial={project.name.charAt(0)}
                    onClick={e => {
                      e.stopPropagation();
                      setActiveProject(project);
                    }}
                    draggable
                    onDragStart={e => handleProjectDragStart(e, index)}
                    onDragEnd={handleProjectDragEnd}
                    onDragOver={e => handleProjectDragOver(e, index)}
                    onDragLeave={handleProjectDragLeave}
                    onDrop={e => handleProjectDrop(e, index)}
                  >
                    <div className="project-info">
                      <span className="project-name">{project.name}</span>
                      {isOpen &&
                        (project.owner === userId ? (
                          <span className="project-owner owned">Owned</span>
                        ) : (
                          <span className="project-owner shared">Shared</span>
                        ))}
                    </div>
                    {isOpen && <span className="drag-handle">⋮⋮</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Modal ref={modalRef}>
          <CreateProject 
            userId={userId} 
            isManualOpen={true}
            setShowCreateProject={(show: boolean) => {
              if (!show) {
                modalRef.current?.close();
              }
            }} 
          />
        </Modal>

        <UserAvatar collapsed={!isOpen} />
      </div>
    </div>
  );
};

export default Sidebar;
