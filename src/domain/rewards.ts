import type { AppState, HabitCategory } from './types'
import { habitStats, indexLogs, type HabitStats, type LogIndex } from './habits'
import { addDays, daysBetween, rangeISO, todayISO } from './dates'
import { calcolaProgresso } from './xp'
import { aderenzaGiorno, pianoDelGiorno } from './dietaLog'

export type Tier = 'bronzo' | 'argento' | 'oro' | 'leggendario'

export interface ContestoPremi {
  state: AppState
  idx: LogIndex
  today: string
  stats: Map<string, HabitStats>
  livello: number
  /** Giornate in cui tutte le abitudini previste sono state completate. */
  giornatePerfette: number
  noteTotali: number
  checkTotali: number
  streakMassimo: number
  settimaneOkMax: number
  ricadute: number
  /** Giorni puliti raggiunti dopo l'ultima ricaduta, su abitudini "quit". */
  rinascita: number
  /** Giorni con almeno una registrazione sul piano alimentare. */
  dietaRegistrati: number
  /** Giorni in cui il piano è stato seguito per intero. */
  dietaCompleti: number
  /** Giorni consecutivi con il piano seguito per intero, fino a oggi. */
  dietaSerie: number
}

export interface Premio {
  id: string
  nome: string
  emoji: string
  tier: Tier
  /** Cosa serve per ottenerlo. */
  condizione: string
  /** Messaggio di congratulazioni. */
  messaggio: string
  /** Premio concreto suggerito dall'app. */
  premioReale?: string
  test: (c: ContestoPremi) => boolean
  /** Avanzamento 0-1 verso lo sblocco. */
  progresso: (c: ContestoPremi) => number
}

const clamp = (n: number) => Math.max(0, Math.min(1, n))

/** Premi reali suggeriti in base alla categoria prevalente delle tue abitudini. */
const PREMI_REALI: Record<HabitCategory, string[]> = {
  movimento: [
    'Comprati un capo tecnico nuovo per allenarti',
    'Prenota un massaggio sportivo',
    'Regalati delle scarpe nuove',
    'Iscriviti a una gara o a un corso che ti incuriosisce',
  ],
  alimentazione: [
    'Vai in un ristorante che volevi provare da tempo',
    'Comprati un attrezzo da cucina che desideravi',
    'Prenota una cena speciale con chi vuoi tu',
    'Fai un corso di cucina di mezza giornata',
  ],
  mente: [
    'Regalati un\'ora tutta tua senza doverla giustificare a nessuno',
    'Comprati un quaderno bello, di quelli che costano troppo',
    'Prenota una giornata alle terme',
    'Concediti un weekend senza sveglia',
  ],
  sonno: [
    'Investi in un cuscino o in un materasso migliore',
    'Comprati lenzuola di qualità',
    'Regalati una domenica di riposo totale senza sensi di colpa',
  ],
  studio: [
    'Comprati i libri che avevi nella lista dei desideri',
    'Iscriviti al corso che rimandavi',
    'Regalati uno strumento di lavoro migliore',
  ],
  sostanze: [
    'Prendi i soldi risparmiati e comprati qualcosa che vedi ogni giorno',
    'Prenota un viaggio breve con quello che non hai speso',
    'Regalati qualcosa che il vecchio te non si sarebbe permesso',
  ],
  digitale: [
    'Usa il tempo recuperato per una gita fuori porta',
    'Comprati qualcosa di analogico: una macchina fotografica, un vinile, un libro',
    'Prenota una serata senza telefono con chi ti va',
  ],
  relazioni: [
    'Organizza una cena con le persone a cui tieni, offri tu',
    'Fai un regalo a sorpresa a qualcuno che ti è stato vicino',
  ],
  altro: [
    'Concediti qualcosa che desideravi e continuavi a rimandare',
    'Prenditi mezza giornata libera solo per te',
  ],
}

