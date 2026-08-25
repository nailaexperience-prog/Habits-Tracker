import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { habitStats, indexLogs, statusOn } from '../domain/habits'
import { calcolaProgresso } from '../domain/xp'
import { analizzaSituazione } from '../domain/insights'
import { prossimoPremio } from '../domain/rewards'
import { addDays, formatLungo, nomeGiorno } from '../domain/dates'
import { AnelloLivello, Barra, Strisce, Vuoto } from '../components/ui'
import RigaAbitudine from '../components/RigaAbitudine'
import GiornoSheet from '../components/GiornoSheet'
import { naviga } from '../App'
import type { Habit } from '../domain/types'
import { useToast } from '../components/toast'
import { aderenzaGiorno, giornoDieta, kcalConsumate, kcalPianificate, pianoDelGiorno, prossimoPasto } from '../domain/dietaLog'
import { EMOJI_PASTI, NOMI_PASTI, ORARI_PASTI } from '../domain/dieta'
import { descriviPasto } from '../domain/promemoria'

export default function Oggi() {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()
  const [sheet, setSheet] = useState<Habit | null>(null)

  const idx = useMemo(() => indexLogs(state.logs), [state.logs])
  const progresso = useMemo(() => calcolaProgresso(state, oggi, idx), [state, oggi, idx])
  const analisi = useMemo(() => analizzaSituazione(state, oggi), [state, oggi])
  const prossimoPremio_ = useMemo(() => prossimoPremio(state, oggi), [state, oggi])

  const attive = state.habits.filter((h) => !h.archived)
  const daFare = attive.filter((h) => h.kind !== 'quit' && statusOn(idx, h.id, oggi) !== 'done')
  const fatte = attive.filter((h) => h.kind !== 'quit' && statusOn(idx, h.id, oggi) === 'done')
  const quit = attive.filter((h) => h.kind === 'quit')

  const saluto = () => {
    const ora = new Date().getHours()
    const nome = state.profile.name ? `, ${state.profile.name}` : ''
    if (ora < 6) return `Notte fonda${nome}`
    if (ora < 12) return `Buongiorno${nome}`
    if (ora < 18) return `Buon pomeriggio${nome}`
    return `Buonasera${nome}`
  }

  const check = (h: Habit) => {
    if (h.kind === 'quit') { setSheet(h); return }
    const attuale = statusOn(idx, h.id, oggi)
    dispatch({
      type: 'segnaGiorno',
      habitId: h.id,
      date: oggi,
      status: attuale === 'done' ? undefined : 'done',
    })
    if (attuale !== 'done') toast(FRASI[Math.floor(Math.random() * FRASI.length)])
  }

  const osservazione = analisi.osservazioni[0]

  const logDieta = giornoDieta(state, oggi)
  const pastiOggi = pianoDelGiorno(oggi, logDieta.allenamento)
  const prossimo = prossimoPasto(pastiOggi, logDieta, ORARI_PASTI)
  const kcalOggi = kcalConsumate(pastiOggi, logDieta)
  const kcalPiano = kcalPianificate(pastiOggi, logDieta)
  const aderenzaDieta = aderenzaGiorno(pastiOggi, logDieta)

  return (
    <div className="schermata">
      <header className="intestazione">
        <div>
          <h1>{saluto()}</h1>
          <div className="sottotitolo">{nomeGiorno(oggi)} {formatLungo(oggi)}</div>
        </div>
        <button className="icona-btn" onClick={() => naviga('impostazioni')} aria-label="Impostazioni">⚙️</button>
      </header>

      <section className="livello-card">
        <div className="riga">
          <AnelloLivello livello={progresso.livello} percentuale={progresso.percentuale} />
          <div className="crescita">
            <div style={{ fontSize: 18, fontWeight: 800 }}>{progresso.titolo}</div>
            <div className="piccolo" style={{ marginBottom: 8 }}>
              {progresso.xp} XP totali
            </div>
            <Barra percentuale={progresso.percentuale} />
            <div className="micro" style={{ marginTop: 6 }}>
              {progresso.xpAlProssimo - progresso.xpNelLivello} XP al livello {progresso.livello + 1}
            </div>
          </div>
        </div>
      </section>

      {attive.length === 0 ? (
        <Vuoto
          emoji="🌱"
          titolo="Nessuna abitudine, per ora"
          testo="Aggiungi la prima: capirò di che tipo è, ti dirò quali benefici ti porta e inizierò a tenere il conto."
          azione={<button className="btn btn-primario" onClick={() => naviga('abitudini')}>Crea la prima abitudine</button>}
        />
      ) : (
        <>
          {quit.length > 0 && (
            <section className="sezione">
              <h2>I tuoi giorni puliti</h2>
              <div className="colonna">
                {quit.map((h) => {
                  const s = habitStats(h, idx, oggi, state.settings.weekStartsMonday)
                  return (
                    <div key={h.id} className="card" style={{ ['--c' as string]: h.color }}>
                      <div className="riga-spazio">
                        <div>
                          <div className="piccolo tronca">{h.icon} {h.name}</div>
                          <div className="numerone" style={{ color: h.color }}>{s.cleanDays}</div>
                          <div className="micro">
                            {s.cleanDays === 1 ? 'giorno' : 'giorni'} · record {s.best} · {s.relapses} ricadute
                          </div>
                        </div>
                        <div className="colonna" style={{ gap: 8 }}>
                          <button className="btn" onClick={() => setSheet(h)}>Registra</button>
                          <button className="btn btn-fantasma" onClick={() => naviga(`abitudini/${h.id}`)}>
                            Benefici
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <Strisce
                          giorni={Array.from({ length: 30 }, (_, i) => {
                            const d = addDays(oggi, -(29 - i))
                            const st = statusOn(idx, h.id, d)
                            return {
                              data: d,
                              stato: st === 'relapse' ? ('ko' as const) : (d >= h.startDate ? ('ok' as const) : undefined),
                              oggi: d === oggi,
                            }
                          })}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          <section className="sezione">
            <h2>{daFare.length > 0 ? `Da fare oggi · ${daFare.length}` : 'Oggi'}</h2>
            <div className="colonna" style={{ gap: 10 }}>
              {daFare.map((h) => (
                <RigaAbitudine
                  key={h.id}
                  habit={h}
                  stats={habitStats(h, idx, oggi, state.settings.weekStartsMonday)}
                  stato={statusOn(idx, h.id, oggi)}
                  onCheck={() => check(h)}
                  onApri={() => setSheet(h)}
                />
              ))}
              {daFare.length === 0 && quit.length === 0 && fatte.length === 0 && (
                <p className="piccolo">Nessuna abitudine giornaliera da spuntare oggi.</p>
              )}
              {daFare.length === 0 && fatte.length > 0 && (
                <div className="avviso vittoria">
                  <b>Giornata completata 🎉</b>
                  <p>Hai chiuso tutto quello che avevi previsto per oggi. Questa è una giornata perfetta.</p>
                </div>
              )}
            </div>
          </section>

          {fatte.length > 0 && (
            <section className="sezione">
              <h2>Fatte · {fatte.length}</h2>
              <div className="colonna" style={{ gap: 10 }}>
                {fatte.map((h) => (
                  <RigaAbitudine
                    key={h.id}
                    habit={h}
                    stats={habitStats(h, idx, oggi, state.settings.weekStartsMonday)}
                    stato={statusOn(idx, h.id, oggi)}
                    onCheck={() => check(h)}
                    onApri={() => setSheet(h)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <section className="sezione">
        <h2>Piano alimentare</h2>
        <button className="card" style={{ width: '100%', textAlign: 'left' }} onClick={() => naviga('dieta')}>
          {prossimo ? (
            <>
              <div className="riga-spazio">
                <b style={{ fontSize: 15 }}>
                  {EMOJI_PASTI[prossimo.pasto.pasto]} {NOMI_PASTI[prossimo.pasto.pasto]}
                </b>
                <span className="streak-pill">{prossimo.orario}</span>
              </div>
              <p className="piccolo" style={{ marginTop: 6 }}>{descriviPasto(prossimo.pasto, logDieta)}</p>
            </>
          ) : (
            <b style={{ fontSize: 15 }}>🍽️ Tutti i pasti di oggi sono registrati</b>
          )}
          <div className="micro" style={{ marginTop: 10 }}>
            {kcalOggi} / {kcalPiano} kcal · {aderenzaDieta.percentuale}% del piano
          </div>
          <div style={{ marginTop: 6 }}>
            <Barra percentuale={kcalPiano > 0 ? kcalOggi / kcalPiano : 0} />
          </div>
        </button>
      </section>

      {prossimoPremio_ && (
        <section className="sezione">
          <h2>Prossimo premio</h2>
          <button className="card" style={{ width: '100%', textAlign: 'left' }} onClick={() => naviga('premi')}>
            <div className="riga">
              <div style={{ fontSize: 30, filter: 'grayscale(1) opacity(.6)' }}>{prossimoPremio_.premio.emoji}</div>
              <div className="crescita">
                <b>{prossimoPremio_.premio.nome}</b>
                <div className="micro">{prossimoPremio_.premio.condizione}</div>
                <div className="mini-barra" style={{ ['--t' as string]: 'var(--accent)' }}>
                  <i style={{ width: `${Math.round(prossimoPremio_.progresso * 100)}%` }} />
                </div>
              </div>
              <div className="piccolo">{Math.round(prossimoPremio_.progresso * 100)}%</div>
            </div>
          </button>
        </section>
      )}

      {osservazione && (
        <section className="sezione">
          <h2>Cosa vedo nei tuoi dati</h2>
          <div className={`avviso ${osservazione.tipo}`}>
            <b>{osservazione.titolo}</b>
            <p>{osservazione.testo}</p>
          </div>
          <button className="btn btn-pieno" style={{ marginTop: 10 }} onClick={() => naviga('diario')}>
            Vedi l'analisi completa
          </button>
        </section>
      )}

      {sheet && <GiornoSheet habit={sheet} data={oggi} onChiudi={() => setSheet(null)} />}
    </div>
  )
}

const FRASI = [
  'Fatto. Un mattone in più. 🧱',
  'Registrato. Domani sarà più facile.',
  'Bravo. La catena continua. 🔗',
  'Fatto: questo è il tipo di persona che stai diventando.',
  'Segnato. I giorni si sommano, sempre.',
]
