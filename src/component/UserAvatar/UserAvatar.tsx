import React from 'react';
import { Link } from 'react-router-dom';
import { useUserData } from '../../hooks/useUserData';
import './UserAvatar.scss';

const avatar = '/avatar.jpg';

interface UserAvatarProps {
  collapsed?: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ collapsed = false }) => {
  const userId = localStorage.getItem('userId') ?? '';
  const { data, isLoading, isError } = useUserData(userId);

  if (isLoading || !data) return null;
  if (isError) return <div className="user-avatar error">Error</div>;

  return (
    <Link to="/account/profile" className={`user-avatar${collapsed ? ' collapsed' : ''}`}>
      <div className="avatar">
        {avatar ? (
          <img src={avatar} alt="Avatar" />
        ) : (
          <div className="placeholder">{data.fullName?.charAt(0).toUpperCase()}</div>
        )}
      </div>
      <div className="name">{data.fullName}</div>
    </Link>
  );
};

export default UserAvatar;
