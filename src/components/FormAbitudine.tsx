import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import type { Habit, HabitCategory, HabitKind } from '../domain/types'
import { trovaProfilo } from '../domain/benefits'
import { todayISO } from '../domain/dates'
import { Sheet } from './ui'
import { useToast } from './toast'

const COLORI = ['#7c5cff', '#22d3ee', '#34d399', '#f2c14e', '#fb7185', '#f472b6', '#60a5fa', '#fb923c']
const ICONE = ['🎯', '🚭', '🏋️', '🥗', '📚', '🧘', '😴', '💧', '🏃', '✍️', '🧊', '📵', '🧹', '❤️', '🎸', '💰', '🧠', '☀️']

const CATEGORIE: { id: HabitCategory; label: string }[] = [
  { id: 'movimento', label: 'Movimento' },
  { id: 'alimentazione', label: 'Alimentazione' },
  { id: 'mente', label: 'Mente' },
  { id: 'sonno', label: 'Sonno' },
  { id: 'studio', label: 'Studio' },
  { id: 'sostanze', label: 'Smettere' },
  { id: 'digitale', label: 'Digitale' },
  { id: 'relazioni', label: 'Relazioni' },
  { id: 'altro', label: 'Altro' },
]

const TIPI: { id: HabitKind; label: string; desc: string }[] = [
  { id: 'daily', label: 'Ogni giorno', desc: 'La spunti tutti i giorni (alimentazione sana, lettura...)' },
  { id: 'weekly', label: 'N volte a settimana', desc: 'Hai un obiettivo settimanale (palestra 4 volte...)' },
  { id: 'quit', label: 'Smettere', desc: 'Conto i giorni senza ricadute (fumo, alcol, social...)' },
]

const SUGGERIMENTI = [
  'Smettere di fumare', 'Palestra', 'Alimentazione sana', 'Leggere', 'Meditare',
  'Bere 2 litri d\'acqua', 'Dormire 8 ore', 'Meno social', 'Correre', 'Studiare inglese',
]

interface Props {
  onChiudi: () => void
  /** Se presente, il form modifica l'abitudine invece di crearla. */
  esistente?: Habit
}

