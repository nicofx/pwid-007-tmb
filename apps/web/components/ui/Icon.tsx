import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Compass,
  Gauge,
  History,
  House,
  Play,
  Settings,
  Shield,
  User
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const iconRegistry = {
  house: House,
  play: Play,
  user: User,
  history: History,
  settings: Settings,
  book: BookOpen,
  compass: Compass,
  arrowRight: ArrowRight,
  alert: AlertCircle,
  gauge: Gauge,
  shield: Shield
};

export type IconName = keyof typeof iconRegistry;

interface IconProps extends Omit<LucideProps, 'ref'> {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps): React.ReactElement {
  const Component = iconRegistry[name];
  return <Component {...props} />;
}
