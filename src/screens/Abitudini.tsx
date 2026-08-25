import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { habitStats, indexLogs, statusOn } from '../domain/habits'
import RigaAbitudine from '../components/RigaAbitudine'
import GiornoSheet from '../components/GiornoSheet'
import FormAbitudine from '../components/FormAbitudine'
import { Vuoto } from '../components/ui'
import type { Habit } from '../domain/types'

export default function Abitudini() {
  const { state, dispatch, oggi } = useStore()
  const [sheet, setSheet] = useState<Habit | null>(null)
  const [form, setForm] = useState(false)
  const [archivio, setArchivio] = useState(false)

  const idx = useMemo(() => indexLogs(state.logs), [state.logs])
  const attive = state.habits.filter((h) => !h.archived)
  const archiviate = state.habits.filter((h) => h.archived)

  return (
    <div className="schermata">
      <header className="intestazione">
        <div>
          <h1>Abitudini</h1>
          <div className="sottotitolo">
            {attive.length === 0 ? 'Nessuna abitudine attiva' : `${attive.length} attive · ${state.logs.length} giorni registrati`}
          </div>
        </div>
        <button className="icona-btn" onClick={() => setForm(true)} aria-label="Nuova abitudine">＋</button>
      </header>

      {attive.length === 0 ? (
        <Vuoto
          emoji="📋"
          titolo="Costruiamo la prima"
          testo="Scrivi che cosa vuoi fare (o smettere di fare). Riconosco l'abitudine, ti spiego i benefici e inizio a contare."
          azione={<button className="btn btn-primario" onClick={() => setForm(true)}>Nuova abitudine</button>}
        />
      ) : (
        <div className="colonna" style={{ gap: 10 }}>
          {attive.map((h) => (
            <RigaAbitudine
              key={h.id}
              habit={h}
              stats={habitStats(h, idx, oggi, state.settings.weekStartsMonday)}
              stato={statusOn(idx, h.id, oggi)}
              onCheck={() => {
                if (h.kind === 'quit') { setSheet(h); return }
                const attuale = statusOn(idx, h.id, oggi)
                dispatch({ type: 'segnaGiorno', habitId: h.id, date: oggi, status: attuale === 'done' ? undefined : 'done' })
              }}
              onApri={() => setSheet(h)}
            />
          ))}
        </div>
      )}

      {attive.length > 0 && (
        <button className="btn btn-primario btn-pieno" style={{ marginTop: 16 }} onClick={() => setForm(true)}>
          ＋ Aggiungi abitudine
        </button>
      )}

      {archiviate.length > 0 && (
        <section className="sezione">
          <button className="btn btn-pieno btn-fantasma" onClick={() => setArchivio(!archivio)}>
            {archivio ? 'Nascondi' : 'Mostra'} archiviate ({archiviate.length})
          </button>
          {archivio && (
            <div className="colonna" style={{ gap: 10, marginTop: 12 }}>
              {archiviate.map((h) => (
                <div key={h.id} className="abitudine" style={{ ['--c' as string]: h.color, opacity: .7 }}>
                  <div className="emoji-tonda" style={{ ['--c' as string]: h.color }}>{h.icon}</div>
                  <div className="crescita">
                    <div className="nome-abitudine tronca">{h.name}</div>
                    <div className="micro">Archiviata</div>
                  </div>
                  <button className="chip" onClick={() => dispatch({ type: 'modificaAbitudine', id: h.id, patch: { archived: false } })}>
                    Riattiva
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {form && <FormAbitudine onChiudi={() => setForm(false)} />}
      {sheet && <GiornoSheet habit={sheet} data={oggi} onChiudi={() => setSheet(null)} />}
    </div>
  )
}
