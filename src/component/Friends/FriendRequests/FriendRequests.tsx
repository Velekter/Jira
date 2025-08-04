import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import './friendRequests.scss';

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: string;
  timestamp: number;
}

interface UserData {
  fullName: string;
  email: string;
}

interface DetailedRequest extends FriendRequest {
  fromUser?: UserData;
  toUser?: UserData;
}

export default function FriendRequests() {
  const currentUserId = localStorage.getItem('userId');
  const [incoming, setIncoming] = useState<DetailedRequest[]>([]);
  const [outgoing, setOutgoing] = useState<DetailedRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (uid: string): Promise<UserData> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');
    return userSnap.data() as UserData;
  };

  useEffect(() => {
    if (!currentUserId) return;

    const incomingQuery = query(
      collection(db, 'friendRequests'),
      where('to', '==', currentUserId),
      where('status', '==', 'pending')
    );

    const outgoingQuery = query(
      collection(db, 'friendRequests'),
      where('from', '==', currentUserId),
      where('status', '==', 'pending')
    );

    const unsubIncoming = onSnapshot(incomingQuery, async snapshot => {
      const incomingReqs: DetailedRequest[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Omit<FriendRequest, 'id'>;
        const request: DetailedRequest = { ...data, id: docSnap.id };
        try {
          request.fromUser = await fetchUserData(data.from);
          incomingReqs.push(request);
        } catch (err) {
          console.warn('Error fetching user data:', err);
        }
      }
      setIncoming(incomingReqs);
      setLoading(false);
    });

    const unsubOutgoing = onSnapshot(outgoingQuery, async snapshot => {
      const outgoingReqs: DetailedRequest[] = [];
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data() as Omit<FriendRequest, 'id'>;
        const request: DetailedRequest = { ...data, id: docSnap.id };
        try {
          request.toUser = await fetchUserData(data.to);
          outgoingReqs.push(request);
        } catch (err) {
          console.warn('Error fetching user data:', err);
        }
      }
      setOutgoing(outgoingReqs);
      setLoading(false);
    });

    return () => {
      unsubIncoming();
      unsubOutgoing();
    };
  }, [currentUserId]);

  const acceptRequest = async (request: FriendRequest) => {
    try {
      const { from, to, id } = request;

      const fromRef = doc(db, 'users', from);
      const toRef = doc(db, 'users', to);

      const [fromSnap, toSnap] = await Promise.all([getDoc(fromRef), getDoc(toRef)]);

      if (!fromSnap.exists() || !toSnap.exists()) {
        console.error('One or both users not found');
        return;
      }

      const fromData = fromSnap.data();
      const toData = toSnap.data();

      

      await updateDoc(doc(db, 'friendRequests', id), { status: 'accepted' });

      await Promise.all([
        updateDoc(fromRef, {
          friends: {
            ...(fromData.friends || {}),
            [to]: true,
          },
        }),
        updateDoc(toRef, {
          friends: {
            ...(toData.friends || {}),
            [from]: true,
          },
        }),
      ]);

      const fromSnapAfter = await getDoc(fromRef);
      
    } catch (error) {
      console.error('Error in acceptRequest:', error);
    }
  };

  const rejectRequest = async (id: string) => {
    await deleteDoc(doc(db, 'friendRequests', id));
  };

  const cancelRequest = async (id: string) => {
    await deleteDoc(doc(db, 'friendRequests', id));
  };

  if (loading) {
    return (
      <div className="friend-requests">
        <h2>Friend Requests</h2>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-requests">
      <h2>Friend Requests</h2>

      <div className="requests-section">
        <h3>Incoming Requests</h3>
        {incoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📥</div>
            <p>No incoming requests</p>
          </div>
        ) : (
          <ul>
            {incoming.map(req => (
              <li key={req.id}>
                <div className="user-info">
                  <div className="user-avatar">
                    {req.fromUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="user-details">
                    <p className="user-name">{req.fromUser?.fullName}</p>
                    <p className="user-email">{req.fromUser?.email}</p>
                  </div>
                </div>
                <div className="friend-actions">
                  <button className="accept" onClick={() => acceptRequest(req)}>
                    Accept
                  </button>
                  <button className="reject" onClick={() => rejectRequest(req.id)}>
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="requests-section">
        <h3>Outgoing Requests</h3>
        {outgoing.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📤</div>
            <p>No outgoing requests</p>
          </div>
        ) : (
          <ul>
            {outgoing.map(req => (
              <li key={req.id}>
                <div className="user-info">
                  <div className="user-avatar">
                    {req.toUser?.fullName?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="user-details">
                    <p className="user-name">{req.toUser?.fullName}</p>
                    <p className="user-email">{req.toUser?.email}</p>
                  </div>
                </div>
                <div className="friend-actions">
                  <button className="cancel" onClick={() => cancelRequest(req.id)}>
                    Cancel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
