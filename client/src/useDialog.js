import { useEffect } from 'react';

/**
 * Dialog behaviour shared by the cart drawer and the item sheet:
 * focus the given element on open, Esc closes, the page behind doesn't scroll,
 * and focus goes back to where it was on close.
 */
export function useDialog(open, onClose, focusRef) {
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    focusRef?.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open, onClose, focusRef]);
}
