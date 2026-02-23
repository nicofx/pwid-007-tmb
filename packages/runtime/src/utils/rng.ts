import type { IRng, IRngFactory } from '../ports/interfaces.js';

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

class LcgRng implements IRng {
  private state: number;

  constructor(public readonly seed: number) {
    this.state = seed || 1;
  }

  nextFloat(): number {
    this.state = (Math.imul(1664525, this.state) + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  nextInt(maxExclusive: number): number {
    if (maxExclusive <= 0) {
      return 0;
    }
    return Math.floor(this.nextFloat() * maxExclusive);
  }
}

export class SeededRngFactory implements IRngFactory {
  create(seedInput: string): IRng {
    return new LcgRng(hashSeed(seedInput));
  }
}
