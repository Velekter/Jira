import React from 'react';
import './friendsProfile.scss';

interface Friend {
  id: string;
  fullName: string;
  email: string;
}

interface FriendsProfileProps {
  friend: Friend;
  onRemoveFriend: () => void;
}

const FriendsProfile: React.FC<FriendsProfileProps> = ({ friend, onRemoveFriend }) => {
  const handleRemoveClick = () => {
    const confirmRemove = window.confirm(
      `Are you sure you want to remove ${friend.fullName} from your friends list?`
    );

    if (confirmRemove) {
      onRemoveFriend();
    }
  };

  return (
    <div className="friends-profile">
      <div className="friend-avatar-large">
        {friend.fullName?.charAt(0)?.toUpperCase() || '?'}
      </div>
      <div className="friend-info">
        <h4>{friend.fullName}</h4>
        <p className="friend-email">{friend.email}</p>
      </div>
      <div className="profile-actions">
        <button className="remove-friend-btn" onClick={handleRemoveClick}>
          Remove Friend
        </button>
      </div>
    </div>
  );
};

export default FriendsProfile; 