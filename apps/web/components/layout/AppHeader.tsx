'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { buttonClassName } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { trackClientEvent } from '@/lib/telemetryClient';

interface NavItem {
  href: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Inicio', icon: 'house' },
  { href: '/play', label: 'Jugar', icon: 'play' },
  { href: '/lobby', label: 'Perfil', icon: 'user' },
  { href: '/history', label: 'Historial', icon: 'history' },
  { href: '/how-to', label: 'Cómo jugar', icon: 'book' },
  { href: '/admin', label: 'Administración', icon: 'settings', adminOnly: true }
];

function trackNav(target: string): void {
  trackClientEvent({
    eventName: 'ui_nav_click',
    ts: new Date().toISOString(),
    payload: { target }
  });
}

export function AppHeader(): React.ReactElement {
  const pathname = usePathname();
  const isDev = process.env.NODE_ENV !== 'production';
  const links = navItems.filter((item) => (item.adminOnly ? isDev : true));

  return (
    <header className="app-header">
      <nav className="app-nav">
        <Link href="/" className="app-brand" onClick={() => trackNav('/')}>
          <span className="app-brand-title">Take Me Back</span>
          <Badge tone="accent">alpha</Badge>
        </Link>

        <div className="app-nav-links">
          {links.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={buttonClassName({ variant: active ? 'primary' : 'ghost', size: 'sm' })}
                onClick={() => trackNav(item.href)}
              >
                <Icon name={item.icon} size={16} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          {isDev ? (
            <Link
              href="/routes"
              className={buttonClassName({ variant: pathname === '/routes' ? 'primary' : 'ghost', size: 'sm' })}
              onClick={() => trackNav('/routes')}
            >
              <Icon name="compass" size={16} aria-hidden="true" />
              <span>Rutas</span>
            </Link>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
