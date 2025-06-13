// components/Modal.jsx
import { useEffect } from 'react';

export default function Modal({ open, onClose, children }) {
  /* ---- se non è aperto, non rendere nulla ---- */
  if (!open) return null;

  /* ---- ESC per chiudere ---- */
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  /* ---- Overlay cliccabile ---- */
  const handleOverlayClick = () => onClose();
  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleOverlayClick}            /* chiude se clicchi fuori */
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-lg p-6"
        onClick={stopPropagation}             /* NON chiude se clicchi dentro */
      >
        {children}

        <button
          onClick={onClose}
          className="mt-6 block rounded-lg bg-primary px-4 py-2 text-white mx-auto"
        >
          Chiudi
        </button>
      </div>
    </div>
  );
}
