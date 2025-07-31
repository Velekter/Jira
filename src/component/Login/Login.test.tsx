import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Login from './Login';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('../../lib/auth', () => ({
  loginUser: vi.fn(),
}));

const renderLogin = () =>
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );

describe('Login component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
      },
      writable: true,
    });
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