import type { AppState, ConfigProgramma, EsercizioEseguito, SerieEseguita, Sessione } from './types'
import {
  PROGRAMMA, prescrizione, scheda,
  type Esercizio, type Prescrizione, type SiglaScheda, type TipoSessione,
} from './allenamento'
import { addDays, daysBetween, startOfWeek, todayISO } from './dates'

export const CONFIG_INIZIALE: ConfigProgramma = {
  programmaId: PROGRAMMA.id,
  inizio: '',
  giorni: [0, 1, 3, 4],
  orario: '18:30',
}

/** Ancora il programma in modo che oggi cada nella settimana indicata. */
export function ancoraSettimana(settimana: number, oggi: string = todayISO()): string {
  return addDays(startOfWeek(oggi, true), -(Math.max(1, settimana) - 1) * 7)
}

/** Settimana del programma alla data indicata (può superare il totale se è finito). */
export function settimanaDi(config: ConfigProgramma, date: string = todayISO()): number {
  if (!config.inizio) return 1
  const giorni = daysBetween(config.inizio, startOfWeek(date, true))
  return Math.floor(giorni / 7) + 1
}

export function programmaConfigurato(config: ConfigProgramma): boolean {
  return !!config.inizio
}

export function programmaFinito(config: ConfigProgramma, date: string = todayISO()): boolean {
  return programmaConfigurato(config) && settimanaDi(config, date) > PROGRAMMA.settimane
}

/** Le sessioni A/B in ordine cronologico (le sessioni col PT non contano). */
function sessioniAB(sessioni: Sessione[]): Sessione[] {
  return sessioni
    .filter((s) => s.tipo === 'A' || s.tipo === 'B')
    .sort((a, b) => (a.date === b.date ? a.id.localeCompare(b.id) : a.date < b.date ? -1 : 1))
}

/**
 * La scheda che tocca fare: si alterna sempre A/B, e la sessione con il
 * personal trainer non rompe l'alternanza.
 */
export function prossimaScheda(sessioni: Sessione[], escludiId?: string): SiglaScheda {
  const ab = sessioniAB(sessioni).filter((s) => s.id !== escludiId)
  const ultima = ab[ab.length - 1]
  if (!ultima) return 'A'
  return ultima.tipo === 'A' ? 'B' : 'A'
}

export function sessioneDelGiorno(sessioni: Sessione[], date: string): Sessione | undefined {
  return sessioni.find((s) => s.date === date)
}

/** Quante sessioni hai fatto nella settimana di calendario della data. */
export function sessioniDellaSettimana(sessioni: Sessione[], date: string = todayISO()): Sessione[] {
  const lunedi = startOfWeek(date, true)
  const domenica = addDays(lunedi, 6)
  return sessioni.filter((s) => s.date >= lunedi && s.date <= domenica)
}

export interface StoricoEsercizio {
  sessione: Sessione
  eseguito: EsercizioEseguito
}

/** Tutte le volte in cui hai fatto un esercizio, dalla più recente. */
export function storicoEsercizio(sessioni: Sessione[], esercizioId: string): StoricoEsercizio[] {
  const out: StoricoEsercizio[] = []
  for (const s of sessioni) {
    const e = s.esercizi.find((x) => x.esercizioId === esercizioId)
    if (e && e.serie.some((v) => v.peso !== undefined || v.reps !== undefined)) out.push({ sessione: s, eseguito: e })
  }
  return out.sort((a, b) => (a.sessione.date < b.sessione.date ? 1 : -1))
}

/** L'ultima volta che hai fatto quell'esercizio, escludendo la sessione corrente. */
export function ultimaVolta(
  sessioni: Sessione[],
  esercizioId: string,
  escludiSessioneId?: string,
): StoricoEsercizio | undefined {
  return storicoEsercizio(sessioni, esercizioId).find((h) => h.sessione.id !== escludiSessioneId)
}

export function pesoMassimo(serie: SerieEseguita[]): number | undefined {
  const pesi = serie.map((s) => s.peso).filter((p): p is number => typeof p === 'number' && p > 0)
  return pesi.length ? Math.max(...pesi) : undefined
}

/** Volume di una serie: peso × ripetizioni, sommato su tutte le serie. */
export function volumeSerie(serie: SerieEseguita[]): number {
  return serie.reduce((tot, s) => tot + (s.peso ?? 0) * (s.reps ?? 0), 0)
}

export function volumeSessione(sessione: Sessione): number {
  return sessione.esercizi.reduce((tot, e) => tot + volumeSerie(e.serie), 0)
}

export interface Suggerimento {
  /** Carico consigliato in kg, se calcolabile. */
  peso?: number
  direzione: 'su' | 'giu' | 'uguale' | 'prima-volta'
  motivo: string
}

function arrotonda(kg: number): number {
  return Math.round(kg / 2.5) * 2.5
}

