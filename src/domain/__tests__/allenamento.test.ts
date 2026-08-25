import { describe, expect, it } from 'vitest'
import { PROGRAMMA, descriviPrescrizione, prescrizione, scheda } from '../allenamento'
import {
  ancoraSettimana, nuovaSessione, pesoMassimo, progressione, programmaFinito,
  prossimaScheda, sessioniDellaSettimana, settimanaDi, statoPalestra, suggerimentoCarico,
  ultimaVolta, volumeSessione,
} from '../allenamentoLog'
import { generaICSAllenamenti } from '../promemoria'
import { valutaPremi } from '../rewards'
import type { AppState, ConfigProgramma, Sessione } from '../types'

const OGGI = '2026-08-25' // martedì della settimana che inizia lunedì 24

const CONFIG: ConfigProgramma = {
  programmaId: PROGRAMMA.id,
  inizio: ancoraSettimana(3, OGGI),
  giorni: [0, 1, 3, 4],
  orario: '18:30',
}

function stato(allenamenti: Sessione[], programma: ConfigProgramma = CONFIG): AppState {
  return {
    version: 1,
    profile: { name: '', createdAt: 0, xp: 0, lastSeenLevel: 1 },
    habits: [], logs: [], journal: [], rewards: [], dieta: [],
    allenamenti,
    programma,
    settings: { reduceMotion: false, weekStartsMonday: true, promemoriaPasti: false },
  }
}

const sessione = (id: string, date: string, tipo: 'A' | 'B' | 'PT', settimana = 3): Sessione =>
  nuovaSessione(id, date, tipo, settimana)

describe('programma del personal trainer', () => {
  it('ha due schede con le prescrizioni delle cinque settimane', () => {
    expect(PROGRAMMA.schede.map((s) => s.sigla)).toEqual(['A', 'B'])
    for (const s of PROGRAMMA.schede) {
      expect(s.esercizi.length).toBeGreaterThanOrEqual(6)
      for (const e of s.esercizi) expect(e.settimane).toHaveLength(5)
    }
  })

  it('riporta fedelmente lo squat della scheda A', () => {
    const squat = scheda('A').esercizi[0]
    expect(squat.nome).toBe('Squat')
    expect(prescrizione(squat, 1)).toMatchObject({ serie: 4, ripetizioni: 10, buffer: 2 })
    expect(prescrizione(squat, 3)).toMatchObject({ serie: 4, ripetizioni: 8, buffer: 1 })
    expect(prescrizione(squat, 4)).toMatchObject({ serie: 5, ripetizioni: 8, buffer: 1 })
    expect(prescrizione(squat, 5)).toMatchObject({ serie: 3, ripetizioni: 10, buffer: 3 })
    expect(descriviPrescrizione(prescrizione(squat, 3))).toContain('4 × 8')
  })

  it('riporta fedelmente la panca piana della scheda B', () => {
    const panca = scheda('B').esercizi[0]
    expect(panca.nome).toBe('Panca piana')
    expect(prescrizione(panca, 1)).toMatchObject({ serie: 4, ripetizioni: 12, buffer: 2 })
    expect(prescrizione(panca, 5)).toMatchObject({ serie: 3, ripetizioni: 12, buffer: 3 })
  })

  it('gli addominali non hanno buffer', () => {
    const situp = scheda('A').esercizi.find((e) => e.nome === 'Sit up')!
    expect(prescrizione(situp, 1).buffer).toBeUndefined()
    expect(prescrizione(situp, 3).serie).toBe(5)
  })
})

describe('settimane del programma', () => {
  it('ancora la settimana corrente alla data di oggi', () => {
    expect(settimanaDi(CONFIG, OGGI)).toBe(3)
    expect(settimanaDi(CONFIG, '2026-09-01')).toBe(4)
    expect(settimanaDi(CONFIG, '2026-08-18')).toBe(2)
  })

  it('riconosce quando il programma è finito', () => {
    expect(programmaFinito(CONFIG, OGGI)).toBe(false)
    expect(programmaFinito(CONFIG, '2026-09-22')).toBe(true)
  })
})

describe('alternanza delle schede', () => {
  it('parte dalla A e poi alterna', () => {
    expect(prossimaScheda([])).toBe('A')
    expect(prossimaScheda([sessione('1', '2026-08-24', 'A')])).toBe('B')
    expect(prossimaScheda([sessione('1', '2026-08-24', 'A'), sessione('2', '2026-08-25', 'B')])).toBe('A')
  })

  it('la sessione col personal trainer non rompe l\'alternanza', () => {
    const sessioni = [
      sessione('1', '2026-08-24', 'A'),
      sessione('2', '2026-08-25', 'B'),
      sessione('3', '2026-08-26', 'PT'),
    ]
    // Dopo A, B e PT tocca di nuovo la A, come nell'esempio del programma.
    expect(prossimaScheda(sessioni)).toBe('A')
    const conQuarta = [...sessioni, sessione('4', '2026-08-27', 'A')]
    // La settimana dopo si riparte dalla B.
    expect(prossimaScheda(conQuarta)).toBe('B')
  })

  it('conta le sessioni della settimana di calendario', () => {
    const sessioni = [
      sessione('1', '2026-08-24', 'A'),
      sessione('2', '2026-08-25', 'B'),
      sessione('3', '2026-08-20', 'A'),
    ]
    expect(sessioniDellaSettimana(sessioni, OGGI)).toHaveLength(2)
  })
})

