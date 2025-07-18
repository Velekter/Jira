import React, { useState, forwardRef, useImperativeHandle } from 'react';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';
import './addBoardModal.scss';

interface AddBoardModalProps {
  onCreateBoard: (boardName: string, color: string) => void;
}

const COLORS = [
  '#F87171', // red
  '#FBBF24', // yellow
  '#000000ff', // black
  '#A78BFA', // purple
  '#F472B6', // pink
  '#38BDF8', // sky
  '#FB923C', // orange
  '#4ADE80', // lime
  '#C084FC', // violet
];

const AddBoardModal = forwardRef<ModalRef, AddBoardModalProps>(({ onCreateBoard }, ref) => {
  const [boardName, setBoardName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const modalRef = React.useRef<ModalRef>(null);

  useImperativeHandle(ref, () => ({
    open: () => modalRef.current?.open(),
    close: () => modalRef.current?.close(),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = boardName.trim();
    if (!trimmed) return;

    onCreateBoard(trimmed, selectedColor);
    setBoardName('');
    setSelectedColor(COLORS[0]);
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

        <div className="color-picker">
          <label>Select color:</label>
          <div className="color-options">
            {COLORS.map(color => (
              <div
                key={color}
                className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setSelectedColor(color)}
              />
            ))}
          </div>
        </div>

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
