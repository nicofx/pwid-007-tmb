'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { buttonClassName } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Panel, PanelBody, PanelHeader } from '@/components/ui/Panel';
import { trackClientEvent } from '@/lib/telemetryClient';

const PLAY_STORAGE_KEY = 'tmb.play.session';

export default function Home(): React.ReactElement {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(localStorage.getItem(PLAY_STORAGE_KEY)));
    trackClientEvent({ eventName: 'ui_landing_view', ts: new Date().toISOString() });
  }, []);

  function onCtaClick(target: string): void {
    trackClientEvent({
      eventName: 'ui_landing_cta_click',
      ts: new Date().toISOString(),
      payload: { target }
    });
  }

  return (
    <main className="container">
      <Panel>
        <PanelHeader>
          <h1>Take Me Back</h1>
          <Badge tone="accent">Noir Pulp</Badge>
        </PanelHeader>
        <PanelBody>
          <p>
            Juego narrativo por turnos: elegís una acción, el motor resuelve el <strong>resultado</strong>,
            aplica <strong>cambios</strong> y devuelve el nuevo estado para decidir el siguiente movimiento.
          </p>
          <div className="scene-meta-row">
            <Badge tone="info">Ajustes</Badge>
            <Badge tone="warning">Imponderables WED</Badge>
            <Badge tone="success">Narrativa de respaldo segura</Badge>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <h2>Cómo se juega</h2>
        </PanelHeader>
        <PanelBody>
          <ol>
            <li>Elegí un punto de interés/verbo o escribí tu intención.</li>
            <li>Enviá turno y mirá el resultado.</li>
            <li>Ajustá tu plan según opciones disponibles y cambios.</li>
          </ol>
          <p className="muted">
            Regla base: <code>Acción → Resultado → Cambios → Paquete de Turno</code>
          </p>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <h2>Entrar</h2>
        </PanelHeader>
        <PanelBody>
          <div className="scene-meta-row">
            <Link
              href="/play"
              className={buttonClassName({ variant: 'primary' })}
              onClick={() => onCtaClick('/play')}
            >
              <Icon name="play" size={16} aria-hidden="true" />
              Jugar
            </Link>
            <Link
              href="/lobby"
              className={buttonClassName({ variant: 'secondary' })}
              onClick={() => onCtaClick('/lobby')}
            >
              <Icon name="user" size={16} aria-hidden="true" />
              Perfil
            </Link>
            <Link
              href="/history"
              className={buttonClassName({ variant: 'ghost' })}
              onClick={() => onCtaClick('/history')}
            >
              <Icon name="history" size={16} aria-hidden="true" />
              Historial
            </Link>
            {hasSession ? (
              <Link
                href="/play"
                className={buttonClassName({ variant: 'secondary' })}
                onClick={() => onCtaClick('/play-continue')}
              >
                <Icon name="arrowRight" size={16} aria-hidden="true" />
                Continuar última partida
              </Link>
            ) : null}
          </div>
        </PanelBody>
      </Panel>
    </main>
  );
}
