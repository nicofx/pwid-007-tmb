import type { TurnPacket } from '@tmb/contracts';
import { useEffect, useRef } from 'react';
import { tTargetLabel } from '@/lib/i18n-content';
import { tVerb } from '@/lib/i18n-game';

interface BlockedHelperProps {
  packet: TurnPacket;
  disabled?: boolean;
  onTryAlternative: (alternative: {
    verb: TurnPacket['action']['verb'];
    targetId?: string;
    reason: string;
  }) => void;
}

function extractBlockedReason(packet: TurnPacket): string {
  const systemLine = packet.narrativeBlocks.find((block) => block.kind === 'SYSTEM')?.text;
  if (systemLine) {
    return systemLine;
  }
  return 'Esa acción está bloqueada en este tramo. Probá una de estas alternativas.';
}

export function BlockedHelper(props: BlockedHelperProps): React.ReactElement | null {
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (props.packet.outcome === 'BLOCKED') {
      sectionRef.current?.focus();
    }
  }, [props.packet.outcome, props.packet.turnId]);

  if (props.packet.outcome !== 'BLOCKED') {
    return null;
  }

  const alternatives = props.packet.affordances?.suggestedActions ?? [];
  if (alternatives.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      className="play-card tmb-frame blocked-helper"
      role="status"
      aria-live="polite"
    >
      <h2>Bloqueado</h2>
      <p>{extractBlockedReason(props.packet)}</p>
      <div className="chip-row">
        {alternatives.slice(0, 4).map((alt, index) => (
          <button
            key={`${alt.verb}-${alt.targetId ?? 'current'}-${index}`}
            type="button"
            className="chip"
            disabled={props.disabled}
            onClick={() => props.onTryAlternative(alt)}
            suppressHydrationWarning
          >
            {tVerb(alt.verb)} {tTargetLabel(alt.targetId)}
          </button>
        ))}
      </div>
    </section>
  );
}
