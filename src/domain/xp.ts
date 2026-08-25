import type { AppState } from './types'
import { habitStats, indexLogs, type LogIndex } from './habits'
import { todayISO } from './dates'
import { aderenzaGiorno, pianoDelGiorno } from './dietaLog'
import { pesoMassimo } from './allenamentoLog'

/** XP totali necessarie per raggiungere il livello indicato (livello 1 = 0 XP). */
export function xpTotaliPerLivello(livello: number): number {
  const n = Math.max(0, livello - 1)
  return 40 * n * n + 80 * n
}

export function livelloDaXp(xp: number): number {
  let l = 1
  while (l < 200 && xpTotaliPerLivello(l + 1) <= xp) l++
  return l
}

const TITOLI = [
  'Seme', 'Germoglio', 'Prima Scintilla', 'Costruttore', 'Costante',
  'Disciplinato', 'Determinato', 'Incrollabile', 'Forgiato nel Ferro', 'Veterano',
  'Guerriero della Routine', 'Maestro dell\'Abitudine', 'Mente Lucida', 'Imbattuto', 'Leggenda Silenziosa',
  'Architetto di Sé', 'Volontà d\'Acciaio', 'Fuoco Continuo', 'Titano', 'Leggenda',
]

export function titoloLivello(livello: number): string {
  if (livello <= TITOLI.length) return TITOLI[livello - 1]
  return `${TITOLI[TITOLI.length - 1]} ${romano(livello - TITOLI.length + 1)}`
}

function romano(n: number): string {
  const mappa: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let out = ''
  let resto = n
  for (const [v, s] of mappa) while (resto >= v) { out += s; resto -= v }
  return out
}

export interface VoceXp {
  etichetta: string
  xp: number
}

export interface ProgressoGiocatore {
  xp: number
  livello: number
  titolo: string
  /** XP accumulate dentro il livello corrente. */
  xpNelLivello: number
  /** XP necessarie per passare al livello successivo. */
  xpAlProssimo: number
  /** 0-1 */
  percentuale: number
  dettaglio: VoceXp[]
}

/** Bonus assegnati al raggiungimento di traguardi di giorni consecutivi. */
const TRAGUARDI = [3, 7, 14, 21, 30, 60, 90, 180, 365, 730]

function bonusTraguardi(giorni: number): number {
  let bonus = 0
  for (const t of TRAGUARDI) if (giorni >= t) bonus += t * 2
  return bonus
}

/**
 * Calcola le XP in modo deterministico a partire dallo stato: modificare il
 * passato (aggiungere o togliere un giorno) ricalcola tutto correttamente.
 */
export function calcolaProgresso(
  state: AppState,
  today: string = todayISO(),
  idxPrecalcolato?: LogIndex,
): ProgressoGiocatore {
  const idx = idxPrecalcolato ?? indexLogs(state.logs)
  const dettaglio: VoceXp[] = []
  let xp = 0

  for (const habit of state.habits) {
    const s = habitStats(habit, idx, today, state.settings.weekStartsMonday)
    let sub = 0
    if (habit.kind === 'quit') {
      sub += s.cleanDays * 8
      sub += bonusTraguardi(s.cleanDays)
      // L'onestà vale: registrare una ricaduta invece di nasconderla dà XP.
      sub += s.relapses * 5
    } else if (habit.kind === 'weekly') {
      sub += s.completed * 12
      sub += s.weeksOk * 40
      sub += bonusTraguardi(s.streak * 7)
    } else {
      sub += s.completed * 10
      sub += bonusTraguardi(s.best)
    }
    sub += s.note * 2
    if (sub > 0) dettaglio.push({ etichetta: habit.name, xp: sub })
    xp += sub
  }

  // Piano alimentare: conta la costanza nel registrare e quanto segui lo schema.
  let xpDieta = 0
  for (const giorno of state.dieta) {
    const ad = aderenzaGiorno(pianoDelGiorno(giorno.date, giorno.allenamento), giorno)
    if (!ad.iniziato) continue
    xpDieta += 5 + Math.round(ad.percentuale / 10)
    if (ad.completo) xpDieta += 15
  }
  if (xpDieta) dettaglio.push({ etichetta: 'Piano alimentare', xp: xpDieta })
  xp += xpDieta

  // Palestra: ogni sessione registrata vale, chiuderla vale di più.
  let xpPalestra = 0
  for (const sessione of state.allenamenti) {
    xpPalestra += 25
    if (sessione.completata) xpPalestra += 15
    xpPalestra += sessione.esercizi.filter((e) => pesoMassimo(e.serie) !== undefined).length * 3
  }
  if (xpPalestra) dettaglio.push({ etichetta: 'Palestra', xp: xpPalestra })
  xp += xpPalestra

  const xpDiario = state.journal.length * 6
  if (xpDiario) dettaglio.push({ etichetta: 'Diario', xp: xpDiario })
  xp += xpDiario

  const xpPremi = state.rewards.length * 25
  if (xpPremi) dettaglio.push({ etichetta: 'Premi sbloccati', xp: xpPremi })
  xp += xpPremi

  const livello = livelloDaXp(xp)
  const base = xpTotaliPerLivello(livello)
  const prossimo = xpTotaliPerLivello(livello + 1)
  const xpNelLivello = xp - base
  const xpAlProssimo = prossimo - base

  dettaglio.sort((a, b) => b.xp - a.xp)

  return {
    xp,
    livello,
    titolo: titoloLivello(livello),
    xpNelLivello,
    xpAlProssimo,
    percentuale: xpAlProssimo > 0 ? xpNelLivello / xpAlProssimo : 1,
    dettaglio,
  }
}
