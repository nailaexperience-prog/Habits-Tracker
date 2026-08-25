import { useState } from 'react'
import { useStore } from '../state/store'
import type { DayStatus, Habit } from '../domain/types'
import { entryOn, indexLogs } from '../domain/habits'
import { etichettaGiorno, isFuture } from '../domain/dates'
import { Sheet } from './ui'
import { useToast } from './toast'

const UMORI = ['😖', '🙁', '😐', '🙂', '😄']

/** Foglio per registrare (o correggere) una giornata di un'abitudine. */
export default function GiornoSheet({
  habit, data, onChiudi,
}: { habit: Habit; data: string; onChiudi: () => void }) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const idx = indexLogs(state.logs)
  const voce = entryOn(idx, habit.id, data)
  const [nota, setNota] = useState(voce?.note ?? '')
  const [umore, setUmore] = useState<number | undefined>(voce?.mood)
  const futuro = isFuture(data)

  const salva = (status?: DayStatus) => {
    dispatch({ type: 'segnaGiorno', habitId: habit.id, date: data, status, note: nota, mood: umore })
    if (status === 'done') toast('Registrato. Bel colpo. 💪')
    else if (status === 'relapse') toast('Registrato. L\'onestà conta più della perfezione.')
    else if (status === 'missed') toast('Segnato come non fatto.')
    onChiudi()
  }

  const stato = voce?.status

  return (
    <Sheet onChiudi={onChiudi}>
      <div className="riga" style={{ marginBottom: 4 }}>
        <div className="emoji-tonda" style={{ ['--c' as string]: habit.color }}>{habit.icon}</div>
        <div className="crescita">
          <h2 style={{ fontSize: 19 }}>{habit.name}</h2>
          <div className="piccolo">{etichettaGiorno(data)}</div>
        </div>
      </div>

      {futuro ? (
        <p className="piccolo" style={{ margin: '18px 0' }}>
          Non puoi registrare un giorno che non è ancora arrivato. Torna qui domani.
        </p>
      ) : (
        <>
          <div className="sezione">
            <h2>Com'è andata</h2>
            <div className="colonna">
              <button
                className={`btn btn-pieno ${stato === 'done' ? 'btn-primario' : ''}`}
                onClick={() => salva('done')}
              >
                ✅ {habit.kind === 'quit' ? 'Giornata pulita' : 'Fatto'}
              </button>
              {habit.kind === 'quit' ? (
                <button className="btn btn-pieno btn-pericolo" onClick={() => salva('relapse')}>
                  ⚠️ Ho avuto una ricaduta
                </button>
              ) : (
                <button
                  className={`btn btn-pieno ${stato === 'missed' ? 'btn-pericolo' : ''}`}
                  onClick={() => salva('missed')}
                >
                  ✖️ Non l'ho fatto
                </button>
              )}
              {stato && (
                <button className="btn btn-pieno btn-fantasma" onClick={() => salva(undefined)}>
                  Cancella la registrazione di questo giorno
                </button>
              )}
            </div>
          </div>

          <div className="sezione">
            <h2>Come ti senti</h2>
            <div className="chips">
              {UMORI.map((e, i) => (
                <button
                  key={e}
                  className={`chip ${umore === i + 1 ? 'attivo' : ''}`}
                  onClick={() => setUmore(umore === i + 1 ? undefined : i + 1)}
                  style={{ fontSize: 20, padding: '6px 12px' }}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="sezione">
            <h2>Nota</h2>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Cosa è successo? Cosa ti ha aiutato o cosa ti ha fatto scivolare? Scrivilo: userò queste note per darti consigli."
            />
            <button
              className="btn btn-pieno"
              style={{ marginTop: 10 }}
              onClick={() => {
                dispatch({ type: 'segnaGiorno', habitId: habit.id, date: data, status: stato, note: nota, mood: umore })
                toast('Nota salvata')
                onChiudi()
              }}
            >
              Salva nota
            </button>
          </div>
        </>
      )}
    </Sheet>
  )
}
