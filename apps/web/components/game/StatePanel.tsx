import type { StateText } from '@tmb/contracts';

interface StatePanelProps {
  stateText: StateText;
  npcsPresent: string[];
}

function MeterRow(props: { label: string; value: number; tone: 'suspicion' | 'tension' | 'clock' | 'risk' }): React.ReactElement {
  return (
    <div className={`meter-row meter-row-${props.tone}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </div>
  );
}

export function StatePanel(props: StatePanelProps): React.ReactElement {
  return (
    <section className="play-card tmb-frame state-panel">
      <h2>Estado</h2>
      <MeterRow label="Sospecha" value={props.stateText.suspicion ?? 0} tone="suspicion" />
      <MeterRow label="Tensión" value={props.stateText.tension ?? 0} tone="tension" />
      <MeterRow label="Reloj" value={props.stateText.clock ?? 0} tone="clock" />
      <MeterRow label="Riesgo" value={props.stateText.risk ?? 0} tone="risk" />
      <p className="muted">
        NPCs: {props.npcsPresent.length ? props.npcsPresent.join(', ') : 'ninguno'}
      </p>
    </section>
  );
}
