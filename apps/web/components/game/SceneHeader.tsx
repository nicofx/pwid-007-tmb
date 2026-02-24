interface SceneHeaderProps {
  sceneTitle: string;
  beatTitle: string;
  locationTimeLabel: string;
  objectiveNow: string;
}

export function SceneHeader(props: SceneHeaderProps): React.ReactElement {
  return (
    <header className="play-card tmb-frame tmb-texture scene-header">
      <p className="scene-eyebrow">Motor de Take Me Back</p>
      <h1>{props.sceneTitle || '—'}</h1>
      <p className="scene-beat">{props.beatTitle || '—'}</p>
      <div className="scene-meta-row">
        <span>{props.locationTimeLabel || '—'}</span>
        <span>Objetivo: {props.objectiveNow || '—'}</span>
      </div>
    </header>
  );
}
