import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { habitStats, indexLogs, statusOn } from '../domain/habits'
import { schedaBenefici } from '../domain/benefits'
import { addDays, durataUmana, etichettaGiorno, formatLungo, GIORNI_CORTI, startOfWeek } from '../domain/dates'
import GiornoSheet from '../components/GiornoSheet'
import FormAbitudine from '../components/FormAbitudine'
import { Vuoto } from '../components/ui'
import { naviga } from '../App'

export default function DettaglioAbitudine({ id }: { id: string }) {
  const { state, dispatch, oggi } = useStore()
  const [giorno, setGiorno] = useState<string | null>(null)
  const [modifica, setModifica] = useState(false)
  const [conferma, setConferma] = useState(false)

  const habit = state.habits.find((h) => h.id === id)
  const idx = useMemo(() => indexLogs(state.logs), [state.logs])

  if (!habit) {
    return (
      <div className="schermata">
        <Vuoto
          emoji="🔍"
          titolo="Abitudine non trovata"
          testo="Forse è stata eliminata."
          azione={<button className="btn btn-primario" onClick={() => naviga('abitudini')}>Torna alle abitudini</button>}
        />
      </div>
    )
  }

  const s = habitStats(habit, idx, oggi, state.settings.weekStartsMonday)
  const scheda = schedaBenefici(habit.name, habit.category, s.progressDays, habit.benefitKey)
  const note = state.logs
    .filter((l) => l.habitId === habit.id && l.note && l.note.trim())
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  // Griglia delle ultime 10 settimane.
  const settimane: string[][] = []
  const primoGiorno = startOfWeek(addDays(oggi, -63), state.settings.weekStartsMonday)
  for (let w = 0; w < 10; w++) {
    const inizio = addDays(primoGiorno, w * 7)
    settimane.push(Array.from({ length: 7 }, (_, i) => addDays(inizio, i)))
  }

  const classeGiorno = (d: string) => {
    if (d > oggi) return 'futuro'
    if (d < habit.startDate) return 'futuro'
    const st = statusOn(idx, habit.id, d)
    if (habit.kind === 'quit') return st === 'relapse' ? 'negativo' : 'pieno'
    if (st === 'done') return 'pieno'
    if (st === 'missed' || st === 'relapse') return 'negativo'
    return ''
  }

  return (
    <div className="schermata">
      <header className="intestazione">
        <button className="icona-btn" onClick={() => naviga('abitudini')} aria-label="Indietro">←</button>
        <div className="crescita">
          <h1 style={{ fontSize: 21 }}>{habit.icon} {habit.name}</h1>
          <div className="sottotitolo">
            {habit.kind === 'quit' ? 'Hai smesso il' : 'Iniziata il'} {formatLungo(habit.startDate)}
          </div>
        </div>
        <button className="icona-btn" onClick={() => setModifica(true)} aria-label="Modifica">✏️</button>
      </header>

      <section className="card" style={{ ['--c' as string]: habit.color }}>
        <div className="centro" style={{ padding: '6px 0 12px' }}>
          <div className="numerone" style={{ color: habit.color }}>
            {habit.kind === 'weekly' ? `${s.weekDone}/${s.weekTarget}` : s.streak}
          </div>
          <div className="piccolo" style={{ marginTop: 6 }}>
            {habit.kind === 'quit' && `senza ricadute · ${durataUmana(s.cleanDays)}`}
            {habit.kind === 'daily' && `${s.streakUnit} di fila`}
            {habit.kind === 'weekly' && 'questa settimana'}
          </div>
        </div>
        <div className="stat-griglia">
          <div className="stat"><b>{s.best}</b><span>record</span></div>
          <div className="stat"><b>{s.aderenza}%</b><span>aderenza</span></div>
          <div className="stat">
            <b>{habit.kind === 'quit' ? s.relapses : s.completed}</b>
            <span>{habit.kind === 'quit' ? 'ricadute' : 'completati'}</span>
          </div>
        </div>
        <button className="btn btn-primario btn-pieno" style={{ marginTop: 14 }} onClick={() => setGiorno(oggi)}>
          Registra oggi
        </button>
      </section>

      {habit.why && (
        <section className="sezione">
          <h2>Il tuo perché</h2>
          <div className="avviso consiglio"><p style={{ fontStyle: 'italic' }}>"{habit.why}"</p></div>
        </section>
      )}

      <section className="sezione">
        <h2>Ultime 10 settimane</h2>
        <div className="card">
          <div className="cal-griglia" style={{ gap: 4 }}>
            {GIORNI_CORTI.map((g, i) => <div key={i} className="cal-intestazione">{g}</div>)}
            {settimane.flat().map((d) => (
              <button
                key={d}
                className={`cal-giorno ${classeGiorno(d)} ${d === oggi ? 'oggi' : ''}`}
                style={{ fontSize: 10 }}
                onClick={() => d <= oggi && setGiorno(d)}
              >
                {Number(d.slice(8))}
              </button>
            ))}
          </div>
          <p className="micro" style={{ marginTop: 10 }}>
            Tocca un giorno per correggerlo o aggiungere una nota, anche nel passato.
          </p>
        </div>
      </section>

      <section className="sezione">
        <h2>Cosa ti sta facendo {scheda.emoji}</h2>
        <div className="card">
          <p style={{ fontSize: 14.5 }}>{scheda.sintesi}</p>
          {!scheda.specifica && (
            <p className="micro" style={{ marginTop: 8 }}>
              Non ho una scheda specifica per questa abitudine: ti mostro i benefici tipici della categoria "{habit.category}".
            </p>
          )}
        </div>
        <div className="card">
          <b style={{ fontSize: 14 }}>💪 Sul corpo</b>
          <ul className="elenco-benefici" style={{ marginTop: 10 }}>
            {scheda.corpo.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
        <div className="card">
          <b style={{ fontSize: 14 }}>🧠 Sulla mente</b>
          <ul className="elenco-benefici" style={{ marginTop: 10 }}>
            {scheda.mente.map((b) => <li key={b}>{b}</li>)}
          </ul>
        </div>
      </section>

      <section className="sezione">
        <h2>La tua linea del tempo</h2>
        <div className="card">
          <div className="timeline">
            {scheda.timeline.map((m) => {
              const raggiunta = s.progressDays >= m.giorni
              const prossima = !raggiunta && scheda.prossima?.giorni === m.giorni
              return (
                <div key={m.giorni} className={`tappa ${raggiunta ? 'raggiunta' : prossima ? 'prossima' : 'futura'}`}>
                  <b>{m.titolo} {raggiunta && '✓'}</b>
                  <p>{m.testo}</p>
                  {prossima && (
                    <div className="micro" style={{ marginTop: 4, color: 'var(--accent-2)' }}>
                      Mancano {Math.max(1, m.giorni - s.progressDays)} giorni
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="sezione">
        <h2>Consigli per questa abitudine</h2>
        <div className="colonna" style={{ gap: 10 }}>
          {scheda.consigli.map((c) => (
            <div key={c} className="avviso consiglio"><p>{c}</p></div>
          ))}
        </div>
      </section>

      {note.length > 0 && (
        <section className="sezione">
          <h2>Le tue note · {note.length}</h2>
          <div className="colonna" style={{ gap: 10 }}>
            {note.slice(0, 20).map((n) => (
              <button key={n.id} className="card" style={{ textAlign: 'left' }} onClick={() => setGiorno(n.date)}>
                <div className="riga-spazio">
                  <b style={{ fontSize: 13 }}>{etichettaGiorno(n.date)}</b>
                  <span className="micro">
                    {n.status === 'done' ? '✅' : n.status === 'relapse' ? '⚠️' : '✖️'}
                    {n.mood ? ` ${['😖', '🙁', '😐', '🙂', '😄'][n.mood - 1]}` : ''}
                  </span>
                </div>
                <p className="piccolo" style={{ marginTop: 6 }}>{n.note}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="sezione">
        <div className="colonna">
          <button
            className="btn btn-pieno btn-fantasma"
            onClick={() => dispatch({ type: 'modificaAbitudine', id: habit.id, patch: { archived: !habit.archived } })}
          >
            {habit.archived ? 'Riattiva abitudine' : 'Archivia abitudine'}
          </button>
          {conferma ? (
            <div className="avviso attenzione">
              <b>Sicuro di eliminarla?</b>
              <p>Perderai tutti i giorni registrati e le note di questa abitudine.</p>
              <div className="riga" style={{ marginTop: 10 }}>
                <button
                  className="btn btn-pericolo crescita"
                  onClick={() => { dispatch({ type: 'eliminaAbitudine', id: habit.id }); naviga('abitudini') }}
                >
                  Elimina davvero
                </button>
                <button className="btn crescita" onClick={() => setConferma(false)}>Annulla</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-pieno btn-pericolo" onClick={() => setConferma(true)}>Elimina abitudine</button>
          )}
        </div>
      </section>

      {giorno && <GiornoSheet habit={habit} data={giorno} onChiudi={() => setGiorno(null)} />}
      {modifica && <FormAbitudine esistente={habit} onChiudi={() => setModifica(false)} />}
    </div>
  )
}
