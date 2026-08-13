interface TitleScreenProps {
  readonly hasSave: boolean
  readonly confirmingNewRite: boolean
  readonly onContinue: () => void
  readonly onNewRite: () => void
  readonly onConfirmNewRite: () => void
  readonly onCancelNewRite: () => void
}

export function TitleScreen({
  hasSave,
  confirmingNewRite,
  onContinue,
  onNewRite,
  onConfirmNewRite,
  onCancelNewRite,
}: TitleScreenProps) {
  return (
    <div className="title-screen" data-title-screen="1">
      <section className="title-screen__panel" aria-label="Mourneveil rite">
        <p className="title-screen__eyebrow">Mourneveil · Rite I</p>
        <h1>Ossuary of the Veilbound</h1>
        <p className="title-screen__lede">
          A local rite. Continue a bound oath, or begin again from the first watch.
        </p>
        {confirmingNewRite ? (
          <div className="title-screen__confirm" role="dialog" aria-labelledby="new-rite-confirm-title" data-title-confirm="1">
            <h2 id="new-rite-confirm-title">Begin a new rite?</h2>
            <p>This clears the current save. The defeated sepulchre, relics, and oath will not return.</p>
            <div className="title-screen__actions">
              <button type="button" data-title-confirm-yes="1" onClick={onConfirmNewRite}>
                Begin New Rite
              </button>
              <button type="button" className="title-screen__ghost" data-title-confirm-no="1" onClick={onCancelNewRite}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="title-screen__actions">
            {hasSave ? (
              <>
                <button type="button" data-title-action="continue" onClick={onContinue}>
                  Continue
                </button>
                <button type="button" className="title-screen__ghost" data-title-action="new-rite" onClick={onNewRite}>
                  New Rite
                </button>
              </>
            ) : (
              <button type="button" data-title-action="begin-rite" onClick={onNewRite}>
                Begin Rite
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
