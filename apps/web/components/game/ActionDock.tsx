import type { ActionVerb, TurnPacket } from '@tmb/contracts';
import { useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { tTargetLabel } from '@/lib/i18n-content';
import { tVerb } from '@/lib/i18n-game';

interface ActionDockProps {
  inputText: string;
  allowedVerbs: ActionVerb[];
  selectedVerb?: ActionVerb;
  selectedTarget?: string;
  suggestedActions: NonNullable<TurnPacket['affordances']>['suggestedActions'];
  isProcessing: boolean;
  lastLatencyMs?: number;
  onInputChange: (text: string) => void;
  onSelectVerb: (verb: ActionVerb) => void;
  onSelectChip: (chip: { verb: ActionVerb; targetId?: string; reason: string }) => void;
  onSubmit: () => void;
}

export function ActionDock(props: ActionDockProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const canSubmit = useMemo(
    () => !props.isProcessing && (Boolean(props.selectedVerb) || props.inputText.trim().length > 0),
    [props.isProcessing, props.selectedVerb, props.inputText]
  );

  useEffect(() => {
    if (!props.isProcessing) {
      inputRef.current?.focus();
    }
  }, [props.isProcessing]);

  return (
    <section className="play-card tmb-frame action-dock">
      <h2>Panel de acciones</h2>
      <p className="muted">
        {props.isProcessing
          ? 'Procesando turno...'
          : `Latencia del último turno: ${props.lastLatencyMs ?? 0}ms`}
      </p>
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
            {tVerb(verb)}
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
            {tVerb(chip.verb)} {tTargetLabel(chip.targetId)}
          </button>
        ))}
      </div>
      <div className="input-row">
        <Input
          ref={inputRef}
          value={props.inputText}
          onChange={(event) => props.onInputChange(event.target.value)}
          placeholder="Describí tu intención"
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
        <Button
          type="button"
          onClick={props.onSubmit}
          disabled={!canSubmit}
          variant="primary"
          suppressHydrationWarning
        >
          {props.isProcessing
            ? 'Enviando...'
            : `Enviar ${props.selectedTarget ? `-> ${tTargetLabel(props.selectedTarget)}` : ''}`}
        </Button>
      </div>
    </section>
  );
}
