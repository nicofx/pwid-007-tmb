'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActionDock } from '@/components/game/ActionDock';
import { ActionInterpretation } from '@/components/game/ActionInterpretation';
import { BlockedHelper } from '@/components/game/BlockedHelper';
import { CoachPanel, buildCoachSuggestions, type CoachMode } from '@/components/game/CoachPanel';
import { DebugDrawer } from '@/components/game/DebugDrawer';
import { EndingPostal } from '@/components/game/EndingPostal';
import { FirstRunTutorial } from '@/components/game/FirstRunTutorial';
import { GuidancePanel, type GuidanceSuggestion } from '@/components/game/GuidancePanel';
import { HotspotOverlay } from '@/components/game/HotspotOverlay';
import { HotspotPanel } from '@/components/game/HotspotPanel';
import { IuModal } from '@/components/game/IuModal';
import { MiniMap } from '@/components/game/MiniMap';
import { NarrativeFeed } from '@/components/game/NarrativeFeed';
import { ScenarioSelector } from '@/components/game/ScenarioSelector';
import { SceneHeader } from '@/components/game/SceneHeader';
import { StatePanel } from '@/components/game/StatePanel';
import { TurnSummaryBar } from '@/components/game/TurnSummaryBar';
import { VisualStage } from '@/components/game/VisualStage';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { Input } from '@/components/ui/Input';
import { LoadingState } from '@/components/ui/LoadingState';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { getCapsuleOverview } from '@/lib/apiClient';
import { useGameStore } from '@/lib/useGameStore';
import { trackClientEvent } from '@/lib/telemetryClient';
import { toTurnPacketViewModel } from '@/viewmodels/turn-packet-vm';
import Link from 'next/link';

const TUTORIAL_DONE_KEY = 'tmb_tutorial_done';
const COACH_MODE_KEY = 'tmb_coach_mode';

