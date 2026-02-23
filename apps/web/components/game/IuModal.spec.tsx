import { fireEvent, render, screen } from '@testing-library/react';
import { IuModal } from './IuModal';

describe('IuModal', () => {
  it('opens and sends selected approach', () => {
    const onSelectApproach = jest.fn();

    render(
      <IuModal
        isOpen={true}
        activeIU={{
          iuId: 'iu-1',
          title: 'Urgent Choice',
          brief: 'Choose quickly',
          approaches: [{ id: 'a1', label: 'Talk', intentHint: 'diplomatic' }]
        }}
        onSelectApproach={onSelectApproach}
      />
    );

    fireEvent.click(screen.getByText('Talk'));
    expect(onSelectApproach).toHaveBeenCalledWith({
      id: 'a1',
      label: 'Talk',
      intentHint: 'diplomatic'
    });
  });
});