export default function FormAbitudine({ onChiudi, esistente }: Props) {
  const { state, dispatch } = useStore()
  const toast = useToast()
  const [nome, setNome] = useState(esistente?.name ?? '')
  const [tipo, setTipo] = useState<HabitKind | null>(esistente?.kind ?? null)
  const [categoria, setCategoria] = useState<HabitCategory | null>(esistente?.category ?? null)
  const [target, setTarget] = useState(esistente?.weeklyTarget ?? 4)
  const [inizio, setInizio] = useState(esistente?.startDate ?? todayISO())
  const [icona, setIcona] = useState(esistente?.icon ?? '')
  // Ogni nuova abitudine prende un colore diverso, per distinguerle a colpo d'occhio.
  const [colore, setColore] = useState(esistente?.color ?? COLORI[state.habits.length % COLORI.length])
  const [perche, setPerche] = useState(esistente?.why ?? '')

  // Riconoscimento automatico dell'abitudine dal nome.
  const profilo = useMemo(() => (nome.trim().length >= 3 ? trovaProfilo(nome) : undefined), [nome])

  const tipoFinale: HabitKind = tipo ?? profilo?.kindHint ?? 'daily'
  const categoriaFinale: HabitCategory = categoria ?? profilo?.category ?? 'altro'
  const iconaFinale = icona || profilo?.emoji || '🎯'

  const salva = () => {
    const pulito = nome.trim()
    if (!pulito) return
    const dati = {
      name: pulito,
      kind: tipoFinale,
      category: categoriaFinale,
      color: colore,
      icon: iconaFinale,
      startDate: inizio,
      weeklyTarget: tipoFinale === 'weekly' ? target : undefined,
      why: perche.trim() || undefined,
      benefitKey: profilo?.key,
    }
    if (esistente) {
      dispatch({ type: 'modificaAbitudine', id: esistente.id, patch: dati })
      toast('Abitudine aggiornata')
    } else {
      dispatch({ type: 'aggiungiAbitudine', habit: dati })
      toast(`"${pulito}" aggiunta. Si parte. 🚀`)
    }
    onChiudi()
  }

  return (
    <Sheet onChiudi={onChiudi}>
      <h2 style={{ fontSize: 21, marginBottom: 4 }}>
        {esistente ? 'Modifica abitudine' : 'Nuova abitudine'}
      </h2>
      <p className="piccolo">Scrivi cosa vuoi fare o smettere di fare: riconosco l'abitudine e preparo la scheda dei benefici.</p>

      <div className="campo" style={{ marginTop: 16 }}>
        <label className="etichetta">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Es. Smettere di fumare, Palestra, Leggere..."
          autoFocus={!esistente}
        />
        {!esistente && (
          <div className="chips" style={{ marginTop: 10 }}>
            {SUGGERIMENTI.map((s) => (
              <button key={s} className="chip" onClick={() => setNome(s)}>{s}</button>
            ))}
          </div>
        )}
      </div>

      {profilo && (
        <div className="avviso consiglio" style={{ marginTop: 14 }}>
          <b>{profilo.emoji} Riconosciuta: {profilo.label}</b>
          <p>{profilo.sintesi}</p>
        </div>
      )}

      <div className="campo">
        <label className="etichetta">Come la traccio</label>
        <div className="colonna" style={{ gap: 8 }}>
          {TIPI.map((t) => (
            <button
              key={t.id}
              className={`card ${tipoFinale === t.id ? '' : ''}`}
              onClick={() => setTipo(t.id)}
              style={{
                textAlign: 'left',
                borderColor: tipoFinale === t.id ? 'var(--accent)' : 'var(--border)',
                background: tipoFinale === t.id ? 'rgba(124,92,255,.14)' : 'var(--surface)',
                padding: 12,
                marginTop: 0,
              }}
            >
              <b style={{ fontSize: 14.5 }}>{t.label}</b>
              <div className="micro" style={{ marginTop: 2 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {tipoFinale === 'weekly' && (
        <div className="campo">
          <label className="etichetta">Quante volte a settimana</label>
          <div className="chips">
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <button key={n} className={`chip ${target === n ? 'attivo' : ''}`} onClick={() => setTarget(n)}>
                {n}x
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="campo">
        <label className="etichetta">
          {tipoFinale === 'quit' ? 'Da quando hai smesso' : 'Da quando la traccio'}
        </label>
        <input type="date" value={inizio} max={todayISO()} onChange={(e) => setInizio(e.target.value || todayISO())} />
        {tipoFinale === 'quit' && (
          <div className="micro" style={{ marginTop: 6 }}>
            Puoi mettere una data passata: conterò tutti i giorni da lì a oggi.
          </div>
        )}
      </div>

      <div className="campo">
        <label className="etichetta">Categoria</label>
        <div className="chips">
          {CATEGORIE.map((c) => (
            <button
              key={c.id}
              className={`chip ${categoriaFinale === c.id ? 'attivo' : ''}`}
              onClick={() => setCategoria(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <label className="etichetta">Icona</label>
        <div className="chips">
          {ICONE.map((e) => (
            <button
              key={e}
              className={`chip ${iconaFinale === e ? 'attivo' : ''}`}
              onClick={() => setIcona(e)}
              style={{ fontSize: 19 }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="campo">
        <label className="etichetta">Colore</label>
        <div className="chips">
          {COLORI.map((c) => (
            <button
              key={c}
              onClick={() => setColore(c)}
              aria-label={`Colore ${c}`}
              style={{
                width: 34, height: 34, borderRadius: '50%', background: c,
                border: colore === c ? '3px solid #fff' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>
      </div>

      <div className="campo">
        <label className="etichetta">Perché lo stai facendo (lo rileggerai nei giorni difficili)</label>
        <textarea
          value={perche}
          onChange={(e) => setPerche(e.target.value)}
          placeholder="Es. Voglio arrivare a 60 anni potendo giocare con i miei figli senza fiatone."
          style={{ minHeight: 70 }}
        />
      </div>

      <div className="colonna" style={{ marginTop: 20 }}>
        <button className="btn btn-primario btn-pieno" onClick={salva} disabled={!nome.trim()}>
          {esistente ? 'Salva modifiche' : 'Crea abitudine'}
        </button>
        <button className="btn btn-pieno btn-fantasma" onClick={onChiudi}>Annulla</button>
      </div>
    </Sheet>
  )
}
