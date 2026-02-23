import type { NarrativeBlock, TurnPacket } from '@tmb/contracts';

export interface SessionMemory {
  bullets: string[];
}

export interface SceneSummary {
  sceneId: string;
  beatId: string;
  summary: string;
}

export interface RunSummary {
  endingId: string;
  outcome: string;
  highlights: string[];
}

export interface NarrativeContext {
  sessionId: string;
  turnId: string;
  capsuleId: string;
  truths: string[];
  toneTags: string[];
  eraLabel: string;
  allowedLocationIds: string[];
  allowedHotspotIds: string[];
  allowedNpcIds: string[];
  allowedItemTags: string[];
  allowedLabels: string[];
  actionSummary: string;
  outcomeSummary: string;
  deltaSummary: string[];
  memoryBullets: string[];
}

export interface NarrativeProviderResult {
  blocks: NarrativeBlock[];
  provider: 'placeholder' | 'llm';
  fallbackUsed: boolean;
  guardrailRejectReason?: string;
  latencyMs?: number;
  cacheHit?: boolean;
}

export interface INarrativeProvider {
  render(ctx: NarrativeContext, packetBase: TurnPacket): Promise<NarrativeProviderResult>;
}

export type NarrativeMode = 'placeholder' | 'llm' | 'hybrid';

export interface NarrativeRenderMetadata {
  mode: NarrativeMode;
  provider: 'placeholder' | 'llm';
  fallbackUsed: boolean;
  guardrailRejectReason?: string;
  latencyMs?: number;
  cacheHit: boolean;
}
