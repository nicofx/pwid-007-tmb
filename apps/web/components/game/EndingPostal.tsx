import type { TurnPacket } from '@tmb/contracts';

interface EndingPostalProps {
  end?: TurnPacket['end'];
  onRestart: () => void;
}

export function EndingPostal(props: EndingPostalProps): React.ReactElement | null {
  if (!props.end) {
    return null;
  }

  return (
    <section className="ending-postal" aria-label="ending postal">
      <article className="ending-postal-card">
        <p className="ending-tag">Ending: {props.end.endingId}</p>
        <h2>{props.end.title}</h2>
        <p>{props.end.text}</p>
        <button type="button" onClick={props.onRestart}>
          Play again
        </button>
      </article>
    </section>
  );
}
