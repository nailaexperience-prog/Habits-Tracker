import { useState } from 'react'
import type { RiepilogoDieta } from '../domain/dietaLog'
import { formatCorto, parseISO } from '../domain/dates'

const ALTEZZA = 150
const PAD_ALTO = 14
const PAD_BASSO = 22

/**
 * Barre giornaliere delle calorie registrate, con linea di riferimento sul
 * valore previsto dal piano. Serie unica: un solo colore, nessuna legenda.
 */
export default function GraficoCalorie({
  giorni,
  riferimento,
  oggi,
}: {
  giorni: RiepilogoDieta[]
  riferimento: number
  oggi: string
}) {
  const [selezionato, setSelezionato] = useState<string | null>(null)

  const larghezza = 340
  const n = Math.max(1, giorni.length)
  const passo = larghezza / n
  const spessore = Math.max(6, passo - 4) // 4px di respiro fra le barre
  const massimo = Math.max(riferimento, ...giorni.map((g) => g.kcal), 1) * 1.18
  const y = (v: number) => PAD_ALTO + (ALTEZZA - PAD_ALTO - PAD_BASSO) * (1 - v / massimo)

  const dettaglio = giorni.find((g) => g.date === selezionato)

  return (
    <div>
      <svg
        viewBox={`0 0 ${larghezza} ${ALTEZZA}`}
        width="100%"
        height={ALTEZZA}
        role="img"
        aria-label="Calorie registrate negli ultimi giorni"
      >
        {/* Griglia discreta */}
        {[0.5, 1].map((f) => (
          <line
            key={f}
            x1={0} x2={larghezza}
            y1={y(massimo * f * 0.85)} y2={y(massimo * f * 0.85)}
            stroke="rgba(255,255,255,.07)" strokeWidth="1"
          />
        ))}

        {/* Riferimento: calorie previste dal piano */}
        {riferimento > 0 && (
          <line
            x1={0} x2={larghezza} y1={y(riferimento)} y2={y(riferimento)}
            stroke="var(--attenzione)" strokeWidth="1.5" strokeDasharray="5 4" opacity=".75"
          />
        )}

        {giorni.map((g, i) => {
          const x = i * passo + (passo - spessore) / 2
          const altezza = Math.max(g.kcal > 0 ? 3 : 0, ALTEZZA - PAD_BASSO - y(g.kcal))
          const attivo = g.date === selezionato
          return (
            <g key={g.date} onClick={() => setSelezionato(attivo ? null : g.date)} style={{ cursor: 'pointer' }}>
              {/* Area di tocco generosa */}
              <rect x={i * passo} y={0} width={passo} height={ALTEZZA} fill="transparent" />
              <rect
                x={x}
                y={ALTEZZA - PAD_BASSO - altezza}
                width={spessore}
                height={altezza}
                rx="4"
                fill={g.kcal > 0 ? 'var(--grafico)' : 'rgba(255,255,255,.10)'}
                opacity={attivo || !selezionato ? 1 : 0.45}
                stroke={attivo ? '#fff' : 'none'}
                strokeWidth={attivo ? 1.5 : 0}
              />
              {g.date === oggi && (
                <circle cx={x + spessore / 2} cy={ALTEZZA - PAD_BASSO + 8} r="2.5" fill="var(--accent-2)" />
              )}
            </g>
          )
        })}

        {/* Base */}
        <line
          x1={0} x2={larghezza} y1={ALTEZZA - PAD_BASSO} y2={ALTEZZA - PAD_BASSO}
          stroke="rgba(255,255,255,.16)" strokeWidth="1"
        />

        {/* Etichette: solo primo e ultimo giorno */}
        {[0, giorni.length - 1].filter((i) => i >= 0 && giorni[i]).map((i) => (
          <text
            key={i}
            x={Math.min(larghezza - 24, Math.max(14, i * passo + spessore / 2))}
            y={ALTEZZA - 6}
            textAnchor="middle"
            fontSize="9"
            fill="var(--testo-3)"
          >
            {formatCorto(giorni[i].date)}
          </text>
        ))}
      </svg>

      <div className="micro" style={{ marginTop: 4 }}>
        {dettaglio ? (
          <>
            <b style={{ color: 'var(--testo)' }}>{formatCorto(dettaglio.date)}</b>
            {' · '}{dettaglio.kcal} kcal registrate su {dettaglio.kcalPiano} previste
            {' · '}aderenza {dettaglio.aderenza}%
          </>
        ) : (
          <>Tocca una barra per i dettagli · la linea tratteggiata sono le kcal previste dal piano ({riferimento})</>
        )}
      </div>
    </div>
  )
}

/** Etichetta breve del giorno della settimana, usata nelle liste. */
export function giornoBreve(dateISO: string): string {
  return ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'][parseISO(dateISO).getDay()]
}
