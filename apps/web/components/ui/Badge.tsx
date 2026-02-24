import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'default' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'default', className, ...props }: BadgeProps): React.ReactElement {
  return <span className={cn('ui-badge', `ui-badge-${tone}`, className)} {...props} />;
}
