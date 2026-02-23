interface HotspotUiMeta {
  id: string;
  x: number;
  y: number;
}

interface HotspotOverlayProps {
  hotspotsUiMeta?: HotspotUiMeta[];
  onSelectTarget: (targetId: string) => void;
}

export function HotspotOverlay(props: HotspotOverlayProps): React.ReactElement | null {
  if (!props.hotspotsUiMeta || props.hotspotsUiMeta.length === 0) {
    return null;
  }

  return (
    <div className="hotspot-overlay" aria-label="hotspot overlay">
      {props.hotspotsUiMeta.map((hotspot) => (
        <button
          key={hotspot.id}
          type="button"
          className="hotspot-overlay-pin"
          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          onClick={() => props.onSelectTarget(hotspot.id)}
        >
          {hotspot.id}
        </button>
      ))}
    </div>
  );
}
