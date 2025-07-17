import React, { useState, forwardRef, useImperativeHandle } from 'react';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';
import './addBoardModal.scss';

interface AddBoardModalProps {
  onCreateBoard: (boardName: string) => void;
}

const AddBoardModal = forwardRef<ModalRef, AddBoardModalProps>(({ onCreateBoard }, ref) => {
  const [boardName, setBoardName] = useState('');
  const modalRef = React.useRef<ModalRef>(null);

  useImperativeHandle(ref, () => ({
    open: () => modalRef.current?.open(),
    close: () => modalRef.current?.close(),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = boardName.trim();
    if (!trimmed) return;

    onCreateBoard(trimmed);
    setBoardName('');
    modalRef.current?.close();
  };

  return (
    <Modal ref={modalRef}>
      <form onSubmit={handleSubmit} className="add-board-form">
        <h2>Create New Board</h2>
        <input
          type="text"
          placeholder="Board name"
          value={boardName}
          onChange={e => setBoardName(e.target.value)}
          required
        />

        <div className="buttons">
          <button type="submit">Create</button>
          <button type="button" onClick={() => modalRef.current?.close()}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
});

export default AddBoardModal;
