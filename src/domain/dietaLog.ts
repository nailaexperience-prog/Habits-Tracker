import type { AppState, ConsumoSlot, DietaGiorno } from './types'
import {
  MERENDA_ALLENAMENTO, ORDINE_PASTI, PIANO, STAGIONALITA,
  type PastoPianificato, type Slot,
} from './dieta'
import { addDays, parseISO, rangeISO, todayISO } from './dates'

/** Indice del giorno nel piano: 0 = lunedì. */
export function indiceGiorno(dateISO: string): number {
  return (parseISO(dateISO).getDay() + 6) % 7
}

/** Il piano del giorno, con la merenda sostituita nei giorni di allenamento. */
export function pianoDelGiorno(dateISO: string, allenamento = false): PastoPianificato[] {
  const giorno = PIANO[indiceGiorno(dateISO)]
  if (!allenamento) return giorno
  return giorno.map((p) =>
    p.pasto === 'merenda'
      ? { ...p, slot: MERENDA_ALLENAMENTO, nota: 'Merenda da giorno di allenamento.' }
      : p,
  )
}

export function vuotoDieta(date: string): DietaGiorno {
  return { date, scelte: {}, consumo: {}, extra: [] }
}

export function giornoDieta(state: AppState, date: string): DietaGiorno {
  return state.dieta.find((d) => d.date === date) ?? vuotoDieta(date)
}

/** Opzione attualmente scelta per uno slot (la prima è il default). */
export function opzioneScelta(slot: Slot, log: DietaGiorno) {
  const id = log.scelte[slot.id]
  return slot.opzioni.find((o) => o.id === id) ?? slot.opzioni[0]
}

export function kcalSlot(slot: Slot, log: DietaGiorno): number {
  const opzione = opzioneScelta(slot, log)
  return opzione.alimenti.reduce((tot, a) => tot + a.kcal, 0)
}

const FATTORE: Record<ConsumoSlot, number> = { tutto: 1, meta: 0.5, saltato: 0 }

/** Calorie previste dal piano per la giornata, in base alle opzioni scelte. */
export function kcalPianificate(pasti: PastoPianificato[], log: DietaGiorno): number {
  let tot = 0
  for (const p of pasti) for (const s of p.slot) tot += kcalSlot(s, log)
  return Math.round(tot)
}

/** Calorie effettivamente registrate: slot consumati + alimenti fuori piano. */
export function kcalConsumate(pasti: PastoPianificato[], log: DietaGiorno): number {
  let tot = 0
  for (const p of pasti) {
    for (const s of p.slot) {
      const stato = log.consumo[s.id]
      if (!stato) continue
      tot += kcalSlot(s, log) * FATTORE[stato]
    }
  }
  for (const e of log.extra) tot += e.kcal
  return Math.round(tot)
}

export interface AderenzaGiorno {
  /** 0-100: quanto del piano hai seguito. */
  percentuale: number
  /** Slot previsti che contano per l'aderenza. */
  previsti: number
  completati: number
  /** Vero se hai registrato almeno una cosa. */
  iniziato: boolean
  /** Vero quando tutti gli slot obbligatori sono stati consumati per intero. */
  completo: boolean
}

export function aderenzaGiorno(pasti: PastoPianificato[], log: DietaGiorno): AderenzaGiorno {
  let previsti = 0
  let punteggio = 0
  let completati = 0
  let interi = 0
  for (const p of pasti) {
    for (const s of p.slot) {
      if (s.libero) continue
      previsti++
      const stato = log.consumo[s.id]
      if (!stato) continue
      punteggio += FATTORE[stato]
      if (stato !== 'saltato') completati++
      if (stato === 'tutto') interi++
    }
  }
  const iniziato = Object.keys(log.consumo).length > 0 || log.extra.length > 0
  return {
    percentuale: previsti > 0 ? Math.round((punteggio / previsti) * 100) : 0,
    previsti,
    completati,
    iniziato,
    completo: previsti > 0 && interi === previsti,
  }
}

export interface RiepilogoDieta {
  date: string
  kcal: number
  kcalPiano: number
  aderenza: number
  registrato: boolean
}

export function riepilogoGiorni(state: AppState, da: string, a: string): RiepilogoDieta[] {
  return rangeISO(da, a).map((date) => {
    const log = giornoDieta(state, date)
    const pasti = pianoDelGiorno(date, log.allenamento)
    const ad = aderenzaGiorno(pasti, log)
    return {
      date,
      kcal: kcalConsumate(pasti, log),
      kcalPiano: kcalPianificate(pasti, log),
      aderenza: ad.percentuale,
      registrato: ad.iniziato,
    }
  })
}

