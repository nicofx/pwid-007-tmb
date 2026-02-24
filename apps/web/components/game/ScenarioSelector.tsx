import type { PlayScenario, PlayScenarioId } from '@/lib/scenarios';

interface ScenarioSelectorProps {
  value: PlayScenarioId;
  scenarios: PlayScenario[];
  disabled?: boolean;
  onChange: (scenarioId: PlayScenarioId) => void;
}

export function ScenarioSelector(props: ScenarioSelectorProps): React.ReactElement {
  return (
    <section className="play-card scenario-selector">
      <h2>Escenario guiado</h2>
      <div className="scenario-list">
        {props.scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className={
              props.value === scenario.id ? 'scenario-btn scenario-btn-selected' : 'scenario-btn'
            }
            disabled={props.disabled}
            onClick={() => props.onChange(scenario.id)}
            suppressHydrationWarning
          >
            <strong>{scenario.label}</strong>
            <span>{scenario.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
