import type { AppState, Habit, LogEntry } from './types'
import { habitStats, indexLogs, type LogIndex } from './habits'
import { addDays, daysBetween, formatCorto, nomeGiorno, parseISO, rangeISO, startOfWeek, todayISO } from './dates'
import { schedaBenefici } from './benefits'
import { andamento, pastiTrascurati } from './dietaLog'
import { NOMI_PASTI } from './dieta'

/* ------------------------------------------------------------------ */
/* Analisi del testo delle note                                        */
/* ------------------------------------------------------------------ */

const POSITIVE = [
  'bene', 'benissimo', 'ottimo', 'contento', 'felice', 'orgoglioso', 'forte', 'energia', 'motivato',
  'soddisfatto', 'facile', 'leggero', 'sereno', 'calmo', 'riposato', 'grande', 'top', 'carico',
  'lucido', 'concentrato', 'fiero', 'meglio', 'progresso', 'riuscito', 'vittoria', 'grato',
]

const NEGATIVE = [
  'male', 'malissimo', 'stanco', 'stanchezza', 'stress', 'stressato', 'ansia', 'ansioso', 'triste',
  'depresso', 'nervoso', 'arrabbiato', 'frustrato', 'demotivato', 'pigro', 'difficile', 'fatica',
  'pesante', 'sbagliato', 'ricaduta', 'fallito', 'fallimento', 'colpa', 'schifo', 'noia', 'annoiato',
  'insonnia', 'mollato', 'saltato', 'crollo', 'crollato', 'voglia di', 'non ce la faccio',
]

const INTENSIFICATORI = ['molto', 'tanto', 'troppo', 'davvero', 'proprio', 'super']

export interface Tema {
  chiave: string
  etichetta: string
  emoji: string
  conteggio: number
  consiglio: string
}

const TEMI: { chiave: string; etichetta: string; emoji: string; parole: string[]; consiglio: string }[] = [
  {
    chiave: 'stress',
    etichetta: 'Stress e lavoro',
    emoji: '🧯',
    parole: ['stress', 'stressato', 'lavoro', 'ufficio', 'scadenza', 'capo', 'riunione', 'pressione', 'incasinato'],
    consiglio: 'Lo stress compare spesso nelle tue note. Prepara una versione "minima" delle tue abitudini da usare nei giorni pieni: 5 minuti invece di 40. Salvare la catena vale più della sessione perfetta.',
  },
  {
    chiave: 'sonno',
    etichetta: 'Sonno',
    emoji: '😴',
    parole: ['sonno', 'dormito', 'insonnia', 'sveglio', 'stanco', 'stanchezza', 'notte', 'letto tardi'],
    consiglio: 'Il sonno torna spesso nei tuoi appunti: è la variabile che trascina tutte le altre. Prova a fissare l\'orario della sveglia (non quello in cui vai a letto) per 7 giorni e osserva cosa cambia sulle altre abitudini.',
  },
  {
    chiave: 'noia',
    etichetta: 'Noia e vuoto',
    emoji: '🌫️',
    parole: ['noia', 'annoiato', 'vuoto', 'niente da fare', 'scrollato', 'perso tempo'],
    consiglio: 'La noia è uno dei trigger più sottovalutati. Tieni pronta una lista di tre azioni da 10 minuti da fare al posto del comportamento che vuoi evitare, scritte prima che ti serva.',
  },
  {
    chiave: 'sociale',
    etichetta: 'Contesti sociali',
    emoji: '🍻',
    parole: ['amici', 'uscita', 'serata', 'festa', 'cena fuori', 'aperitivo', 'compleanno', 'invitato'],
    consiglio: 'Le situazioni sociali ricorrono nei tuoi scivoloni. Decidi la strategia prima di uscire (cosa dici, cosa ordini, a che ora torni): decidere sul momento, in mezzo agli altri, non funziona quasi mai.',
  },
  {
    chiave: 'ansia',
    etichetta: 'Ansia',
    emoji: '💭',
    parole: ['ansia', 'ansioso', 'panico', 'agitato', 'preoccupato', 'pensieri'],
    consiglio: 'Quando l\'ansia sale, il corpo viene prima della testa: 4 respiri lunghi con espirazione doppia rispetto all\'inspirazione abbassano l\'attivazione in meno di due minuti. Poi decidi.',
  },
  {
    chiave: 'motivazione',
    etichetta: 'Motivazione in calo',
    emoji: '🪫',
    parole: ['demotivato', 'non ho voglia', 'mollare', 'inutile', 'senso', 'stufo', 'basta'],
    consiglio: 'La motivazione non è affidabile: è un\'onda. Riduci la dimensione dell\'abitudine finché non ti serve motivazione per farla, e rialza l\'asticella quando l\'onda torna.',
  },
  {
    chiave: 'cibo',
    etichetta: 'Fame e cibo',
    emoji: '🍔',
    parole: ['fame', 'mangiato', 'abbuffata', 'dolce', 'zucchero', 'sgarro', 'cibo'],
    consiglio: 'Molte note ruotano attorno al cibo. Guarda l\'orario in cui succede: quasi sempre è un problema di pasto precedente troppo leggero o di stanchezza, non di forza di volontà.',
  },
  {
    chiave: 'orgoglio',
    etichetta: 'Momenti di forza',
    emoji: '💪',
    parole: ['fiero', 'orgoglioso', 'riuscito', 'resistito', 'ce l\'ho fatta', 'soddisfatto', 'grande'],
    consiglio: 'Rileggi queste note nei giorni difficili: sono la prova che ci sei già riuscito. È il tuo materiale motivazionale migliore, e l\'hai scritto tu.',
  },
]

