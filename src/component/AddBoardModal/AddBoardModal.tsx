import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import Modal from '../Modal/Modal';
import type { ModalRef } from '../Modal/Modal';
import './addBoardModal.scss';

interface AddBoardModalProps {
  onCreateBoard?: (boardName: string, color: string) => void;
  onUpdateBoard?: (boardName: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
  isEdit?: boolean;
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

const AddBoardModal = forwardRef<ModalRef, AddBoardModalProps>(
  (
    { onCreateBoard, onUpdateBoard, initialName = '', initialColor = COLORS[0], isEdit = false },
    ref
  ) => {
    const [boardName, setBoardName] = useState(initialName);
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const modalRef = React.useRef<ModalRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => {
        setBoardName(initialName);
        setSelectedColor(initialColor);
        modalRef.current?.open();
      },
      close: () => modalRef.current?.close(),
    }));

    useEffect(() => {
      setBoardName(initialName);
      setSelectedColor(initialColor);
    }, [initialName, initialColor]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = boardName.trim();
      if (!trimmed) return;

      if (isEdit && onUpdateBoard) {
        onUpdateBoard(trimmed, selectedColor);
      } else if (onCreateBoard) {
        onCreateBoard(trimmed, selectedColor);
      }

      setBoardName('');
      setSelectedColor(COLORS[0]);
      modalRef.current?.close();
    };

    return (
      <Modal ref={modalRef}>
        <form onSubmit={handleSubmit} className="add-board-form">
          <h2>{isEdit ? 'Edit Board' : 'Create New Board'}</h2>
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
            <button type="submit">{isEdit ? 'Save' : 'Create'}</button>
            <button type="button" onClick={() => modalRef.current?.close()}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    );
  }
);

export default AddBoardModal;
