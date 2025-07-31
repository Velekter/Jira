import { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Modal from '../../Modal/Modal';
import type { ModalRef } from '../../Modal/Modal';
import FriendsProfile from '../FriendsProfile/FriendsProfile';
import './friendsList.scss';

interface Friend {
  id: string;
  fullName: string;
  email: string;
}

export default function FriendsList() {
  const userId = localStorage.getItem('userId') ?? '';
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const modalRef = useRef<ModalRef>(null);

  useEffect(() => {
    if (!userId) return;

    const userDocRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(userDocRef, async docSnap => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        const friendsObj = userData.friends || {};
        const friendsIds = Object.keys(friendsObj);

        const friendsData = await Promise.all(
          friendsIds.map(async friendId => {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            if (friendDoc.exists()) {
              return { id: friendDoc.id, ...friendDoc.data() } as Friend;
            }
            return null;
          })
        );

        setFriends(friendsData.filter(Boolean) as Friend[]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const handleFriendClick = (friend: Friend) => {
    setSelectedFriend(friend);
    modalRef.current?.open();
  };

  const handleCloseModal = () => {
    modalRef.current?.close();
    setSelectedFriend(null);
  };

  const handleRemoveFriend = async () => {
    if (!selectedFriend || !userId) return;

    try {
      const userRef = doc(db, 'users', userId);
      const friendRef = doc(db, 'users', selectedFriend.id);

      const [userSnap, friendSnap] = await Promise.all([getDoc(userRef), getDoc(friendRef)]);

      if (userSnap.exists() && friendSnap.exists()) {
        const userData = userSnap.data();
        const friendData = friendSnap.data();

        const updatedUserFriends = { ...userData.friends };
        const updatedFriendFriends = { ...friendData.friends };

        delete updatedUserFriends[selectedFriend.id];
        delete updatedFriendFriends[userId];

        await Promise.all([
          updateDoc(userRef, { friends: updatedUserFriends }),
          updateDoc(friendRef, { friends: updatedFriendFriends }),
        ]);

        handleCloseModal();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (loading) {
    return (
      <div className="friends-list">
        <h2>Your Friends</h2>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-list">
      <h2>Your Friends</h2>
      {friends.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <p>No friends yet</p>
          <p className="empty-subtitle">Start by searching for friends above!</p>
        </div>
      ) : (
        <ul>
          {friends.map(friend => (
            <li key={friend.id} onClick={() => handleFriendClick(friend)}>
              <div className="user-info">
                <div className="user-avatar">
                  {friend.fullName?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="user-details">
                  <p className="user-name">{friend.fullName}</p>
                  <p className="user-email">{friend.email}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal ref={modalRef}>
        {selectedFriend && (
          <FriendsProfile friend={selectedFriend} onRemoveFriend={handleRemoveFriend} />
        )}
      </Modal>
    </div>
  );
}
