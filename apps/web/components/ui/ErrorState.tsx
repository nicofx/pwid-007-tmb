import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';

interface ErrorStateProps {
  title?: string;
  message: string;
  ctaLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Algo falló',
  message,
  ctaLabel = 'Reintentar',
  onRetry
}: ErrorStateProps): React.ReactElement {
  return (
    <Panel className="error-state tmb-frame tmb-texture">
      <h2>{title}</h2>
      <p className="error-text">{message}</p>
      {onRetry ? (
        <div className="scene-meta-row">
          <Button variant="secondary" onClick={onRetry}>
            {ctaLabel}
          </Button>
        </div>
      ) : null}
    </Panel>
  );
}