export interface AndamentoDieta {
  giorni: RiepilogoDieta[]
  /** Media calorica sui giorni effettivamente registrati. */
  mediaKcal: number
  mediaPiano: number
  mediaAderenza: number
  giorniRegistrati: number
  /** Differenza tra la media degli ultimi 7 giorni e quella dei 7 precedenti. */
  variazione: number
  /** Vero solo se entrambe le settimane hanno abbastanza giorni registrati. */
  confrontabile: boolean
  /** Serie di giorni consecutivi con almeno una registrazione. */
  serie: number
}

export function andamento(state: AppState, oggi: string = todayISO(), giorni = 14): AndamentoDieta {
  const lista = riepilogoGiorni(state, addDays(oggi, -(giorni - 1)), oggi)
  const registrati = lista.filter((g) => g.registrato)
  const media = (v: RiepilogoDieta[], sel: (g: RiepilogoDieta) => number) =>
    v.length > 0 ? Math.round(v.reduce((t, g) => t + sel(g), 0) / v.length) : 0

  const ultimi7 = lista.slice(-7).filter((g) => g.registrato)
  const precedenti7 = lista.slice(-14, -7).filter((g) => g.registrato)

  let serie = 0
  for (let i = lista.length - 1; i >= 0; i--) {
    if (lista[i].registrato) serie++
    else if (lista[i].date !== oggi) break
  }

  // Il confronto fra settimane ha senso solo se entrambe hanno dati veri.
  const confrontabile = ultimi7.length >= 2 && precedenti7.length >= 2

  return {
    giorni: lista,
    mediaKcal: media(registrati, (g) => g.kcal),
    mediaPiano: media(registrati, (g) => g.kcalPiano),
    mediaAderenza: media(registrati, (g) => g.aderenza),
    giorniRegistrati: registrati.length,
    variazione: confrontabile ? media(ultimi7, (g) => g.kcal) - media(precedenti7, (g) => g.kcal) : 0,
    confrontabile,
    serie,
  }
}

/** Quante volte ogni pasto è stato saltato o lasciato in bianco nel periodo. */
export function pastiTrascurati(state: AppState, da: string, a: string): Record<string, number> {
  const conteggio: Record<string, number> = {}
  for (const date of rangeISO(da, a)) {
    const log = state.dieta.find((d) => d.date === date)
    if (!log) continue
    const ad = aderenzaGiorno(pianoDelGiorno(date, log.allenamento), log)
    if (!ad.iniziato) continue
    for (const p of pianoDelGiorno(date, log.allenamento)) {
      const slotVeri = p.slot.filter((s) => !s.libero)
      if (slotVeri.length === 0) continue
      const saltato = slotVeri.every((s) => !log.consumo[s.id] || log.consumo[s.id] === 'saltato')
      if (saltato) conteggio[p.pasto] = (conteggio[p.pasto] ?? 0) + 1
    }
  }
  return conteggio
}

/** Frutta e verdura di stagione per il mese della data indicata. */
export function stagioneDi(dateISO: string) {
  return STAGIONALITA[parseISO(dateISO).getMonth()]
}

/** Il prossimo pasto da consumare oggi, in base all'ora corrente. */
export function prossimoPasto(
  pasti: PastoPianificato[],
  log: DietaGiorno,
  orari: Record<string, string>,
  adesso: Date = new Date(),
): { pasto: PastoPianificato; orario: string } | undefined {
  const minutiOra = adesso.getHours() * 60 + adesso.getMinutes()
  const ordinati = [...pasti].sort(
    (x, y) => ORDINE_PASTI.indexOf(x.pasto) - ORDINE_PASTI.indexOf(y.pasto),
  )
  const daFare = ordinati.filter((p) => !p.slot.every((s) => log.consumo[s.id]))
  if (daFare.length === 0) return undefined
  // Il primo pasto non ancora chiuso il cui orario non sia passato da più di un'ora e mezza.
  const imminente = daFare.find((p) => {
    const [h, m] = orari[p.pasto].split(':').map(Number)
    return h * 60 + m >= minutiOra - 90
  })
  const scelto = imminente ?? daFare[0]
  return { pasto: scelto, orario: orari[scelto.pasto] }
}
