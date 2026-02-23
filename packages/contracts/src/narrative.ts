export type NarrativeBlockType = 'NARRATION' | 'DIALOGUE' | 'EVENT' | 'SYSTEM';

export interface NarrativeBlock {
  kind: NarrativeBlockType;
  text: string;
  speaker?: string;
  emotionTag?: string;
  sfxCue?: string;
}

export interface NarrativePayload {
  blocks: NarrativeBlock[];
}
