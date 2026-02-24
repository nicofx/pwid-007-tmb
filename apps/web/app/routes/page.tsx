'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { trackClientEvent } from '@/lib/telemetryClient';

const routes = [
  { path: '/', purpose: 'Inicio y accesos principales', requiresProfile: false, requiresAdmin: false },
  { path: '/lobby', purpose: 'Perfil local y partidas recientes', requiresProfile: true, requiresAdmin: false },
  { path: '/play', purpose: 'Loop de juego', requiresProfile: true, requiresAdmin: false },
  { path: '/history', purpose: 'Listado de partidas', requiresProfile: true, requiresAdmin: false },
  {
    path: '/history/:sessionId',
    purpose: 'Línea de tiempo e inspector de una partida',
    requiresProfile: true,
    requiresAdmin: false
  },
  { path: '/how-to', purpose: 'Guía de uso', requiresProfile: false, requiresAdmin: false },
  { path: '/admin', purpose: 'Configuración del motor y balance', requiresProfile: false, requiresAdmin: true }
];

export default function RoutesPage(): React.ReactElement {
  const isProd = process.env.NODE_ENV === 'production';

  useEffect(() => {
    if (isProd) {
      return;
    }
    trackClientEvent({ eventName: 'ui_routes_index_view', ts: new Date().toISOString() });
  }, [isProd]);

  if (isProd) {
    return (
      <main className="container">
        <section className="play-card">
          <h1>Índice de rutas</h1>
          <p>Disponible solo en desarrollo.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <section className="play-card">
        <h1>Índice de rutas (dev)</h1>
        <p>Mapa rápido de todo lo linkeable en web.</p>
      </section>

      <section className="play-card">
        <table className="routes-table">
          <thead>
            <tr>
              <th>Ruta</th>
              <th>Propósito</th>
              <th>Perfil</th>
              <th>Administrador</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((item) => (
              <tr key={item.path}>
                <td>{item.path.includes(':') ? item.path : <Link href={item.path}>{item.path}</Link>}</td>
                <td>{item.purpose}</td>
                <td>{item.requiresProfile ? 'sí' : 'no'}</td>
                <td>{item.requiresAdmin ? 'sí' : 'no'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
