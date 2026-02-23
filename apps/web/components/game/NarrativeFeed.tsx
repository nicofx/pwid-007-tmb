import type { NarrativeBlock } from '@tmb/contracts';
import { renderNarrativeBlock } from '@/renderers/renderer-registry';

interface NarrativeFeedProps {
  blocks: NarrativeBlock[];
}

export function NarrativeFeed(props: NarrativeFeedProps): React.ReactElement {
  return (
    <section className="play-card narrative-feed">
      <h2>Narrative Feed</h2>
      <div className="narrative-list">
        {props.blocks.map((block, idx) => renderNarrativeBlock(block, idx))}
      </div>
    </section>
  );
}