export interface AnalisiTesto {
  /** -1 (molto negativo) .. +1 (molto positivo) */
  sentiment: number
  etichettaSentiment: string
  temi: Tema[]
  parole: number
}

function normalizza(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function analizzaTesti(testi: string[]): AnalisiTesto {
  const unito = normalizza(testi.join(' \n '))
  let pos = 0
  let neg = 0
  for (const w of POSITIVE) if (unito.includes(w)) pos += contaOccorrenze(unito, w)
  for (const w of NEGATIVE) if (unito.includes(w)) neg += contaOccorrenze(unito, w)
  const intensita = INTENSIFICATORI.reduce((a, w) => a + contaOccorrenze(unito, w), 0)
  const totale = pos + neg
  let sentiment = totale > 0 ? (pos - neg) / totale : 0
  if (intensita > 0) sentiment *= Math.min(1.3, 1 + intensita * 0.05)
  sentiment = Math.max(-1, Math.min(1, sentiment))

  const temi: Tema[] = []
  for (const t of TEMI) {
    let n = 0
    for (const p of t.parole) n += contaOccorrenze(unito, normalizza(p))
    if (n > 0) temi.push({ chiave: t.chiave, etichetta: t.etichetta, emoji: t.emoji, conteggio: n, consiglio: t.consiglio })
  }
  temi.sort((a, b) => b.conteggio - a.conteggio)

  return {
    sentiment,
    etichettaSentiment: etichettaSentiment(sentiment, totale),
    temi,
    parole: unito.split(/\s+/).filter(Boolean).length,
  }
}

function contaOccorrenze(testo: string, parola: string): number {
  if (!parola) return 0
  let n = 0
  let i = testo.indexOf(parola)
  while (i !== -1) { n++; i = testo.indexOf(parola, i + parola.length) }
  return n
}

function etichettaSentiment(s: number, campioni: number): string {
  if (campioni === 0) return 'neutro'
  if (s > 0.45) return 'molto positivo'
  if (s > 0.12) return 'positivo'
  if (s < -0.45) return 'molto pesante'
  if (s < -0.12) return 'in difficoltà'
  return 'altalenante'
}

/* ------------------------------------------------------------------ */
/* Analisi dei pattern nei dati                                        */
/* ------------------------------------------------------------------ */

export type TipoOsservazione = 'vittoria' | 'attenzione' | 'consiglio' | 'pattern'

export interface Osservazione {
  tipo: TipoOsservazione
  titolo: string
  testo: string
  habitId?: string
}

function noteRecenti(logs: LogEntry[], da: string): string[] {
  return logs
    .filter((l) => l.note && l.note.trim() && daysBetween(da, l.date) >= 0)
    .map((l) => l.note as string)
}

/** Giorno della settimana in cui salti più spesso. */
function giornoCritico(habits: Habit[], idx: LogIndex, oggi: string): { giorno: string; salti: number } | undefined {
  const conteggio = new Array(7).fill(0)
  for (const h of habits) {
    if (h.archived || h.kind === 'weekly') continue
    const da = daysBetween(h.startDate, oggi) > 60 ? addDays(oggi, -60) : h.startDate
    for (const d of rangeISO(da, addDays(oggi, -1))) {
      const s = idx.get(h.id)?.get(d)?.status
      const saltato = h.kind === 'quit' ? s === 'relapse' : s !== 'done'
      if (saltato) conteggio[parseISO(d).getDay()]++
    }
  }
  let best = -1
  let idxBest = -1
  conteggio.forEach((n, i) => { if (n > best) { best = n; idxBest = i } })
  const totale = conteggio.reduce((a, b) => a + b, 0)
  if (best < 3 || totale === 0 || best / totale < 0.25) return undefined
  const giorni = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']
  return { giorno: giorni[idxBest], salti: best }
}

/** Confronto tra gli ultimi 7 giorni e i 7 precedenti. */
export function trendSettimanale(state: AppState, oggi = todayISO()): { ora: number; prima: number; delta: number } {
  const idx = indexLogs(state.logs)
  const conta = (da: string, a: string) => {
    let n = 0
    for (const h of state.habits) {
      if (h.archived) continue
      for (const d of rangeISO(da, a)) {
        if (idx.get(h.id)?.get(d)?.status === 'done') n++
      }
    }
    return n
  }
  const ora = conta(addDays(oggi, -6), oggi)
  const prima = conta(addDays(oggi, -13), addDays(oggi, -7))
  return { ora, prima, delta: ora - prima }
}

export interface Analisi {
  testo: AnalisiTesto
  osservazioni: Osservazione[]
  /** Frase di apertura personalizzata. */
  sintesi: string
}

/**
 * Analisi completa: incrocia note, ricadute, streak e aderenza per produrre
 * osservazioni e consigli concreti.
 */
export function analizzaSituazione(state: AppState, oggi: string = todayISO()): Analisi {
  const idx = indexLogs(state.logs)
  const attive = state.habits.filter((h) => !h.archived)
  const oss: Osservazione[] = []

  const testiNote = [
    ...noteRecenti(state.logs, addDays(oggi, -30)),
    ...state.journal.filter((j) => daysBetween(addDays(oggi, -30), j.date) >= 0).map((j) => j.text),
  ]
  const testo = analizzaTesti(testiNote)

  // 1. Vittorie in corso
  for (const h of attive) {
    const s = habitStats(h, idx, oggi, state.settings.weekStartsMonday)
    if (s.streak >= 7) {
      oss.push({
        tipo: 'vittoria',
        titolo: `${h.name}: ${s.streak} ${s.streakUnit} di fila`,
        testo: s.streak === s.best
          ? 'Sei sul tuo record personale. Non serve fare di più: serve non interrompere.'
          : `Il tuo record è ${s.best} ${s.streakUnit}: ti mancano ${Math.max(1, s.best - s.streak + 1)} per superarlo.`,
        habitId: h.id,
      })
    }
    if (h.kind !== 'quit' && s.daysTracked >= 10 && s.aderenza < 50) {
      oss.push({
        tipo: 'attenzione',
        titolo: `${h.name} sta scivolando (${s.aderenza}%)`,
        testo: 'Quando un\'abitudine scende sotto il 50% il problema non è la volontà, è il design: è troppo grande, troppo vaga o all\'orario sbagliato. Prova a dimezzarla o a spostarla di orario.',
        habitId: h.id,
      })
    }
    if (h.kind === 'weekly' && s.weekTarget > 0) {
      const mancano = s.weekTarget - s.weekDone
      const giorniRimasti = 7 - daysBetween(startOfWeek(oggi, state.settings.weekStartsMonday), oggi)
      if (mancano > 0 && mancano >= giorniRimasti) {
        oss.push({
          tipo: 'attenzione',
          titolo: `${h.name}: settimana a rischio`,
          testo: `Ti ${mancano === 1 ? 'manca 1 sessione' : `mancano ${mancano} sessioni`} e ${giorniRimasti === 1 ? 'resta 1 giorno' : `restano ${Math.max(0, giorniRimasti)} giorni`}. O ti muovi oggi, o chiudi la settimana sotto obiettivo: meglio saperlo adesso.`,
          habitId: h.id,
        })
      }
    }
    if (h.kind === 'quit' && s.relapses > 0 && s.cleanDays >= 1) {
      oss.push({
        tipo: 'pattern',
        titolo: `${h.name}: ricadute registrate ${s.relapses}`,
        testo: 'Le ricadute fanno parte del percorso: quello che conta è la distanza media tra una e l\'altra. Guarda cosa avevi scritto nei giorni prima: la risposta è quasi sempre lì.',
        habitId: h.id,
      })
    }
  }

  // 2. Giorno critico della settimana
  const critico = giornoCritico(attive, idx, oggi)
  if (critico) {
    oss.push({
      tipo: 'pattern',
      titolo: `Il tuo punto debole è ${critico.giorno}`,
      testo: `È il giorno in cui salti più spesso (${critico.salti} volte). Non è un caso: cambia l'orario dell'abitudine solo per quel giorno, oppure preparati una versione ridotta da fare comunque.`,
    })
  }

  // 3. Trend
  const t = trendSettimanale(state, oggi)
  if (t.ora + t.prima > 0) {
    if (t.delta > 0) {
      oss.push({
        tipo: 'vittoria',
        titolo: `Settimana in crescita (+${t.delta})`,
        testo: `Hai completato ${t.ora} obiettivi negli ultimi 7 giorni contro ${t.prima} della settimana prima. La direzione è quella giusta.`,
      })
    } else if (t.delta < 0) {
      oss.push({
        tipo: 'attenzione',
        titolo: `Settimana in calo (${t.delta})`,
        testo: `${t.ora} obiettivi completati contro ${t.prima} della settimana precedente. Un calo isolato non è un problema, due di fila sì: scegli l'abitudine più importante e proteggi solo quella per i prossimi 7 giorni.`,
      })
    }
  }

  // 4. Temi dalle note
  for (const tema of testo.temi.slice(0, 3)) {
    oss.push({
      tipo: 'consiglio',
      titolo: `${tema.emoji} ${tema.etichetta} (${tema.conteggio} ${tema.conteggio === 1 ? 'volta' : 'volte'} nelle tue note)`,
      testo: tema.consiglio,
    })
  }

  // 5. Consigli specifici dal profilo dell'abitudine più importante
  const principale = [...attive].sort((a, b) => {
    const sa = habitStats(a, idx, oggi).progressDays
    const sb = habitStats(b, idx, oggi).progressDays
    return sb - sa
  })[0]
  if (principale) {
    const s = habitStats(principale, idx, oggi, state.settings.weekStartsMonday)
    const scheda = schedaBenefici(principale.name, principale.category, s.progressDays, principale.benefitKey)
    const consiglio = scheda.consigli[s.progressDays % scheda.consigli.length]
    if (consiglio) {
      oss.push({
        tipo: 'consiglio',
        titolo: `Per "${principale.name}"`,
        testo: consiglio,
        habitId: principale.id,
      })
    }
    if (scheda.prossima) {
      oss.push({
        tipo: 'pattern',
        titolo: `Prossimo beneficio: ${scheda.prossima.titolo}`,
        testo: `${scheda.prossima.testo} Mancano ${Math.max(1, scheda.prossima.giorni - s.progressDays)} giorni.`,
        habitId: principale.id,
      })
    }
  }

  // 6. Piano alimentare
  const dieta = andamento(state, oggi, 14)
  if (dieta.giorniRegistrati >= 3) {
    const scarto = dieta.mediaKcal - dieta.mediaPiano
    if (scarto > 250) {
      oss.push({
        tipo: 'attenzione',
        titolo: `Dieta: ${scarto} kcal al giorno sopra il piano`,
        testo: `Stai mangiando in media ${dieta.mediaKcal} kcal contro le ${dieta.mediaPiano} previste dallo schema. Guarda la voce "fuori piano": quasi sempre la differenza sta lì, non nei pasti principali.`,
      })
    } else if (scarto < -300) {
      oss.push({
        tipo: 'attenzione',
        titolo: `Dieta: ${Math.abs(scarto)} kcal al giorno sotto il piano`,
        testo: 'Mangiare troppo meno del previsto non accelera i risultati: fa perdere massa e ti fa arrivare affamato la sera. Controlla quali pasti stai saltando.',
      })
    } else {
      oss.push({
        tipo: 'vittoria',
        titolo: `Dieta in linea: ${dieta.mediaKcal} kcal al giorno`,
        testo: `Media degli ultimi giorni contro le ${dieta.mediaPiano} previste, con un'aderenza del ${dieta.mediaAderenza}%. Continua così.`,
      })
    }

    const trascurati = pastiTrascurati(state, addDays(oggi, -29), oggi)
    const peggiore = Object.entries(trascurati).sort((x, y) => y[1] - x[1])[0]
    if (peggiore && peggiore[1] >= 3) {
      oss.push({
        tipo: 'pattern',
        titolo: `Salti spesso: ${NOMI_PASTI[peggiore[0] as keyof typeof NOMI_PASTI]}`,
        testo: `${peggiore[1]} volte nell'ultimo mese. Se è un problema di tempo, preparalo la sera prima; se è di fame, il pasto precedente è troppo leggero. Saltarlo sposta le calorie a fine giornata, dove pesano di più.`,
      })
    }
  } else if (state.dieta.length === 0) {
    oss.push({
      tipo: 'consiglio',
      titolo: 'Il piano alimentare è pronto ma vuoto',
      testo: 'Apri la scheda Dieta e spunta i pasti man mano che li fai: dopo 4-5 giorni posso dirti se stai davvero seguendo lo schema e in che direzione vanno le calorie.',
    })
  }

  // 7. Nessun dato
  if (attive.length === 0) {
    oss.push({
      tipo: 'consiglio',
      titolo: 'Inizia da una sola abitudine',
      testo: 'Chi parte con cinque abitudini insieme molla nel 90% dei casi. Scegli quella che, se andasse bene, renderebbe più facili tutte le altre.',
    })
  } else if (testiNote.length === 0) {
    oss.push({
      tipo: 'consiglio',
      titolo: 'Scrivi due righe quando registri la giornata',
      testo: 'Le note sono i dati che mi servono per analizzare i tuoi pattern: senza, posso guardare solo i numeri. Anche "giornata storta, troppo lavoro" è utile.',
    })
  }

  const sintesi = costruisciSintesi(state, idx, oggi, testo)
  return { testo, osservazioni: oss, sintesi }
}

function costruisciSintesi(state: AppState, idx: LogIndex, oggi: string, testo: AnalisiTesto): string {
  const attive = state.habits.filter((h) => !h.archived)
  if (attive.length === 0) return 'Non hai ancora abitudini attive. Aggiungine una e inizio subito a tracciare i tuoi progressi.'
  const totaleStreak = attive.map((h) => habitStats(h, idx, oggi, state.settings.weekStartsMonday))
  const migliore = totaleStreak.reduce((a, b) => (b.streak > a.streak ? b : a))
  const media = Math.round(totaleStreak.reduce((a, s) => a + s.aderenza, 0) / totaleStreak.length)
  const tono = testo.parole > 20
    ? ` Il tono di quello che scrivi negli ultimi 30 giorni è ${testo.etichettaSentiment}.`
    : ''
  return `Stai portando avanti ${attive.length} ${attive.length === 1 ? 'abitudine' : 'abitudini'} con un'aderenza media del ${media}%. La serie più lunga in corso è di ${migliore.streak} ${migliore.streakUnit}.${tono}`
}

/** Riepilogo settimanale pronto da mostrare o esportare. */
export function riepilogoSettimana(state: AppState, oggi: string = todayISO()): string[] {
  const idx = indexLogs(state.logs)
  const righe: string[] = []
  const da = addDays(oggi, -6)
  righe.push(`Settimana ${formatCorto(da)} - ${formatCorto(oggi)}`)
  for (const h of state.habits.filter((x) => !x.archived)) {
    let fatti = 0
    let saltati = 0
    for (const d of rangeISO(da, oggi)) {
      const s = idx.get(h.id)?.get(d)?.status
      if (s === 'done') fatti++
      else if (s === 'missed' || s === 'relapse') saltati++
    }
    const st = habitStats(h, idx, oggi, state.settings.weekStartsMonday)
    righe.push(
      h.kind === 'quit'
        ? `${h.name}: ${st.cleanDays} giorni puliti${saltati ? `, ${saltati} ricadute questa settimana` : ''}`
        : `${h.name}: ${fatti}/7 giorni${h.kind === 'weekly' ? ` (obiettivo ${st.weekTarget}/sett.)` : ''}`,
    )
  }
  righe.push(`Oggi è ${nomeGiorno(oggi)}.`)
  return righe
}
