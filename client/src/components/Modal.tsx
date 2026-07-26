import { useEffect, type ReactNode } from "react";

export function Modal({
  isOpen,
  onClose,
  dismissable = true,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  dismissable?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen || !dismissable) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, dismissable, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={dismissable ? onClose : undefined}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        {dismissable && (
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
