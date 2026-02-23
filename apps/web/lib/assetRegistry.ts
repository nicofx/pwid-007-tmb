export interface StageAssetView {
  backgroundClass: string;
  moodClass: string;
  sfxCue?: string;
  unknownBackgroundKey?: boolean;
  unknownMoodKey?: boolean;
}

const BACKGROUND_MAP: Record<string, string> = {
  'tram-street': 'stage-bg-tram',
  'archive-room': 'stage-bg-archive'
};

const MOOD_MAP: Record<string, string> = {
  tense: 'stage-mood-tense',
  quiet: 'stage-mood-quiet',
  urgent: 'stage-mood-urgent'
};

export function resolveStageAsset(input: { backdrop: string; mood: string }): StageAssetView {
  const backgroundClass = BACKGROUND_MAP[input.backdrop] ?? 'stage-bg-fallback';
  const moodClass = MOOD_MAP[input.mood] ?? 'stage-mood-fallback';

  return {
    backgroundClass,
    moodClass,
    sfxCue: input.mood === 'tense' ? 'ambient-tense-loop' : undefined,
    unknownBackgroundKey: !(input.backdrop in BACKGROUND_MAP),
    unknownMoodKey: !(input.mood in MOOD_MAP)
  };
}
