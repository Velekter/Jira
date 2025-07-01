import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
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

  const fetchRequests = async () => {
    console.log('userId from localStorage:', localStorage.getItem('userId'));

    if (!currentUserId) return;

    const q = query(collection(db, 'friendRequests'), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);

    const incomingReqs: DetailedRequest[] = [];
    const outgoingReqs: DetailedRequest[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Omit<FriendRequest, 'id'>;
      const request: DetailedRequest = {
        ...data,
        id: docSnap.id,
      };

      if (data.to === currentUserId) {
        // Дозволено, currentUser — отримувач, бачить відправника
        if (currentUserId !== data.to && currentUserId !== data.from) {
          console.warn('Немає доступу до цього запиту');
          continue;
        }

        try {
          request.fromUser = await fetchUserData(data.from);
          incomingReqs.push(request);
        } catch (err) {
          console.warn('Помилка при отриманні даних користувача:', err);
        }
      } else if (data.from === currentUserId) {
        // Дозволено, currentUser — відправник, бачить отримувача
        if (currentUserId !== data.from && currentUserId !== data.to) {
          console.warn('Немає доступу до цього запиту');
          continue;
        }

        try {
          request.toUser = await fetchUserData(data.to);
          outgoingReqs.push(request);
        } catch (err) {
          console.warn('Помилка при отриманні даних користувача:', err);
        }
      }
    }

    setIncoming(incomingReqs);
    setOutgoing(outgoingReqs);
    setLoading(false);
  };

  const acceptRequest = async (request: FriendRequest) => {
    const { from, to, id } = request;

    await updateDoc(doc(db, 'friendRequests', id), { status: 'accepted' });

    await Promise.all([
      updateDoc(doc(db, 'users', to), {
        [`friends.${from}`]: true,
      }),
      updateDoc(doc(db, 'users', from), {
        [`friends.${to}`]: true,
      }),
    ]);

    fetchRequests();
  };

  const rejectRequest = async (id: string) => {
    await deleteDoc(doc(db, 'friendRequests', id));
    fetchRequests();
  };

  const cancelRequest = async (id: string) => {
    await deleteDoc(doc(db, 'friendRequests', id));
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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
