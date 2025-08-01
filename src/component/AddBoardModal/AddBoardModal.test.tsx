import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import AddBoardModal, { ModalRef } from './AddBoardModal';

const mockModalRef = {
  current: {
    open: vi.fn(),
    close: vi.fn(),
  },
};

vi.mock('../Modal/Modal', () => ({
  default: ({ children, ref }: any) => {
    if (ref) {
      ref.current = mockModalRef.current;
    }
    return <div data-testid="modal">{children}</div>;
  },
}));

const renderAddBoardModal = (props = {}) => {
  return render(<AddBoardModal {...props} />);
};

describe('AddBoardModal component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders create board form by default', () => {
    renderAddBoardModal();

    expect(screen.getByText('Create New Board')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Board name')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  test('renders edit board form when isEdit is true', () => {
    renderAddBoardModal({ isEdit: true });

    expect(screen.getByText('Edit Board')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
  });

  test('displays initial name and color', () => {
    renderAddBoardModal({
      initialName: 'Test Board',
      initialColor: '#F87171',
    });

    expect(screen.getByDisplayValue('Test Board')).toBeInTheDocument();
    const selectedColor = screen.getByTestId('modal').querySelector('.color-swatch.selected');
    expect(selectedColor).toHaveStyle({ backgroundColor: '#F87171' });
  });

  test('calls onCreateBoard when creating new board', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const input = screen.getByPlaceholderText('Board name');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'New Board' } });
      fireEvent.click(createButton);
    });

    expect(onCreateBoard).toHaveBeenCalledWith('New Board', '#F87171');
  });

  test('calls onUpdateBoard when editing board', async () => {
    const onUpdateBoard = vi.fn();
    renderAddBoardModal({
      isEdit: true,
      onUpdateBoard,
      initialName: 'Old Board',
      initialColor: '#F87171',
    });

    const input = screen.getByDisplayValue('Old Board');
    const saveButton = screen.getByText('Save');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Updated Board' } });
      fireEvent.click(saveButton);
    });

    expect(onUpdateBoard).toHaveBeenCalledWith('Updated Board', '#F87171');
  });

  test('allows color selection', async () => {
    renderAddBoardModal();

    const colorSwatches = screen.getAllByTestId('modal')[0].querySelectorAll('.color-swatch');
    const secondColor = colorSwatches[1];

    await act(async () => {
      fireEvent.click(secondColor);
    });

    expect(secondColor).toHaveClass('selected');
  });

  test('does not submit empty board name', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.click(createButton);
    });

    expect(onCreateBoard).not.toHaveBeenCalled();
  });

  test('does not submit whitespace-only board name', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const input = screen.getByPlaceholderText('Board name');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(createButton);
    });

    expect(onCreateBoard).not.toHaveBeenCalled();
  });

  test('trims board name before submission', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const input = screen.getByPlaceholderText('Board name');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(input, { target: { value: '  Test Board  ' } });
      fireEvent.click(createButton);
    });

    expect(onCreateBoard).toHaveBeenCalledWith('Test Board', '#F87171');
  });

  test('closes modal after successful submission', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const input = screen.getByPlaceholderText('Board name');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test Board' } });
      fireEvent.click(createButton);
    });

    expect(mockModalRef.current.close).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', async () => {
    renderAddBoardModal();

    const cancelButton = screen.getByText('Cancel');

    await act(async () => {
      fireEvent.click(cancelButton);
    });

    expect(mockModalRef.current.close).toHaveBeenCalled();
  });

  test('resets form after submission', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const input = screen.getByPlaceholderText('Board name');
    const createButton = screen.getByText('Create');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test Board' } });
      fireEvent.click(createButton);
    });

    expect(screen.getByDisplayValue('')).toBeInTheDocument();
  });

  test('updates when initial props change', () => {
    const { rerender } = renderAddBoardModal({
      initialName: 'Initial Board',
      initialColor: '#F87171',
    });

    expect(screen.getByDisplayValue('Initial Board')).toBeInTheDocument();

    rerender(
      <AddBoardModal
        initialName="Updated Board"
        initialColor="#FBBF24"
      />
    );

    expect(screen.getByDisplayValue('Updated Board')).toBeInTheDocument();
  });

  test('renders all color options', () => {
    renderAddBoardModal();

    const colorSwatches = screen.getAllByTestId('modal')[0].querySelectorAll('.color-swatch');
    expect(colorSwatches).toHaveLength(9);
  });

  test('handles form submission via enter key', async () => {
    const onCreateBoard = vi.fn();
    renderAddBoardModal({ onCreateBoard });

    const input = screen.getByPlaceholderText('Board name');
    const form = screen.getByTestId('modal').querySelector('form');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Test Board' } });
      fireEvent.submit(form!);
    });

    expect(onCreateBoard).toHaveBeenCalledWith('Test Board', '#F87171');
  });
}); 