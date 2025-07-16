import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { createPortal } from 'react-dom';
import './modal.scss';

export type ModalRef = {
  open: () => void;
  close: () => void;
};

interface ModalProps {
  children: React.ReactNode;
}

const Modal = forwardRef<ModalRef, ModalProps>(function Modal({ children }, ref) {
  const [isOpen, setIsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }));

  const onBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const modalRoot = document.getElementById('modal');
  if (!modalRoot) return null;

  return isOpen
    ? createPortal(
        <div className="modal-backdrop" onClick={onBackgroundClick}>
          <div className="modal-content">{children}</div>
        </div>,
        modalRoot
      )
    : null;
});

export default Modal;
