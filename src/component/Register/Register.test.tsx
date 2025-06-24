import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import Register from './Register';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegister = () =>
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

describe('Register component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test('renders all input fields and buttons', () => {
    renderRegister();

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('shows errors if form is submitted empty', async () => {
    renderRegister();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(await screen.findByText(/full name must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  test('shows password mismatch error', async () => {
    renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full Name/i), 'Test User');
    await user.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), '123456');
    await user.type(screen.getByLabelText(/Confirm Password/i), '654321');
    await user.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('navigates to /account after successful registration', async () => {
    vi.mock('@tanstack/react-query', async () => {
      const actual = await vi.importActual<any>('@tanstack/react-query');
      return {
        ...actual,
        useMutation: (options: any) => ({
          mutate: () => {
            if (typeof options?.onSuccess === 'function') {
              options.onSuccess();
            }
          },
          isPending: false,
          isError: false,
          isSuccess: false,
          error: null,
        }),
      };
    });

    renderRegister();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/Full Name/i), 'Test User');
    await user.type(screen.getByLabelText(/Email Address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^Password$/i), '123456');
    await user.type(screen.getByLabelText(/Confirm Password/i), '123456');
    await user.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/account');
  });
});
