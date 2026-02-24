import { useMemo, useState } from 'react';
import type { PresetDials } from '@tmb/contracts';
import { buildTurnDiff } from '@/lib/debug/diff-builder';
import { buildExplainBullets } from '@/lib/debug/explain-builder';
import type { DebugTab, DebugTurnEntry } from '@/lib/debug/types';
import { tActionSource, tOutcome } from '@/lib/i18n-game';

interface DebugDrawerProps {
  enabled: boolean;
  history: DebugTurnEntry[];
  onCopyJson: () => void;
  onTraceReload?: () => void;
  onTabChange?: (tab: DebugTab) => void;
  presetDebug?: {
    presetId: string;
    dials: PresetDials | null;
    tags: string[];
  };
  capsuleOverview?: {
    capsuleId: string;
    title: string;
    scenes: Array<{ id: string; title: string; beatIds: string[] }>;
    hotspots: Array<{ id: string; label: string; locationId: string }>;
  } | null;
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
  const stateLabel: Record<string, string> = {
    suspicion: 'sospecha',
    tension: 'tensión',
    clock: 'reloj',
    risk: 'riesgo'
  };

  if (!props.enabled) {
    return null;
  }

  return (
    <aside className={`debug-drawer tmb-frame ${collapsed ? 'debug-drawer-collapsed' : ''}`}>
      <header className="debug-drawer-header">
        <strong>Depuración</strong>
        <div className="debug-drawer-actions">
          {props.onTraceReload ? (
            <button type="button" onClick={props.onTraceReload}>
              Traza
            </button>
          ) : null}
          <button type="button" onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? 'Abrir' : 'Ocultar'}
          </button>
        </div>
      </header>

      {collapsed ? null : (
        <div className="debug-drawer-content">
          <section className="debug-timeline">
            <h4>Línea de tiempo</h4>
            <ul>
              {props.history.map((entry, index) => (
                <li key={`${entry.request.turnId}-${index}`}>
                  <button
                    type="button"
                    className={index === selectedIndex ? 'debug-selected' : ''}
                    onClick={() => setSelectedIndex(index)}
                  >
                    #{entry.seq ?? index + 1} {entry.request.turnId} ({tOutcome(entry.packet.outcome)})
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {selected ? (
            <section className="debug-panel">
              {props.presetDebug ? (
                <div className="debug-list">
                  <p>Preset: {props.presetDebug.presetId}</p>
                  <p>Dials: {JSON.stringify(props.presetDebug.dials)}</p>
                  <p>Tags: {props.presetDebug.tags.join(', ') || '-'}</p>
                  <p>Proveedor narrativo: {selected.narrativeProvider ?? 'desconocido'}</p>
                </div>
              ) : null}
              {props.capsuleOverview ? (
                <div className="debug-list">
                  <p>
                    Cápsula: {props.capsuleOverview.title} ({props.capsuleOverview.capsuleId})
                  </p>
                  <p>Escenas: {props.capsuleOverview.scenes.length}</p>
                  <p>Hotspots: {props.capsuleOverview.hotspots.length}</p>
                  <pre>
                    {JSON.stringify(
                      {
                        scenes: props.capsuleOverview.scenes,
                        hotspots: props.capsuleOverview.hotspots
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              ) : null}
              {selected.packet.worldEvent ? (
                <div className="debug-list">
                  <p>
                    WED: {selected.packet.worldEvent.fired ? 'disparado' : 'saltado'} | último
                    evento: {selected.packet.worldEvent.eventId ?? '-'}
                  </p>
                  <p>
                    Sabor/Intensidad: {selected.packet.worldEvent.flavor ?? '-'} /{' '}
                    {selected.packet.worldEvent.intensity ?? '-'}
                  </p>
                  <p>Razón de salto: {selected.packet.worldEvent.skipReason ?? '-'}</p>
                  <p>
                    Budget escena:{' '}
                    {JSON.stringify(
                      selected.packet.worldEvent.sceneBudgetUsed ?? { soft: 0, strong: 0 }
                    )}
                  </p>
                  <p>
                    Budget cápsula:{' '}
                    {JSON.stringify(
                      selected.packet.worldEvent.capsuleBudgetUsed ?? { soft: 0, strong: 0 }
                    )}
                  </p>
                  <p>
                    Mix: {JSON.stringify(selected.packet.worldEvent.mixCounts ?? {})} | Candidatos:{' '}
                    {selected.packet.worldEvent.matchedCandidates ?? 0}/
                    {selected.packet.worldEvent.totalEvents ?? 0}
                  </p>
                  <p>Cooldowns: {JSON.stringify(selected.packet.worldEvent.cooldowns ?? {})}</p>
                </div>
              ) : null}
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
                    {tab === 'request'
                      ? 'solicitud'
                      : tab === 'explain'
                        ? 'explicar'
                        : tab === 'diff'
                          ? 'cambios'
                          : 'json'}
                  </button>
                ))}
              </nav>

              {activeTab === 'request' ? (
                <pre>
                  {JSON.stringify(
                    {
                      ...selected.request,
                      actionSource: tActionSource(selected.packet.action.source)
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
                    Estado:{' '}
                    {diff.state
                      .map((s) => `${stateLabel[s.key] ?? s.key} ${s.delta > 0 ? '+' : ''}${s.delta}`)
                      .join(', ')}
                  </p>
                  <p>Pistas +{diff.cluesAdded.join(', ') || '-'}</p>
                  <p>Ventajas +{diff.leverageAdded.join(', ') || '-'}</p>
                  <p>Inventario +{diff.inventoryAdded.join(', ') || '-'}</p>
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
                    Copiar JSON
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
            <p className="muted">Todavía no hay turnos en debug.</p>
          )}
        </div>
      )}
    </aside>
  );
}
