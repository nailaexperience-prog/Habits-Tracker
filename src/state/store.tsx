import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type {
  AppState, ConsumoSlot, DayStatus, DietaGiorno, ExtraAlimento, Habit, JournalEntry, LogEntry,
} from '../domain/types'
import { nuovaId } from '../domain/habits'
import { todayISO } from '../domain/dates'
import { nuoviPremi } from '../domain/rewards'

const CHIAVE = 'habits-tracker:v1'

export const statoIniziale: AppState = {
  version: 1,
  profile: { name: '', createdAt: Date.now(), xp: 0, lastSeenLevel: 1 },
  habits: [],
  logs: [],
  journal: [],
  rewards: [],
  dieta: [],
  settings: { reduceMotion: false, weekStartsMonday: true, promemoriaPasti: false },
}

export type Azione =
  | { type: 'aggiungiAbitudine'; habit: Omit<Habit, 'id' | 'createdAt'> }
  | { type: 'modificaAbitudine'; id: string; patch: Partial<Habit> }
  | { type: 'eliminaAbitudine'; id: string }
  | { type: 'segnaGiorno'; habitId: string; date: string; status?: DayStatus; note?: string; mood?: number }
  | { type: 'aggiungiDiario'; entry: Omit<JournalEntry, 'id' | 'createdAt'> }
  | { type: 'eliminaDiario'; id: string }
  | { type: 'sbloccaPremi'; ids: string[] }
  | { type: 'premiVisti' }
  | { type: 'livelloVisto'; livello: number }
  | { type: 'impostazioni'; patch: Partial<AppState['settings']> }
  | { type: 'nome'; nome: string }
  | { type: 'dietaScelta'; date: string; slotId: string; opzioneId: string }
  | { type: 'dietaConsumo'; date: string; slotId: string; stato?: ConsumoSlot }
  | { type: 'dietaAllenamento'; date: string; attivo: boolean }
  | { type: 'dietaExtra'; date: string; extra: Omit<ExtraAlimento, 'id'> }
  | { type: 'dietaRimuoviExtra'; date: string; id: string }
  | { type: 'dietaNota'; date: string; nota: string }
  | { type: 'importa'; state: AppState }
  | { type: 'azzera' }

export function reducer(state: AppState, azione: Azione): AppState {
  switch (azione.type) {
    case 'aggiungiAbitudine': {
      const habit: Habit = { ...azione.habit, id: nuovaId('hab'), createdAt: Date.now() }
      return { ...state, habits: [...state.habits, habit] }
    }
    case 'modificaAbitudine':
      return {
        ...state,
        habits: state.habits.map((h) => (h.id === azione.id ? { ...h, ...azione.patch } : h)),
      }
    case 'eliminaAbitudine':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== azione.id),
        logs: state.logs.filter((l) => l.habitId !== azione.id),
      }
    case 'segnaGiorno': {
      const altri = state.logs.filter((l) => !(l.habitId === azione.habitId && l.date === azione.date))
      const precedente = state.logs.find((l) => l.habitId === azione.habitId && l.date === azione.date)
      // Nessuno stato e nessuna nota: la voce viene rimossa.
      const note = azione.note !== undefined ? azione.note : precedente?.note
      const mood = azione.mood !== undefined ? azione.mood : precedente?.mood
      if (!azione.status && !(note && note.trim())) return { ...state, logs: altri }
      const voce: LogEntry = {
        id: precedente?.id ?? nuovaId('log'),
        habitId: azione.habitId,
        date: azione.date,
        status: azione.status ?? precedente?.status ?? 'missed',
        note,
        mood,
        createdAt: Date.now(),
      }
      return { ...state, logs: [...altri, voce] }
    }
    case 'aggiungiDiario': {
      const entry: JournalEntry = { ...azione.entry, id: nuovaId('dia'), createdAt: Date.now() }
      return { ...state, journal: [entry, ...state.journal] }
    }
    case 'eliminaDiario':
      return { ...state, journal: state.journal.filter((j) => j.id !== azione.id) }
    case 'sbloccaPremi': {
      const gia = new Set(state.rewards.map((r) => r.id))
      const nuovi = azione.ids
        .filter((id) => !gia.has(id))
        .map((id) => ({ id, unlockedAt: Date.now(), seen: false }))
      if (nuovi.length === 0) return state
      return { ...state, rewards: [...state.rewards, ...nuovi] }
    }
    case 'premiVisti':
      return { ...state, rewards: state.rewards.map((r) => ({ ...r, seen: true })) }
    case 'livelloVisto':
      return { ...state, profile: { ...state.profile, lastSeenLevel: azione.livello } }
    case 'impostazioni':
      return { ...state, settings: { ...state.settings, ...azione.patch } }
    case 'nome':
      return { ...state, profile: { ...state.profile, name: azione.nome } }
    case 'dietaScelta':
      return aggiornaDieta(state, azione.date, (g) => ({
        ...g,
        scelte: { ...g.scelte, [azione.slotId]: azione.opzioneId },
      }))
    case 'dietaConsumo':
      return aggiornaDieta(state, azione.date, (g) => {
        const consumo = { ...g.consumo }
        if (azione.stato) consumo[azione.slotId] = azione.stato
        else delete consumo[azione.slotId]
        return { ...g, consumo }
      })
    case 'dietaAllenamento':
      return aggiornaDieta(state, azione.date, (g) => ({ ...g, allenamento: azione.attivo }))
    case 'dietaExtra':
      return aggiornaDieta(state, azione.date, (g) => ({
        ...g,
        extra: [...g.extra, { ...azione.extra, id: nuovaId('ext') }],
      }))
    case 'dietaRimuoviExtra':
      return aggiornaDieta(state, azione.date, (g) => ({
        ...g,
        extra: g.extra.filter((e) => e.id !== azione.id),
      }))
    case 'dietaNota':
      return aggiornaDieta(state, azione.date, (g) => ({ ...g, nota: azione.nota }))
    case 'importa':
      return normalizzaStato(azione.state)
    case 'azzera':
      return { ...statoIniziale, profile: { ...statoIniziale.profile, createdAt: Date.now() } }
    default:
      return state
  }
}

