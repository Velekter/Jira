import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db, auth} from '../../../lib/firebase';
import './friendSearch.scss';

export default function FriendSearch() {
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const currentUserId = localStorage.getItem('userId');

  const searchUser = async (email: string) => {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      return { id: docData.id, ...docData.data() };
    }
    return null;
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async (userEmail: string) => {
      setSearching(true);
      const user = await searchUser(userEmail);

      if (user && user.id === currentUserId) {
        setFoundUser(null);
        setHasSearched(true);
        setSearching(false);
        return;
      }

      setFoundUser(user);
      setHasSearched(true);
      setSearching(false);
    },
  });

  const sendFriendRequest = async (receiverId: string) => {
    const senderId = auth.currentUser?.uid;
    if (!senderId) throw new Error('Not authenticated');

    const requestRef = doc(db, 'friendRequests', `${currentUserId}_${receiverId}`);
    await setDoc(requestRef, {
      from: currentUserId,
      to: receiverId,
      status: 'pending',
      timestamp: Date.now(),
    });
  };

  const { mutate: sendRequest, isPending: sending } = useMutation({
    mutationFn: sendFriendRequest,
  });

  return (
    <div className="friend-search">
      <h2>Find Friends</h2>
      <div className="search-bar">
        <input
          type="email"
          placeholder="Enter user email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button onClick={() => mutate(email)} disabled={searching || !email}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </div>

      {foundUser && (
        <div className="result">
          <p>
            <strong>{foundUser.fullName}</strong> – {foundUser.email}
          </p>
          <button onClick={() => sendRequest(foundUser.id)} disabled={sending}>
            {sending ? 'Sending...' : 'Send Friend Request'}
          </button>
        </div>
      )}

      {hasSearched && foundUser === null && <p className="not-found">User not found</p>}
    </div>
  );
}
