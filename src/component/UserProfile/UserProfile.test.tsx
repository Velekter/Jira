import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import UserProfile from './UserProfile';
import * as firebaseAuth from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import * as firebaseStorage from 'firebase/storage';

vi.mock('../../hooks/useUserData', () => ({
  useUserData: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  updateProfile: vi.fn(),
  updatePassword: vi.fn(),
  reauthenticateWithCredential: vi.fn(),
  EmailAuthProvider: {
    credential: vi.fn(),
  },
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
}));

vi.mock('../../lib/firebase', () => ({
  auth: {
    currentUser: {
      email: 'test@example.com',
      displayName: 'Test User',
    },
  },
  db: {},
  storage: {},
}));

vi.mock('../Back/Back', () => ({
  default: ({ page }: any) => (
    <div data-testid="back-button">
      <button>Back to {page}</button>
    </div>
  ),
}));

const renderUserProfile = () => {
  return render(<UserProfile />);
};

describe('UserProfile component', () => {
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
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
  });

  test('renders error state when user data fails to load', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    await act(async () => {
      renderUserProfile();
    });

    expect(screen.getByText('Loading Error')).toBeInTheDocument();
    expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
  });

  test('renders user profile form when data is loaded', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
      },
      isLoading: false,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    expect(screen.getByText('User Profile')).toBeInTheDocument();
    expect(screen.getByText('Manage your personal data')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('handles full name input change', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
      },
      isLoading: false,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    const nameInput = screen.getByDisplayValue('Test User');
    
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: 'New Name' } });
    });

    expect(nameInput).toHaveValue('New Name');
  });

  test('handles password input changes', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
      },
      isLoading: false,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    const currentPasswordInput = screen.getByPlaceholderText('Enter current password');
    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Repeat new password');

    await act(async () => {
      fireEvent.change(currentPasswordInput, { target: { value: 'oldpass' } });
      fireEvent.change(newPasswordInput, { target: { value: 'newpass' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpass' } });
    });

    expect(currentPasswordInput).toHaveValue('oldpass');
    expect(newPasswordInput).toHaveValue('newpass');
    expect(confirmPasswordInput).toHaveValue('newpass');
  });

  test('shows error message when passwords do not match', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
      },
      isLoading: false,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Repeat new password');
    const saveButton = screen.getByText('Save Changes');

    await act(async () => {
      fireEvent.change(newPasswordInput, { target: { value: 'newpass' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.click(saveButton);
    });

    expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
  });

  test('shows error message when new password is too short', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
      },
      isLoading: false,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    const newPasswordInput = screen.getByPlaceholderText('Enter new password');
    const confirmPasswordInput = screen.getByPlaceholderText('Repeat new password');
    const saveButton = screen.getByText('Save Changes');

    await act(async () => {
      fireEvent.change(newPasswordInput, { target: { value: '123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123' } });
      fireEvent.click(saveButton);
    });

    expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument();
  });

  test('handles file upload for avatar', async () => {
    const { useUserData } = await import('../../hooks/useUserData');
    (useUserData as any).mockReturnValue({
      data: {
        fullName: 'Test User',
        email: 'test@example.com',
      },
      isLoading: false,
      isError: false,
    });

    await act(async () => {
      renderUserProfile();
    });

    const fileInput = screen.getByLabelText('Change Photo') as HTMLInputElement;
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    expect(fileInput.files?.[0]).toBe(file);
  });
}); 