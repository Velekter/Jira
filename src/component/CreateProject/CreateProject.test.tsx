import { render, screen, act } from '@testing-library/react';
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

  test('renders loading state initially', async () => {
    await act(async () => {
      renderCreateProject();
    });
    expect(screen.getByText('Loading friends...')).toBeInTheDocument();
  });

  test('renders create project form after loading', async () => {
    const mockUnsubscribe = vi.fn();
    (firestore.onSnapshot as any).mockImplementation((docRef: any, callback: any) => {
      callback({
        exists: () => true,
        data: () => ({
          friends: {
            'friend-1': true,
            'friend-2': true,
          },
        }),
      });
      return mockUnsubscribe;
    });
    
    let callCount = 0;
    (firestore.getDoc as any).mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        exists: () => true,
        id: `friend-${callCount}`,
        data: () => ({
          id: `friend-${callCount}`,
          fullName: `Friend ${callCount}`,
          email: `friend${callCount}@example.com`,
        }),
      });
    });

    await act(async () => {
      renderCreateProject();
    });
    
    await screen.findByText('Create a New Project');
    expect(screen.getByPlaceholderText('Project name')).toBeInTheDocument();
    expect(screen.getByText('Select Friends')).toBeInTheDocument();
    expect(screen.getByText('Create Project')).toBeInTheDocument();
  });

  test('shows no friends message when user has no friends', async () => {
    (firestore.onSnapshot as any).mockImplementation((docRef: any, callback: any) => {
      callback({
        exists: () => true,
        data: () => ({ friends: {} }),
      });
      return vi.fn();
    });
    
    await act(async () => {
      renderCreateProject();
    });
    
    await screen.findByText("You don't have any friends yet.");
    expect(screen.getByText('Add friends first to collaborate on projects!')).toBeInTheDocument();
  });
}); 