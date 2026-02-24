import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function buttonClassName(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const variant = options?.variant ?? 'primary';
  const size = options?.size ?? 'md';

  return cn(
    'ui-button',
    `ui-button-${variant}`,
    `ui-button-${size}`,
    options?.fullWidth && 'ui-button-full',
    options?.className
  );
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps): React.ReactElement {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
