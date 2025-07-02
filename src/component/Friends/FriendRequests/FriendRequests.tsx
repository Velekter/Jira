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

    console.log('Before update fromData.friends:', fromData.friends);
    console.log('Before update toData.friends:', toData.friends);

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
    console.log('After update fromData.friends:', fromSnapAfter.data()?.friends);

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

  if (loading) return <p>Loading requests...</p>;

  return (
    <div className="friend-requests">
      <h2>Incoming Friend Requests</h2>
      {incoming.length === 0 ? (
        <p>No incoming requests</p>
      ) : (
        <ul>
          {incoming.map(req => (
            <li key={req.id}>
              <p>
                {req.fromUser?.fullName} ({req.fromUser?.email})
              </p>
              <button onClick={() => acceptRequest(req)}>Accept</button>
              <button onClick={() => rejectRequest(req.id)}>Reject</button>
            </li>
          ))}
        </ul>
      )}

      <h2>Outgoing Friend Requests</h2>
      {outgoing.length === 0 ? (
        <p>No outgoing requests</p>
      ) : (
        <ul>
          {outgoing.map(req => (
            <li key={req.id}>
              <p>
                {req.toUser?.fullName} ({req.toUser?.email})
              </p>
              <button onClick={() => cancelRequest(req.id)}>Cancel</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
