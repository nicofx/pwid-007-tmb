import type { TurnPacket } from '@tmb/contracts';
import { tActionSource, tVerb } from '@/lib/i18n-game';

interface ActionInterpretationProps {
  packet: TurnPacket;
}

export function ActionInterpretation(props: ActionInterpretationProps): React.ReactElement {
  const action = props.packet.action;
  return (
    <section className="play-card tmb-frame action-interpretation" aria-live="polite">
      <p>
        Interpreté tu acción como: <strong>{tVerb(action.verb)}</strong>
        {action.targetId ? (
          <>
            {' '}
            {'->'} <code>{action.targetId}</code>
          </>
        ) : null}{' '}
        <span className="muted">({tActionSource(action.source)})</span>
      </p>
    </section>
  );
}
