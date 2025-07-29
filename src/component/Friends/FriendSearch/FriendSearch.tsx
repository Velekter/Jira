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

  const handleSearch = () => {
    if (email.trim()) {
      mutate(email.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="friend-search">
      <h2>Find Friends</h2>
      <p className="search-description">Search for friends by their email address</p>
      
      <div className="search-bar">
        <input
          type="email"
          placeholder="Enter friend's email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button onClick={handleSearch} disabled={searching || !email.trim()}>
          {searching ? (
            <>
              <div className="spinner"></div>
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {foundUser && (
        <div className="result">
          <div className="user-info">
            <div className="user-avatar">
              {foundUser.fullName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div className="user-details">
              <p className="user-name">{foundUser.fullName}</p>
              <p className="user-email">{foundUser.email}</p>
            </div>
          </div>
          <button 
            onClick={() => sendRequest(foundUser.id)} 
            disabled={sending}
            className="send-request-btn"
          >
            {sending ? (
              <>
                <div className="spinner"></div>
                Sending...
              </>
            ) : (
              'Send Friend Request'
            )}
          </button>
        </div>
      )}

      {hasSearched && foundUser === null && (
        <div className="not-found">
          <div className="not-found-icon">🔍</div>
          <p>User not found</p>
          <p className="not-found-subtitle">Make sure the email address is correct</p>
        </div>
      )}
    </div>
  );
}
