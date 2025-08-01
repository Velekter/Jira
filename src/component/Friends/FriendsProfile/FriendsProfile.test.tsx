import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import FriendsProfile from './FriendsProfile';

const mockFriend = {
  id: 'friend-1',
  fullName: 'John Doe',
  email: 'john@example.com',
};

const mockOnRemoveFriend = vi.fn();

const renderFriendsProfile = () => {
  return render(
    <FriendsProfile 
      friend={mockFriend} 
      onRemoveFriend={mockOnRemoveFriend} 
    />
  );
};

describe('FriendsProfile component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'confirm', {
      value: vi.fn(),
      writable: true,
    });
  });

  test('renders friend information correctly', () => {
    renderFriendsProfile();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('J')).toBeInTheDocument();
  });

  test('renders remove friend button', () => {
    renderFriendsProfile();

    expect(screen.getByText('Remove Friend')).toBeInTheDocument();
  });

  test('shows confirmation dialog when remove button is clicked', () => {
    (window.confirm as any).mockReturnValue(true);
    renderFriendsProfile();

    const removeButton = screen.getByText('Remove Friend');
    fireEvent.click(removeButton);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to remove John Doe from your friends list?'
    );
  });

  test('calls onRemoveFriend when user confirms removal', () => {
    (window.confirm as any).mockReturnValue(true);
    renderFriendsProfile();

    const removeButton = screen.getByText('Remove Friend');
    fireEvent.click(removeButton);

    expect(mockOnRemoveFriend).toHaveBeenCalledTimes(1);
  });

  test('does not call onRemoveFriend when user cancels removal', () => {
    (window.confirm as any).mockReturnValue(false);
    renderFriendsProfile();

    const removeButton = screen.getByText('Remove Friend');
    fireEvent.click(removeButton);

    expect(mockOnRemoveFriend).not.toHaveBeenCalled();
  });

  test('handles friend with empty fullName', () => {
    const friendWithEmptyName = {
      ...mockFriend,
      fullName: '',
    };

    render(
      <FriendsProfile 
        friend={friendWithEmptyName} 
        onRemoveFriend={mockOnRemoveFriend} 
      />
    );

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  test('handles friend with undefined fullName', () => {
    const friendWithUndefinedName = {
      ...mockFriend,
      fullName: undefined as any,
    };

    render(
      <FriendsProfile 
        friend={friendWithUndefinedName} 
        onRemoveFriend={mockOnRemoveFriend} 
      />
    );

    expect(screen.getByText('?')).toBeInTheDocument();
  });

  test('displays first character of friend name in avatar', () => {
    const friendWithLongName = {
      ...mockFriend,
      fullName: 'Alice Johnson Smith',
    };

    render(
      <FriendsProfile 
        friend={friendWithLongName} 
        onRemoveFriend={mockOnRemoveFriend} 
      />
    );

    expect(screen.getByText('A')).toBeInTheDocument();
  });
}); 