'use client';

import { useEffect } from 'react';
import { trackClientEvent } from '@/lib/telemetryClient';

export default function HowToPage(): React.ReactElement {
  useEffect(() => {
    trackClientEvent({ eventName: 'ui_howto_view', ts: new Date().toISOString() });
  }, []);

  return (
    <main className="container">
      <section className="play-card">
        <h1>Cómo jugar Take Me Back</h1>
        <p>Manual corto para testers y demos.</p>
      </section>

      <section className="play-card">
        <h2>Flujo básico</h2>
        <ol>
          <li>Iniciá sesión desde Perfil o Jugar.</li>
          <li>Seleccioná punto de interés/verbo o escribí intención en texto libre.</li>
          <li>Enviá turno y evaluá resultado + cambios.</li>
          <li>Repetí hasta llegar a un final o punto de corte del escenario.</li>
        </ol>
      </section>

      <section className="play-card">
        <h2>Qué significa “Bloqueado”</h2>
        <p>
          La acción no es válida para el tramo actual (verbo no permitido o objetivo no activo). Usá las
          alternativas sugeridas para salir rápido del bloqueo.
        </p>
      </section>

      <section className="play-card">
        <h2>Controles y paneles</h2>
        <ul>
          <li>Puntos de interés: objetivo principal de interacción.</li>
          <li>Mini mapa: navegación entre ubicaciones cuando “Moverse” está habilitado.</li>
          <li>IU modal: decisión puntual obligatoria cuando aparece.</li>
          <li>Historial: inspección de partidas previas y revisión de turnos.</li>
        </ul>
      </section>

      <section className="play-card">
        <h2>Reanudar, reiniciar y exportar</h2>
        <ul>
          <li>Reanudar: continuá la última partida desde Perfil o Historial.</li>
          <li>Eliminar partida: borra una partida puntual y su traza asociada.</li>
          <li>Borrar todo: reinicia el perfil local completo.</li>
          <li>Exportar JSON: respaldo de perfil + partidas + turnos.</li>
        </ul>
      </section>
    </main>
  );
}