/** Sceglie un premio reale coerente con le abitudini dell'utente. */
export function premioRealeSuggerito(state: AppState, seed: number): string {
  const conteggio = new Map<HabitCategory, number>()
  for (const h of state.habits) {
    if (h.archived) continue
    conteggio.set(h.category, (conteggio.get(h.category) ?? 0) + 1)
  }
  let categoria: HabitCategory = 'altro'
  let max = 0
  for (const [cat, n] of conteggio) if (n > max) { max = n; categoria = cat }
  const lista = PREMI_REALI[categoria] ?? PREMI_REALI.altro
  return lista[Math.abs(seed) % lista.length]
}

function premioStreak(giorni: number, tier: Tier, emoji: string, nome: string, messaggio: string): Premio {
  return {
    id: `streak-${giorni}`,
    nome,
    emoji,
    tier,
    condizione: `${giorni} giorni consecutivi su una qualsiasi abitudine`,
    messaggio,
    test: (c) => c.streakMassimo >= giorni,
    progresso: (c) => clamp(c.streakMassimo / giorni),
  }
}

export const CATALOGO_PREMI: Premio[] = [
  {
    id: 'inizio',
    nome: 'Il Primo Passo',
    emoji: '🌱',
    tier: 'bronzo',
    condizione: 'Crea la tua prima abitudine',
    messaggio: 'Hai smesso di pensarci e hai iniziato. È la parte che quasi nessuno fa.',
    test: (c) => c.state.habits.length >= 1,
    progresso: (c) => clamp(c.state.habits.length),
  },
  {
    id: 'primo-check',
    nome: 'Giorno Uno',
    emoji: '✅',
    tier: 'bronzo',
    condizione: 'Registra il tuo primo giorno',
    messaggio: 'Il primo segno sul calendario. Ora hai qualcosa da non interrompere.',
    test: (c) => c.checkTotali >= 1,
    progresso: (c) => clamp(c.checkTotali),
  },
  premioStreak(3, 'bronzo', '🔥', 'Tre Giorni', 'I primi tre giorni sono i più duri. Sono alle tue spalle.'),
  premioStreak(7, 'bronzo', '🗓️', 'Una Settimana Intera', 'Sette giorni di fila. Non è più un caso, è un pattern.'),
  premioStreak(14, 'argento', '⚡', 'Due Settimane', 'Quattordici giorni: il tuo cervello inizia a considerarlo normale.'),
  premioStreak(21, 'argento', '🧠', 'Ventuno', 'Tre settimane. La resistenza iniziale si è sciolta.'),
  premioStreak(30, 'argento', '🌙', 'Un Mese Pieno', 'Trenta giorni. Ora hai delle prove, non solo delle intenzioni.'),
  premioStreak(66, 'oro', '🧬', 'Soglia dell\'Automatismo', '66 giorni: la media scientifica perché un comportamento diventi automatico. Ci sei.'),
  premioStreak(100, 'oro', '💯', 'Cento', 'Cento giorni consecutivi. Questa cosa non ti appartiene più: sei tu.'),
  premioStreak(180, 'leggendario', '👑', 'Mezzo Anno', 'Sei mesi senza mollare. Pochissime persone arrivano qui.'),
  premioStreak(365, 'leggendario', '🏆', 'Un Anno Intero', 'Trecentosessantacinque giorni. Sei diventato un\'altra persona.'),
  {
    id: 'volume-10',
    nome: 'Decina',
    emoji: '🔟',
    tier: 'bronzo',
    condizione: '10 giorni completati in totale',
    messaggio: 'Dieci mattoni posati. Il muro inizia a vedersi.',
    test: (c) => c.checkTotali >= 10,
    progresso: (c) => clamp(c.checkTotali / 10),
  },
  {
    id: 'volume-50',
    nome: 'Cinquanta',
    emoji: '🧱',
    tier: 'argento',
    condizione: '50 giorni completati in totale',
    messaggio: 'Cinquanta volte in cui hai scelto la versione migliore di te.',
    test: (c) => c.checkTotali >= 50,
    progresso: (c) => clamp(c.checkTotali / 50),
  },
  {
    id: 'volume-200',
    nome: 'Duecento',
    emoji: '🏔️',
    tier: 'oro',
    condizione: '200 giorni completati in totale',
    messaggio: 'Duecento. Non è motivazione: è identità.',
    test: (c) => c.checkTotali >= 200,
    progresso: (c) => clamp(c.checkTotali / 200),
  },
  {
    id: 'settimana-target',
    nome: 'Obiettivo Centrato',
    emoji: '🎯',
    tier: 'bronzo',
    condizione: 'Chiudi una settimana raggiungendo un obiettivo settimanale',
    messaggio: 'Obiettivo settimanale raggiunto. Il piano funziona.',
    test: (c) => c.settimaneOkMax >= 1,
    progresso: (c) => clamp(c.settimaneOkMax),
  },
  {
    id: 'settimane-4',
    nome: 'Mese Programmato',
    emoji: '📈',
    tier: 'argento',
    condizione: '4 settimane a obiettivo su una stessa abitudine',
    messaggio: 'Un mese intero rispettando la programmazione. Questa è la parte difficile.',
    test: (c) => c.settimaneOkMax >= 4,
    progresso: (c) => clamp(c.settimaneOkMax / 4),
  },
  {
    id: 'settimane-12',
    nome: 'Trimestre Solido',
    emoji: '🛡️',
    tier: 'oro',
    condizione: '12 settimane a obiettivo su una stessa abitudine',
    messaggio: 'Tre mesi di continuità. I risultati a questo punto sono visibili anche agli altri.',
    test: (c) => c.settimaneOkMax >= 12,
    progresso: (c) => clamp(c.settimaneOkMax / 12),
  },
  {
    id: 'giornata-perfetta',
    nome: 'Giornata Perfetta',
    emoji: '⭐',
    tier: 'bronzo',
    condizione: 'Completa tutte le abitudini previste in un giorno',
    messaggio: 'Una giornata in cui non hai lasciato nulla indietro.',
    test: (c) => c.giornatePerfette >= 1,
    progresso: (c) => clamp(c.giornatePerfette),
  },
  {
    id: 'giornate-perfette-7',
    nome: 'Settimana Impeccabile',
    emoji: '💎',
    tier: 'oro',
    condizione: '7 giornate perfette',
    messaggio: 'Sette giornate senza sbavature. Livello raro.',
    test: (c) => c.giornatePerfette >= 7,
    progresso: (c) => clamp(c.giornatePerfette / 7),
  },
  {
    id: 'fenice',
    nome: 'Fenice',
    emoji: '🔆',
    tier: 'oro',
    condizione: 'Torna a 7 giorni puliti dopo una ricaduta',
    messaggio: 'Sei caduto e sei tornato più forte. Questo vale più di chi non è mai caduto.',
    premioReale: 'Meriti qualcosa di concreto: sei tornato quando era più facile mollare del tutto.',
    test: (c) => c.ricadute >= 1 && c.rinascita >= 7,
    progresso: (c) => (c.ricadute >= 1 ? clamp(c.rinascita / 7) : 0),
  },
  {
    id: 'onesta',
    nome: 'Onestà Brutale',
    emoji: '🪞',
    tier: 'argento',
    condizione: 'Scrivi 10 note, anche nei giorni storti',
    messaggio: 'Scrivere quando le cose vanno male è la cosa più utile che puoi fare per te.',
    test: (c) => c.noteTotali >= 10,
    progresso: (c) => clamp(c.noteTotali / 10),
  },
  {
    id: 'cronista',
    nome: 'Cronista di Te Stesso',
    emoji: '📔',
    tier: 'oro',
    condizione: 'Scrivi 50 note o voci di diario',
    messaggio: 'Cinquanta pagine del tuo percorso. Tra un anno varranno oro.',
    test: (c) => c.noteTotali >= 50,
    progresso: (c) => clamp(c.noteTotali / 50),
  },
  {
    id: 'multi-3',
    nome: 'Su Tre Fronti',
    emoji: '🎛️',
    tier: 'argento',
    condizione: 'Porta avanti 3 abitudini attive insieme',
    messaggio: 'Tre abitudini in parallelo: stai ricostruendo la giornata, non un dettaglio.',
    test: (c) => c.state.habits.filter((h) => !h.archived).length >= 3,
    progresso: (c) => clamp(c.state.habits.filter((h) => !h.archived).length / 3),
  },
  {
    id: 'dieta-inizio',
    nome: 'Primo Pasto Tracciato',
    emoji: '🥗',
    tier: 'bronzo',
    condizione: 'Registra il primo giorno del piano alimentare',
    messaggio: 'Hai iniziato a misurare quello che mangi. Da qui in poi non vai più a memoria.',
    test: (c) => c.dietaRegistrati >= 1,
    progresso: (c) => clamp(c.dietaRegistrati),
  },
  {
    id: 'dieta-settimana',
    nome: 'Settimana in Regola',
    emoji: '🍽️',
    tier: 'oro',
    condizione: '7 giorni consecutivi con il piano seguito per intero',
    messaggio: 'Sette giorni pieni rispettando lo schema. Questa è la parte che quasi nessuno regge.',
    test: (c) => c.dietaSerie >= 7,
    progresso: (c) => clamp(c.dietaSerie / 7),
  },
  {
    id: 'dieta-30',
    nome: 'Un Mese di Dati',
    emoji: '📊',
    tier: 'argento',
    condizione: '30 giorni registrati sul piano alimentare',
    messaggio: 'Trenta giorni tracciati: ora hai numeri veri su cui ragionare, non sensazioni.',
    test: (c) => c.dietaRegistrati >= 30,
    progresso: (c) => clamp(c.dietaRegistrati / 30),
  },
  {
    id: 'livello-5',
    nome: 'Livello 5',
    emoji: '🥉',
    tier: 'bronzo',
    condizione: 'Raggiungi il livello 5',
    messaggio: 'Livello 5. Il gioco è iniziato sul serio.',
    test: (c) => c.livello >= 5,
    progresso: (c) => clamp(c.livello / 5),
  },
  {
    id: 'livello-10',
    nome: 'Livello 10',
    emoji: '🥈',
    tier: 'argento',
    condizione: 'Raggiungi il livello 10',
    messaggio: 'Doppia cifra. La costanza sta pagando.',
    test: (c) => c.livello >= 10,
    progresso: (c) => clamp(c.livello / 10),
  },
  {
    id: 'livello-20',
    nome: 'Livello 20',
    emoji: '🥇',
    tier: 'oro',
    condizione: 'Raggiungi il livello 20',
    messaggio: 'Livello 20. Qui non arriva chi si affida alla motivazione.',
    test: (c) => c.livello >= 20,
    progresso: (c) => clamp(c.livello / 20),
  },
  {
    id: 'livello-30',
    nome: 'Livello 30',
    emoji: '🌟',
    tier: 'leggendario',
    condizione: 'Raggiungi il livello 30',
    messaggio: 'Livello 30. Sei nella fascia in cui le abitudini si mantengono da sole.',
    test: (c) => c.livello >= 30,
    progresso: (c) => clamp(c.livello / 30),
  },
]