export default function PlayPage(): React.ReactElement {
  const store = useGameStore();
  const [debugAvailable, setDebugAvailable] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [iuDismissed, setIuDismissed] = useState(false);
  const [capsuleOverviewOpen, setCapsuleOverviewOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [coachMode, setCoachMode] = useState<CoachMode>('compact');
  const [capsuleOverview, setCapsuleOverview] = useState<{
    capsuleId: string;
    title: string;
    scenes: Array<{ id: string; title: string; beatIds: string[] }>;
    hotspots: Array<{ id: string; label: string; locationId: string }>;
  } | null>(null);

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

  const viewModel = store.packet ? toTurnPacketViewModel(store.packet) : null;
  const iuOpen = Boolean(viewModel?.activeIU) && !iuDismissed;

  const blockedTargets = useMemo(() => {
    if (!viewModel || viewModel.packet.outcome !== 'BLOCKED') {
      return { hotspots: [] as string[], locations: [] as string[] };
    }
    const targets = viewModel.packet.affordances?.suggestedActions
      .map((item) => item.targetId)
      .filter(Boolean) as string[];
    const hotspots = targets.filter((target) => viewModel.activeHotspots.includes(target));
    const locations = targets.filter((target) => viewModel.activeLocations.includes(target));
    return { hotspots, locations };
  }, [viewModel]);

  const coachSuggestions = useMemo(
    () => (viewModel ? buildCoachSuggestions(viewModel.packet) : []),
    [viewModel]
  );

  const selectedPresetDescription = useMemo(
    () =>
      store.availablePresets.find((preset) => preset.id === store.selectedPresetId)?.description,
    [store.availablePresets, store.selectedPresetId]
  );

  useEffect(() => {
    const queryDebug = new URLSearchParams(window.location.search).get('debug') === '1';
    setDebugAvailable(queryDebug);
    setDebugOpen(queryDebug);
    if (queryDebug) {
      emit('ui_debug_enabled');
    }

    const tutorialDone = localStorage.getItem(TUTORIAL_DONE_KEY);
    if (tutorialDone !== 'true') {
      setShowTutorial(true);
      emit('ui_tutorial_started');
    }

    const savedCoachMode = localStorage.getItem(COACH_MODE_KEY);
    if (savedCoachMode === 'off' || savedCoachMode === 'compact' || savedCoachMode === 'on') {
      setCoachMode(savedCoachMode);
    }
  }, [emit]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (debugOpen) {
        setDebugOpen(false);
      }
      if (iuOpen) {
        setIuDismissed(true);
      }
      if (showTutorial) {
        setShowTutorial(false);
        localStorage.setItem(TUTORIAL_DONE_KEY, 'true');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [debugOpen, iuOpen, showTutorial]);

  useEffect(() => {
    if (!debugOpen || !sessionId) {
      return;
    }
    void loadTrace(20);
  }, [debugOpen, loadTrace, sessionId]);

  useEffect(() => {
    setIuDismissed(false);
  }, [viewModel?.activeIU?.iuId, viewModel?.packet.turnId]);

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
    emit('ui_turn_summary_shown', { outcome: viewModel.packet.outcome });
    emit('ui_action_interpretation_shown', {
      verb: viewModel.packet.action.verb,
      targetId: viewModel.packet.action.targetId,
      source: viewModel.packet.action.source
    });
  }, [viewModel, sessionId, emit]);

  useEffect(() => {
    if (!viewModel?.end || !sessionId) {
      return;
    }
    emit('ui_postal_view', { endingId: viewModel.end.endingId });
  }, [viewModel?.end, sessionId, emit]);

  useEffect(() => {
    if (!sessionId || coachSuggestions.length === 0) {
      return;
    }
    emit('ui_coach_suggested', {
      count: coachSuggestions.length,
      suggestions: coachSuggestions.map((item) => ({
        verb: item.verb,
        targetId: item.targetId
      }))
    });
  }, [sessionId, coachSuggestions, emit]);

  useEffect(() => {
    if (!debugOpen || !viewModel?.packet.worldEvent || !sessionId) {
      return;
    }
    emit('ui_debug_wed_view', {
      fired: viewModel.packet.worldEvent.fired,
      eventId: viewModel.packet.worldEvent.eventId,
      skipReason: viewModel.packet.worldEvent.skipReason
    });
  }, [debugOpen, sessionId, viewModel?.packet.worldEvent, emit]);

  useEffect(() => {
    if (!debugOpen || !sessionId) {
      return;
    }
    const last = store.turnHistory[store.turnHistory.length - 1];
    if (!last?.narrativeProvider) {
      return;
    }
    emit('ui_debug_narrative_provider_view', { provider: last.narrativeProvider });
  }, [debugOpen, sessionId, store.turnHistory, emit]);

  if (!viewModel || !sessionId) {
    return (
      <main className="play-shell disconnected-shell">
        <Panel className="start-card tmb-frame tmb-texture">
          <PanelHeader>
            <h1>Take Me Back - Prueba de juego</h1>
          </PanelHeader>
          <PanelBody>
            <p>Elegí un escenario guiado y jugá 10 turnos sin abrir herramientas de dev.</p>

            <ScenarioSelector
              value={store.selectedScenarioId}
              scenarios={store.scenarios}
              disabled={store.isProcessing}
              onChange={(scenarioId) => store.chooseScenario(scenarioId)}
            />

            <label htmlFor="capsuleId">ID de cápsula</label>
            <Input
              id="capsuleId"
              value={store.capsuleId}
              onChange={(event) => store.setCapsuleId(event.target.value)}
              disabled={store.isProcessing}
              suppressHydrationWarning
            />

            <label htmlFor="presetId">Preset</label>
            <Select
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
              {store.availablePresets.length === 0 ? (
                <option value="default">Predeterminado</option>
              ) : null}
            </Select>

            {selectedPresetDescription ? <p className="muted">{selectedPresetDescription}</p> : null}

            <label className="demo-toggle">
              <input
                type="checkbox"
                checked={store.demoMode}
                onChange={(event) => store.setDemo(event.target.checked)}
                disabled={store.isProcessing}
                suppressHydrationWarning
              />
              Modo demo (seed fija: <code>{store.demoSeed}</code>)
            </label>

            <Button
              type="button"
              onClick={() => void store.start()}
              disabled={store.isProcessing}
              suppressHydrationWarning
            >
              {store.isProcessing ? 'Iniciando...' : 'Iniciar sesión'}
            </Button>

            {store.isProcessing ? (
              <LoadingState title="Iniciando sesión..." message="Preparando escena inicial." />
            ) : null}
            {store.error ? <ErrorState message={store.error} /> : null}
            <p className="muted">
              Si no hay sesión activa, esta vista muestra el estado desconectado.
            </p>
            <p className="muted">
              Si te perdés: <Link href="/lobby">ir a Perfil</Link> · <Link href="/history">ver Historial</Link>{' '}
              · <Link href="/how-to">cómo jugar</Link>.
            </p>
          </PanelBody>
        </Panel>
      </main>
    );
  }

  const overlayMeta = undefined;

  return (
    <main className="play-shell">
      <SceneHeader
        sceneTitle={viewModel.sceneTitle}
        beatTitle={viewModel.beatTitle}
        locationTimeLabel={viewModel.locationTimeLabel}
        objectiveNow={viewModel.objectiveNow}
      />

      <TurnSummaryBar packet={viewModel.packet} />
      <ActionInterpretation packet={viewModel.packet} />

      <section className="play-grid">
        <div className="play-main-column">
          <VisualStage
            backgroundClass={viewModel.stage.backgroundClass}
            moodClass={viewModel.stage.moodClass}
            sfxCue={viewModel.stage.sfxCue}
          />

          <CoachPanel
            mode={coachMode}
            packet={viewModel.packet}
            disabled={store.isProcessing || iuOpen}
            onSelect={(suggestion) => {
              emit('ui_coach_clicked', {
                verb: suggestion.verb,
                targetId: suggestion.targetId,
                reason: suggestion.reason
              });
              void store.send({
                verb: suggestion.verb,
                targetId: suggestion.targetId,
                playerText: suggestion.playerText,
                source: 'guidance'
              });
            }}
          />

          <GuidancePanel
            scenario={store.selectedScenario}
            packet={viewModel.packet}
            turnNumber={viewModel.packet.turnNumber}
            disabled={store.isProcessing || iuOpen}
            onTry={(suggestion: GuidanceSuggestion) => {
              emit('ui_guidance_clicked', {
                verb: suggestion.verb,
                targetId: suggestion.targetId,
                reason: suggestion.reason
              });
              void store.send({
                verb: suggestion.verb,
                targetId: suggestion.targetId,
                playerText: suggestion.playerText,
                source: 'guidance'
              });
            }}
          />

          <HotspotOverlay
            hotspotsUiMeta={overlayMeta}
            onSelectTarget={(targetId) => {
              store.setSelectedTarget(targetId);
              emit('ui_hotspot_click', { targetId, via: 'overlay' });
            }}
          />
          <NarrativeFeed blocks={viewModel.narrativeBlocks} />

          <BlockedHelper
            packet={viewModel.packet}
            disabled={store.isProcessing || iuOpen}
            onTryAlternative={(alternative) => {
              emit('ui_blocked_alternative_click', {
                verb: alternative.verb,
                targetId: alternative.targetId
              });
              emit('ui_blocked_recovery_used', {
                verb: alternative.verb,
                targetId: alternative.targetId
              });
              void store.send({
                verb: alternative.verb,
                targetId: alternative.targetId,
                playerText: alternative.reason,
                source: 'blocked_alternative'
              });
            }}
          />

          <ActionDock
            inputText={store.inputText}
            selectedVerb={store.selectedVerb}
            selectedTarget={store.selectedTarget}
            allowedVerbs={viewModel.allowedVerbs}
            suggestedActions={viewModel.suggestedActions}
            isProcessing={store.isProcessing || iuOpen}
            lastLatencyMs={store.lastLatencyMs}
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
            highlightedTargets={blockedTargets.hotspots}
            selectedTarget={store.selectedTarget}
            onSelectTarget={(targetId) => {
              store.setSelectedTarget(targetId);
              emit('ui_hotspot_click', { targetId });
            }}
          />
          <MiniMap
            locations={viewModel.activeLocations}
            highlightedLocations={blockedTargets.locations}
            currentLocationId={viewModel.packet.scene.sceneId}
            canMove={viewModel.allowedVerbs.includes('MOVE')}
            onMove={(locationId) => {
              emit('ui_location_click', { locationId });
              void store.send({
                verb: 'MOVE',
                targetId: locationId,
                playerText: `Mover a ${locationId}`,
                source: 'move'
              });
            }}
          />
          <StatePanel stateText={viewModel.stateText} npcsPresent={viewModel.npcsPresent} />
          {store.error ? <ErrorState title="Error de turno" message={store.error} /> : null}
          <section className="play-card tmb-frame play-meta-card">
            <p className="muted">Último ID de turno: {store.lastTurnId || 'ninguno'}</p>
            <p className="muted">Última latencia: {store.lastLatencyMs}ms</p>
            <p className="muted">Preajuste: {store.selectedPresetId}</p>
            <p className="muted">Escenario: {store.selectedScenario.label}</p>
            <p className="muted">Semilla: {store.sessionSeed ?? '-'}</p>
          </section>

          <label htmlFor="coachMode">Asistente</label>
          <Select
            id="coachMode"
            value={coachMode}
            onChange={(event) => {
              const next = event.target.value as CoachMode;
              setCoachMode(next);
              localStorage.setItem(COACH_MODE_KEY, next);
            }}
          >
            <option value="off">Oculto</option>
            <option value="compact">Compacto</option>
            <option value="on">Completo</option>
          </Select>

          <Button
            type="button"
            onClick={() => {
              if (!window.confirm('¿Reiniciar esta partida y volver al turno 0?')) {
                return;
              }
              void store.resetRun();
            }}
            disabled={store.isProcessing}
            variant="danger"
            suppressHydrationWarning
          >
            Reiniciar partida
          </Button>
        </aside>
      </section>

      <IuModal
        activeIU={viewModel.activeIU}
        isOpen={iuOpen}
        onRequestClose={() => setIuDismissed(true)}
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
          void store.resetRun();
        }}
      />

      <FirstRunTutorial
        isOpen={showTutorial}
        onClose={() => {
          setShowTutorial(false);
          localStorage.setItem(TUTORIAL_DONE_KEY, 'true');
          emit('ui_tutorial_completed');
        }}
        onSkip={() => {
          setShowTutorial(false);
          localStorage.setItem(TUTORIAL_DONE_KEY, 'true');
          emit('ui_tutorial_skipped');
        }}
      />

      {debugAvailable ? (
        <div className="debug-toggle-floating">
          <Button type="button" size="sm" variant="secondary" onClick={() => setDebugOpen((value) => !value)}>
            {debugOpen ? 'Ocultar depuración' : 'Mostrar depuración'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              if (capsuleOverview) {
                setCapsuleOverviewOpen((value) => !value);
                return;
              }
              void getCapsuleOverview(store.capsuleId)
                .then((overview) => {
                  setCapsuleOverview(overview);
                  setCapsuleOverviewOpen(true);
                  emit('ui_capsule_overview_open', {
                    scenes: overview.scenes.length,
                    hotspots: overview.hotspots.length
                  });
                })
                .catch(() => undefined);
            }}
          >
            Ver cápsula
          </Button>
        </div>
      ) : null}

      {debugOpen ? (
        <DebugDrawer
          enabled={debugOpen}
          history={store.turnHistory}
          presetDebug={{
            presetId: store.selectedPresetId,
            dials:
              store.availablePresets.find((preset) => preset.id === store.selectedPresetId)
                ?.dials ?? null,
            tags:
              store.availablePresets.find((preset) => preset.id === store.selectedPresetId)?.tags ??
              []
          }}
          capsuleOverview={capsuleOverviewOpen ? capsuleOverview : null}
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
