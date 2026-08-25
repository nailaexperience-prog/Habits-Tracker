import { useMemo, useState } from 'react'
import { useStore } from '../state/store'
import { TIER_COLORI, valutaPremi, type StatoPremio } from '../domain/rewards'
import { calcolaProgresso } from '../domain/xp'
import { AnelloLivello, Barra, Sheet } from '../components/ui'

export default function Premi() {
  const { state, oggi } = useStore()
  const [aperto, setAperto] = useState<StatoPremio | null>(null)

  const premi = useMemo(() => valutaPremi(state, oggi), [state, oggi])
  const progresso = useMemo(() => calcolaProgresso(state, oggi), [state, oggi])
  const sbloccati = premi.filter((p) => p.sbloccato)
  const bloccati = premi.filter((p) => !p.sbloccato).sort((a, b) => b.progresso - a.progresso)

  return (
    <div className="schermata">
      <header className="intestazione">
        <div>
          <h1>Premi</h1>
          <div className="sottotitolo">{sbloccati.length} di {premi.length} sbloccati</div>
        </div>
      </header>

      <section className="livello-card">
        <div className="riga">
          <AnelloLivello livello={progresso.livello} percentuale={progresso.percentuale} />
          <div className="crescita">
            <div style={{ fontSize: 18, fontWeight: 800 }}>{progresso.titolo}</div>
            <div className="piccolo" style={{ marginBottom: 8 }}>
              {progresso.xpNelLivello} / {progresso.xpAlProssimo} XP verso il livello {progresso.livello + 1}
            </div>
            <Barra percentuale={progresso.percentuale} />
          </div>
        </div>
        {progresso.dettaglio.length > 0 && (
          <div className="chips" style={{ marginTop: 14 }}>
            {progresso.dettaglio.slice(0, 5).map((d) => (
              <span key={d.etichetta} className="chip">{d.etichetta}: {d.xp} XP</span>
            ))}
          </div>
        )}
      </section>

      {sbloccati.length > 0 && (
        <section className="sezione">
          <h2>Conquistati</h2>
          <div className="griglia-premi">
            {sbloccati.map((p) => <Card key={p.premio.id} p={p} onApri={() => setAperto(p)} />)}
          </div>
        </section>
      )}

      <section className="sezione">
        <h2>Da conquistare</h2>
        <div className="griglia-premi">
          {bloccati.map((p) => <Card key={p.premio.id} p={p} onApri={() => setAperto(p)} />)}
        </div>
      </section>

      {aperto && (
        <Sheet onChiudi={() => setAperto(null)}>
          <div className="centro" style={{ padding: '8px 0 4px' }}>
            <div style={{ fontSize: 62, filter: aperto.sbloccato ? 'none' : 'grayscale(1) opacity(.5)' }}>
              {aperto.premio.emoji}
            </div>
            <h2 style={{ marginTop: 8 }}>{aperto.premio.nome}</h2>
            <div
              className="chip"
              style={{ marginTop: 8, borderColor: TIER_COLORI[aperto.premio.tier], color: TIER_COLORI[aperto.premio.tier] }}
            >
              {aperto.premio.tier}
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="micro">COME SI OTTIENE</div>
            <p style={{ marginTop: 4, fontSize: 14.5 }}>{aperto.premio.condizione}</p>
            {!aperto.sbloccato && (
              <>
                <div className="mini-barra" style={{ ['--t' as string]: TIER_COLORI[aperto.premio.tier], marginTop: 12 }}>
                  <i style={{ width: `${Math.round(aperto.progresso * 100)}%` }} />
                </div>
                <div className="micro" style={{ marginTop: 6 }}>{Math.round(aperto.progresso * 100)}% completato</div>
              </>
            )}
          </div>

          {aperto.sbloccato && (
            <>
              <div className="avviso vittoria" style={{ marginTop: 12 }}>
                <b>Sbloccato ✓</b>
                <p>{aperto.premio.messaggio}</p>
              </div>
              <div className="card" style={{ marginTop: 12 }}>
                <div className="micro">IL PREMIO CHE TI ASSEGNO</div>
                <p style={{ marginTop: 6, fontSize: 15 }}>🎁 {aperto.premioReale}</p>
                <p className="micro" style={{ marginTop: 8 }}>
                  Te lo sei guadagnato: riscuotilo davvero, serve a chiudere il cerchio tra fatica e ricompensa.
                </p>
              </div>
            </>
          )}

          <button className="btn btn-pieno" style={{ marginTop: 18 }} onClick={() => setAperto(null)}>Chiudi</button>
        </Sheet>
      )}
    </div>
  )
}

function Card({ p, onApri }: { p: StatoPremio; onApri: () => void }) {
  return (
    <button
      className={`premio ${p.sbloccato ? 'sbloccato' : 'bloccato'}`}
      style={{ ['--t' as string]: TIER_COLORI[p.premio.tier] }}
      onClick={onApri}
    >
      <div className="medaglia">{p.sbloccato ? p.premio.emoji : '🔒'}</div>
      <b>{p.premio.nome}</b>
      <div className="cond">{p.premio.condizione}</div>
      {!p.sbloccato && (
        <div className="mini-barra">
          <i style={{ width: `${Math.round(p.progresso * 100)}%` }} />
        </div>
      )}
    </button>
  )
}
