import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from './Register';
import { vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<any>('@tanstack/react-query');
  return {
    ...actual,
    useMutation: () => ({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
    }),
  };
});

describe('Register component', () => {
  test('renders all input fields and buttons', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('shows errors if form is submitted empty', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(screen.getByText(/full name must be at least 3 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  });

  test('shows password mismatch error', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: 'Test User' },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^Password$/i), {
      target: { value: '123456' },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: '654321' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });
});
