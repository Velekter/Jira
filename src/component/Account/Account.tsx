import React, { useState } from 'react';
import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import './account.scss';

const Account: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError, error } = useUserData(userId);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <div className={`account-page ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} logoutUser={logoutUser} />
      <div className="container">
        <h1>
          111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111
        </h1>
        <h1>Welcome, {data?.fullName}</h1>
        <p>Email: {data?.email}</p>
        <button onClick={logoutUser} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default Account;
