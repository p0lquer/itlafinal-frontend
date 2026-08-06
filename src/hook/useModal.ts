import { useState, useCallback } from 'react';

interface UseModalOptions {
  onClose?: () => void; // runs every time the modal closes — reset form fields, errors, etc.
}

export function useModal({ onClose }: UseModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);

  const close = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  return { isOpen, open, close 
};
  }