import type { DayStatus, Habit, LogEntry } from './types'
import { addDays, daysBetween, rangeISO, startOfWeek, todayISO } from './dates'

export type LogIndex = Map<string, Map<string, LogEntry>>

/** Indice logs: habitId -> data -> voce. */
export function indexLogs(logs: LogEntry[]): LogIndex {
  const idx: LogIndex = new Map()
  for (const l of logs) {
    let m = idx.get(l.habitId)
    if (!m) { m = new Map(); idx.set(l.habitId, m) }
    const prev = m.get(l.date)
    // In caso di duplicati vince la voce più recente.
    if (!prev || prev.createdAt <= l.createdAt) m.set(l.date, l)
  }
  return idx
}

export function statusOn(idx: LogIndex, habitId: string, date: string): DayStatus | undefined {
  return idx.get(habitId)?.get(date)?.status
}

export function entryOn(idx: LogIndex, habitId: string, date: string): LogEntry | undefined {
  return idx.get(habitId)?.get(date)
}

export interface HabitStats {
  /** Streak corrente: giorni (quit/daily) o settimane consecutive a target (weekly). */
  streak: number
  streakUnit: 'giorni' | 'settimane'
  /** Record personale nella stessa unità dello streak. */
  best: number
  /** Giorni totali tracciati dall'inizio (compreso oggi). */
  daysTracked: number
  /** Numero di giorni/sessioni completate. */
  completed: number
  /** Numero di ricadute registrate. */
  relapses: number
  lastRelapse?: string
  /** Percentuale 0-100 di aderenza. */
  aderenza: number
  /** Per weekly: sessioni fatte nella settimana corrente. */
  weekDone: number
  weekTarget: number
  /** Giorni "puliti" per le abitudini di tipo quit. */
  cleanDays: number
  /** Vero se oggi risulta già completata (o, per quit, non ci sono ricadute oggi). */
  doneToday: boolean
  /** Giorni totali in cui il progresso "conta" per benefici e premi. */
  progressDays: number
  /** Solo weekly: settimane chiuse raggiungendo l'obiettivo. */
  weeksOk: number
  /** Numero di note scritte su questa abitudine. */
  note: number
}

function contaNote(idx: LogIndex, habitId: string): number {
  let n = 0
  const perDay = idx.get(habitId)
  if (!perDay) return 0
  for (const entry of perDay.values()) if (entry.note && entry.note.trim().length > 0) n++
  return n
}

function daysElapsed(startDate: string, today: string): number {
  return Math.max(0, daysBetween(startDate, today)) + 1
}

function statsQuit(habit: Habit, idx: LogIndex, today: string): HabitStats {
  const perDay = idx.get(habit.id)
  const relapses: string[] = []
  if (perDay) {
    for (const [date, entry] of perDay) {
      if (entry.status === 'relapse' && daysBetween(date, today) >= 0) relapses.push(date)
    }
  }
  relapses.sort()
  const last = relapses[relapses.length - 1]
  // Il giorno della ricaduta azzera il contatore: da lì si ricomincia da zero.
  const from = last ?? habit.startDate
  const cleanDays = Math.max(0, daysBetween(from, today))

  // Record personale: il segmento più lungo tra inizio, ricadute e oggi.
  let best = 0
  let segStart = habit.startDate
  for (const r of relapses) {
    best = Math.max(best, Math.max(0, daysBetween(segStart, r)))
    segStart = r
  }
  best = Math.max(best, cleanDays)

  const totalDays = daysElapsed(habit.startDate, today)
  const aderenza = totalDays > 0
    ? Math.round(((totalDays - relapses.length) / totalDays) * 100)
    : 100

  return {
    streak: cleanDays,
    streakUnit: 'giorni',
    best,
    daysTracked: totalDays,
    completed: cleanDays,
    relapses: relapses.length,
    lastRelapse: last,
    aderenza: Math.max(0, Math.min(100, aderenza)),
    weekDone: 0,
    weekTarget: 0,
    cleanDays,
    doneToday: statusOn(idx, habit.id, today) !== 'relapse',
    progressDays: cleanDays,
    weeksOk: 0,
    note: contaNote(idx, habit.id),
  }
}

