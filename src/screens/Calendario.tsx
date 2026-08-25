import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { indexLogs, statusOn } from '../domain/habits'
import {
  addDays, daysBetween, endOfMonth, etichettaGiorno, GIORNI_CORTI, nomeMese,
  parseISO, startOfMonth, startOfWeek,
} from '../domain/dates'
import { Sheet, Vuoto } from '../components/ui'
import GiornoSheet from '../components/GiornoSheet'
import type { Habit } from '../domain/types'
import { naviga } from '../App'

export default function Calendario() {
  const { state, dispatch, oggi } = useStore()
  const [mese, setMese] = useState(startOfMonth(oggi))
  const [filtro, setFiltro] = useState<string>('tutte')
  const [giorno, setGiorno] = useState<string | null>(null)
  const [notaPer, setNotaPer] = useState<{ habit: Habit; data: string } | null>(null)

  const idx = useMemo(() => indexLogs(state.logs), [state.logs])
  const attive = state.habits.filter((h) => !h.archived)
  const visibili = filtro === 'tutte' ? attive : attive.filter((h) => h.id === filtro)

  const primo = startOfMonth(mese)
  const ultimo = endOfMonth(mese)
  const inizioGriglia = startOfWeek(primo, state.settings.weekStartsMonday)
  const celle: string[] = []
  for (let d = inizioGriglia; daysBetween(d, ultimo) >= 0; d = addDays(d, 1)) celle.push(d)
  while (celle.length % 7 !== 0) celle.push(addDays(celle[celle.length - 1], 1))

  /** Per ogni giorno: quante abitudini previste e quante completate. */
  const riepilogo = (d: string) => {
    let previste = 0
    let fatte = 0
    let negative = 0
    for (const h of visibili) {
      if (daysBetween(h.startDate, d) < 0) continue
      const st = statusOn(idx, h.id, d)
      if (h.kind === 'quit') {
        previste++
        if (st === 'relapse') negative++
        else fatte++
      } else {
        previste++
        if (st === 'done') fatte++
        else if (st === 'missed') negative++
      }
    }
    return { previste, fatte, negative }
  }

  const haNota = (d: string) =>
    visibili.some((h) => {
      const n = idx.get(h.id)?.get(d)?.note
      return !!(n && n.trim())
    })

  if (attive.length === 0) {
    return (
      <div className="schermata">
        <header className="intestazione"><h1>Calendario</h1></header>
        <Vuoto
          emoji="🗓️"
          titolo="Niente da mostrare"
          testo="Crea un'abitudine e il calendario inizierà a riempirsi."
          azione={<button className="btn btn-primario" onClick={() => naviga('abitudini')}>Vai alle abitudini</button>}
        />
      </div>
    )
  }

  return (
    <div className="schermata">
      <header className="intestazione">
        <div>
          <h1>Calendario</h1>
          <div className="sottotitolo">Tocca un giorno per correggere il passato o aggiungere note</div>
        </div>
      </header>

      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={`chip ${filtro === 'tutte' ? 'attivo' : ''}`} onClick={() => setFiltro('tutte')}>
          Tutte
        </button>
        {attive.map((h) => (
          <button key={h.id} className={`chip ${filtro === h.id ? 'attivo' : ''}`} onClick={() => setFiltro(h.id)}>
            {h.icon} {h.name.length > 16 ? `${h.name.slice(0, 15)}…` : h.name}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="riga-spazio" style={{ marginBottom: 14 }}>
          <button className="icona-btn" onClick={() => setMese(startOfMonth(addDays(primo, -1)))} aria-label="Mese precedente">←</button>
          <b style={{ textTransform: 'capitalize' }}>{nomeMese(primo)} {parseISO(primo).getFullYear()}</b>
          <button
            className="icona-btn"
            onClick={() => setMese(startOfMonth(addDays(ultimo, 1)))}
            aria-label="Mese successivo"
            disabled={daysBetween(oggi, ultimo) >= 0}
            style={{ opacity: daysBetween(oggi, ultimo) >= 0 ? .35 : 1 }}
          >
            →
          </button>
        </div>

        <div className="cal-griglia">
          {GIORNI_CORTI.map((g, i) => <div key={i} className="cal-intestazione">{g}</div>)}
          {celle.map((d) => {
            const fuoriMese = parseISO(d).getMonth() !== parseISO(primo).getMonth()
            const { previste, fatte, negative } = riepilogo(d)
            const futuro = d > oggi
            const classe = [
              'cal-giorno',
              fuoriMese ? 'fuori-mese' : '',
              futuro ? 'futuro' : '',
              d === oggi ? 'oggi' : '',
              !futuro && previste > 0 && fatte === previste ? 'pieno' : '',
              !futuro && negative > 0 ? 'negativo' : '',
              !futuro && fatte > 0 && fatte < previste && negative === 0 ? 'parziale' : '',
            ].join(' ').trim()
            return (
              <button key={d} className={classe} onClick={() => !fuoriMese && !futuro && setGiorno(d)}>
                {haNota(d) && <span className="cal-nota">📝</span>}
                {Number(d.slice(8))}
              </button>
            )
          })}
        </div>

        <div className="riga" style={{ gap: 14, marginTop: 14, flexWrap: 'wrap' }}>
          <span className="micro">🟩 tutto fatto</span>
          <span className="micro">🟨 parziale</span>
          <span className="micro">🟥 saltato / ricaduta</span>
        </div>
      </div>

      {giorno && (
        <Sheet onChiudi={() => setGiorno(null)}>
          <h2 style={{ fontSize: 20 }}>{etichettaGiorno(giorno)}</h2>
          <p className="piccolo" style={{ marginBottom: 14 }}>Segna com'è andata. Puoi cambiare idea quando vuoi.</p>
          <div className="colonna" style={{ gap: 10 }}>
            {visibili
              .filter((h) => daysBetween(h.startDate, giorno) >= 0)
              .map((h) => {
                const st = statusOn(idx, h.id, giorno)
                const segna = (status?: 'done' | 'missed' | 'relapse') =>
                  dispatch({ type: 'segnaGiorno', habitId: h.id, date: giorno, status: st === status ? undefined : status })
                return (
                  <div key={h.id} className="card" style={{ marginTop: 0, ['--c' as string]: h.color }}>
                    <div className="riga" style={{ marginBottom: 10 }}>
                      <div className="emoji-tonda" style={{ ['--c' as string]: h.color, width: 36, height: 36, fontSize: 17 }}>
                        {h.icon}
                      </div>
                      <div className="crescita tronca"><b style={{ fontSize: 14.5 }}>{h.name}</b></div>
                      <button className="icona-btn" onClick={() => setNotaPer({ habit: h, data: giorno })} aria-label="Nota">📝</button>
                    </div>
                    <div className="riga" style={{ gap: 8 }}>
                      <button
                        className={`btn crescita ${st === 'done' ? 'btn-primario' : ''}`}
                        onClick={() => segna('done')}
                        style={{ padding: '10px 12px' }}
                      >
                        ✅ Fatto
                      </button>
                      <button
                        className={`btn crescita ${st === 'missed' || st === 'relapse' ? 'btn-pericolo' : ''}`}
                        onClick={() => segna(h.kind === 'quit' ? 'relapse' : 'missed')}
                        style={{ padding: '10px 12px' }}
                      >
                        {h.kind === 'quit' ? '⚠️ Ricaduta' : '✖️ No'}
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
          <button className="btn btn-pieno" style={{ marginTop: 16 }} onClick={() => setGiorno(null)}>Chiudi</button>
        </Sheet>
      )}

      {notaPer && (
        <GiornoSheet habit={notaPer.habit} data={notaPer.data} onChiudi={() => setNotaPer(null)} />
      )}
    </div>
  )
}
