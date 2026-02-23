import { useMemo, useState } from 'react';
import { buildTurnDiff } from '@/lib/debug/diff-builder';
import { buildExplainBullets } from '@/lib/debug/explain-builder';
import type { DebugTab, DebugTurnEntry } from '@/lib/debug/types';

interface DebugDrawerProps {
  enabled: boolean;
  history: DebugTurnEntry[];
  onCopyJson: () => void;
  onTraceReload?: () => void;
  onTabChange?: (tab: DebugTab) => void;
}

export function DebugDrawer(props: DebugDrawerProps): React.ReactElement | null {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<DebugTab>('request');
  const [selectedIndex, setSelectedIndex] = useState<number>(Math.max(0, props.history.length - 1));

  const selected = props.history[selectedIndex];
  const previous = selectedIndex > 0 ? props.history[selectedIndex - 1] : undefined;
  const diff = useMemo(
    () => (selected ? buildTurnDiff(previous?.packet ?? null, selected.packet) : null),
    [selected, previous]
  );
  const explain = useMemo(
    () => (selected && diff ? buildExplainBullets({ packet: selected.packet, diff }) : []),
    [selected, diff]
  );

  if (!props.enabled) {
    return null;
  }

  return (
    <aside className={`debug-drawer ${collapsed ? 'debug-drawer-collapsed' : ''}`}>
      <header className="debug-drawer-header">
        <strong>Debug</strong>
        <div className="debug-drawer-actions">
          {props.onTraceReload ? (
            <button type="button" onClick={props.onTraceReload}>
              Trace
            </button>
          ) : null}
          <button type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? 'Open' : 'Hide'}
          </button>
        </div>
      </header>

      {collapsed ? null : (
        <div className="debug-drawer-content">
          <section className="debug-timeline">
            <h4>Timeline</h4>
            <ul>
              {props.history.map((entry, index) => (
                <li key={`${entry.request.turnId}-${index}`}>
                  <button
                    type="button"
                    className={index === selectedIndex ? 'debug-selected' : ''}
                    onClick={() => setSelectedIndex(index)}
                  >
                    #{entry.seq ?? index + 1} {entry.request.turnId} ({entry.packet.outcome})
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selected ? (
            <section className="debug-panel">
              <nav className="debug-tabs">
                {(['request', 'explain', 'diff', 'raw'] as DebugTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={activeTab === tab ? 'debug-tab-active' : ''}
                    onClick={() => {
                      setActiveTab(tab);
                      props.onTabChange?.(tab);
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </nav>

              {activeTab === 'request' ? (
                <pre>
                  {JSON.stringify(
                    {
                      ...selected.request,
                      actionSource: selected.packet.action.source
                    },
                    null,
                    2
                  )}
                </pre>
              ) : null}

              {activeTab === 'explain' ? (
                <ul className="debug-list">
                  {explain.map((line, index) => (
                    <li key={`${line}-${index}`}>{line}</li>
                  ))}
                </ul>
              ) : null}

              {activeTab === 'diff' && diff ? (
                <div className="debug-list">
                  <p>
                    State:{' '}
                    {diff.state
                      .map((s) => `${s.key} ${s.delta > 0 ? '+' : ''}${s.delta}`)
                      .join(', ')}
                  </p>
                  <p>Clues +{diff.cluesAdded.join(', ') || '-'}</p>
                  <p>Leverage +{diff.leverageAdded.join(', ') || '-'}</p>
                  <p>Inventory +{diff.inventoryAdded.join(', ') || '-'}</p>
                  <p>
                    Hotspots +{diff.hotspotsAdded.join(', ') || '-'} / -
                    {diff.hotspotsRemoved.join(', ') || '-'}
                  </p>
                  <p>
                    Locations +{diff.locationsAdded.join(', ') || '-'} / -
                    {diff.locationsRemoved.join(', ') || '-'}
                  </p>
                </div>
              ) : null}

              {activeTab === 'raw' ? (
                <>
                  <button type="button" onClick={props.onCopyJson}>
                    Copy JSON
                  </button>
                  <pre>
                    {JSON.stringify(
                      { request: selected.request, packet: selected.packet },
                      null,
                      2
                    )}
                  </pre>
                </>
              ) : null}
            </section>
          ) : (
            <p className="muted">No debug turns yet.</p>
          )}
        </div>
      )}
    </aside>
  );
}
