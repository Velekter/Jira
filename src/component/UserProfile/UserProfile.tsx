import React from 'react';
import { useUserData } from '../../hooks/useUserData';
import { Link, useNavigate } from 'react-router-dom';
import './UserProfile.scss';

const UserProfile: React.FC = () => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError } = useUserData(userId);
  const navigate = useNavigate();

  if (isLoading) return <div className="user-profile">Loading...</div>;
  if (isError || !data) return <div className="user-profile">Error loading user</div>;

  return (
    <Link to='/account/profile' className="user-profile" >
      <div className="avatar">{data.fullName.charAt(0).toUpperCase()}</div>
      <div className="info">
        <div className="name">{data.fullName}</div>
      </div>
    </Link>
  );
};

export default UserProfile;
