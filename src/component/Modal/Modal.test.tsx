import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import Modal, { ModalRef } from './Modal';

describe('Modal component', () => {
  let modalRef: React.RefObject<ModalRef>;
  let modalRoot: HTMLDivElement;

  beforeEach(() => {
    modalRef = { current: null };
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal';
    document.body.appendChild(modalRoot);
  });

  afterEach(() => {
    document.body.removeChild(modalRoot);
  });

  test('renders nothing when closed', () => {
    render(
      <Modal ref={modalRef}>
        <div>Modal content</div>
      </Modal>
    );

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  test('renders content when opened', async () => {
    render(
      <Modal ref={modalRef}>
        <div>Modal content</div>
      </Modal>
    );

    await act(async () => {
      modalRef.current?.open();
    });

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('closes when close method is called', async () => {
    render(
      <Modal ref={modalRef}>
        <div>Modal content</div>
      </Modal>
    );

    await act(async () => {
      modalRef.current?.open();
    });
    expect(screen.getByText('Modal content')).toBeInTheDocument();

    await act(async () => {
      modalRef.current?.close();
    });
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  test('closes when clicking on backdrop', async () => {
    render(
      <Modal ref={modalRef}>
        <div>Modal content</div>
      </Modal>
    );

    await act(async () => {
      modalRef.current?.open();
    });
    expect(screen.getByText('Modal content')).toBeInTheDocument();

    const backdrop = screen.getByText('Modal content').closest('.modal-backdrop');
    await act(async () => {
      fireEvent.click(backdrop!);
    });

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  test('does not close when clicking on modal content', async () => {
    render(
      <Modal ref={modalRef}>
        <div>Modal content</div>
      </Modal>
    );

    await act(async () => {
      modalRef.current?.open();
    });
    expect(screen.getByText('Modal content')).toBeInTheDocument();

    const content = screen.getByText('Modal content');
    await act(async () => {
      fireEvent.click(content);
    });

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('renders complex content', async () => {
    render(
      <Modal ref={modalRef}>
        <div>
          <h2>Modal Title</h2>
          <p>Modal description</p>
          <button>Action button</button>
        </div>
      </Modal>
    );

    await act(async () => {
      modalRef.current?.open();
    });

    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action button' })).toBeInTheDocument();
  });

  test('returns null when modal root is not found', async () => {
    const { container } = render(
      <Modal ref={modalRef}>
        <div>Modal content</div>
      </Modal>
    );

    await act(async () => {
      modalRef.current?.open();
    });

    expect(container.firstChild).toBeNull();
  });
}); 