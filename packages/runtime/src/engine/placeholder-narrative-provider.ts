export class PlaceholderNarrativeProvider {
  renderNarrative(input: {
    isInitial: boolean;
    beatEntryText?: string;
    actionSummary: string;
    outcome: string;
    deltasText: string[];
    blockedReason?: string;
  }) {
    const blocks = [];

    if (input.isInitial && input.beatEntryText) {
      blocks.push({ kind: 'NARRATION' as const, text: input.beatEntryText });
    }

    if (input.blockedReason) {
      blocks.push({
        kind: 'SYSTEM' as const,
        text: `Bloqueado: ${input.blockedReason}. Probá una de las acciones sugeridas.`
      });
    } else {
      blocks.push({
        kind: 'EVENT' as const,
        text: `${input.actionSummary} -> ${input.outcome}`
      });
    }

    if (input.deltasText.length > 0) {
      blocks.push({
        kind: 'SYSTEM' as const,
        text: input.deltasText.join(' | ')
      });
    }

    return blocks.slice(0, 3);
  }
}
