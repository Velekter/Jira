import React from 'react';

import { useUserData } from '../../hooks/useUserData';
import { logoutUser } from '../../lib/auth';
import Sidebar from '../Sidebar/Sidebar';
import './account.scss'

const Account: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError, error } = useUserData(userId);

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Error: {error?.message}</p>;

  return (
    <div className='container'>
      <Sidebar />
      <h1>Welcome, {data?.fullName}</h1>
      <p>Email: {data?.email}</p>
      <button onClick={logoutUser} className="logout-button">
        Logout
      </button>
    </div>
  );
};

export default Account;
