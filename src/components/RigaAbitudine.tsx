import type { Habit } from '../domain/types'
import type { HabitStats } from '../domain/habits'
import { naviga } from '../App'

interface Props {
  habit: Habit
  stats: HabitStats
  /** Stato registrato oggi. */
  stato?: 'done' | 'missed' | 'relapse'
  onCheck: () => void
  onApri: () => void
  onDettaglio?: () => void
}

function sottotitolo(habit: Habit, s: HabitStats): string {
  if (habit.kind === 'quit') {
    return s.cleanDays === 0
      ? 'Si riparte da oggi. Giorno 1.'
      : `${s.cleanDays} ${s.cleanDays === 1 ? 'giorno' : 'giorni'} senza ricadute`
  }
  if (habit.kind === 'weekly') {
    const mancano = Math.max(0, s.weekTarget - s.weekDone)
    return mancano === 0
      ? `Obiettivo settimanale raggiunto (${s.weekDone}/${s.weekTarget})`
      : `${s.weekDone}/${s.weekTarget} questa settimana · ne mancano ${mancano}`
  }
  return s.streak > 0
    ? `${s.streak} ${s.streak === 1 ? 'giorno' : 'giorni'} di fila · ${s.aderenza}% di aderenza`
    : 'Nessuna serie in corso: oggi si riparte'
}

export default function RigaAbitudine({ habit, stats, stato, onCheck, onApri, onDettaglio }: Props) {
  const fatta = habit.kind === 'quit' ? stato !== 'relapse' && stats.cleanDays > 0 : stato === 'done'
  const persa = stato === 'missed' || stato === 'relapse'

  return (
    <div
      className={`abitudine ${stato === 'done' ? 'fatta' : ''} ${persa ? 'persa' : ''}`}
      style={{ ['--c' as string]: habit.color }}
    >
      <button
        className="emoji-tonda"
        style={{ ['--c' as string]: habit.color }}
        onClick={() => (onDettaglio ? onDettaglio() : naviga(`abitudini/${habit.id}`))}
        aria-label={`Apri ${habit.name}`}
      >
        {habit.icon}
      </button>

      <button
        className="crescita"
        style={{ textAlign: 'left' }}
        onClick={() => (onDettaglio ? onDettaglio() : naviga(`abitudini/${habit.id}`))}
      >
        <div className="nome-abitudine tronca">{habit.name}</div>
        <div className="micro" style={{ marginTop: 2 }}>{sottotitolo(habit, stats)}</div>
      </button>

      <div className="riga" style={{ gap: 6 }}>
        <button className="icona-btn" onClick={onApri} aria-label="Aggiungi nota" title="Nota, umore, correzioni">
          📝
        </button>
        <button
          className={`check ${fatta && habit.kind !== 'quit' ? 'on' : ''}`}
          onClick={onCheck}
          aria-label={habit.kind === 'quit' ? 'Registra ricaduta o giornata pulita' : 'Segna come fatto'}
        >
          {habit.kind === 'quit'
            ? (persa ? '⚠️' : '🛡️')
            : (stato === 'done' ? '✓' : stato === 'missed' ? '✕' : '')}
        </button>
      </div>
    </div>
  )
}
