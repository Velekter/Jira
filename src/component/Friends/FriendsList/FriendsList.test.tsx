import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import FriendsList from './FriendsList';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('../../../lib/firebase', () => ({
  db: {},
}));

vi.mock('../../Modal/Modal', () => ({
  default: React.forwardRef(({ children }: any, ref: any) => {
    if (ref) {
      ref.current = {
        open: vi.fn(),
        close: vi.fn(),
      };
    }
    return <div data-testid="modal">{children}</div>;
  }),
}));

vi.mock('../FriendsProfile/FriendsProfile', () => ({
  default: ({ friend, onRemoveFriend }: any) => (
    <div data-testid="friends-profile">
      <h3>{friend.fullName}</h3>
      <p>{friend.email}</p>
      <button onClick={onRemoveFriend}>Remove Friend</button>
    </div>
  ),
}));

const renderFriendsList = () => {
  return render(<FriendsList />);
};

describe('FriendsList component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-user-id'),
      },
      writable: true,
    });
  });

  test('renders loading state initially', async () => {
    const mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((docRef: any, callback: any) => {
      return mockUnsubscribe;
    });

    await act(async () => {
      renderFriendsList();
    });

    expect(screen.getByText('Your Friends')).toBeInTheDocument();
    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  test('renders empty state when no friends', async () => {
    const mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((docRef: any, callback: any) => {
      callback({
        exists: () => true,
        data: () => ({ friends: {} }),
      });
      return mockUnsubscribe;
    });

    await act(async () => {
      renderFriendsList();
    });

    expect(screen.getByText('No friends yet')).toBeInTheDocument();
    expect(screen.getByText('Start by searching for friends above!')).toBeInTheDocument();
  });

  test('renders single friend when one friend exists', async () => {
    const mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((docRef: any, callback: any) => {
      callback({
        exists: () => true,
        data: () => ({
          friends: {
            'friend-1': true,
          },
        }),
      });
      return mockUnsubscribe;
    });

    (firestore.getDoc as any).mockImplementation(() => {
      return Promise.resolve({
        exists: () => true,
        id: 'friend-1',
        data: () => ({
          id: 'friend-1',
          fullName: 'Test Friend',
          email: 'test@example.com',
        }),
      });
    });

    await act(async () => {
      renderFriendsList();
    });

    expect(screen.getByText('Test Friend')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('filters out non-existent friends', async () => {
    const mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((docRef: any, callback: any) => {
      callback({
        exists: () => true,
        data: () => ({
          friends: {
            'friend-1': true,
            'friend-2': true,
          },
        }),
      });
      return mockUnsubscribe;
    });

    let callCount = 0;
    (firestore.getDoc as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          exists: () => true,
          id: 'friend-1',
          data: () => ({
            id: 'friend-1',
            fullName: 'Friend 1',
            email: 'friend1@example.com',
          }),
        });
      } else {
        return Promise.resolve({
          exists: () => false,
        });
      }
    });

    await act(async () => {
      renderFriendsList();
    });

    expect(screen.getByText('Friend 1')).toBeInTheDocument();
    expect(screen.queryByText('Friend 2')).not.toBeInTheDocument();
  });
}); 