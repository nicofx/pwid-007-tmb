interface VisualStageProps {
  backgroundClass: string;
  moodClass: string;
  sfxCue?: string;
}

export function VisualStage(props: VisualStageProps): React.ReactElement {
  return (
    <section className={`play-card tmb-frame tmb-texture visual-stage ${props.backgroundClass} ${props.moodClass}`}>
      <div className="visual-stage-overlay" />
      <p className="visual-stage-label">Escena visual</p>
      <p className="visual-stage-sfx">SFX: {props.sfxCue ?? 'sin cue'}</p>
    </section>
  );
}
