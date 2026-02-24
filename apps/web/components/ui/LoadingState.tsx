import { Panel } from '@/components/ui/Panel';

interface LoadingStateProps {
  title?: string;
  message?: string;
}

export function LoadingState({
  title = 'Cargando...',
  message = 'Esperá un momento.'
}: LoadingStateProps): React.ReactElement {
  return (
    <Panel className="loading-state tmb-frame tmb-texture">
      <h2>{title}</h2>
      <p className="muted">{message}</p>
    </Panel>
  );
}
