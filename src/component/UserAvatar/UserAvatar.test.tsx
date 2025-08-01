import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import UserAvatar from './UserAvatar';

const mockUserData = {
  id: 'test-user-id',
  fullName: 'John Doe',
  email: 'john@example.com',
};

const mockUseUserData = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useUserData', () => ({
  useUserData: mockUseUserData,
}));

const renderUserAvatar = (props = {}) => {
  return render(
    <MemoryRouter>
      <UserAvatar {...props} />
    </MemoryRouter>
  );
};

describe('UserAvatar component', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => 'test-user-id'),
      },
      writable: true,
    });
  });

  test('renders user avatar with name when data is loaded', () => {
    mockUseUserData.mockReturnValue({
      data: mockUserData,
      isLoading: false,
      isError: false,
    });

    renderUserAvatar();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByAltText('Avatar')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/account/profile');
  });

  test('renders collapsed avatar when collapsed prop is true', () => {
    mockUseUserData.mockReturnValue({
      data: mockUserData,
      isLoading: false,
      isError: false,
    });

    renderUserAvatar({ collapsed: true });

    const link = screen.getByRole('link');
    expect(link).toHaveClass('user-avatar', 'collapsed');
  });

  test('renders avatar image when available', () => {
    mockUseUserData.mockReturnValue({
      data: mockUserData,
      isLoading: false,
      isError: false,
    });

    renderUserAvatar();

    expect(screen.getByAltText('Avatar')).toBeInTheDocument();
    expect(screen.getByAltText('Avatar')).toHaveAttribute('src', '/avatar.jpg');
  });

  test('renders nothing when loading', () => {
    mockUseUserData.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    const { container } = renderUserAvatar();

    expect(container.firstChild).toBeNull();
  });

  test('renders error state when there is an error', () => {
    mockUseUserData.mockReturnValue({
      data: { id: 'test', fullName: 'Test', email: 'test@test.com' },
      isLoading: false,
      isError: true,
    });

    renderUserAvatar();

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Error')).toHaveClass('user-avatar', 'error');
  });

  test('renders nothing when no data is available', () => {
    mockUseUserData.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    const { container } = renderUserAvatar();

    expect(container.firstChild).toBeNull();
  });

  test('renders full name correctly', () => {
    const userDataWithLongName = {
      ...mockUserData,
      fullName: 'Alice Johnson Smith',
    };

    mockUseUserData.mockReturnValue({
      data: userDataWithLongName,
      isLoading: false,
      isError: false,
    });

    renderUserAvatar();

    expect(screen.getByText('Alice Johnson Smith')).toBeInTheDocument();
  });

  test('handles empty full name gracefully', () => {
    const userDataWithoutName = {
      ...mockUserData,
      fullName: '',
    };

    mockUseUserData.mockReturnValue({
      data: userDataWithoutName,
      isLoading: false,
      isError: false,
    });

    renderUserAvatar();

    expect(screen.getByAltText('Avatar')).toBeInTheDocument();
  });
}); 