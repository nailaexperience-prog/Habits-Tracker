import type { ConfigProgramma, DietaGiorno } from './types'
import { EMOJI_PASTI, NOMI_PASTI, ORARI_PASTI, ORDINE_PASTI, type PastoPianificato } from './dieta'
import { opzioneScelta, pianoDelGiorno, vuotoDieta } from './dietaLog'
import { addDays, startOfWeek, todayISO } from './dates'

/** Descrizione testuale di un pasto: "Pane integrale 80 g · Marmellata 15 g". */
export function descriviPasto(pasto: PastoPianificato, log: DietaGiorno): string {
  return pasto.slot
    .map((s) => opzioneScelta(s, log).alimenti.map((a) => `${a.nome} ${a.quantita}`).join(' + '))
    .join(' · ')
}

/* ------------------------------------------------------------------ */
/* Notifiche del browser                                               */
/* ------------------------------------------------------------------ */

export function notificheSupportate(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function permessoNotifiche(): NotificationPermission | 'non-supportato' {
  return notificheSupportate() ? Notification.permission : 'non-supportato'
}

export async function chiediPermessoNotifiche(): Promise<NotificationPermission | 'non-supportato'> {
  if (!notificheSupportate()) return 'non-supportato'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/**
 * Programma le notifiche dei pasti ancora da fare oggi.
 * Funzionano finché l'app resta aperta (anche in background): per promemoria
 * indipendenti dall'app si usa l'esportazione nel calendario.
 * Restituisce la funzione per annullarle.
 */
export function programmaNotificheOggi(
  pasti: PastoPianificato[],
  log: DietaGiorno,
  adesso: Date = new Date(),
): () => void {
  if (!notificheSupportate() || Notification.permission !== 'granted') return () => {}
  const timers: number[] = []
  for (const p of pasti) {
    if (p.slot.every((s) => log.consumo[s.id])) continue
    const [h, m] = ORARI_PASTI[p.pasto].split(':').map(Number)
    const quando = new Date(adesso)
    quando.setHours(h, m, 0, 0)
    const ritardo = quando.getTime() - adesso.getTime()
    if (ritardo <= 0 || ritardo > 86400000) continue
    const id = window.setTimeout(() => {
      try {
        new Notification(`${EMOJI_PASTI[p.pasto]} ${NOMI_PASTI[p.pasto]}`, {
          body: descriviPasto(p, log),
          tag: `pasto-${p.pasto}`,
          icon: './icon-192.png',
        })
      } catch {
        // Alcuni browser bloccano le notifiche fuori dal service worker: si ignora.
      }
    }, ritardo)
    timers.push(id)
  }
  return () => timers.forEach((t) => window.clearTimeout(t))
}

/** Programma una singola notifica a un orario di oggi. Restituisce l'annullamento. */
export function programmaNotifica(
  orario: string,
  titolo: string,
  corpo: string,
  tag: string,
  adesso: Date = new Date(),
): () => void {
  if (!notificheSupportate() || Notification.permission !== 'granted') return () => {}
  const [h, m] = orario.split(':').map(Number)
  const quando = new Date(adesso)
  quando.setHours(h, m, 0, 0)
  const ritardo = quando.getTime() - adesso.getTime()
  if (ritardo <= 0 || ritardo > 86400000) return () => {}
  const id = window.setTimeout(() => {
    try {
      new Notification(titolo, { body: corpo, tag, icon: './icon-192.png' })
    } catch {
      // Notifiche non disponibili in questo contesto.
    }
  }, ritardo)
  return () => window.clearTimeout(id)
}

/* ------------------------------------------------------------------ */
/* Esportazione nel calendario (.ics)                                  */
/* ------------------------------------------------------------------ */

const GIORNI_ICS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

function escapeICS(testo: string): string {
  return testo
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

function timestamp(data: string, orario: string): string {
  const [h, m] = orario.split(':')
  return `${data.replace(/-/g, '')}T${h}${m}00`
}

/**
 * Genera un calendario con un evento ricorrente settimanale per ogni pasto di
 * ogni giorno, con l'elenco degli alimenti e una sveglia all'orario del pasto.
 * Importandolo nel telefono i promemoria arrivano anche ad app chiusa.
 */
export function generaICS(oggi: string = todayISO(), anticipoMinuti = 10): string {
  const lunedi = startOfWeek(oggi, true)
  const righe: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Livelli//Piano alimentare//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Piano alimentare',
  ]

  for (let g = 0; g < 7; g++) {
    const data = addDays(lunedi, g)
    const pasti = pianoDelGiorno(data, false)
    const log = vuotoDieta(data)
    for (const pasto of [...pasti].sort((x, y) => ORDINE_PASTI.indexOf(x.pasto) - ORDINE_PASTI.indexOf(y.pasto))) {
      const inizio = timestamp(data, ORARI_PASTI[pasto.pasto])
      const [h, m] = ORARI_PASTI[pasto.pasto].split(':').map(Number)
      const fine = timestamp(data, `${String(h + (m >= 30 ? 1 : 0)).padStart(2, '0')}:${String((m + 30) % 60).padStart(2, '0')}`)
      const descrizione = escapeICS(
        `${descriviPasto(pasto, log)}${pasto.nota ? `\n\n${pasto.nota}` : ''}\n\nSpunta il pasto nell'app Livelli.`,
      )
      righe.push(
        'BEGIN:VEVENT',
        `UID:livelli-${pasto.pasto}-${g}@habits-tracker`,
        `DTSTAMP:${timestamp(oggi, '08:00')}Z`,
        `DTSTART:${inizio}`,
        `DTEND:${fine}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${GIORNI_ICS[g]}`,
        `SUMMARY:${escapeICS(`${EMOJI_PASTI[pasto.pasto]} ${NOMI_PASTI[pasto.pasto]}`)}`,
        `DESCRIPTION:${descrizione}`,
        'BEGIN:VALARM',
        `TRIGGER:-PT${anticipoMinuti}M`,
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(NOMI_PASTI[pasto.pasto])}`,
        'END:VALARM',
        'END:VEVENT',
      )
    }
  }

  righe.push('END:VCALENDAR')
  // Le righe ICS non dovrebbero superare i 75 ottetti: si ripiegano con uno spazio.
  return righe.flatMap(piega).join('\r\n')
}

/**
 * Ripiega le righe lunghe come richiede il formato iCalendar. Il limite è di 75
 * ottetti: si taglia a 60 caratteri per stare larghi anche con emoji e accenti.
 */
function piega(riga: string): string[] {
  const LIMITE = 60
  if (riga.length <= LIMITE) return [riga]
  const pezzi: string[] = [riga.slice(0, LIMITE)]
  let resto = riga.slice(LIMITE)
  while (resto.length > LIMITE - 1) {
    pezzi.push(` ${resto.slice(0, LIMITE - 1)}`)
    resto = resto.slice(LIMITE - 1)
  }
  if (resto) pezzi.push(` ${resto}`)
  return pezzi
}

/**
 * Calendario dei soli allenamenti, sui giorni scelti e all'orario impostato.
 * La scheda del giorno (A o B) dipende dall'alternanza, quindi l'evento rimanda
 * all'app invece di indicarne una a caso.
 */
export function generaICSAllenamenti(config: ConfigProgramma, oggi: string = todayISO()): string {
  const lunedi = startOfWeek(oggi, true)
  const righe: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Livelli//Allenamento//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Allenamento',
  ]
  for (const g of [...config.giorni].sort((a, b) => a - b)) {
    const data = addDays(lunedi, g)
    const [h, m] = config.orario.split(':').map(Number)
    const fineOra = `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    righe.push(
      'BEGIN:VEVENT',
      `UID:livelli-allenamento-${g}@habits-tracker`,
      `DTSTAMP:${timestamp(oggi, '08:00')}Z`,
      `DTSTART:${timestamp(data, config.orario)}`,
      `DTEND:${timestamp(data, fineOra)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${GIORNI_ICS[g]}`,
      'SUMMARY:🏋️ Allenamento',
      `DESCRIPTION:${escapeICS('Apri Livelli per la scheda di oggi: le schede A e B si alternano, quindi te la dice l\'app in base all\'ultima che hai fatto.')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Allenamento',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  righe.push('END:VCALENDAR')
  return righe.flatMap(piega).join('\r\n')
}

/** Scarica un file .ics già generato. */
export function scaricaFile(contenuto: string, nomeFile: string): void {
  const blob = new Blob([contenuto], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function scaricaICS(nomeFile = 'piano-alimentare.ics', oggi: string = todayISO()): void {
  scaricaFile(generaICS(oggi), nomeFile)
}