/**
 * Consiglio di carico per la settimana corrente, seguendo la regola del PT:
 * quando la prescrizione chiede meno ripetizioni o meno buffer il carico sale,
 * quando ne chiede di più il carico scende.
 */
export function suggerimentoCarico(
  esercizio: Esercizio,
  settimana: number,
  precedente?: { serie: SerieEseguita[]; settimana: number },
): Suggerimento {
  const ora = prescrizione(esercizio, settimana)
  if (!precedente) {
    return {
      direzione: 'prima-volta',
      motivo: ora.buffer
        ? `Prima volta che lo registri: scegli un carico che ti lasci ${ora.buffer} ${ora.buffer === 1 ? 'ripetizione' : 'ripetizioni'} in canna a fine serie.`
        : 'Prima volta che lo registri: parti con un carico gestibile e segna quello che usi.',
    }
  }
  const peso = pesoMassimo(precedente.serie)
  const prima = prescrizione(esercizio, precedente.settimana)
  const deltaRip = prima.ripetizioni - ora.ripetizioni
  const deltaBuffer = (prima.buffer ?? 0) - (ora.buffer ?? 0)
  const variazione = 0.025 * deltaRip + 0.025 * deltaBuffer

  if (!peso) {
    return {
      direzione: deltaRip + deltaBuffer > 0 ? 'su' : deltaRip + deltaBuffer < 0 ? 'giu' : 'uguale',
      motivo: 'L\'ultima volta non hai segnato il carico: registralo e la prossima volta ti do un numero.',
    }
  }

  if (variazione > 0.001) {
    return {
      peso: arrotonda(peso * (1 + variazione)),
      direzione: 'su',
      motivo: `Rispetto all'ultima volta la scheda chiede ${descriviDelta(deltaRip, deltaBuffer)}: il carico va su.`,
    }
  }
  if (variazione < -0.001) {
    return {
      peso: arrotonda(peso * (1 + variazione)),
      direzione: 'giu',
      motivo: `Questa settimana la scheda chiede ${descriviDelta(deltaRip, deltaBuffer)}: il carico va giù.`,
    }
  }
  return {
    peso,
    direzione: 'uguale',
    motivo: 'Stessa prescrizione dell\'ultima volta: tieni il carico e punta a chiudere tutte le serie pulite.',
  }
}

function descriviDelta(deltaRip: number, deltaBuffer: number): string {
  const parti: string[] = []
  if (deltaRip > 0) parti.push(`${deltaRip} ${deltaRip === 1 ? 'ripetizione' : 'ripetizioni'} in meno`)
  if (deltaRip < 0) parti.push(`${-deltaRip} ${deltaRip === -1 ? 'ripetizione' : 'ripetizioni'} in più`)
  if (deltaBuffer > 0) parti.push(`${deltaBuffer} di buffer in meno`)
  if (deltaBuffer < 0) parti.push(`${-deltaBuffer} di buffer in più`)
  return parti.join(' e ')
}

export interface StatoPalestra {
  sessioniTotali: number
  sessioniQuestaSettimana: number
  settimana: number
  finito: boolean
  prossima: SiglaScheda
  volumeTotale: number
  /** Ultima sessione registrata. */
  ultima?: Sessione
}

export function statoPalestra(state: AppState, oggi: string = todayISO()): StatoPalestra {
  const sessioni = state.allenamenti
  const ordinate = [...sessioni].sort((a, b) => (a.date < b.date ? 1 : -1))
  return {
    sessioniTotali: sessioni.length,
    sessioniQuestaSettimana: sessioniDellaSettimana(sessioni, oggi).length,
    settimana: settimanaDi(state.programma, oggi),
    finito: programmaFinito(state.programma, oggi),
    prossima: prossimaScheda(sessioni),
    volumeTotale: sessioni.reduce((t, s) => t + volumeSessione(s), 0),
    ultima: ordinate[0],
  }
}

/** Prepara una sessione vuota con tutti gli esercizi della scheda. */
export function nuovaSessione(
  id: string,
  date: string,
  tipo: TipoSessione,
  settimana: number,
): Sessione {
  if (tipo === 'PT') {
    return { id, date, tipo, settimana, esercizi: [] }
  }
  const s = scheda(tipo)
  return {
    id,
    date,
    tipo,
    settimana,
    esercizi: s.esercizi.map((e) => ({
      esercizioId: e.id,
      serie: Array.from({ length: prescrizione(e, settimana).serie }, () => ({})),
    })),
  }
}

/** Progressione del carico massimo di un esercizio, dalla più vecchia. */
export function progressione(sessioni: Sessione[], esercizioId: string): { date: string; peso: number }[] {
  return storicoEsercizio(sessioni, esercizioId)
    .map((h) => ({ date: h.sessione.date, peso: pesoMassimo(h.eseguito.serie) }))
    .filter((x): x is { date: string; peso: number } => typeof x.peso === 'number')
    .reverse()
}

export type { Prescrizione }
