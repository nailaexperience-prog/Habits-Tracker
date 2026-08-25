/** Tipi di abitudine supportati. */
export type HabitKind =
  /** Smettere: si contano i giorni consecutivi senza ricadute (es. fumo). */
  | 'quit'
  /** Da fare ogni giorno (es. alimentazione sana, lettura). */
  | 'daily'
  /** Da fare N volte a settimana (es. palestra 4x). */
  | 'weekly'

export type HabitCategory =
  | 'movimento'
  | 'alimentazione'
  | 'mente'
  | 'sonno'
  | 'studio'
  | 'sostanze'
  | 'digitale'
  | 'relazioni'
  | 'altro'

export interface Habit {
  id: string
  name: string
  kind: HabitKind
  category: HabitCategory
  /** Colore di accento (hex). */
  color: string
  icon: string
  /** Data di inizio in formato ISO locale YYYY-MM-DD. */
  startDate: string
  /** Solo per kind='weekly': quante volte a settimana. */
  weeklyTarget?: number
  /** Motivazione personale, mostrata nei momenti difficili. */
  why?: string
  createdAt: number
  archived?: boolean
  /** Id delle voci del catalogo benefici associate (calcolate all'inserimento). */
  benefitKey?: string
}

/** Stato di una giornata per una singola abitudine. */
export type DayStatus = 'done' | 'missed' | 'relapse'

export interface LogEntry {
  id: string
  habitId: string
  /** YYYY-MM-DD */
  date: string
  status: DayStatus
  note?: string
  /** Umore da 1 (pessimo) a 5 (ottimo), opzionale. */
  mood?: number
  createdAt: number
}

export interface JournalEntry {
  id: string
  date: string
  text: string
  mood?: number
  createdAt: number
}

export interface UnlockedReward {
  id: string
  unlockedAt: number
  /** Id abitudine se il premio è legato a una specifica abitudine. */
  habitId?: string
  /** Seed per scegliere il premio reale suggerito. */
  seen?: boolean
}

/** Stato di consumo di uno slot del piano alimentare. */
export type ConsumoSlot = 'tutto' | 'meta' | 'saltato'

export interface ExtraAlimento {
  id: string
  nome: string
  kcal: number
}

/** Registro giornaliero del piano alimentare. */
export interface DietaGiorno {
  /** YYYY-MM-DD */
  date: string
  /** slotId -> id dell'opzione scelta fra le alternative. */
  scelte: Record<string, string>
  /** slotId -> quanto ne hai mangiato. */
  consumo: Record<string, ConsumoSlot>
  /** Giorno di allenamento: la merenda viene sostituita. */
  allenamento?: boolean
  /** Alimenti fuori piano registrati per il conteggio calorico. */
  extra: ExtraAlimento[]
  nota?: string
}

/** Una serie eseguita: carico usato e ripetizioni chiuse. */
export interface SerieEseguita {
  peso?: number
  reps?: number
}

export interface EsercizioEseguito {
  esercizioId: string
  serie: SerieEseguita[]
  nota?: string
}

/** Una sessione di allenamento registrata. */
export interface Sessione {
  id: string
  /** YYYY-MM-DD */
  date: string
  /** Scheda A, scheda B oppure sessione con il personal trainer. */
  tipo: 'A' | 'B' | 'PT'
  /** Settimana del programma in cui è avvenuta (1-5). */
  settimana: number
  esercizi: EsercizioEseguito[]
  completata?: boolean
  nota?: string
}

/** Configurazione del programma di allenamento in corso. */
export interface ConfigProgramma {
  programmaId: string
  /** Lunedì della settimana 1 del programma. Vuoto = non ancora configurato. */
  inizio: string
  /** Giorni in cui ti alleni: 0 = lunedì ... 6 = domenica. */
  giorni: number[]
  orario: string
}

export interface AppState {
  version: number
  profile: {
    name: string
    createdAt: number
    /** XP totali accumulate. */
    xp: number
    /** Ultimo livello notificato, per mostrare l'animazione di level up. */
    lastSeenLevel: number
  }
  habits: Habit[]
  logs: LogEntry[]
  journal: JournalEntry[]
  rewards: UnlockedReward[]
  dieta: DietaGiorno[]
  allenamenti: Sessione[]
  programma: ConfigProgramma
  settings: {
    reduceMotion: boolean
    weekStartsMonday: boolean
    /** Promemoria pasti attivi (notifiche mentre l'app è aperta). */
    promemoriaPasti: boolean
  }
}
