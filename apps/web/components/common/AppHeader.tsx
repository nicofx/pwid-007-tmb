'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { trackClientEvent } from '@/lib/telemetryClient';

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio' },
  { href: '/play', label: 'Jugar' },
  { href: '/lobby', label: 'Perfil' },
  { href: '/history', label: 'Historial' },
  { href: '/how-to', label: 'Cómo jugar' },
  { href: '/admin', label: 'Administración', adminOnly: true }
];

export function AppHeader(): React.ReactElement {
  const pathname = usePathname();
  const isDev = process.env.NODE_ENV !== 'production';
  const links = navItems.filter((item) => (item.adminOnly ? isDev : true));

  return (
    <header className="app-header">
      <nav className="app-nav">
        <strong className="app-brand">Take Me Back</strong>
        <div className="app-nav-links">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'app-nav-link active' : 'app-nav-link'}
              onClick={() =>
                trackClientEvent({
                  eventName: 'ui_nav_click',
                  ts: new Date().toISOString(),
                  payload: { target: item.href }
                })
              }
            >
              {item.label}
            </Link>
          ))}
          {isDev ? (
            <Link
              href="/routes"
              className={pathname === '/routes' ? 'app-nav-link active' : 'app-nav-link'}
              onClick={() =>
                trackClientEvent({
                  eventName: 'ui_nav_click',
                  ts: new Date().toISOString(),
                  payload: { target: '/routes' }
                })
              }
            >
              Rutas
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
