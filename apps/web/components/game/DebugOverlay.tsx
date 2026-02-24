import type { TurnPacket } from '@tmb/contracts';
import { tOutcome } from '@/lib/i18n-game';

interface DebugOverlayProps {
  packet: TurnPacket;
}

export function DebugOverlay(props: DebugOverlayProps): React.ReactElement {
  const deltaKeys = Object.keys(props.packet.deltas?.state ?? {});

  return (
    <aside className="debug-overlay">
      <p>turnId: {props.packet.turnId}</p>
      <p>resultado: {tOutcome(props.packet.outcome)}</p>
      <p>wed.evento: {props.packet.worldEvent?.eventId ?? 'ninguno'}</p>
      <p>wed.flavor: {props.packet.worldEvent?.flavor ?? '-'}</p>
      <p>wed.intensity: {props.packet.worldEvent?.intensity ?? '-'}</p>
      <p>wed.skip: {props.packet.worldEvent?.skipReason ?? '-'}</p>
      <p>delta.estado: {deltaKeys.length ? deltaKeys.join(', ') : 'ninguno'}</p>
      <p>verbos: {props.packet.affordances?.allowedVerbs.length ?? 0}</p>
      <p>hotspots: {props.packet.affordances?.activeHotspots.length ?? 0}</p>
      <p>ubicaciones: {props.packet.affordances?.activeLocations.length ?? 0}</p>
    </aside>
  );
}
