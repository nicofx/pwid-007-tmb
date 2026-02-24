interface FirstRunTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
}

const steps = [
  '1) Elegí un punto de interés de la lista.',
  '2) Elegí un verbo en el panel de acciones.',
  '3) Enviá el turno (Enter también funciona).',
  '4) Mirá el minimapa para moverte si “Moverse” está habilitado.',
  '5) Si aparece una IU, elegí un enfoque para continuar.'
];

export function FirstRunTutorial(props: FirstRunTutorialProps): React.ReactElement | null {
  if (!props.isOpen) {
    return null;
  }

  return (
    <section
      className="iu-modal-backdrop"
      aria-label="tutorial inicial"
      role="dialog"
      aria-modal="true"
    >
      <article className="iu-modal-card">
        <h2>Tutorial rápido</h2>
        <p>Esto aparece una sola vez para que arranques sin fricción.</p>
        <ul className="debug-list">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <div className="scene-meta-row">
          <button type="button" onClick={props.onSkip}>
            Saltar
          </button>
          <button type="button" onClick={props.onClose}>
            Entendido
          </button>
        </div>
      </article>
    </section>
  );
}
