import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Login from './Login';

const mockNavigate = vi.fn();
const mockLoginUser = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../lib/firebase', () => ({
  loginUser: (...args: any[]) => mockLoginUser(...args),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockLoginUser.mockReset();
  });

  test('renders email and password fields and buttons', () => {
    renderLogin();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  test('shows validation error if fields are empty', async () => {
    renderLogin();

    const user = userEvent.setup();
    await user.click(screen.getByTestId('submit-button'));

    expect(await screen.findByText(/please fill in both fields/i)).toBeInTheDocument();
    expect(mockLoginUser).not.toHaveBeenCalled();
  });

  test('calls loginUser and navigates to /account on success', async () => {
    mockLoginUser.mockResolvedValue({});
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByTestId('password-input'), 'password123');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/account');
    });
  });

  test('shows error if login fails', async () => {
    mockLoginUser.mockRejectedValue(new Error('Invalid credentials'));
    renderLogin();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email address/i), 'wrong@example.com');
    await user.type(screen.getByTestId('password-input'), 'wrongpass');
    await user.click(screen.getByTestId('submit-button'));

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('toggles password visibility', async () => {
    renderLogin();

    const user = userEvent.setup();
    const passwordInput = screen.getByTestId('password-input');
    const toggleButton = screen.getByRole('button', {
      name: /toggle password visibility/i,
    });

    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
