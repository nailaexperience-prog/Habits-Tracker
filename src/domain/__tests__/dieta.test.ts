import { describe, expect, it } from 'vitest'
import { MERENDA_ALLENAMENTO, ORDINE_PASTI, PIANO, STAGIONALITA } from '../dieta'
import {
  aderenzaGiorno, andamento, indiceGiorno, kcalConsumate, kcalPianificate,
  opzioneScelta, pastiTrascurati, pianoDelGiorno, prossimoPasto, stagioneDi, vuotoDieta,
} from '../dietaLog'
import { generaICS, descriviPasto } from '../promemoria'
import { valutaPremi } from '../rewards'
import { calcolaProgresso } from '../xp'
import type { AppState, DietaGiorno } from '../types'

const LUNEDI = '2026-08-24'
const MARTEDI = '2026-08-25'
const SABATO = '2026-08-29'

function stato(dieta: DietaGiorno[]): AppState {
  return {
    version: 1,
    profile: { name: '', createdAt: 0, xp: 0, lastSeenLevel: 1 },
    habits: [],
    logs: [],
    journal: [],
    rewards: [],
    dieta,
    allenamenti: [],
    programma: { programmaId: 'palloni-ipertrofia-5w', inizio: '', giorni: [0, 1, 3, 4], orario: '18:30' },
    settings: { reduceMotion: false, weekStartsMonday: true, promemoriaPasti: false },
  }
}

describe('struttura del piano', () => {
  it('copre sette giorni con i cinque pasti', () => {
    expect(PIANO).toHaveLength(7)
    for (const giorno of PIANO) {
      const pasti = giorno.map((p) => p.pasto)
      for (const atteso of ORDINE_PASTI) expect(pasti).toContain(atteso)
    }
  })

  it('mappa correttamente i giorni della settimana', () => {
    expect(indiceGiorno(LUNEDI)).toBe(0)
    expect(indiceGiorno(MARTEDI)).toBe(1)
    expect(indiceGiorno('2026-08-30')).toBe(6) // domenica
  })

  it('rispetta lo schema del nutrizionista sui pasti chiave', () => {
    const lunedi = pianoDelGiorno(LUNEDI)
    const cena = lunedi.find((p) => p.pasto === 'cena')!
    const proteine = cena.slot.find((s) => s.etichetta === 'Proteine')!
    expect(proteine.opzioni.map((o) => o.alimenti[0].nome)).toEqual([
      'Pesce di mare (con lisca)',
      'Molluschi (media)',
    ])
    const venerdi = pianoDelGiorno('2026-08-28').find((p) => p.pasto === 'cena')!
    expect(venerdi.slot.some((s) => s.opzioni[0].alimenti[0].nome.includes('Uova'))).toBe(true)
  })

  it('sostituisce la merenda nei giorni di allenamento', () => {
    const normale = pianoDelGiorno(LUNEDI, false).find((p) => p.pasto === 'merenda')!
    const allenamento = pianoDelGiorno(LUNEDI, true).find((p) => p.pasto === 'merenda')!
    expect(normale.slot).not.toEqual(MERENDA_ALLENAMENTO)
    expect(allenamento.slot).toEqual(MERENDA_ALLENAMENTO)
    expect(descriviPasto(allenamento, vuotoDieta(LUNEDI))).toContain('Pane integrale')
  })

  it('ha dodici mesi di stagionalità', () => {
    expect(STAGIONALITA).toHaveLength(12)
    expect(stagioneDi('2026-08-25').frutta).toContain('Angurie')
    expect(stagioneDi('2026-01-10').verdura).toContain('Carciofi')
  })
})

