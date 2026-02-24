import { render, screen } from '@testing-library/react';
import { ActionInterpretation } from './ActionInterpretation';

describe('ActionInterpretation', () => {
  it('shows resolved action and source', () => {
    render(
      <ActionInterpretation
        packet={
          {
            action: { verb: 'SEARCH', targetId: 'archive-lock', source: 'heuristic' }
          } as never
        }
      />
    );

    expect(screen.getByText(/Interpreté tu acción como/i)).toBeInTheDocument();
    expect(screen.getByText(/Buscar/)).toBeInTheDocument();
    expect(screen.getByText(/archive-lock/)).toBeInTheDocument();
  });
});
