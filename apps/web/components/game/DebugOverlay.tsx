import type { TurnPacket } from '@tmb/contracts';

interface DebugOverlayProps {
  packet: TurnPacket;
}

export function DebugOverlay(props: DebugOverlayProps): React.ReactElement {
  const deltaKeys = Object.keys(props.packet.deltas?.state ?? {});

  return (
    <aside className="debug-overlay">
      <p>turnId: {props.packet.turnId}</p>
      <p>outcome: {props.packet.outcome}</p>
      <p>wed.event: {props.packet.worldEvent?.eventId ?? 'none'}</p>
      <p>wed.flavor: {props.packet.worldEvent?.flavor ?? '-'}</p>
      <p>wed.intensity: {props.packet.worldEvent?.intensity ?? '-'}</p>
      <p>wed.skip: {props.packet.worldEvent?.skipReason ?? '-'}</p>
      <p>delta.state: {deltaKeys.length ? deltaKeys.join(', ') : 'none'}</p>
      <p>verbs: {props.packet.affordances?.allowedVerbs.length ?? 0}</p>
      <p>hotspots: {props.packet.affordances?.activeHotspots.length ?? 0}</p>
      <p>locations: {props.packet.affordances?.activeLocations.length ?? 0}</p>
    </aside>
  );
}
