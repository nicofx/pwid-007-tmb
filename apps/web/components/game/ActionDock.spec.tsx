import { fireEvent, render, screen } from '@testing-library/react';
import { ActionDock } from './ActionDock';

describe('ActionDock', () => {
  it('submits on Enter and disables button while processing', () => {
    const onSubmit = jest.fn();

    const { rerender } = render(
      <ActionDock
        inputText="hello"
        allowedVerbs={['OBSERVE', 'SEARCH']}
        selectedVerb="OBSERVE"
        selectedTarget="officer"
        suggestedActions={[]}
        isProcessing={false}
        onInputChange={() => undefined}
        onSelectVerb={() => undefined}
        onSelectChip={() => undefined}
        onSubmit={onSubmit}
      />
    );

    fireEvent.keyDown(screen.getByPlaceholderText('Describí tu intención'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <ActionDock
        inputText="hello"
        allowedVerbs={['OBSERVE']}
        selectedVerb="OBSERVE"
        selectedTarget="officer"
        suggestedActions={[]}
        isProcessing={true}
        onInputChange={() => undefined}
        onSelectVerb={() => undefined}
        onSelectChip={() => undefined}
        onSubmit={onSubmit}
      />
    );

    expect(screen.getByText('Enviando...')).toBeDisabled();
  });
});