describe('carichi e progressione', () => {
  const conCarichi = (id: string, date: string, tipo: 'A' | 'B', settimana: number, peso: number, reps: number): Sessione => {
    const s = nuovaSessione(id, date, tipo, settimana)
    return {
      ...s,
      esercizi: s.esercizi.map((e) =>
        e.esercizioId === 'a-squat' || e.esercizioId === 'b-panca-piana'
          ? { ...e, serie: e.serie.map(() => ({ peso, reps })) }
          : e,
      ),
    }
  }

  it('trova l\'ultima volta e il peso massimo', () => {
    const sessioni = [
      conCarichi('1', '2026-08-10', 'A', 1, 60, 10),
      conCarichi('2', '2026-08-17', 'A', 2, 65, 8),
    ]
    const ultima = ultimaVolta(sessioni, 'a-squat')
    expect(ultima?.sessione.id).toBe('2')
    expect(pesoMassimo(ultima!.eseguito.serie)).toBe(65)
    expect(progressione(sessioni, 'a-squat').map((p) => p.peso)).toEqual([60, 65])
  })

  it('esclude la sessione in corso quando cerca la precedente', () => {
    const sessioni = [conCarichi('1', '2026-08-10', 'A', 1, 60, 10), conCarichi('2', OGGI, 'A', 3, 70, 8)]
    expect(ultimaVolta(sessioni, 'a-squat', '2')?.sessione.id).toBe('1')
  })

  it('calcola il volume della sessione', () => {
    const s = conCarichi('1', OGGI, 'A', 3, 50, 10)
    expect(volumeSessione(s)).toBe(50 * 10 * prescrizione(scheda('A').esercizi[0], 3).serie)
  })
})

describe('suggerimento di carico', () => {
  const squat = scheda('A').esercizi[0]

  it('alla prima volta non inventa numeri', () => {
    const s = suggerimentoCarico(squat, 3)
    expect(s.direzione).toBe('prima-volta')
    expect(s.peso).toBeUndefined()
  })

  it('sale quando la scheda chiede meno ripetizioni o meno buffer', () => {
    // Settimana 2: 4x8 buffer 2 -> settimana 3: 4x8 buffer 1
    const s = suggerimentoCarico(squat, 3, { serie: [{ peso: 60, reps: 8 }], settimana: 2 })
    expect(s.direzione).toBe('su')
    expect(s.peso!).toBeGreaterThan(60)
  })

  it('scende nella settimana di scarico', () => {
    // Settimana 4: 5x8 buffer 1 -> settimana 5: 3x10 buffer 3
    const s = suggerimentoCarico(squat, 5, { serie: [{ peso: 80, reps: 8 }], settimana: 4 })
    expect(s.direzione).toBe('giu')
    expect(s.peso!).toBeLessThan(80)
  })

  it('resta uguale se la prescrizione non cambia', () => {
    const pulley = scheda('A').esercizi.find((e) => e.nome === 'Pulley')!
    const s = suggerimentoCarico(pulley, 3, { serie: [{ peso: 45, reps: 10 }], settimana: 2 })
    expect(s.direzione).toBe('uguale')
    expect(s.peso).toBe(45)
  })

  it('arrotonda a multipli di 2,5 kg', () => {
    const s = suggerimentoCarico(squat, 3, { serie: [{ peso: 62, reps: 8 }], settimana: 2 })
    expect((s.peso! * 10) % 25).toBe(0)
  })
})

describe('stato e premi della palestra', () => {
  it('riassume lo stato del programma', () => {
    const st = statoPalestra(stato([sessione('1', '2026-08-24', 'A')]), OGGI)
    expect(st.settimana).toBe(3)
    expect(st.sessioniQuestaSettimana).toBe(1)
    expect(st.prossima).toBe('B')
  })

  it('sblocca i premi della palestra', () => {
    const premi = valutaPremi(stato([sessione('1', '2026-08-24', 'A')]), OGGI)
    const per = (id: string) => premi.find((p) => p.premio.id === id)!
    expect(per('palestra-inizio').sbloccato).toBe(true)
    expect(per('palestra-12').sbloccato).toBe(false)
    expect(valutaPremi(stato([]), OGGI).find((p) => p.premio.id === 'palestra-inizio')!.sbloccato).toBe(false)
  })

  it('premia l\'aumento di carico documentato', () => {
    const base = nuovaSessione('1', '2026-08-10', 'A', 1)
    const dopo = nuovaSessione('2', '2026-08-17', 'A', 2)
    const conPeso = (s: Sessione, peso: number): Sessione => ({
      ...s,
      esercizi: s.esercizi.map((e) => (e.esercizioId === 'a-squat' ? { ...e, serie: [{ peso, reps: 8 }] } : e)),
    })
    const premi = valutaPremi(stato([conPeso(base, 60), conPeso(dopo, 70)]), OGGI)
    expect(premi.find((p) => p.premio.id === 'palestra-carico')!.sbloccato).toBe(true)
  })
})

describe('calendario degli allenamenti', () => {
  it('crea un evento ricorrente per ogni giorno scelto', () => {
    const ics = generaICSAllenamenti(CONFIG, OGGI)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(4)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=FR')
    expect(ics).toContain('DTSTART:20260824T183000')
  })
})
