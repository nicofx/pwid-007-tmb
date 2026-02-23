import { Injectable } from '@nestjs/common';
import type { TurnPacket } from '@tmb/contracts';
import type { RunSummary } from './narrative.types';

@Injectable()
export class PostalComposerService {
  compose(
    endBase: NonNullable<TurnPacket['end']>,
    runSummary: RunSummary | null
  ): TurnPacket['end'] {
    if (!runSummary || runSummary.highlights.length === 0) {
      return endBase;
    }

    const tail = runSummary.highlights.slice(-3).join(' | ');
    return {
      ...endBase,
      text: `${endBase.text}\n\nRun summary: ${tail}`
    };
  }
}
