/**
 * Programma di allenamento (Jacopo Palloni PT, Virgin Active — schede
 * "IPERTROFIA A" e "IPERTROFIA B" per Lorenzo Mazza, 5 settimane).
 *
 * Ogni esercizio ha una prescrizione diversa per ciascuna delle 5 settimane:
 * serie, ripetizioni, buffer (ripetizioni lasciate in canna) e recupero.
 */

export type SiglaScheda = 'A' | 'B'
/** Una sessione può essere anche quella con il personal trainer. */
export type TipoSessione = SiglaScheda | 'PT'

export interface Prescrizione {
  serie: number
  ripetizioni: number
  /** Ripetizioni da lasciare in canna. Assente sugli addominali. */
  buffer?: number
  recupero: string
}

export interface Esercizio {
  id: string
  nome: string
  /** Indicazione tecnica breve, come promemoria in palestra. */
  tecnica?: string
  /** Prescrizione per le settimane 1-5. */
  settimane: Prescrizione[]
}

export interface Scheda {
  sigla: SiglaScheda
  nome: string
  esercizi: Esercizio[]
}

export interface Programma {
  id: string
  nome: string
  autore: string
  contatto: string
  settimane: number
  schede: Scheda[]
  regole: string[]
}

const rec = (r: string) => r

/** Costruttore compatto: [serie, ripetizioni, buffer|null] per settimana. */
function sett(
  valori: [number, number, number | null][],
  recuperi: string[],
): Prescrizione[] {
  return valori.map(([serie, ripetizioni, buffer], i) => ({
    serie,
    ripetizioni,
    buffer: buffer ?? undefined,
    recupero: recuperi[i] ?? recuperi[recuperi.length - 1],
  }))
}

const REC_MEDIO = [rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\"")]
const REC_ADDOME = [rec('30"'), rec('30"'), rec('30"'), rec('30"'), rec('30"')]

