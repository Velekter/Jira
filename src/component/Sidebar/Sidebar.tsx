import React, { useRef, useState } from 'react';
import './sidebar.scss';
import menuIcon from './img/menu.png';
import UserAvatar from '../UserAvatar/UserAvatar';
import { Link } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';
import CreateProject from '../CreateProject/CreateProject';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';

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

  const userId = localStorage.getItem('userId') ?? '';

  const handleProjectDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    console.log('Drag start triggered for index:', index);
    
    console.log('Starting drag for project:', index);
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
    console.log('Drag over project:', index);
  };

  const handleProjectDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleProjectDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    e.preventDefault();
    console.log('Drop event triggered for index:', dropIndex);
    
    const draggedIndexStr = e.dataTransfer.getData('draggedProjectIndex');
    console.log('Dragged index string:', draggedIndexStr);
    
    if (!draggedIndexStr) {
      console.log('No dragged index found');
      return;
    }

    const draggedIndex = Number(draggedIndexStr);
    console.log('Dragged index number:', draggedIndex);
    
    if (draggedIndex === dropIndex) {
      console.log('Same index, no reordering needed');
      return;
    }

    console.log('Reordering projects:', draggedIndex, 'to', dropIndex);

    reorderProjects(draggedIndex, dropIndex);
    setDragOverIndex(null);
  };

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
            <Link to="/account/friend">Friend</Link>
          </li>
        </ul>

        <div className="project-list">
          <h4>Projects</h4>
          {projects.length > 0 && (
            <ul>
              {projects.map((project, index) => (
                <li
                  key={project.id}
                  className={`${activeProject?.id === project.id ? 'active' : ''} ${
                    draggedProjectIndex === index ? 'dragging' : ''
                  } ${dragOverIndex === index ? 'drag-over' : ''}`}
                  onClick={(e) => {
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
                    {project.owner === userId ? (
                      <span className="project-owner owned">Owned</span>
                    ) : (
                      <span className="project-owner shared">Shared</span>
                    )}
                  </div>
                  <span className="drag-handle">⋮⋮</span>
                </li>
              ))}
            </ul>
          )}
          <button className="add-project-btn" onClick={() => modalRef.current?.open()}>
            + Add Project
          </button>
        </div>

        <Modal ref={modalRef}>
          <CreateProject userId={userId} setShowCreateProject={() => modalRef.current?.close()} />
        </Modal>

        <UserAvatar collapsed={!isOpen} />
      </div>
    </div>
  );
};

export default Sidebar;
