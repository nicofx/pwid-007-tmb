import { useEffect } from 'react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className
}: ModalProps): React.ReactElement | null {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="ui-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('ui-modal-card', className)}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? <h3 className="ui-modal-title">{title}</h3> : null}
        <div className="ui-modal-body">{children}</div>
        {footer ? <footer className="ui-modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