/** Costruisce il contesto necessario a valutare i premi. */
export function contestoPremi(state: AppState, today: string = todayISO()): ContestoPremi {
  const idx = indexLogs(state.logs)
  const stats = new Map<string, HabitStats>()
  let streakMassimo = 0
  let settimaneOkMax = 0
  let checkTotali = 0
  let ricadute = 0
  let rinascita = 0
  let noteTotali = state.journal.length

  for (const h of state.habits) {
    const s = habitStats(h, idx, today, state.settings.weekStartsMonday)
    stats.set(h.id, s)
    // Le settimane consecutive valgono come 7 giorni ciascuna, per confrontarle con le altre abitudini.
    const fattore = s.streakUnit === 'settimane' ? 7 : 1
    streakMassimo = Math.max(streakMassimo, s.best * fattore, s.streak * fattore)
    settimaneOkMax = Math.max(settimaneOkMax, s.weeksOk)
    checkTotali += h.kind === 'quit' ? s.cleanDays : s.completed
    ricadute += s.relapses
    noteTotali += s.note
    if (h.kind === 'quit' && s.relapses > 0) rinascita = Math.max(rinascita, s.cleanDays)
  }

  // Giornate perfette: giorni in cui tutte le abitudini attive quel giorno sono a posto.
  let giornatePerfette = 0
  const attive = state.habits.filter((h) => !h.archived && h.kind !== 'quit')
  if (attive.length > 0) {
    const inizio = attive.reduce((min, h) => (daysBetween(h.startDate, min) > 0 ? h.startDate : min), today)
    for (const giorno of rangeISO(inizio, today)) {
      const previste = attive.filter((h) => daysBetween(h.startDate, giorno) >= 0)
      if (previste.length === 0) continue
      const tutte = previste.every((h) => idx.get(h.id)?.get(giorno)?.status === 'done')
      if (tutte) giornatePerfette++
    }
  }

  // Piano alimentare
  const giorniDieta = [...state.dieta]
    .map((g) => ({ giorno: g, ad: aderenzaGiorno(pianoDelGiorno(g.date, g.allenamento), g) }))
    .filter((x) => x.ad.iniziato)
    .sort((x, y) => (x.giorno.date < y.giorno.date ? -1 : 1))
  const dietaRegistrati = giorniDieta.length
  const dietaCompleti = giorniDieta.filter((x) => x.ad.completo).length
  let dietaSerie = 0
  let cursore = today
  const perData = new Map(giorniDieta.map((x) => [x.giorno.date, x.ad]))
  // La giornata di oggi non ancora completata non spezza la serie.
  if (!perData.get(today)?.completo) cursore = addDays(today, -1)
  while (perData.get(cursore)?.completo) {
    dietaSerie++
    cursore = addDays(cursore, -1)
  }

  const progresso = calcolaProgresso(state, today, idx)

  return {
    state,
    idx,
    today,
    stats,
    livello: progresso.livello,
    giornatePerfette,
    noteTotali,
    checkTotali,
    streakMassimo,
    settimaneOkMax,
    ricadute,
    rinascita,
    dietaRegistrati,
    dietaCompleti,
    dietaSerie,
  }
}

