import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Anello di progresso con il livello al centro. */
export function AnelloLivello({ livello, percentuale }: { livello: number; percentuale: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(1, percentuale))
  return (
    <div className="anello" aria-label={`Livello ${livello}`}>
      <svg width="82" height="82" viewBox="0 0 82 82">
        <defs>
          <linearGradient id="gradAnello" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7c5cff" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <circle cx="41" cy="41" r={r} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="7" />
        <circle
          cx="41" cy="41" r={r} fill="none"
          stroke="url(#gradAnello)" strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - p)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,.9,.3,1)' }}
        />
      </svg>
      <div className="anello-testo">
        <div>
          <b>{livello}</b>
          <span style={{ display: 'block' }}>livello</span>
        </div>
      </div>
    </div>
  )
}

export function Barra({ percentuale }: { percentuale: number }) {
  return (
    <div className="barra">
      <i style={{ width: `${Math.max(0, Math.min(1, percentuale)) * 100}%` }} />
    </div>
  )
}

export function Sheet({ children, onChiudi }: { children: ReactNode; onChiudi: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onChiudi() }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  }, [onChiudi])

  return (
    <div className="velo" onClick={onChiudi} role="dialog" aria-modal="true">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="maniglia" />
        {children}
      </div>
    </div>
  )
}

export function Vuoto({ emoji, titolo, testo, azione }: { emoji: string; titolo: string; testo: string; azione?: ReactNode }) {
  return (
    <div className="vuoto">
      <div className="grande">{emoji}</div>
      <h3 style={{ marginBottom: 6 }}>{titolo}</h3>
      <p className="piccolo" style={{ marginBottom: 16 }}>{testo}</p>
      {azione}
    </div>
  )
}

/** Toast temporaneo in fondo allo schermo. */
export function Toast({ testo, onFine }: { testo: string; onFine: () => void }) {
  useEffect(() => {
    const t = setTimeout(onFine, 2600)
    return () => clearTimeout(t)
  }, [testo, onFine])
  return <div className="toast">{testo}</div>
}

const COLORI_CORIANDOLI = ['#7c5cff', '#22d3ee', '#34d399', '#f2c14e', '#fb7185', '#f472b6']

export function Coriandoli({ attivi }: { attivi: boolean }) {
  const [pezzi, setPezzi] = useState<{ id: number; left: number; delay: number; dur: number; colore: string }[]>([])
  useEffect(() => {
    if (!attivi) { setPezzi([]); return }
    const nuovi = Array.from({ length: 44 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 1.9 + Math.random() * 1.4,
      colore: COLORI_CORIANDOLI[i % COLORI_CORIANDOLI.length],
    }))
    setPezzi(nuovi)
    const t = setTimeout(() => setPezzi([]), 3800)
    return () => clearTimeout(t)
  }, [attivi])

  return (
    <>
      {pezzi.map((p) => (
        <span
          key={p.id}
          className="coriandolo"
          style={{
            left: `${p.left}%`,
            background: p.colore,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            borderRadius: p.id % 3 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </>
  )
}

/** Overlay di celebrazione per level up e premi. */
export function Celebrazione({
  emoji, titolo, testo, sottotesto, onChiudi,
}: { emoji: string; titolo: string; testo: string; sottotesto?: string; onChiudi: () => void }) {
  return (
    <>
      <Coriandoli attivi />
      <div className="celebrazione" onClick={onChiudi}>
        <div className="contenuto">
          <div className="medaglione">{emoji}</div>
          <h2 style={{ fontSize: 26, marginTop: 14 }}>{titolo}</h2>
          <p style={{ marginTop: 10, color: 'var(--testo-2)' }}>{testo}</p>
          {sottotesto && (
            <div className="card" style={{ marginTop: 16, textAlign: 'left' }}>
              <div className="micro" style={{ marginBottom: 4 }}>IL TUO PREMIO</div>
              <div style={{ fontSize: 14.5 }}>{sottotesto}</div>
            </div>
          )}
          <button className="btn btn-primario" style={{ marginTop: 20 }} onClick={onChiudi}>
            Continua
          </button>
        </div>
      </div>
    </>
  )
}

/** Barra a strisce degli ultimi N giorni. */
export function Strisce({ giorni }: { giorni: { data: string; stato?: 'ok' | 'ko'; oggi?: boolean }[] }) {
  return (
    <div className="strisce">
      {giorni.map((g) => (
        <i
          key={g.data}
          className={[g.stato ?? '', g.oggi ? 'oggi' : ''].join(' ').trim()}
          title={g.data}
        />
      ))}
    </div>
  )
}

/** Piccolo hook per capire quando un valore cresce (es. livello). */
export function usaAumento(valore: number): boolean {
  const prec = useRef(valore)
  const [aumentato, setAumentato] = useState(false)
  useEffect(() => {
    if (valore > prec.current) {
      setAumentato(true)
      const t = setTimeout(() => setAumentato(false), 100)
      return () => clearTimeout(t)
    }
    prec.current = valore
  }, [valore])
  return aumentato
}