function statsDaily(habit: Habit, idx: LogIndex, today: string): HabitStats {
  const totalDays = daysElapsed(habit.startDate, today)
  const days = rangeISO(habit.startDate, today)
  let completed = 0
  let relapses = 0
  let best = 0
  let run = 0
  for (const d of days) {
    const s = statusOn(idx, habit.id, d)
    if (s === 'done') {
      completed++
      run++
      best = Math.max(best, run)
    } else {
      if (s === 'missed' || s === 'relapse') relapses++
      // Oggi ancora "in bianco" non spezza il record storico.
      if (!(d === today && s === undefined)) run = 0
    }
  }

  // Streak corrente: si parte da oggi, ma oggi non ancora segnato non spezza nulla.
  let streak = 0
  let cursor = today
  if (statusOn(idx, habit.id, today) !== 'done') cursor = addDays(today, -1)
  while (daysBetween(habit.startDate, cursor) >= 0 && statusOn(idx, habit.id, cursor) === 'done') {
    streak++
    cursor = addDays(cursor, -1)
  }

  return {
    streak,
    streakUnit: 'giorni',
    best: Math.max(best, streak),
    daysTracked: totalDays,
    completed,
    relapses,
    aderenza: totalDays > 0 ? Math.round((completed / totalDays) * 100) : 0,
    weekDone: 0,
    weekTarget: 0,
    cleanDays: 0,
    doneToday: statusOn(idx, habit.id, today) === 'done',
    progressDays: completed,
    weeksOk: 0,
    note: contaNote(idx, habit.id),
  }
}

function statsWeekly(habit: Habit, idx: LogIndex, today: string, mondayFirst: boolean): HabitStats {
  const target = Math.max(1, habit.weeklyTarget ?? 3)
  const firstWeek = startOfWeek(habit.startDate, mondayFirst)
  const thisWeek = startOfWeek(today, mondayFirst)
  const weeks: { start: string; count: number }[] = []
  for (let w = firstWeek; daysBetween(w, thisWeek) >= 0; w = addDays(w, 7)) {
    let count = 0
    for (const d of rangeISO(w, addDays(w, 6))) {
      if (daysBetween(d, today) < 0) continue
      if (statusOn(idx, habit.id, d) === 'done') count++
    }
    weeks.push({ start: w, count })
  }

  let best = 0
  let run = 0
  for (const wk of weeks) {
    if (wk.count >= target) { run++; best = Math.max(best, run) } else if (wk.start !== thisWeek) run = 0
  }

  // Streak: settimane consecutive a target andando a ritroso.
  let streak = 0
  for (let i = weeks.length - 1; i >= 0; i--) {
    const wk = weeks[i]
    if (wk.count >= target) streak++
    else if (wk.start === thisWeek) continue // la settimana in corso non è ancora persa
    else break
  }

  const completed = weeks.reduce((a, w) => a + w.count, 0)
  const settimaneOk = weeks.filter((w) => w.count >= target).length
  const settimaneChiuse = weeks.filter((w) => w.start !== thisWeek).length
  const aderenza = settimaneChiuse > 0
    ? Math.round((weeks.filter((w) => w.start !== thisWeek && w.count >= target).length / settimaneChiuse) * 100)
    : Math.round(Math.min(100, (weeks[weeks.length - 1]?.count ?? 0) / target * 100))

  return {
    streak,
    streakUnit: 'settimane',
    best: Math.max(best, streak, settimaneOk > 0 ? best : 0),
    daysTracked: daysElapsed(habit.startDate, today),
    completed,
    relapses: 0,
    aderenza,
    weekDone: weeks[weeks.length - 1]?.count ?? 0,
    weekTarget: target,
    cleanDays: 0,
    doneToday: statusOn(idx, habit.id, today) === 'done',
    progressDays: completed,
    weeksOk: settimaneOk,
    note: contaNote(idx, habit.id),
  }
}

export function habitStats(
  habit: Habit,
  idx: LogIndex,
  today: string = todayISO(),
  mondayFirst = true,
): HabitStats {
  switch (habit.kind) {
    case 'quit': return statsQuit(habit, idx, today)
    case 'weekly': return statsWeekly(habit, idx, today, mondayFirst)
    default: return statsDaily(habit, idx, today)
  }
}

/** Le abitudini attive di oggi, con il loro stato. */
export function abitudiniDiOggi(habits: Habit[]): Habit[] {
  return habits.filter((h) => !h.archived)
}

export function nuovaId(prefix = 'id'): string {
  const rnd = Math.random().toString(36).slice(2, 9)
  return `${prefix}_${Date.now().toString(36)}_${rnd}`
}