export const PROGRAMMA: Programma = {
  id: 'palloni-ipertrofia-5w',
  nome: 'Ipertrofia A/B — 5 settimane',
  autore: 'Jacopo Palloni, personal trainer',
  contatto: 'j.palloni@virginactive.it · 3388608476',
  settimane: 5,
  regole: [
    'BUFFER: se da settimana a settimana scende, aumenta il carico; se sale, diminuiscilo.',
    'RIPETIZIONI: se da settimana a settimana, o fra una serie e l\'altra, scendono, aumenta il carico; se salgono, diminuiscilo.',
    'Il buffer sono le ripetizioni che ti restano in canna a fine serie: buffer 2 significa fermarsi due ripetizioni prima del cedimento.',
    'Alterna sempre le schede: mai due volte di fila la stessa. La sessione con il personal trainer non rompe l\'alternanza.',
    'Rispetta i tempi di recupero: sono parte del programma quanto i carichi.',
  ],
  schede: [
    {
      sigla: 'A',
      nome: 'Ipertrofia A',
      esercizi: [
        {
          id: 'a-squat',
          nome: 'Squat',
          tecnica: 'Schiena neutra, ginocchia in linea con i piedi, scendi almeno al parallelo.',
          settimane: sett(
            [[4, 10, 2], [4, 8, 2], [4, 8, 1], [5, 8, 1], [3, 10, 3]],
            [rec("1'30\"/2'00\""), rec("1'30\"/2'00\""), rec("1'30\"/2'00\""), rec("1'30\"/2'00\""), rec("1'00\"/1'30\"")],
          ),
        },
        {
          id: 'a-trazioni',
          nome: 'Trazioni easy (chin dip)',
          tecnica: 'Assistenza alla chin/dip machine, scapole basse, salita controllata.',
          settimane: sett([[4, 10, 2], [4, 8, 2], [4, 8, 1], [5, 8, 1], [3, 10, 3]], REC_MEDIO),
        },
        {
          id: 'a-panca-inclinata',
          nome: 'Panca inclinata',
          tecnica: 'Scapole addotte, gomiti a 45°, bilanciere alla parte alta del petto.',
          settimane: sett([[4, 12, 2], [4, 10, 2], [4, 8, 2], [5, 8, 1], [3, 10, 3]], REC_MEDIO),
        },
        {
          id: 'a-pulley',
          nome: 'Pulley',
          tecnica: 'Busto fermo, tira con i gomiti, stringi le scapole a fine movimento.',
          settimane: sett([[4, 10, 2], [4, 10, 2], [4, 10, 2], [5, 10, 1], [3, 10, 3]], REC_MEDIO),
        },
        {
          id: 'a-shoulder-press',
          nome: 'Shoulder press',
          tecnica: 'Schiena appoggiata, non inarcare la lombare, spingi senza bloccare i gomiti.',
          settimane: sett([[4, 10, 2], [4, 10, 2], [4, 10, 2], [5, 10, 1], [3, 10, 3]], REC_MEDIO),
        },
        {
          id: 'a-leg-extension',
          nome: 'Leg extension',
          tecnica: 'Fermo un secondo in alto, discesa lenta.',
          settimane: sett([[4, 12, 2], [4, 10, 2], [4, 8, 2], [5, 6, 2], [3, 10, 3]], REC_MEDIO),
        },
        {
          id: 'a-situp',
          nome: 'Sit up',
          tecnica: 'Movimento controllato, non tirare il collo con le mani.',
          settimane: sett([[4, 10, null], [4, 10, null], [5, 10, null], [5, 10, null], [4, 10, null]], REC_ADDOME),
        },
      ],
    },
    {
      sigla: 'B',
      nome: 'Ipertrofia B',
      esercizi: [
        {
          id: 'b-panca-piana',
          nome: 'Panca piana',
          tecnica: 'Piedi a terra, scapole addotte, bilanciere allo sterno.',
          settimane: sett(
            [[4, 12, 2], [4, 10, 2], [4, 8, 2], [5, 8, 1], [3, 12, 3]],
            [rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"")],
          ),
        },
        {
          id: 'b-leg-press',
          nome: 'Leg press 45°',
          tecnica: 'Non bloccare le ginocchia in alto, lombare sempre appoggiata.',
          settimane: sett(
            [[4, 12, 2], [4, 10, 2], [4, 8, 2], [5, 8, 1], [3, 12, 3]],
            [rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"")],
          ),
        },
        {
          id: 'b-lat-inversa',
          nome: 'Lat machine presa inversa',
          tecnica: 'Presa supina alla larghezza delle spalle, porta la barra allo sterno.',
          settimane: sett(
            [[4, 10, 2], [4, 8, 2], [4, 8, 2], [5, 8, 2], [3, 12, 3]],
            [rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"")],
          ),
        },
        {
          id: 'b-push-down',
          nome: 'Push down ai cavi con fune',
          tecnica: 'Gomiti fermi al fianco, apri la fune a fine spinta.',
          settimane: sett(
            [[4, 10, 2], [4, 10, 2], [4, 10, 2], [5, 10, 2], [3, 10, 3]],
            [rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"")],
          ),
        },
        {
          id: 'b-curl-bilanciere',
          nome: 'Curl in piedi con bilanciere',
          tecnica: 'Niente slancio di schiena, discesa controllata.',
          settimane: sett(
            [[4, 10, 2], [4, 10, 2], [4, 10, 2], [5, 10, 2], [3, 10, 3]],
            [rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"/1'30\""), rec("1'00\"")],
          ),
        },
        {
          id: 'b-leg-raise',
          nome: 'Leg raise',
          tecnica: 'Lombare aderente, salita senza slancio.',
          settimane: sett([[4, 10, null], [4, 10, null], [5, 10, null], [5, 10, null], [4, 15, null]], REC_ADDOME),
        },
      ],
    },
  ],
}

export function scheda(sigla: SiglaScheda): Scheda {
  return PROGRAMMA.schede.find((s) => s.sigla === sigla) ?? PROGRAMMA.schede[0]
}

export function esercizioPerId(id: string): Esercizio | undefined {
  for (const s of PROGRAMMA.schede) {
    const e = s.esercizi.find((x) => x.id === id)
    if (e) return e
  }
  return undefined
}

/** Prescrizione di un esercizio per la settimana indicata (1-5). */
export function prescrizione(esercizio: Esercizio, settimana: number): Prescrizione {
  const i = Math.min(Math.max(1, settimana), esercizio.settimane.length) - 1
  return esercizio.settimane[i]
}

export function descriviPrescrizione(p: Prescrizione): string {
  return `${p.serie} × ${p.ripetizioni}${p.buffer !== undefined ? ` · buffer ${p.buffer}` : ''} · rec. ${p.recupero}`
}
