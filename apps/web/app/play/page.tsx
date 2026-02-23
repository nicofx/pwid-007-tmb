'use client';

import { useCallback, useEffect, useState } from 'react';
import { ActionDock } from '@/components/game/ActionDock';
import { DebugDrawer } from '@/components/game/DebugDrawer';
import { EndingPostal } from '@/components/game/EndingPostal';
import { HotspotOverlay } from '@/components/game/HotspotOverlay';
import { HotspotPanel } from '@/components/game/HotspotPanel';
import { IuModal } from '@/components/game/IuModal';
import { MiniMap } from '@/components/game/MiniMap';
import { NarrativeFeed } from '@/components/game/NarrativeFeed';
import { SceneHeader } from '@/components/game/SceneHeader';
import { StatePanel } from '@/components/game/StatePanel';
import { VisualStage } from '@/components/game/VisualStage';
import { useGameStore } from '@/lib/useGameStore';
import { trackClientEvent } from '@/lib/telemetryClient';
import { toTurnPacketViewModel } from '@/viewmodels/turn-packet-vm';

export default function PlayPage(): React.ReactElement {
  const store = useGameStore();
  const [debug, setDebug] = useState(false);
  const sessionId = store.sessionId;
  const loadTrace = store.loadTrace;

  const emit = useCallback(
    (eventName: string, payload?: Record<string, unknown>): void => {
      trackClientEvent({
        sessionId: store.sessionId ?? undefined,
        eventName,
        ts: new Date().toISOString(),
        payload
      });
    },
    [store.sessionId]
  );

  useEffect(() => {
    const enabled = new URLSearchParams(window.location.search).get('debug') === '1';
    setDebug(enabled);
    if (enabled) {
      emit('ui_debug_enabled');
    }
  }, [emit]);

  useEffect(() => {
    if (!debug || !sessionId) {
      return;
    }
    void loadTrace(20);
  }, [debug, loadTrace, sessionId]);

  const viewModel = store.packet ? toTurnPacketViewModel(store.packet) : null;

  useEffect(() => {
    if (!viewModel?.activeIU || !sessionId) {
      return;
    }
    emit('ui_iu_open', { iuId: viewModel.activeIU.iuId });
  }, [viewModel?.activeIU, sessionId, emit]);

  useEffect(() => {
    if (!viewModel || !sessionId) {
      return;
    }
    if (viewModel.stage.unknownBackgroundKey || viewModel.stage.unknownMoodKey) {
      emit('visual_key_unknown', {
        unknownBackgroundKey: viewModel.stage.unknownBackgroundKey,
        unknownMoodKey: viewModel.stage.unknownMoodKey
      });
    }

    emit('ui_overlay_enabled', { enabled: false });
  }, [viewModel, sessionId, emit]);

  useEffect(() => {
    if (!viewModel?.end || !sessionId) {
      return;
    }
    emit('ui_postal_view', { endingId: viewModel.end.endingId });
  }, [viewModel?.end, sessionId, emit]);

  if (!viewModel || !sessionId) {
    return (
      <main className="play-shell disconnected-shell">
        <section className="play-card start-card">
          <h1>Take Me Back - Play</h1>
          <p>Start a session to enter the runtime loop.</p>
          <label htmlFor="capsuleId">Capsule ID</label>
          <input
            id="capsuleId"
            value={store.capsuleId}
            onChange={(event) => store.setCapsuleId(event.target.value)}
            disabled={store.isProcessing}
            suppressHydrationWarning
          />
          <label htmlFor="presetId">Preset</label>
          <select
            id="presetId"
            value={store.selectedPresetId}
            onChange={(event) => store.choosePreset(event.target.value)}
            disabled={store.isProcessing}
            suppressHydrationWarning
          >
            {store.availablePresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
            {store.availablePresets.length === 0 ? <option value="default">Default</option> : null}
          </select>
          {store.availablePresets.length > 0 ? (
            <p className="muted">
              {
                store.availablePresets.find((preset) => preset.id === store.selectedPresetId)
                  ?.description
              }
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => void store.start()}
            disabled={store.isProcessing}
            suppressHydrationWarning
          >
            {store.isProcessing ? 'Starting...' : 'Start Session'}
          </button>
          {store.error ? <p className="error-text">{store.error}</p> : null}
          <p className="muted">Disconnected fallback works without active packet.</p>
        </section>
      </main>
    );
  }

  const overlayMeta = undefined;
  const iuOpen = Boolean(viewModel.activeIU);

  return (
    <main className="play-shell">
      <SceneHeader
        sceneTitle={viewModel.sceneTitle}
        beatTitle={viewModel.beatTitle}
        locationTimeLabel={viewModel.locationTimeLabel}
        objectiveNow={viewModel.objectiveNow}
      />

      <section className="play-grid">
        <div className="play-main-column">
          <VisualStage
            backgroundClass={viewModel.stage.backgroundClass}
            moodClass={viewModel.stage.moodClass}
            sfxCue={viewModel.stage.sfxCue}
          />
          <HotspotOverlay
            hotspotsUiMeta={overlayMeta}
            onSelectTarget={(targetId) => {
              store.setSelectedTarget(targetId);
              emit('ui_hotspot_click', { targetId, via: 'overlay' });
            }}
          />
          <NarrativeFeed blocks={viewModel.narrativeBlocks} />
          <ActionDock
            inputText={store.inputText}
            selectedVerb={store.selectedVerb}
            selectedTarget={store.selectedTarget}
            allowedVerbs={viewModel.allowedVerbs}
            suggestedActions={viewModel.suggestedActions}
            isProcessing={store.isProcessing || iuOpen}
            onInputChange={store.setInputText}
            onSelectVerb={(verb) => {
              store.setSelectedVerb(verb);
              emit('ui_verb_select', { verb });
            }}
            onSelectChip={(chip) => {
              store.setSelectedVerb(chip.verb);
              store.setSelectedTarget(chip.targetId);
              emit('ui_chip_select', { verb: chip.verb, targetId: chip.targetId });
            }}
            onSubmit={() => void store.send({ source: 'dock_submit' })}
          />
        </div>

        <aside className="play-side-column">
          <HotspotPanel
            hotspots={viewModel.activeHotspots}
            selectedTarget={store.selectedTarget}
            onSelectTarget={(targetId) => {
              store.setSelectedTarget(targetId);
              emit('ui_hotspot_click', { targetId });
            }}
          />
          <MiniMap
            locations={viewModel.activeLocations}
            currentLocationId={viewModel.packet.scene.sceneId}
            canMove={viewModel.allowedVerbs.includes('MOVE')}
            onMove={(locationId) => {
              emit('ui_location_click', { locationId });
              void store.send({
                verb: 'MOVE',
                targetId: locationId,
                playerText: `Move to ${locationId}`,
                source: 'move'
              });
            }}
          />
          <StatePanel stateText={viewModel.stateText} npcsPresent={viewModel.npcsPresent} />
          {store.error ? <p className="error-text">{store.error}</p> : null}
          <p className="muted">Last turnId: {store.lastTurnId || 'none'}</p>
          <p className="muted">Preset: {store.selectedPresetId}</p>
        </aside>
      </section>

      <IuModal
        activeIU={viewModel.activeIU}
        isOpen={iuOpen}
        onSelectApproach={(approach) => {
          emit('ui_iu_select_approach', { approachId: approach.id });
          void store.send({
            verb: store.selectedVerb,
            targetId: store.selectedTarget,
            playerText: approach.intentHint ?? approach.label,
            source: 'iu'
          });
        }}
      />

      <EndingPostal
        end={viewModel.end}
        onRestart={() => {
          emit('ui_postal_restart', { endingId: viewModel.end?.endingId });
          store.restart();
        }}
      />

      {debug ? (
        <DebugDrawer
          enabled={debug}
          history={store.turnHistory}
          onTraceReload={() => void store.loadTrace(20)}
          onTabChange={(tab) => {
            if (tab === 'explain') {
              emit('ui_debug_explain_view');
            }
          }}
          onCopyJson={() => {
            const last = store.turnHistory[store.turnHistory.length - 1];
            if (!last) {
              return;
            }
            void navigator.clipboard.writeText(
              JSON.stringify({ request: last.request, packet: last.packet }, null, 2)
            );
            emit('ui_debug_copy_json', { turnId: last.request.turnId });
          }}
        />
      ) : null}
    </main>
  );
}
