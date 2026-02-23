import type { StateText } from '@tmb/contracts';

interface StatePanelProps {
  stateText: StateText;
  npcsPresent: string[];
}

function MeterRow(props: { label: string; value: number }): React.ReactElement {
  return (
    <div className="meter-row">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

export function StatePanel(props: StatePanelProps): React.ReactElement {
  return (
    <section className="play-card state-panel">
      <h2>State</h2>
      <MeterRow label="Suspicion" value={props.stateText.suspicion ?? 0} />
      <MeterRow label="Tension" value={props.stateText.tension ?? 0} />
      <MeterRow label="Clock" value={props.stateText.clock ?? 0} />
      <MeterRow label="Risk" value={props.stateText.risk ?? 0} />
      <p className="muted">
        NPCs: {props.npcsPresent.length ? props.npcsPresent.join(', ') : 'none'}
      </p>
    </section>
  );
}
