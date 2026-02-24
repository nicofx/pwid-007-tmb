import { tTargetLabel } from '@/lib/i18n-content';

interface HotspotPanelProps {
  hotspots: string[];
  selectedTarget?: string;
  highlightedTargets?: string[];
  onSelectTarget: (targetId: string) => void;
}

export function HotspotPanel(props: HotspotPanelProps): React.ReactElement {
  const highlighted = new Set(props.highlightedTargets ?? []);
  return (
    <section className="play-card tmb-frame hotspot-panel">
      <h2>Puntos de interés</h2>
      <div className="chip-row">
        {props.hotspots.length === 0 ? <p className="muted">No hay hotspots activos</p> : null}
        {props.hotspots.map((hotspot) => (
          <button
            key={hotspot}
            type="button"
            onClick={() => props.onSelectTarget(hotspot)}
            className={
              props.selectedTarget === hotspot
                ? 'chip chip-selected'
                : highlighted.has(hotspot)
                  ? 'chip chip-highlighted'
                  : 'chip'
            }
          >
            {tTargetLabel(hotspot)}
          </button>
        ))}
      </div>
    </section>
  );
}