describe('calorie e aderenza', () => {
  it('somma le calorie previste dalle opzioni scelte', () => {
    const log = vuotoDieta(LUNEDI)
    const pasti = pianoDelGiorno(LUNEDI)
    const conRiso = kcalPianificate(pasti, log)
    const conWasa = kcalPianificate(pasti, { ...log, scelte: { 'lun-pra-cereale': 'wasa' } })
    expect(conRiso).toBeGreaterThan(1500)
    // Il Wasa da 60 g vale meno del riso da 80 g.
    expect(conWasa).toBeLessThan(conRiso)
  })

  it('conta solo quello che hai davvero mangiato', () => {
    const pasti = pianoDelGiorno(LUNEDI)
    const colazione = pasti.find((p) => p.pasto === 'colazione')!
    const log: DietaGiorno = {
      ...vuotoDieta(LUNEDI),
      consumo: { [colazione.slot[1].id]: 'tutto' },
    }
    expect(kcalConsumate(pasti, log)).toBe(179) // pane integrale 80 g
    const meta: DietaGiorno = { ...log, consumo: { [colazione.slot[1].id]: 'meta' } }
    expect(kcalConsumate(pasti, meta)).toBe(90)
    const saltato: DietaGiorno = { ...log, consumo: { [colazione.slot[1].id]: 'saltato' } }
    expect(kcalConsumate(pasti, saltato)).toBe(0)
  })

  it('somma gli alimenti fuori piano', () => {
    const pasti = pianoDelGiorno(LUNEDI)
    const log: DietaGiorno = {
      ...vuotoDieta(LUNEDI),
      extra: [{ id: 'e1', nome: 'Birra', kcal: 150 }, { id: 'e2', nome: 'Gelato', kcal: 250 }],
    }
    expect(kcalConsumate(pasti, log)).toBe(400)
  })

  it('calcola aderenza e completamento ignorando gli slot liberi', () => {
    const pasti = pianoDelGiorno(LUNEDI)
    const vuoto = aderenzaGiorno(pasti, vuotoDieta(LUNEDI))
    expect(vuoto.percentuale).toBe(0)
    expect(vuoto.iniziato).toBe(false)

    const consumo: Record<string, 'tutto'> = {}
    for (const p of pasti) for (const s of p.slot) if (!s.libero) consumo[s.id] = 'tutto'
    const pieno = aderenzaGiorno(pasti, { ...vuotoDieta(LUNEDI), consumo })
    expect(pieno.percentuale).toBe(100)
    expect(pieno.completo).toBe(true)
  })

  it('la cena di sabato è il pasto libero e non pesa sull\'aderenza', () => {
    const cena = pianoDelGiorno(SABATO).find((p) => p.pasto === 'cena')!
    expect(cena.slot.every((s) => s.libero)).toBe(true)
    expect(cena.nota).toContain('pasto libero')
  })

  it('sceglie l\'opzione indicata, con la prima come default', () => {
    const pranzo = pianoDelGiorno(LUNEDI).find((p) => p.pasto === 'pranzo')!
    const slot = pranzo.slot[0]
    expect(opzioneScelta(slot, vuotoDieta(LUNEDI)).id).toBe('basmati')
    expect(opzioneScelta(slot, { ...vuotoDieta(LUNEDI), scelte: { [slot.id]: 'wasa' } }).id).toBe('wasa')
  })
})

