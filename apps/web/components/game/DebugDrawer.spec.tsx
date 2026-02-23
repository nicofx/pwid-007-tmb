import { fireEvent, render, screen } from '@testing-library/react';
import { DebugDrawer } from './DebugDrawer';

describe('DebugDrawer', () => {
  it('renders only when enabled and supports tab switch', () => {
    const onCopy = jest.fn();
    const onTabChange = jest.fn();
    const history = [
      {
        request: { sessionId: 's1', turnId: 't1', source: 'dock_submit' as const },
        packet: {
          turnId: 't1',
          outcome: 'SUCCESS',
          action: { source: 'explicit' },
          stateText: { suspicion: 1, tension: 2, clock: 3, risk: 4 },
          affordances: {
            activeHotspots: [],
            activeLocations: [],
            allowedVerbs: [],
            suggestedActions: []
          }
        } as never,
        sentAt: '2026-01-01T00:00:00.000Z',
        receivedAt: '2026-01-01T00:00:00.100Z',
        latencyMs: 100
      }
    ];

    const { rerender } = render(
      <DebugDrawer
        enabled={false}
        history={history}
        onCopyJson={onCopy}
        onTabChange={onTabChange}
      />
    );
    expect(screen.queryByText('Debug')).toBeNull();

    rerender(
      <DebugDrawer enabled history={history} onCopyJson={onCopy} onTabChange={onTabChange} />
    );
    expect(screen.getByText('Debug')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'explain' }));
    expect(onTabChange).toHaveBeenCalledWith('explain');
  });
});
