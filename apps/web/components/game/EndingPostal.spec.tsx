import { fireEvent, render, screen } from '@testing-library/react';
import { EndingPostal } from './EndingPostal';

describe('EndingPostal', () => {
  it('renders ending data and handles restart', () => {
    const onRestart = jest.fn();

    render(
      <EndingPostal
        end={{ endingId: 'clean-exit', title: 'Out Before Curfew', text: 'You made it.' }}
        onRestart={onRestart}
      />
    );

    expect(screen.getByText('Out Before Curfew')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Play again'));
    expect(onRestart).toHaveBeenCalledTimes(1);
  });
});
