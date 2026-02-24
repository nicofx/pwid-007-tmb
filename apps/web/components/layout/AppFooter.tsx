import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export function AppFooter(): React.ReactElement {
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <p>
          <strong>Take Me Back</strong> · Motor por turnos con resultados deterministas y estado persistente.
        </p>
        <div className="app-footer-links">
          <Link href="/how-to">Cómo jugar</Link>
          <Link href="/history">Historial</Link>
          <a href="http://localhost:3001/api/docs" target="_blank" rel="noreferrer">
            Swagger API
          </a>
          {isDev ? <Link href="/routes">Índice de rutas</Link> : null}
          <Badge tone="info">S19 · Design System v0</Badge>
        </div>
      </div>
    </footer>
  );
}
