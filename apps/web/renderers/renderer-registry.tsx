import type { NarrativeBlock } from '@tmb/contracts';
import React from 'react';

type NarrativeRenderer = (block: NarrativeBlock, index: number) => React.ReactNode;

function renderNarration(block: NarrativeBlock, index: number): React.ReactNode {
  return (
    <article key={`narration-${index}`} className="narrative-block narrative-narration">
      <p>{block.text}</p>
    </article>
  );
}

function renderDialogue(block: NarrativeBlock, index: number): React.ReactNode {
  return (
    <article key={`dialogue-${index}`} className="narrative-block narrative-dialogue">
      <p>
        <strong>{block.speaker ?? 'Unknown'}:</strong> {block.text}
      </p>
    </article>
  );
}

function renderEvent(block: NarrativeBlock, index: number): React.ReactNode {
  return (
    <article key={`event-${index}`} className="narrative-block narrative-event">
      <p>{block.text}</p>
    </article>
  );
}

function renderSystem(block: NarrativeBlock, index: number): React.ReactNode {
  return (
    <article key={`system-${index}`} className="narrative-block narrative-system">
      <p>{block.text}</p>
    </article>
  );
}

const registry: Record<NarrativeBlock['kind'], NarrativeRenderer> = {
  NARRATION: renderNarration,
  DIALOGUE: renderDialogue,
  EVENT: renderEvent,
  SYSTEM: renderSystem
};

export function renderNarrativeBlock(block: NarrativeBlock, index: number): React.ReactNode {
  return registry[block.kind](block, index);
}