/** Applica una modifica al registro dieta di un giorno, creandolo se serve. */
function aggiornaDieta(
  state: AppState,
  date: string,
  patch: (g: DietaGiorno) => DietaGiorno,
): AppState {
  const esistente = state.dieta.find((d) => d.date === date)
  const base: DietaGiorno = esistente ?? { date, scelte: {}, consumo: {}, extra: [] }
  const aggiornato = patch(base)
  return {
    ...state,
    dieta: esistente
      ? state.dieta.map((d) => (d.date === date ? aggiornato : d))
      : [...state.dieta, aggiornato],
  }
}

/** Ripulisce uno stato caricato da disco o importato, tollerando dati incompleti. */
export function normalizzaStato(raw: unknown): AppState {
  const s = (raw ?? {}) as Partial<AppState>
  return {
    version: 1,
    profile: {
      name: s.profile?.name ?? '',
      createdAt: s.profile?.createdAt ?? Date.now(),
      xp: s.profile?.xp ?? 0,
      lastSeenLevel: s.profile?.lastSeenLevel ?? 1,
    },
    habits: Array.isArray(s.habits) ? s.habits.filter((h) => h && h.id && h.name) : [],
    logs: Array.isArray(s.logs) ? s.logs.filter((l) => l && l.habitId && l.date) : [],
    journal: Array.isArray(s.journal) ? s.journal.filter((j) => j && j.id) : [],
    rewards: Array.isArray(s.rewards) ? s.rewards.filter((r) => r && r.id) : [],
    dieta: Array.isArray(s.dieta)
      ? s.dieta
          .filter((d) => d && d.date)
          .map((d) => ({
            date: d.date,
            scelte: d.scelte ?? {},
            consumo: d.consumo ?? {},
            allenamento: d.allenamento,
            extra: Array.isArray(d.extra) ? d.extra : [],
            nota: d.nota,
          }))
      : [],
    settings: {
      reduceMotion: s.settings?.reduceMotion ?? false,
      weekStartsMonday: s.settings?.weekStartsMonday ?? true,
      promemoriaPasti: s.settings?.promemoriaPasti ?? false,
    },
  }
}

function carica(): AppState {
  try {
    const raw = localStorage.getItem(CHIAVE)
    if (!raw) return statoIniziale
    return normalizzaStato(JSON.parse(raw))
  } catch {
    return statoIniziale
  }
}

interface Contesto {
  state: AppState
  dispatch: (a: Azione) => void
  oggi: string
}

const Ctx = createContext<Contesto | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, carica)
  const oggi = todayISO()

  useEffect(() => {
    try {
      localStorage.setItem(CHIAVE, JSON.stringify(state))
    } catch {
      // Spazio esaurito o storage non disponibile: l'app continua a funzionare in memoria.
    }
  }, [state])

  // Sblocco automatico dei premi a ogni cambiamento rilevante.
  useEffect(() => {
    const ids = nuoviPremi(state, oggi)
    if (ids.length > 0) dispatch({ type: 'sbloccaPremi', ids })
  }, [state, oggi])

  const value = useMemo(() => ({ state, dispatch, oggi }), [state, oggi])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore(): Contesto {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore va usato dentro StoreProvider')
  return c
}

export const CHIAVE_STORAGE = CHIAVE
