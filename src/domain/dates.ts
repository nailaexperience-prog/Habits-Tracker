/** Utility di date basate su stringhe ISO locali (YYYY-MM-DD), senza fusi orari. */

export function toISO(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayISO(now: Date = new Date()): string {
  return toISO(now)
}

export function addDays(iso: string, delta: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + delta)
  return toISO(d)
}

/** Giorni interi tra due date ISO (b - a). */
export function daysBetween(a: string, b: string): number {
  const ms = parseISO(b).getTime() - parseISO(a).getTime()
  return Math.round(ms / 86400000)
}

export function isFuture(iso: string, today = todayISO()): boolean {
  return daysBetween(today, iso) > 0
}

/** Elenco di date ISO da `from` a `to` inclusi. */
export function rangeISO(from: string, to: string): string[] {
  const out: string[] = []
  const n = daysBetween(from, to)
  for (let i = 0; i <= n; i++) out.push(addDays(from, i))
  return out
}

/** Lunedì (o domenica) della settimana della data indicata. */
export function startOfWeek(iso: string, mondayFirst = true): string {
  const d = parseISO(iso)
  const dow = d.getDay() // 0 = domenica
  const shift = mondayFirst ? (dow + 6) % 7 : dow
  return addDays(iso, -shift)
}

export function startOfMonth(iso: string): string {
  const d = parseISO(iso)
  return toISO(new Date(d.getFullYear(), d.getMonth(), 1))
}

export function endOfMonth(iso: string): string {
  const d = parseISO(iso)
  return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

const MESI = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato']

export const GIORNI_CORTI = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

export function nomeMese(iso: string): string {
  return MESI[parseISO(iso).getMonth()]
}

export function nomeGiorno(iso: string): string {
  return GIORNI[parseISO(iso).getDay()]
}

/** "25 agosto 2026" */
export function formatLungo(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

/** "25 ago" */
export function formatCorto(iso: string): string {
  const d = parseISO(iso)
  return `${d.getDate()} ${MESI[d.getMonth()].slice(0, 3)}`
}

/** Etichetta relativa: Oggi / Ieri / data. */
export function etichettaGiorno(iso: string, today = todayISO()): string {
  const diff = daysBetween(iso, today)
  if (diff === 0) return 'Oggi'
  if (diff === 1) return 'Ieri'
  if (diff === -1) return 'Domani'
  return formatLungo(iso)
}

/** Trasforma un numero di giorni in una frase leggibile: "1 anno, 2 mesi e 3 giorni". */
export function durataUmana(giorni: number): string {
  if (giorni <= 0) return 'oggi è il giorno 1'
  const anni = Math.floor(giorni / 365)
  const mesi = Math.floor((giorni % 365) / 30)
  const gg = giorni - anni * 365 - mesi * 30
  const parti: string[] = []
  if (anni) parti.push(`${anni} ${anni === 1 ? 'anno' : 'anni'}`)
  if (mesi) parti.push(`${mesi} ${mesi === 1 ? 'mese' : 'mesi'}`)
  if (gg) parti.push(`${gg} ${gg === 1 ? 'giorno' : 'giorni'}`)
  if (parti.length === 1) return parti[0]
  return `${parti.slice(0, -1).join(', ')} e ${parti[parti.length - 1]}`
}
