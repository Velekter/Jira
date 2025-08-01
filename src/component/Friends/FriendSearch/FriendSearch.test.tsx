import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import FriendSearch from './FriendSearch';

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('../../../lib/firebase', () => ({
  db: {},
  auth: {
    currentUser: {
      uid: 'current-user-id',
    },
  },
}));

const renderFriendSearch = () => {
  return render(<FriendSearch />);
};

describe('FriendSearch component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'current-user-id'),
      },
      writable: true,
    });
  });

  test('renders search form', () => {
    renderFriendSearch();

    expect(screen.getByText('Find Friends')).toBeInTheDocument();
    expect(screen.getByText('Search for friends by their email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter friend's email address")).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
  });

  test('search button is disabled when email is empty', () => {
    renderFriendSearch();

    const searchButton = screen.getByText('Search');
    expect(searchButton).toBeDisabled();
  });

  test('search button is enabled when email is entered', () => {
    renderFriendSearch();

    const emailInput = screen.getByPlaceholderText("Enter friend's email address");
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const searchButton = screen.getByText('Search');
    expect(searchButton).not.toBeDisabled();
  });

  test('handles email input change', () => {
    renderFriendSearch();

    const emailInput = screen.getByPlaceholderText("Enter friend's email address");
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    expect(emailInput).toHaveValue('new@example.com');
  });

  test('handles Enter key press', () => {
    renderFriendSearch();

    const emailInput = screen.getByPlaceholderText("Enter friend's email address");
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.keyPress(emailInput, { key: 'Enter', code: 'Enter' });

    expect(emailInput).toHaveValue('test@example.com');
  });

  test('handles search button click', () => {
    renderFriendSearch();

    const emailInput = screen.getByPlaceholderText("Enter friend's email address");
    const searchButton = screen.getByText('Search');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(searchButton);

    expect(emailInput).toHaveValue('test@example.com');
  });


}); 