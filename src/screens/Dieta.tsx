import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../state/store'
import {
  EMOJI_PASTI, EXTRA_RAPIDI, INFO_PIANO, NOMI_PASTI, ORARI_PASTI, ORDINE_PASTI,
  REGOLE_PIANO, type PastoPianificato, type Slot,
} from '../domain/dieta'
import {
  aderenzaGiorno, andamento, giornoDieta, kcalConsumate, kcalPianificate,
  opzioneScelta, pianoDelGiorno, prossimoPasto, stagioneDi,
} from '../domain/dietaLog'
import { addDays, etichettaGiorno, nomeMese, parseISO } from '../domain/dates'
import { chiediPermessoNotifiche, descriviPasto, permessoNotifiche, programmaNotificheOggi, scaricaICS } from '../domain/promemoria'
import { Barra, Sheet } from '../components/ui'
import GraficoCalorie from '../components/GraficoCalorie'
import { useToast } from '../components/toast'
import type { ConsumoSlot } from '../domain/types'
import { statusOn, indexLogs } from '../domain/habits'

type Tab = 'oggi' | 'andamento' | 'piano'

export default function Dieta() {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()
  const [data, setData] = useState(oggi)
  const [tab, setTab] = useState<Tab>('oggi')
  const [extraAperto, setExtraAperto] = useState(false)

  const log = giornoDieta(state, data)
  const pasti = useMemo(() => pianoDelGiorno(data, log.allenamento), [data, log.allenamento])
  const kcal = kcalConsumate(pasti, log)
  const kcalPiano = kcalPianificate(pasti, log)
  const ad = aderenzaGiorno(pasti, log)
  const trend = useMemo(() => andamento(state, oggi, 14), [state, oggi])
  const stagione = stagioneDi(data)
  const prossimo = data === oggi ? prossimoPasto(pasti, log, ORARI_PASTI) : undefined

  // Quando la giornata è completa segna anche l'abitudine collegata.
  const abitudineCibo = state.habits.find(
    (h) => !h.archived && (h.benefitKey === 'alimentazione' || h.category === 'alimentazione'),
  )
  useEffect(() => {
    if (!abitudineCibo || !ad.completo) return
    const idx = indexLogs(state.logs)
    if (statusOn(idx, abitudineCibo.id, data) === 'done') return
    dispatch({ type: 'segnaGiorno', habitId: abitudineCibo.id, date: data, status: 'done' })
  }, [abitudineCibo, ad.completo, data, dispatch, state.logs])

  // Promemoria dei pasti mentre l'app è aperta.
  useEffect(() => {
    if (!state.settings.promemoriaPasti || data !== oggi) return
    return programmaNotificheOggi(pasti, log)
  }, [state.settings.promemoriaPasti, pasti, log, data, oggi])

  const segna = (slot: Slot, stato?: ConsumoSlot) =>
    dispatch({ type: 'dietaConsumo', date: data, slotId: slot.id, stato })

  const attivaPromemoria = async () => {
    const esito = await chiediPermessoNotifiche()
    if (esito === 'granted') {
      dispatch({ type: 'impostazioni', patch: { promemoriaPasti: true } })
      toast('Promemoria attivi mentre l\'app è aperta')
    } else if (esito === 'non-supportato') {
      toast('Questo browser non supporta le notifiche')
    } else {
      toast('Permesso negato: puoi cambiarlo dalle impostazioni del browser')
    }
  }

  return (
    <div className="schermata">
      <header className="intestazione">
        <div>
          <h1>Dieta</h1>
          <div className="sottotitolo">Il tuo schema, giorno per giorno</div>
        </div>
        <button className="icona-btn" onClick={() => setExtraAperto(true)} aria-label="Aggiungi alimento fuori piano">＋</button>
      </header>

      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={`chip ${tab === 'oggi' ? 'attivo' : ''}`} onClick={() => setTab('oggi')}>🍽️ Giornata</button>
        <button className={`chip ${tab === 'andamento' ? 'attivo' : ''}`} onClick={() => setTab('andamento')}>📈 Andamento</button>
        <button className={`chip ${tab === 'piano' ? 'attivo' : ''}`} onClick={() => setTab('piano')}>📋 Piano e regole</button>
      </div>

      {tab === 'oggi' && (
        <>
          <div className="riga-spazio" style={{ marginBottom: 12 }}>
            <button className="icona-btn" onClick={() => setData(addDays(data, -1))} aria-label="Giorno precedente">←</button>
            <b>{etichettaGiorno(data, oggi)}</b>
            <button
              className="icona-btn"
              onClick={() => setData(addDays(data, 1))}
              aria-label="Giorno successivo"
              style={{ opacity: data >= oggi ? .35 : 1 }}
              disabled={data >= oggi}
            >
              →
            </button>
          </div>

          <section className="livello-card">
            <div className="riga-spazio">
              <div>
                <div className="numerone">{kcal}</div>
                <div className="piccolo">kcal registrate su {kcalPiano} previste</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 26, fontWeight: 800 }}>{ad.percentuale}%</div>
                <div className="micro">del piano</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Barra percentuale={kcalPiano > 0 ? kcal / kcalPiano : 0} />
            </div>
            <button
              className={`chip ${log.allenamento ? 'attivo' : ''}`}
              style={{ marginTop: 14 }}
              onClick={() => dispatch({ type: 'dietaAllenamento', date: data, attivo: !log.allenamento })}
            >
              🏋️ {log.allenamento ? 'Giorno di allenamento' : 'Oggi mi alleno'}
            </button>
          </section>

          {prossimo && (
            <div className="avviso consiglio" style={{ marginTop: 12 }}>
              <b>{EMOJI_PASTI[prossimo.pasto.pasto]} Prossimo: {NOMI_PASTI[prossimo.pasto.pasto]} · {prossimo.orario}</b>
              <p>{descriviPasto(prossimo.pasto, log)}</p>
            </div>
          )}

          {[...pasti]
            .sort((x, y) => ORDINE_PASTI.indexOf(x.pasto) - ORDINE_PASTI.indexOf(y.pasto))
            .map((p) => (
              <CardPasto
                key={p.pasto}
                pasto={p}
                log={log}
                onScegli={(slotId, opzioneId) => dispatch({ type: 'dietaScelta', date: data, slotId, opzioneId })}
                onSegna={segna}
              />
            ))}

          <section className="sezione">
            <h2>Fuori piano · {log.extra.length}</h2>
            {log.extra.length === 0 && (
              <p className="piccolo">Niente fuori piano oggi. Se mangi altro, aggiungilo: serve a tenere il conto vero.</p>
            )}
            <div className="colonna" style={{ gap: 8 }}>
              {log.extra.map((e) => (
                <div key={e.id} className="riga-spazio card" style={{ marginTop: 0, padding: 12 }}>
                  <div className="crescita tronca">{e.nome}</div>
                  <div className="piccolo">{e.kcal} kcal</div>
                  <button
                    className="icona-btn"
                    style={{ width: 34, height: 34 }}
                    onClick={() => dispatch({ type: 'dietaRimuoviExtra', date: data, id: e.id })}
                    aria-label="Rimuovi"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button className="btn btn-pieno" style={{ marginTop: 10 }} onClick={() => setExtraAperto(true)}>
              ＋ Ho mangiato altro
            </button>
          </section>

          <section className="sezione">
            <h2>Di stagione a {nomeMese(data)}</h2>
            <div className="card">
              <p className="piccolo"><b>Frutta:</b> {stagione.frutta.join(', ')}</p>
              <p className="piccolo" style={{ marginTop: 8 }}><b>Verdura:</b> {stagione.verdura.join(', ')}</p>
              <p className="micro" style={{ marginTop: 10 }}>
                Le "verdure di stagione a piacere" del tuo schema sono queste. Varia i colori: giallo, viola-blu, bianco, rosso, verde.
              </p>
            </div>
          </section>
        </>
      )}

      {tab === 'andamento' && (
        <>
          <section className="card">
            <b style={{ fontSize: 14 }}>Calorie degli ultimi 14 giorni</b>
            <div style={{ marginTop: 12 }}>
              <GraficoCalorie giorni={trend.giorni} riferimento={trend.mediaPiano} oggi={oggi} />
            </div>
          </section>

          <div className="stat-griglia" style={{ marginTop: 12 }}>
            <div className="stat"><b>{trend.mediaKcal}</b><span>media kcal</span></div>
            <div className="stat"><b>{trend.mediaAderenza}%</b><span>aderenza</span></div>
            <div className="stat"><b>{trend.giorniRegistrati}</b><span>giorni</span></div>
          </div>

          <div
            className={`avviso ${!trend.confrontabile ? 'consiglio' : trend.variazione > 150 ? 'attenzione' : trend.variazione < -150 ? 'pattern' : 'vittoria'}`}
            style={{ marginTop: 12 }}
          >
            <b>
              {!trend.confrontabile
                ? 'Non ho ancora abbastanza dati per l\'andamento'
                : trend.variazione === 0
                  ? 'Andamento stabile'
                  : trend.variazione > 0
                    ? `In salita: +${trend.variazione} kcal al giorno`
                    : `In discesa: ${trend.variazione} kcal al giorno`}
            </b>
            <p>
              {!trend.confrontabile
                ? `Per confrontare due settimane mi servono almeno 2 giorni registrati per ciascuna: finora ne hai ${trend.giorniRegistrati}. Continua a spuntare i pasti.`
                : `Media degli ultimi 7 giorni confrontata con i 7 precedenti. Il piano prevede circa ${trend.mediaPiano} kcal al giorno.`}
            </p>
          </div>

          <section className="sezione">
            <h2>Giorno per giorno</h2>
            <div className="card">
              {[...trend.giorni].reverse().slice(0, 14).map((g) => (
                <div key={g.date} className="riga-spazio" style={{ padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="piccolo" style={{ width: 74 }}>{etichettaGiorno(g.date, oggi)}</span>
                  <span className="crescita micro">{g.registrato ? `${g.aderenza}% del piano` : 'non registrato'}</span>
                  <b style={{ fontSize: 14 }}>{g.registrato ? `${g.kcal} kcal` : '—'}</b>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === 'piano' && (
        <>
          <section className="card">
            <b style={{ fontSize: 14 }}>Promemoria dei pasti</b>
            <p className="piccolo" style={{ marginTop: 8 }}>
              Due modi, e conviene usarli insieme.
            </p>
            <div className="colonna" style={{ marginTop: 12 }}>
              <button className="btn btn-pieno btn-primario" onClick={() => { scaricaICS(); toast('Calendario scaricato: aprilo per importarlo') }}>
                📅 Aggiungi i pasti al calendario del telefono
              </button>
              <p className="micro">
                Scarica un calendario con i 35 promemoria settimanali (5 pasti × 7 giorni), ognuno con la lista
                di cosa mangiare. Una volta importato, le notifiche arrivano dal telefono anche ad app chiusa.
              </p>
              {state.settings.promemoriaPasti ? (
                <button
                  className="btn btn-pieno"
                  onClick={() => dispatch({ type: 'impostazioni', patch: { promemoriaPasti: false } })}
                >
                  🔕 Disattiva le notifiche dell'app
                </button>
              ) : (
                <button className="btn btn-pieno" onClick={attivaPromemoria}>
                  🔔 Attiva le notifiche dell'app
                </button>
              )}
              <p className="micro">
                Le notifiche dell'app funzionano solo mentre resta aperta (anche in secondo piano):
                senza un server non è possibile fare di più. Stato permesso: {permessoNotifiche()}.
              </p>
            </div>
          </section>

          <section className="sezione">
            <h2>Regole del piano</h2>
            <div className="card">
              <ul className="elenco-benefici">
                {REGOLE_PIANO.map((r) => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </section>

          <section className="sezione">
            <h2>La settimana completa</h2>
            <div className="colonna" style={{ gap: 10 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((g) => {
                const dataGiorno = addDays(oggi, g - ((parseISO(oggi).getDay() + 6) % 7))
                const pastiGiorno = pianoDelGiorno(dataGiorno, false)
                const logVuoto = { date: dataGiorno, scelte: {}, consumo: {}, extra: [] }
                return (
                  <div key={g} className="card" style={{ marginTop: 0 }}>
                    <b style={{ fontSize: 14 }}>{['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'][g]}</b>
                    {[...pastiGiorno]
                      .sort((x, y) => ORDINE_PASTI.indexOf(x.pasto) - ORDINE_PASTI.indexOf(y.pasto))
                      .map((p) => (
                        <div key={p.pasto} style={{ marginTop: 8 }}>
                          <div className="micro">{EMOJI_PASTI[p.pasto]} {NOMI_PASTI[p.pasto].toUpperCase()}</div>
                          <div className="piccolo">{descriviPasto(p, logVuoto)}</div>
                        </div>
                      ))}
                  </div>
                )
              })}
            </div>
          </section>

          <section className="sezione">
            <div className="card">
              <p className="micro">
                Schema di {INFO_PIANO.autore}, intestato a {INFO_PIANO.intestatario}, emesso il {INFO_PIANO.emesso}
                {' '}con validità indicata di {INFO_PIANO.validita}. Le calorie sono stime calcolate dalle grammature
                dello schema: servono a vedere l'andamento, non sostituiscono il parere del nutrizionista.
              </p>
            </div>
          </section>
        </>
      )}

      {extraAperto && (
        <SheetExtra
          onChiudi={() => setExtraAperto(false)}
          onAggiungi={(nome, kcal) => {
            dispatch({ type: 'dietaExtra', date: data, extra: { nome, kcal } })
            toast(`${nome} aggiunto (${kcal} kcal)`)
          }}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CardPasto({
  pasto, log, onScegli, onSegna,
}: {
  pasto: PastoPianificato
  log: ReturnType<typeof giornoDieta>
  onScegli: (slotId: string, opzioneId: string) => void
  onSegna: (slot: Slot, stato?: ConsumoSlot) => void
}) {
  const fatti = pasto.slot.filter((s) => log.consumo[s.id]).length
  const completo = fatti === pasto.slot.length

  return (
    <section className="card" style={{ marginTop: 12, borderColor: completo ? 'rgba(52,211,153,.4)' : undefined }}>
      <div className="riga-spazio">
        <div>
          <b style={{ fontSize: 15 }}>{EMOJI_PASTI[pasto.pasto]} {NOMI_PASTI[pasto.pasto]}</b>
          <div className="micro">{ORARI_PASTI[pasto.pasto]} · {fatti}/{pasto.slot.length} registrati</div>
        </div>
        {completo && <span className="streak-pill">✓ fatto</span>}
      </div>

      {pasto.nota && <p className="micro" style={{ marginTop: 8, fontStyle: 'italic' }}>{pasto.nota}</p>}

      <div className="colonna" style={{ gap: 12, marginTop: 12 }}>
        {pasto.slot.map((slot) => {
          const opzione = opzioneScelta(slot, log)
          const stato = log.consumo[slot.id]
          return (
            <div key={slot.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <div className="micro">{slot.etichetta.toUpperCase()}{slot.libero ? ' · libero' : ''}</div>
              <div style={{ fontSize: 14.5, fontWeight: 600, marginTop: 2 }}>
                {opzione.alimenti.map((a) => `${a.nome} — ${a.quantita}`).join(' + ')}
              </div>
              <div className="micro" style={{ marginTop: 2 }}>
                ~{opzione.alimenti.reduce((t, a) => t + a.kcal, 0)} kcal
              </div>

              {slot.opzioni.length > 1 && (
                <div className="chips" style={{ marginTop: 8 }}>
                  {slot.opzioni.map((o) => (
                    <button
                      key={o.id}
                      className={`chip ${o.id === opzione.id ? 'attivo' : ''}`}
                      onClick={() => onScegli(slot.id, o.id)}
                    >
                      {o.alimenti.map((a) => a.nome.split(' (')[0]).join(' + ')}
                    </button>
                  ))}
                </div>
              )}

              <div className="riga" style={{ gap: 6, marginTop: 8 }}>
                <button
                  className={`btn crescita ${stato === 'tutto' ? 'btn-primario' : ''}`}
                  style={{ padding: '9px 8px', fontSize: 14 }}
                  onClick={() => onSegna(slot, stato === 'tutto' ? undefined : 'tutto')}
                >
                  ✓ Tutto
                </button>
                <button
                  className={`btn crescita ${stato === 'meta' ? 'btn-primario' : ''}`}
                  style={{ padding: '9px 8px', fontSize: 14 }}
                  onClick={() => onSegna(slot, stato === 'meta' ? undefined : 'meta')}
                >
                  ½ Metà
                </button>
                <button
                  className={`btn crescita ${stato === 'saltato' ? 'btn-pericolo' : ''}`}
                  style={{ padding: '9px 8px', fontSize: 14 }}
                  onClick={() => onSegna(slot, stato === 'saltato' ? undefined : 'saltato')}
                >
                  ✕ No
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function SheetExtra({
  onChiudi, onAggiungi,
}: { onChiudi: () => void; onAggiungi: (nome: string, kcal: number) => void }) {
  const [nome, setNome] = useState('')
  const [kcal, setKcal] = useState('')

  return (
    <Sheet onChiudi={onChiudi}>
      <h2 style={{ fontSize: 20 }}>Ho mangiato altro</h2>
      <p className="piccolo" style={{ marginBottom: 14 }}>
        Registra quello che hai mangiato fuori dal piano: serve a vedere le calorie vere, non quelle ideali.
      </p>

      <div className="chips">
        {EXTRA_RAPIDI.map((e) => (
          <button
            key={e.nome}
            className="chip"
            onClick={() => { onAggiungi(e.nome, e.kcal); onChiudi() }}
          >
            {e.nome} · {e.kcal}
          </button>
        ))}
      </div>

      <div className="campo" style={{ marginTop: 18 }}>
        <label className="etichetta">Altro alimento</label>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Focaccia" />
      </div>
      <div className="campo">
        <label className="etichetta">Calorie stimate</label>
        <input
          value={kcal}
          onChange={(e) => setKcal(e.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          placeholder="Es. 300"
        />
      </div>
      <button
        className="btn btn-primario btn-pieno"
        style={{ marginTop: 16 }}
        disabled={!nome.trim() || !kcal}
        onClick={() => { onAggiungi(nome.trim(), Number(kcal)); onChiudi() }}
      >
        Aggiungi
      </button>
      <button className="btn btn-pieno btn-fantasma" style={{ marginTop: 10 }} onClick={onChiudi}>Annulla</button>
    </Sheet>
  )
}
