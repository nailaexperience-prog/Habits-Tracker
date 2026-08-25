import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../state/store'
import {
  PROGRAMMA, descriviPrescrizione, prescrizione, scheda,
  type TipoSessione,
} from '../domain/allenamento'
import {
  ancoraSettimana, nuovaSessione, pesoMassimo, progressione, programmaConfigurato,
  programmaFinito, prossimaScheda, sessioneDelGiorno, settimanaDi,
  statoPalestra, suggerimentoCarico, ultimaVolta, volumeSessione,
} from '../domain/allenamentoLog'
import { etichettaGiorno, formatCorto, parseISO } from '../domain/dates'
import { nuovaId } from '../domain/habits'
import { generaICSAllenamenti, programmaNotifica, scaricaFile } from '../domain/promemoria'
import { Barra, Vuoto } from '../components/ui'
import { useToast } from '../components/toast'
import type { Sessione } from '../domain/types'
import { indexLogs, statusOn } from '../domain/habits'

const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

export default function Palestra() {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'oggi' | 'storico' | 'programma'>('oggi')
  const [apertaId, setApertaId] = useState<string | null>(null)

  const stato = useMemo(() => statoPalestra(state, oggi), [state, oggi])
  const configurato = programmaConfigurato(state.programma)
  const sessioneOggi = sessioneDelGiorno(state.allenamenti, oggi)
  const aperta = state.allenamenti.find((s) => s.id === apertaId) ?? sessioneOggi

  // Promemoria dell'allenamento nei giorni previsti, mentre l'app è aperta.
  const giornoDiOggi = (parseISO(oggi).getDay() + 6) % 7
  const eGiornoDiPalestra = state.programma.giorni.includes(giornoDiOggi)
  useEffect(() => {
    if (!state.settings.promemoriaPasti || !eGiornoDiPalestra || sessioneOggi) return
    const s = scheda(stato.prossima)
    return programmaNotifica(
      state.programma.orario,
      `🏋️ Allenamento · scheda ${stato.prossima}`,
      s.esercizi.map((e) => e.nome).join(' · '),
      'allenamento',
    )
  }, [state.settings.promemoriaPasti, state.programma.orario, eGiornoDiPalestra, sessioneOggi, stato.prossima])

  const iniziaSessione = (tipo: TipoSessione) => {
    const settimana = settimanaDi(state.programma, oggi)
    const sessione = nuovaSessione(nuovaId('ses'), oggi, tipo, settimana)
    dispatch({ type: 'sessioneAggiungi', sessione })
    setApertaId(sessione.id)
    toast(tipo === 'PT' ? 'Sessione con il PT registrata' : `Scheda ${tipo} iniziata. Forza. 💪`)
  }

  if (!configurato) {
    return (
      <div className="schermata">
        <Vuoto
          emoji="🏋️"
          titolo="A che punto sei del programma?"
          testo="Il programma di Jacopo dura 5 settimane. Dimmi in quale ti trovi adesso e allineo tutto: prescrizioni, carichi e alternanza delle schede."
        />
        <div className="chips" style={{ justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className={`chip ${n === 3 ? 'attivo' : ''}`}
              onClick={() => {
                dispatch({ type: 'programma', patch: { inizio: ancoraSettimana(n, oggi) } })
                toast(`Programma allineato alla settimana ${n}`)
              }}
            >
              Settimana {n}
            </button>
          ))}
        </div>
        <p className="micro centro" style={{ marginTop: 14 }}>
          Puoi cambiarla quando vuoi da "Programma".
        </p>
      </div>
    )
  }

  return (
    <div className="schermata">
      <div className="chips" style={{ marginBottom: 14 }}>
        <button className={`chip ${tab === 'oggi' ? 'attivo' : ''}`} onClick={() => setTab('oggi')}>🏋️ Allenamento</button>
        <button className={`chip ${tab === 'storico' ? 'attivo' : ''}`} onClick={() => setTab('storico')}>📈 Carichi</button>
        <button className={`chip ${tab === 'programma' ? 'attivo' : ''}`} onClick={() => setTab('programma')}>📋 Programma</button>
      </div>

      {tab === 'oggi' && (
        <>
          <section className="livello-card">
            <div className="riga-spazio">
              <div>
                <div className="micro">SETTIMANA</div>
                <div className="numerone">{Math.min(stato.settimana, PROGRAMMA.settimane)}<span style={{ fontSize: 20, opacity: .6 }}>/{PROGRAMMA.settimane}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="micro">QUESTA SETTIMANA</div>
                <div style={{ fontSize: 26, fontWeight: 800 }}>
                  {stato.sessioniQuestaSettimana}/{state.programma.giorni.length}
                </div>
                <div className="micro">sessioni</div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Barra percentuale={stato.sessioniQuestaSettimana / Math.max(1, state.programma.giorni.length)} />
            </div>
          </section>

          {stato.finito && (
            <div className="avviso attenzione" style={{ marginTop: 12 }}>
              <b>Programma completato 🎉</b>
              <p>
                Le 5 settimane sono finite. Quando hai la scheda nuova mandamela e la carico al posto di questa.
                Nel frattempo puoi continuare con l'ultima settimana o riallineare il programma da "Programma".
              </p>
            </div>
          )}

          {!aperta ? (
            <section className="sezione">
              <h2>Oggi</h2>
              <div className="card">
                <p className="piccolo">
                  Tocca la <b>scheda {stato.prossima}</b>: {stato.ultima
                    ? `l'ultima è stata la ${stato.ultima.tipo === 'PT' ? 'sessione col PT' : `scheda ${stato.ultima.tipo}`} il ${formatCorto(stato.ultima.date)}.`
                    : 'è la prima sessione che registri.'}
                </p>
                <div className="colonna" style={{ marginTop: 14 }}>
                  <button className="btn btn-primario btn-pieno" onClick={() => iniziaSessione(stato.prossima)}>
                    Inizia scheda {stato.prossima} · {scheda(stato.prossima).nome}
                  </button>
                  <button className="btn btn-pieno" onClick={() => iniziaSessione(stato.prossima === 'A' ? 'B' : 'A')}>
                    Fai invece la scheda {stato.prossima === 'A' ? 'B' : 'A'}
                  </button>
                  <button className="btn btn-pieno btn-fantasma" onClick={() => iniziaSessione('PT')}>
                    🧑‍🏫 Sessione con il personal trainer
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <SessioneAperta sessione={aperta} onChiudi={() => setApertaId(null)} />
          )}
        </>
      )}

      {tab === 'storico' && <Carichi />}
      {tab === 'programma' && <ConfigProgrammaVista />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function SessioneAperta({ sessione, onChiudi }: { sessione: Sessione; onChiudi: () => void }) {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()

  if (sessione.tipo === 'PT') {
    return (
      <section className="sezione">
        <h2>{etichettaGiorno(sessione.date, oggi)}</h2>
        <div className="card">
          <b style={{ fontSize: 15 }}>🧑‍🏫 Sessione con il personal trainer</b>
          <p className="piccolo" style={{ marginTop: 8 }}>
            Non rompe l'alternanza: la prossima volta tocca comunque la scheda {prossimaScheda(state.allenamenti, sessione.id) }.
          </p>
          <textarea
            style={{ marginTop: 12 }}
            value={sessione.nota ?? ''}
            onChange={(e) => dispatch({ type: 'sessioneNota', id: sessione.id, nota: e.target.value })}
            placeholder="Cosa avete fatto, correzioni tecniche, cosa ti ha detto..."
          />
          <div className="riga" style={{ gap: 8, marginTop: 12 }}>
            <button className="btn crescita" onClick={onChiudi}>Chiudi</button>
            <button
              className="btn btn-pericolo crescita"
              onClick={() => { dispatch({ type: 'sessioneElimina', id: sessione.id }); onChiudi(); toast('Sessione eliminata') }}
            >
              Elimina
            </button>
          </div>
        </div>
      </section>
    )
  }

  const s = scheda(sessione.tipo)
  const fatti = sessione.esercizi.filter((e) => e.serie.some((v) => v.reps !== undefined || v.peso !== undefined)).length

  return (
    <section className="sezione">
      <div className="riga-spazio" style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Scheda {sessione.tipo} · settimana {sessione.settimana}</h2>
        <span className="micro">{fatti}/{sessione.esercizi.length}</span>
      </div>

      {s.esercizi.map((esercizio) => {
        const eseguito = sessione.esercizi.find((e) => e.esercizioId === esercizio.id)
        if (!eseguito) return null
        const p = prescrizione(esercizio, sessione.settimana)
        const precedente = ultimaVolta(state.allenamenti, esercizio.id, sessione.id)
        const suggerimento = suggerimentoCarico(
          esercizio,
          sessione.settimana,
          precedente ? { serie: precedente.eseguito.serie, settimana: precedente.sessione.settimana } : undefined,
        )
        return (
          <div key={esercizio.id} className="card" style={{ marginTop: 12 }}>
            <b style={{ fontSize: 15 }}>{esercizio.nome}</b>
            <div className="micro" style={{ marginTop: 3 }}>{descriviPrescrizione(p)}</div>
            {esercizio.tecnica && <p className="micro" style={{ marginTop: 6, fontStyle: 'italic' }}>{esercizio.tecnica}</p>}

            {precedente && (
              <div className="avviso pattern" style={{ marginTop: 10 }}>
                <b>Ultima volta · {formatCorto(precedente.sessione.date)} (sett. {precedente.sessione.settimana})</b>
                <p>
                  {precedente.eseguito.serie
                    .map((v, i) => `${i + 1}ª ${v.peso ?? '—'} kg × ${v.reps ?? '—'}`)
                    .join(' · ')}
                </p>
              </div>
            )}

            <div className={`avviso ${suggerimento.direzione === 'su' ? 'vittoria' : suggerimento.direzione === 'giu' ? 'attenzione' : 'consiglio'}`} style={{ marginTop: 10 }}>
              <b>
                {suggerimento.direzione === 'su' && '↑ Sali di carico'}
                {suggerimento.direzione === 'giu' && '↓ Scendi di carico'}
                {suggerimento.direzione === 'uguale' && '= Stesso carico'}
                {suggerimento.direzione === 'prima-volta' && 'Prima volta'}
                {suggerimento.peso !== undefined && ` · ${suggerimento.peso} kg`}
              </b>
              <p>{suggerimento.motivo}</p>
            </div>

            <div className="colonna" style={{ gap: 8, marginTop: 12 }}>
              {eseguito.serie.map((valore, i) => (
                <div key={i} className="riga" style={{ gap: 8 }}>
                  <span className="micro" style={{ width: 30 }}>{i + 1}ª</span>
                  <input
                    inputMode="decimal"
                    placeholder={suggerimento.peso !== undefined ? `${suggerimento.peso}` : 'kg'}
                    value={valore.peso ?? ''}
                    onChange={(e) => dispatch({
                      type: 'sessioneSerie',
                      id: sessione.id,
                      esercizioId: esercizio.id,
                      indice: i,
                      patch: { peso: e.target.value === '' ? undefined : Number(e.target.value.replace(',', '.')) },
                    })}
                    style={{ padding: '10px 12px' }}
                  />
                  <span className="micro">kg ×</span>
                  <input
                    inputMode="numeric"
                    placeholder={`${p.ripetizioni}`}
                    value={valore.reps ?? ''}
                    onChange={(e) => dispatch({
                      type: 'sessioneSerie',
                      id: sessione.id,
                      esercizioId: esercizio.id,
                      indice: i,
                      patch: { reps: e.target.value === '' ? undefined : Number(e.target.value.replace(/[^0-9]/g, '')) },
                    })}
                    style={{ padding: '10px 12px' }}
                  />
                  <span className="micro">rip.</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="card" style={{ marginTop: 12 }}>
        <label className="etichetta">Note della sessione</label>
        <textarea
          value={sessione.nota ?? ''}
          onChange={(e) => dispatch({ type: 'sessioneNota', id: sessione.id, nota: e.target.value })}
          placeholder="Come ti sentivi, dolori, cosa ha funzionato..."
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="colonna" style={{ marginTop: 12 }}>
        <button
          className={`btn btn-pieno ${sessione.completata ? '' : 'btn-primario'}`}
          onClick={() => {
            dispatch({ type: 'sessioneCompleta', id: sessione.id, completata: !sessione.completata })
            if (!sessione.completata) {
              // Chiudere l'allenamento spunta anche l'abitudine "palestra" di quel giorno.
              const abitudine = state.habits.find(
                (h) => !h.archived && (h.benefitKey === 'palestra' || h.category === 'movimento'),
              )
              if (abitudine && statusOn(indexLogs(state.logs), abitudine.id, sessione.date) !== 'done') {
                dispatch({ type: 'segnaGiorno', habitId: abitudine.id, date: sessione.date, status: 'done' })
              }
              toast('Allenamento chiuso. Volume registrato. 🔥')
            }
          }}
        >
          {sessione.completata ? '✓ Allenamento completato (tocca per riaprire)' : 'Chiudi allenamento'}
        </button>
        <button className="btn btn-pieno btn-fantasma" onClick={onChiudi}>Torna indietro</button>
        <button
          className="btn btn-pieno btn-pericolo"
          onClick={() => { dispatch({ type: 'sessioneElimina', id: sessione.id }); onChiudi(); toast('Sessione eliminata') }}
        >
          Elimina sessione
        </button>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

function Carichi() {
  const { state, oggi } = useStore()
  const sessioni = [...state.allenamenti].sort((a, b) => (a.date < b.date ? 1 : -1))

  if (sessioni.length === 0) {
    return (
      <Vuoto
        emoji="📈"
        titolo="Ancora nessun carico registrato"
        testo="Dopo il primo allenamento trovi qui i pesi che hai usato, esercizio per esercizio, e quanto sono saliti nel tempo."
      />
    )
  }

  return (
    <>
      <section className="sezione">
        <h2>Progressione dei carichi</h2>
        <div className="colonna" style={{ gap: 10 }}>
          {PROGRAMMA.schede.flatMap((s) => s.esercizi).map((esercizio) => {
            const storia = progressione(state.allenamenti, esercizio.id)
            if (storia.length === 0) return null
            const ultimo = storia[storia.length - 1]
            const primo = storia[0]
            const delta = ultimo.peso - primo.peso
            return (
              <div key={esercizio.id} className="card" style={{ marginTop: 0 }}>
                <div className="riga-spazio">
                  <b style={{ fontSize: 14 }}>{esercizio.nome}</b>
                  <span className="streak-pill">{ultimo.peso} kg</span>
                </div>
                <div className="micro" style={{ marginTop: 6 }}>
                  {storia.map((h) => `${h.peso}`).join(' → ')} kg
                  {storia.length > 1 && (delta > 0 ? ` · +${delta} kg dall'inizio` : delta < 0 ? ` · ${delta} kg` : ' · stabile')}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="sezione">
        <h2>Sessioni · {sessioni.length}</h2>
        <div className="colonna" style={{ gap: 10 }}>
          {sessioni.slice(0, 20).map((s) => (
            <div key={s.id} className="card" style={{ marginTop: 0 }}>
              <div className="riga-spazio">
                <b style={{ fontSize: 14 }}>
                  {s.tipo === 'PT' ? '🧑‍🏫 Personal trainer' : `Scheda ${s.tipo}`} · sett. {s.settimana}
                </b>
                <span className="micro">{etichettaGiorno(s.date, oggi)}</span>
              </div>
              {s.tipo !== 'PT' && (
                <div className="micro" style={{ marginTop: 4 }}>
                  volume {Math.round(volumeSessione(s)).toLocaleString('it-IT')} kg ·
                  {' '}{s.esercizi.filter((e) => pesoMassimo(e.serie) !== undefined).length}/{s.esercizi.length} esercizi
                  {s.completata ? ' · completato' : ''}
                </div>
              )}
              {s.nota && <p className="piccolo" style={{ marginTop: 6 }}>{s.nota}</p>}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

/* ------------------------------------------------------------------ */

function ConfigProgrammaVista() {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()
  const settimana = settimanaDi(state.programma, oggi)

  const toggleGiorno = (g: number) => {
    const attuali = state.programma.giorni
    const nuovi = attuali.includes(g) ? attuali.filter((x) => x !== g) : [...attuali, g].sort((a, b) => a - b)
    dispatch({ type: 'programma', patch: { giorni: nuovi } })
  }

  return (
    <>
      <section className="card">
        <b style={{ fontSize: 14 }}>{PROGRAMMA.nome}</b>
        <p className="micro" style={{ marginTop: 4 }}>{PROGRAMMA.autore} · {PROGRAMMA.contatto}</p>
        <div className="campo" style={{ marginTop: 14 }}>
          <label className="etichetta">In che settimana sei</label>
          <div className="chips">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`chip ${settimana === n ? 'attivo' : ''}`}
                onClick={() => {
                  dispatch({ type: 'programma', patch: { inizio: ancoraSettimana(n, oggi) } })
                  toast(`Allineato alla settimana ${n}`)
                }}
              >
                {n}
              </button>
            ))}
          </div>
          {programmaFinito(state.programma, oggi) && (
            <div className="micro" style={{ marginTop: 8 }}>
              Sei oltre la quinta settimana: il programma è concluso.
            </div>
          )}
        </div>

        <div className="campo">
          <label className="etichetta">Giorni in cui ti alleni</label>
          <div className="chips">
            {GIORNI.map((g, i) => (
              <button
                key={g}
                className={`chip ${state.programma.giorni.includes(i) ? 'attivo' : ''}`}
                onClick={() => toggleGiorno(i)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <label className="etichetta">Orario del promemoria</label>
          <input
            type="time"
            value={state.programma.orario}
            onChange={(e) => dispatch({ type: 'programma', patch: { orario: e.target.value || '18:30' } })}
          />
        </div>

        <button
          className="btn btn-primario btn-pieno"
          style={{ marginTop: 14 }}
          onClick={() => {
            scaricaFile(generaICSAllenamenti(state.programma, oggi), 'allenamenti.ics')
            toast('Calendario allenamenti scaricato')
          }}
        >
          📅 Aggiungi gli allenamenti al calendario
        </button>
        <p className="micro" style={{ marginTop: 8 }}>
          Un promemoria ricorrente nei giorni scelti, mezz'ora prima. La scheda del giorno la decide
          l'alternanza, quindi l'evento ti rimanda qui invece di indovinarla.
        </p>
      </section>

      <section className="sezione">
        <h2>Le regole di Jacopo</h2>
        <div className="card">
          <ul className="elenco-benefici">
            {PROGRAMMA.regole.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </section>

      {PROGRAMMA.schede.map((s) => (
        <section className="sezione" key={s.sigla}>
          <h2>Scheda {s.sigla} · {s.nome}</h2>
          <div className="card">
            {s.esercizi.map((e) => (
              <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <b style={{ fontSize: 14 }}>{e.nome}</b>
                <div className="micro" style={{ marginTop: 3 }}>
                  Settimana {Math.min(settimana, PROGRAMMA.settimane)}: {descriviPrescrizione(prescrizione(e, settimana))}
                </div>
                <div className="micro" style={{ marginTop: 2, opacity: .75 }}>
                  {e.settimane.map((p, i) => `S${i + 1}: ${p.serie}×${p.ripetizioni}`).join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