describe('andamento nel tempo', () => {
  const giornoPieno = (date: string, extraKcal = 0): DietaGiorno => {
    const consumo: Record<string, 'tutto'> = {}
    for (const p of pianoDelGiorno(date)) for (const s of p.slot) consumo[s.id] = 'tutto'
    return {
      date,
      scelte: {},
      consumo,
      extra: extraKcal ? [{ id: `x-${date}`, nome: 'Extra', kcal: extraKcal }] : [],
    }
  }

  it('media solo i giorni registrati', () => {
    const a = andamento(stato([giornoPieno('2026-08-24'), giornoPieno('2026-08-25')]), MARTEDI, 14)
    expect(a.giorniRegistrati).toBe(2)
    expect(a.mediaKcal).toBeGreaterThan(1000)
    expect(a.giorni).toHaveLength(14)
  })

  it('rileva la variazione tra le due settimane', () => {
    const dieta = [
      ...['2026-08-12', '2026-08-13', '2026-08-14'].map((d) => giornoPieno(d)),
      ...['2026-08-20', '2026-08-21', '2026-08-22'].map((d) => giornoPieno(d, 600)),
    ]
    const a = andamento(stato(dieta), MARTEDI, 14)
    expect(a.variazione).toBeGreaterThan(400)
  })

  it('non confronta le settimane senza dati sufficienti', () => {
    const a = andamento(stato([giornoPieno('2026-08-24')]), MARTEDI, 14)
    expect(a.confrontabile).toBe(false)
    expect(a.variazione).toBe(0)
  })

  it('conta i pasti trascurati', () => {
    const log: DietaGiorno = { ...vuotoDieta(LUNEDI), consumo: {} }
    const pasti = pianoDelGiorno(LUNEDI)
    for (const s of pasti.find((p) => p.pasto === 'colazione')!.slot) log.consumo[s.id] = 'tutto'
    const conteggio = pastiTrascurati(stato([log]), LUNEDI, LUNEDI)
    expect(conteggio.merenda).toBe(1)
    expect(conteggio.colazione).toBeUndefined()
  })

  it('propone il prossimo pasto in base all\'ora', () => {
    const pasti = pianoDelGiorno(LUNEDI)
    const orari = { colazione: '07:30', spuntino: '10:30', pranzo: '13:00', merenda: '16:30', cena: '20:00' }
    const mattina = new Date(2026, 7, 24, 7, 0)
    expect(prossimoPasto(pasti, vuotoDieta(LUNEDI), orari, mattina)?.pasto.pasto).toBe('colazione')
    const sera = new Date(2026, 7, 24, 19, 0)
    expect(prossimoPasto(pasti, vuotoDieta(LUNEDI), orari, sera)?.pasto.pasto).toBe('cena')
  })
})

describe('gamification della dieta', () => {
  const completo = (date: string): DietaGiorno => {
    const consumo: Record<string, 'tutto'> = {}
    for (const p of pianoDelGiorno(date)) for (const s of p.slot) consumo[s.id] = 'tutto'
    return { date, scelte: {}, consumo, extra: [] }
  }

  it('dà XP per i giorni registrati', () => {
    const senza = calcolaProgresso(stato([]), MARTEDI)
    const con = calcolaProgresso(stato([completo(MARTEDI)]), MARTEDI)
    expect(con.xp).toBeGreaterThan(senza.xp)
  })

  it('sblocca i premi della dieta', () => {
    const settimana = ['2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25']
      .map(completo)
    const premi = valutaPremi(stato(settimana), MARTEDI)
    const per = (id: string) => premi.find((p) => p.premio.id === id)!
    expect(per('dieta-inizio').sbloccato).toBe(true)
    expect(per('dieta-settimana').sbloccato).toBe(true)
    expect(per('dieta-30').sbloccato).toBe(false)
    expect(valutaPremi(stato([]), MARTEDI).find((p) => p.premio.id === 'dieta-inizio')!.sbloccato).toBe(false)
  })
})

describe('esportazione nel calendario', () => {
  const ics = generaICS(MARTEDI)

  it('contiene un evento ricorrente per ogni pasto della settimana', () => {
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('END:VCALENDAR')
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(35)
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=SU')
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(35)
  })

  it('rispetta il limite di lunghezza delle righe, anche in ottetti', () => {
    for (const riga of ics.split('\r\n')) {
      expect(riga.length).toBeLessThanOrEqual(61)
      expect(new TextEncoder().encode(riga).length).toBeLessThanOrEqual(75)
    }
  })

  it('mette il menu nella descrizione', () => {
    expect(ics.replace(/\r\n /g, '')).toContain('Riso Basmati')
  })
})
