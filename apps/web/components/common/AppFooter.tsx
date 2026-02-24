import Link from 'next/link';

export function AppFooter(): React.ReactElement {
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p>Take Me Back · loop por turnos con resultados, cambios y estado persistente.</p>
        <div className="app-footer-links">
          <Link href="/how-to">Cómo jugar</Link>
          <Link href="/history">Historial</Link>
          {isDev ? <Link href="/routes">Índice de rutas</Link> : null}
          <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer">
            Documentación API
          </a>
        </div>
      </div>
    </footer>
  );
}
