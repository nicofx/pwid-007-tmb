import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>): React.ReactElement {
  return <section className={cn('ui-panel', className)} {...props} />;
}

export function PanelHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('ui-panel-header', className)} {...props} />;
}

export function PanelBody({ className, ...props }: HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('ui-panel-body', className)} {...props} />;
}

export function PanelFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>): React.ReactElement {
  return <div className={cn('ui-panel-footer', className)} {...props} />;
}
