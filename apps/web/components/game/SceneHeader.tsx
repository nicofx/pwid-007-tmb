interface SceneHeaderProps {
  sceneTitle: string;
  beatTitle: string;
  locationTimeLabel: string;
  objectiveNow: string;
}

export function SceneHeader(props: SceneHeaderProps): React.ReactElement {
  return (
    <header className="play-card scene-header">
      <p className="scene-eyebrow">Take Me Back Runtime</p>
      <h1>{props.sceneTitle || '—'}</h1>
      <p className="scene-beat">{props.beatTitle || '—'}</p>
      <div className="scene-meta-row">
        <span>{props.locationTimeLabel || '—'}</span>
        <span>Objective: {props.objectiveNow || '—'}</span>
      </div>
    </header>
  );
}
