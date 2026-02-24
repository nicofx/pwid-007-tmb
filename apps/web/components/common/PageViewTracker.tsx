'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackClientEvent } from '@/lib/telemetryClient';

export function PageViewTracker(): null {
  const pathname = usePathname();

  useEffect(() => {
    trackClientEvent({
      eventName: 'page_view',
      ts: new Date().toISOString(),
      payload: { path: pathname }
    });
  }, [pathname]);

  return null;
}

