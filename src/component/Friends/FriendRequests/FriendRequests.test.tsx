import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import FriendRequests from './FriendRequests';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('../../../lib/firebase', () => ({
  db: {},
}));

const mockUnsubscribe = vi.fn();

const renderFriendRequests = () => {
  return render(<FriendRequests />);
};

describe('FriendRequests component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'current-user-id'),
      },
      writable: true,
    });

    (firestore.onSnapshot as any).mockReturnValue(mockUnsubscribe);
  });

  test('renders loading state initially', () => {
    renderFriendRequests();

    expect(screen.getByText('Friend Requests')).toBeInTheDocument();
    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });

  test('renders empty states when no requests', async () => {
    (firestore.onSnapshot as any).mockImplementation((queryRef: any, callback: any) => {
      callback({
        docs: [],
      });
      return mockUnsubscribe;
    });

    await act(async () => {
      renderFriendRequests();
    });

    await waitFor(() => {
      expect(screen.getByText('Incoming Requests')).toBeInTheDocument();
      expect(screen.getByText('Outgoing Requests')).toBeInTheDocument();
    });
  });

  test('handles missing currentUserId', () => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => null),
      },
      writable: true,
    });

    renderFriendRequests();

    expect(screen.getByText('Loading requests...')).toBeInTheDocument();
  });
}); 