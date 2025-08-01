import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, beforeAll } from 'vitest';
import CreateProject from './CreateProject';
import * as firestore from 'firebase/firestore';

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  getDoc: vi.fn(),
}));

vi.mock('../../hooks/useProjects', () => ({
  createProjectHooks: vi.fn(),
}));

vi.mock('../../context/ProjectContext', () => ({
  useProjectContext: () => ({
    refreshProjects: vi.fn(),
    projects: [],
  }),
}));

vi.mock('../../lib/firebase', () => ({
  db: {},
}));

const renderCreateProject = (props = {}) => {
  const defaultProps = {
    userId: 'test-user-id',
    setShowCreateProject: vi.fn(),
    ...props,
  };

  return render(<CreateProject {...defaultProps} />);
};

describe('CreateProject component', () => {
  beforeAll(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders loading state initially', () => {
    renderCreateProject();
    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  test('renders create project form after loading', async () => {
    const mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((docRef, callback) => {
      callback({
        exists: () => true,
        data: () => ({
          friends: {
            '1': true,
            '2': true,
          },
        }),
      });
      return mockUnsubscribe;
    });
    (firestore.getDoc as any).mockResolvedValue({
      exists: () => true,
      id: '1',
      data: () => ({
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
      }),
    });
    renderCreateProject();
    await screen.findByText('Create a New Project');
    expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
    expect(screen.getByText('Select Friends')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  test('shows no friends message when user has no friends', async () => {
    (firestore.onSnapshot as any).mockImplementation((docRef, callback) => {
      callback({
        exists: () => true,
        data: () => ({ friends: {} }),
      });
      return vi.fn();
    });
    renderCreateProject();
    await screen.findByText("You don't have any friends yet.");
    expect(screen.getByText('Add friends first to collaborate on projects!')).toBeInTheDocument();
  });
}); 