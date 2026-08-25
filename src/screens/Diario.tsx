import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { analizzaSituazione, riepilogoSettimana } from '../domain/insights'
import { etichettaGiorno } from '../domain/dates'
import { useToast } from '../components/toast'

const UMORI = ['😖', '🙁', '😐', '🙂', '😄']

export default function Diario() {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()
  const [testo, setTesto] = useState('')
  const [umore, setUmore] = useState<number | undefined>()
  const [tab, setTab] = useState<'analisi' | 'voci'>('analisi')

  const analisi = useMemo(() => analizzaSituazione(state, oggi), [state, oggi])
  const settimana = useMemo(() => riepilogoSettimana(state, oggi), [state, oggi])

  const voci = useMemo(() => {
    const dalDiario = state.journal.map((j) => ({
      id: j.id,
      data: j.date,
      testo: j.text,
      mood: j.mood,
      origine: 'Diario',
      eliminabile: true,
    }))
    const dalleNote = state.logs
      .filter((l) => l.note && l.note.trim())
      .map((l) => ({
        id: l.id,
        data: l.date,
        testo: l.note as string,
        mood: l.mood,
        origine: state.habits.find((h) => h.id === l.habitId)?.name ?? 'Abitudine',
        eliminabile: false,
      }))
    return [...dalDiario, ...dalleNote].sort((a, b) => (a.data < b.data ? 1 : -1))
  }, [state])

  const salva = () => {
    const t = testo.trim()
    if (!t) return
    dispatch({ type: 'aggiungiDiario', entry: { date: oggi, text: t, mood: umore } })
    setTesto('')
    setUmore(undefined)
    toast('Scritto. Rileggerlo tra un mese vale oro.')
  }

  const sentimentEmoji = analisi.testo.sentiment > 0.12 ? '🙂' : analisi.testo.sentiment < -0.12 ? '😕' : '😐'

  return (
    <div className="schermata">
      <header className="intestazione">
        <div>
          <h1>Diario</h1>
          <div className="sottotitolo">Scrivi anche quando sbagli: sono le note più utili</div>
        </div>
      </header>

      <section className="card">
        <textarea
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Com'è andata oggi? Cosa ti ha aiutato, cosa ti ha fatto scivolare, cosa hai imparato..."
        />
        <div className="riga-spazio" style={{ marginTop: 10 }}>
          <div className="chips">
            {UMORI.map((e, i) => (
              <button
                key={e}
                className={`chip ${umore === i + 1 ? 'attivo' : ''}`}
                onClick={() => setUmore(umore === i + 1 ? undefined : i + 1)}
                style={{ fontSize: 18, padding: '5px 10px' }}
              >
                {e}
              </button>
            ))}
          </div>
          <button className="btn btn-primario" onClick={salva} disabled={!testo.trim()}>Salva</button>
        </div>
      </section>

      <div className="chips" style={{ margin: '18px 0 12px' }}>
        <button className={`chip ${tab === 'analisi' ? 'attivo' : ''}`} onClick={() => setTab('analisi')}>
          🔎 Analisi
        </button>
        <button className={`chip ${tab === 'voci' ? 'attivo' : ''}`} onClick={() => setTab('voci')}>
          📓 Tutte le voci ({voci.length})
        </button>
      </div>

      {tab === 'analisi' ? (
        <>
          <section className="card">
            <b style={{ fontSize: 14 }}>La tua situazione</b>
            <p className="piccolo" style={{ marginTop: 8 }}>{analisi.sintesi}</p>
            {analisi.testo.parole > 0 && (
              <div className="riga" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
                <span className="chip">{sentimentEmoji} Tono: {analisi.testo.etichettaSentiment}</span>
                <span className="chip">✍️ {analisi.testo.parole} parole analizzate</span>
              </div>
            )}
          </section>

          {analisi.testo.temi.length > 0 && (
            <section className="sezione">
              <h2>Temi ricorrenti nelle tue note</h2>
              <div className="chips">
                {analisi.testo.temi.map((t) => (
                  <span key={t.chiave} className="chip">{t.emoji} {t.etichetta} · {t.conteggio}</span>
                ))}
              </div>
            </section>
          )}

          <section className="sezione">
            <h2>Cosa vedo e cosa ti consiglio</h2>
            <div className="colonna" style={{ gap: 10 }}>
              {analisi.osservazioni.map((o, i) => (
                <div key={i} className={`avviso ${o.tipo}`}>
                  <b>{o.titolo}</b>
                  <p>{o.testo}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="sezione">
            <h2>Riepilogo degli ultimi 7 giorni</h2>
            <div className="card">
              {settimana.map((r, i) => (
                <div key={i} className={i === 0 ? 'piccolo' : ''} style={{ marginTop: i === 0 ? 0 : 6, fontSize: i === 0 ? 12 : 14 }}>
                  {i === 0 ? r.toUpperCase() : r}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="colonna" style={{ gap: 10 }}>
          {voci.length === 0 && <p className="piccolo centro" style={{ padding: 20 }}>Nessuna nota ancora. Inizia scrivendo due righe qui sopra.</p>}
          {voci.map((v) => (
            <div key={v.id} className="card" style={{ marginTop: 0 }}>
              <div className="riga-spazio">
                <b style={{ fontSize: 13 }}>{etichettaGiorno(v.data)}</b>
                <span className="micro">
                  {v.mood ? `${UMORI[v.mood - 1]} · ` : ''}{v.origine}
                </span>
              </div>
              <p className="piccolo" style={{ marginTop: 6, color: 'var(--testo)' }}>{v.testo}</p>
              {v.eliminabile && (
                <button
                  className="micro"
                  style={{ marginTop: 8, color: 'var(--errore)' }}
                  onClick={() => dispatch({ type: 'eliminaDiario', id: v.id })}
                >
                  Elimina
                </button>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
