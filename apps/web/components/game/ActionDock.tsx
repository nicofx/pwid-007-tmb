import type { ActionVerb, TurnPacket } from '@tmb/contracts';
import { useMemo } from 'react';

interface ActionDockProps {
  inputText: string;
  allowedVerbs: ActionVerb[];
  selectedVerb?: ActionVerb;
  selectedTarget?: string;
  suggestedActions: NonNullable<TurnPacket['affordances']>['suggestedActions'];
  isProcessing: boolean;
  onInputChange: (text: string) => void;
  onSelectVerb: (verb: ActionVerb) => void;
  onSelectChip: (chip: { verb: ActionVerb; targetId?: string; reason: string }) => void;
  onSubmit: () => void;
}

export function ActionDock(props: ActionDockProps): React.ReactElement {
  const canSubmit = useMemo(
    () => !props.isProcessing && (Boolean(props.selectedVerb) || props.inputText.trim().length > 0),
    [props.isProcessing, props.selectedVerb, props.inputText]
  );

  return (
    <section className="play-card action-dock">
      <h2>Action Dock</h2>
      <div className="verb-row">
        {props.allowedVerbs.map((verb) => (
          <button
            key={verb}
            type="button"
            className={props.selectedVerb === verb ? 'verb-btn verb-btn-selected' : 'verb-btn'}
            disabled={props.isProcessing}
            onClick={() => props.onSelectVerb(verb)}
            suppressHydrationWarning
          >
            {verb}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {props.suggestedActions.map((chip, index) => (
          <button
            key={`${chip.verb}-${chip.targetId ?? 'none'}-${index}`}
            type="button"
            className="chip"
            disabled={props.isProcessing}
            onClick={() => props.onSelectChip(chip)}
            suppressHydrationWarning
          >
            {chip.verb} {chip.targetId ?? 'current'}
          </button>
        ))}
      </div>
      <div className="input-row">
        <input
          value={props.inputText}
          onChange={(event) => props.onInputChange(event.target.value)}
          placeholder="Describe your intent"
          disabled={props.isProcessing}
          suppressHydrationWarning
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (canSubmit) {
                props.onSubmit();
              }
            }
          }}
        />
        <button
          type="button"
          onClick={props.onSubmit}
          disabled={!canSubmit}
          suppressHydrationWarning
        >
          {props.isProcessing
            ? 'Sending...'
            : `Send ${props.selectedTarget ? `-> ${props.selectedTarget}` : ''}`}
        </button>
      </div>
    </section>
  );
}
