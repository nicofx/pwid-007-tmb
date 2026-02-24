import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ items, value, onChange, className }: TabsProps): React.ReactElement {
  const active = items.find((item) => item.id === value) ?? items[0];

  return (
    <section className={cn('ui-tabs', className)}>
      <div className="ui-tabs-list" role="tablist" aria-orientation="horizontal">
        {items.map((item) => {
          const selected = item.id === active?.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={cn('ui-tabs-trigger', selected && 'ui-tabs-trigger-active')}
              onClick={() => onChange(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="ui-tabs-content" role="tabpanel">
        {active?.content ?? null}
      </div>
    </section>
  );
}
