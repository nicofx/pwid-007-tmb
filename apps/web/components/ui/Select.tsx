import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>): React.ReactElement {
  return <select className={cn('ui-input ui-select', className)} {...props} />;
}
