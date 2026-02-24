import type { OutcomeType } from '@tmb/contracts';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

interface OutcomeBadgeProps {
  outcome: OutcomeType;
  className?: string;
}

const labelByOutcome: Record<OutcomeType, string> = {
  SUCCESS: 'Éxito',
  PARTIAL: 'Parcial',
  FAIL_FORWARD: 'Fallo con avance',
  BLOCKED: 'Bloqueado'
};

const toneByOutcome: Record<OutcomeType, Parameters<typeof Badge>[0]['tone']> = {
  SUCCESS: 'success',
  PARTIAL: 'warning',
  FAIL_FORWARD: 'info',
  BLOCKED: 'danger'
};

export function OutcomeBadge({ outcome, className }: OutcomeBadgeProps): React.ReactElement {
  return (
    <Badge tone={toneByOutcome[outcome]} className={cn('outcome-badge', `outcome-${outcome.toLowerCase()}`, className)}>
      {labelByOutcome[outcome]}
    </Badge>
  );
}
