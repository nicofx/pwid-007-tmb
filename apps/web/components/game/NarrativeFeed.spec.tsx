import { render, screen } from '@testing-library/react';
import { NarrativeFeed } from './NarrativeFeed';

describe('NarrativeFeed', () => {
  it('renders all narrative block types', () => {
    render(
      <NarrativeFeed
        blocks={[
          { kind: 'NARRATION', text: 'scene text' },
          { kind: 'DIALOGUE', text: 'hello', speaker: 'NPC' },
          { kind: 'EVENT', text: 'event text' },
          { kind: 'SYSTEM', text: 'system text' }
        ]}
      />
    );

    expect(screen.getByText('scene text')).toBeInTheDocument();
    expect(screen.getByText('NPC:')).toBeInTheDocument();
    expect(screen.getByText('event text')).toBeInTheDocument();
    expect(screen.getByText('system text')).toBeInTheDocument();
  });
});