export interface StatoPremio {
  premio: Premio
  sbloccato: boolean
  progresso: number
  /** Premio reale suggerito (solo per quelli sbloccati o d'oro). */
  premioReale: string
}

export function valutaPremi(state: AppState, today: string = todayISO()): StatoPremio[] {
  const c = contestoPremi(state, today)
  return CATALOGO_PREMI.map((premio, i) => ({
    premio,
    sbloccato: premio.test(c),
    progresso: clamp(premio.progresso(c)),
    premioReale: premio.premioReale ?? premioRealeSuggerito(state, i * 7 + premio.nome.length),
  }))
}

/** Restituisce gli id dei premi appena sbloccati rispetto a quelli già registrati. */
export function nuoviPremi(state: AppState, today: string = todayISO()): string[] {
  const gia = new Set(state.rewards.map((r) => r.id))
  return valutaPremi(state, today)
    .filter((p) => p.sbloccato && !gia.has(p.premio.id))
    .map((p) => p.premio.id)
}

export function premioPerId(id: string): Premio | undefined {
  return CATALOGO_PREMI.find((p) => p.id === id)
}

export const TIER_COLORI: Record<Tier, string> = {
  bronzo: '#c98b5e',
  argento: '#b9c4d4',
  oro: '#f2c14e',
  leggendario: '#b06cf0',
}

/** Prossimo traguardo utile da mostrare in dashboard. */
export function prossimoPremio(state: AppState, today: string = todayISO()): StatoPremio | undefined {
  const tutti = valutaPremi(state, today).filter((p) => !p.sbloccato)
  tutti.sort((a, b) => b.progresso - a.progresso)
  return tutti[0]
}
