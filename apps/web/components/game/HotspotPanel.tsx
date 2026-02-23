interface HotspotPanelProps {
  hotspots: string[];
  selectedTarget?: string;
  onSelectTarget: (targetId: string) => void;
}

export function HotspotPanel(props: HotspotPanelProps): React.ReactElement {
  return (
    <section className="play-card hotspot-panel">
      <h2>Hotspots</h2>
      <div className="chip-row">
        {props.hotspots.length === 0 ? <p className="muted">No active hotspots</p> : null}
        {props.hotspots.map((hotspot) => (
          <button
            key={hotspot}
            type="button"
            onClick={() => props.onSelectTarget(hotspot)}
            className={props.selectedTarget === hotspot ? 'chip chip-selected' : 'chip'}
          >
            {hotspot}
          </button>
        ))}
      </div>
    </section>
  );
}
