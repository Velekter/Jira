import { useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import './friendsList.scss'

export default function FriendsList() {
  const userId = localStorage.getItem('userId') ?? '';
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
  if (!userId) return;

  const userDocRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const friendsObj = userData.friends || {};
      const friendsIds = Object.keys(friendsObj);

      const friendsData = await Promise.all(
        friendsIds.map(async (friendId) => {
          const friendDoc = await getDoc(doc(db, 'users', friendId));
          if (friendDoc.exists()) {
            return { id: friendDoc.id, ...friendDoc.data() };
          }
          return null;
        })
      );

      setFriends(friendsData.filter(Boolean) as any[]);
    }
  });

  return () => unsubscribe();
}, [userId]);



  return (
    <div className="friend-list">
      <h2>Your Friends</h2>
      {friends.length === 0 ? (
        <p>No friends yet</p>
      ) : (
        <ul>
          {friends.map(friend => (
            <li key={friend.id}>
              {friend.fullName} ({friend.email})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
