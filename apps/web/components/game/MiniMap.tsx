interface MiniMapProps {
  locations: string[];
  currentLocationId: string;
  canMove: boolean;
  onMove: (locationId: string) => void;
}

export function MiniMap(props: MiniMapProps): React.ReactElement {
  return (
    <section className="play-card mini-map">
      <h2>Mini-map</h2>
      <div className="mini-map-list">
        {props.locations.map((location) => {
          const selected = location === props.currentLocationId;
          return (
            <button
              key={location}
              type="button"
              disabled={!props.canMove}
              onClick={() => props.onMove(location)}
              className={selected ? 'mini-node mini-node-current' : 'mini-node'}
            >
              {location}
            </button>
          );
        })}
      </div>
      {!props.canMove ? <p className="muted">MOVE unavailable in current beat</p> : null}
    </section>
  );
}
