import type { TurnPacket } from '@tmb/contracts';

interface IuModalProps {
  activeIU?: TurnPacket['activeIU'];
  isOpen: boolean;
  onSelectApproach: (approach: { id: string; label: string; intentHint?: string }) => void;
}

export function IuModal(props: IuModalProps): React.ReactElement | null {
  if (!props.isOpen || !props.activeIU) {
    return null;
  }

  return (
    <div className="iu-modal-backdrop" role="dialog" aria-modal="true" aria-label="IU modal">
      <article className="iu-modal-card">
        <h2>{props.activeIU.title}</h2>
        <p>{props.activeIU.brief}</p>
        <div className="iu-approaches">
          {props.activeIU.approaches.map((approach) => (
            <button
              key={approach.id}
              type="button"
              onClick={() => props.onSelectApproach(approach)}
              suppressHydrationWarning
            >
              {approach.label}
            </button>
          ))}
        </div>
      </article>
    </div>
  );
}
