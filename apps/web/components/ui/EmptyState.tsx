import Link from 'next/link';
import { buttonClassName } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';

interface EmptyStateProps {
  title: string;
  message: string;
  ctaLabel: string;
  ctaHref: string;
}

export function EmptyState(props: EmptyStateProps): React.ReactElement {
  return (
    <Panel className="empty-state tmb-frame tmb-texture">
      <h2>{props.title}</h2>
      <p className="muted">{props.message}</p>
      <div className="scene-meta-row">
        <Link href={props.ctaHref} className={buttonClassName({ variant: 'primary' })}>
          {props.ctaLabel}
        </Link>
      </div>
    </Panel>
  );
}
