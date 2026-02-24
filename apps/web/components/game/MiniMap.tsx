import { tTargetLabel } from '@/lib/i18n-content';

interface MiniMapProps {
  locations: string[];
  currentLocationId: string;
  canMove: boolean;
  highlightedLocations?: string[];
  onMove: (locationId: string) => void;
}

export function MiniMap(props: MiniMapProps): React.ReactElement {
  const highlighted = new Set(props.highlightedLocations ?? []);
  return (
    <section className="play-card tmb-frame mini-map">
      <h2>Mini-mapa</h2>
      <div className="mini-map-list">
        {props.locations.map((location) => {
          const selected = location === props.currentLocationId;
          const highlightedNode = highlighted.has(location);
          return (
            <button
              key={location}
              type="button"
              disabled={!props.canMove}
              onClick={() => props.onMove(location)}
              className={
                selected
                  ? 'mini-node mini-node-current'
                  : highlightedNode
                    ? 'mini-node mini-node-highlighted'
                    : 'mini-node'
              }
            >
              {tTargetLabel(location)}
            </button>
          );
        })}
      </div>
      {!props.canMove ? <p className="muted">Moverse no está disponible en este tramo</p> : null}
    </section>
  );
}
