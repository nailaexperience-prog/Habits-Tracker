import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, durataUmana, rangeISO, startOfWeek } from '../dates'
import { habitStats, indexLogs } from '../habits'
import { calcolaProgresso, livelloDaXp, xpTotaliPerLivello } from '../xp'
import { schedaBenefici, trovaProfilo } from '../benefits'
import { valutaPremi } from '../rewards'
import { analizzaSituazione, analizzaTesti } from '../insights'
import type { AppState, Habit, LogEntry } from '../types'

const OGGI = '2026-08-25'

function habit(over: Partial<Habit> = {}): Habit {
  return {
    id: 'h1',
    name: 'Test',
    kind: 'daily',
    category: 'altro',
    color: '#7c5cff',
    icon: '⭐',
    startDate: '2026-08-01',
    createdAt: 0,
    ...over,
  }
}

function log(habitId: string, date: string, status: LogEntry['status'], note?: string): LogEntry {
  return { id: `${habitId}-${date}`, habitId, date, status, note, createdAt: 0 }
}

function stato(habits: Habit[], logs: LogEntry[]): AppState {
  return {
    version: 1,
    profile: { name: 'Test', createdAt: 0, xp: 0, lastSeenLevel: 1 },
    habits,
    logs,
    journal: [],
    rewards: [],
    settings: { reduceMotion: false, weekStartsMonday: true },
  }
}

describe('date', () => {
  it('calcola la distanza tra date', () => {
    expect(daysBetween('2026-08-10', '2026-08-25')).toBe(15)
    expect(daysBetween('2026-08-25', '2026-08-10')).toBe(-15)
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01')
  })

  it('gestisce il cambio di mese e anno', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(rangeISO('2026-08-01', '2026-08-03')).toEqual(['2026-08-01', '2026-08-02', '2026-08-03'])
  })

  it('trova il lunedì della settimana', () => {
    // 2026-08-25 è un martedì
    expect(startOfWeek('2026-08-25', true)).toBe('2026-08-24')
    expect(startOfWeek('2026-08-24', true)).toBe('2026-08-24')
  })

  it('formatta le durate in italiano', () => {
    expect(durataUmana(1)).toBe('1 giorno')
    expect(durataUmana(40)).toBe('1 mese e 10 giorni')
    expect(durataUmana(400)).toBe('1 anno, 1 mese e 5 giorni')
  })
})

describe('abitudini di tipo "smettere"', () => {
  const h = habit({ kind: 'quit', name: 'Smettere di fumare', startDate: '2026-08-10' })

  it('conta i giorni dall\'inizio', () => {
    const s = habitStats(h, indexLogs([]), OGGI)
    expect(s.cleanDays).toBe(15)
    expect(s.streak).toBe(15)
    expect(s.best).toBe(15)
    expect(s.doneToday).toBe(true)
  })

  it('azzera il contatore alla ricaduta e ricorda il record', () => {
    const logs = [log('h1', '2026-08-20', 'relapse', 'serata fuori con amici')]
    const s = habitStats(h, indexLogs(logs), OGGI)
    expect(s.cleanDays).toBe(5)
    expect(s.best).toBe(10)
    expect(s.relapses).toBe(1)
    expect(s.lastRelapse).toBe('2026-08-20')
  })

  it('mostra zero giorni se la ricaduta è oggi', () => {
    const s = habitStats(h, indexLogs([log('h1', OGGI, 'relapse')]), OGGI)
    expect(s.cleanDays).toBe(0)
    expect(s.doneToday).toBe(false)
  })
})

describe('abitudini giornaliere', () => {
  const h = habit({ kind: 'daily', startDate: '2026-08-20' })

  it('conta la serie consecutiva', () => {
    const logs = ['2026-08-23', '2026-08-24', '2026-08-25'].map((d) => log('h1', d, 'done'))
    const s = habitStats(h, indexLogs(logs), OGGI)
    expect(s.streak).toBe(3)
    expect(s.completed).toBe(3)
  })

  it('non spezza la serie se oggi non è ancora stato registrato', () => {
    const logs = ['2026-08-23', '2026-08-24'].map((d) => log('h1', d, 'done'))
    const s = habitStats(h, indexLogs(logs), OGGI)
    expect(s.streak).toBe(2)
    expect(s.doneToday).toBe(false)
  })

  it('spezza la serie con un giorno saltato', () => {
    const logs = [
      log('h1', '2026-08-21', 'done'),
      log('h1', '2026-08-22', 'missed'),
      log('h1', '2026-08-23', 'done'),
      log('h1', '2026-08-24', 'done'),
    ]
    const s = habitStats(h, indexLogs(logs), OGGI)
    expect(s.streak).toBe(2)
    expect(s.best).toBe(2)
    expect(s.relapses).toBe(1)
  })

  it('calcola aderenza sul periodo tracciato', () => {
    const logs = ['2026-08-20', '2026-08-21', '2026-08-22'].map((d) => log('h1', d, 'done'))
    const s = habitStats(h, indexLogs(logs), OGGI) // 6 giorni tracciati, 3 fatti
    expect(s.daysTracked).toBe(6)
    expect(s.aderenza).toBe(50)
  })
})

describe('abitudini settimanali', () => {
  const h = habit({ kind: 'weekly', weeklyTarget: 4, startDate: '2026-08-10' })

  it('conta le sessioni della settimana in corso', () => {
    const logs = ['2026-08-24', '2026-08-25'].map((d) => log('h1', d, 'done'))
    const s = habitStats(h, indexLogs(logs), OGGI)
    expect(s.weekDone).toBe(2)
    expect(s.weekTarget).toBe(4)
    expect(s.streakUnit).toBe('settimane')
  })

  it('conta le settimane a obiettivo', () => {
    const settimanaScorsa = ['2026-08-17', '2026-08-18', '2026-08-20', '2026-08-22'].map((d) => log('h1', d, 'done'))
    const s = habitStats(h, indexLogs(settimanaScorsa), OGGI)
    expect(s.weeksOk).toBe(1)
    expect(s.streak).toBe(1) // la settimana in corso non ancora completa non azzera
  })

  it('non conta i giorni futuri', () => {
    const logs = [log('h1', '2026-09-10', 'done')]
    const s = habitStats(h, indexLogs(logs), OGGI)
    expect(s.weekDone).toBe(0)
  })
})

describe('livelli ed esperienza', () => {
  it('le soglie sono crescenti', () => {
    expect(xpTotaliPerLivello(1)).toBe(0)
    for (let l = 1; l < 30; l++) {
      expect(xpTotaliPerLivello(l + 1)).toBeGreaterThan(xpTotaliPerLivello(l))
    }
  })

  it('il livello corrisponde alle soglie', () => {
    expect(livelloDaXp(0)).toBe(1)
    expect(livelloDaXp(xpTotaliPerLivello(5))).toBe(5)
    expect(livelloDaXp(xpTotaliPerLivello(5) - 1)).toBe(4)
  })

  it('più giorni completati significano più XP', () => {
    const h = habit({ kind: 'daily', startDate: '2026-08-01' })
    const pochi = calcolaProgresso(stato([h], [log('h1', '2026-08-24', 'done')]), OGGI)
    const molti = calcolaProgresso(
      stato([h], rangeISO('2026-08-01', OGGI).map((d) => log('h1', d, 'done'))),
      OGGI,
    )
    expect(molti.xp).toBeGreaterThan(pochi.xp)
    expect(molti.livello).toBeGreaterThanOrEqual(pochi.livello)
    expect(molti.percentuale).toBeGreaterThanOrEqual(0)
    expect(molti.percentuale).toBeLessThanOrEqual(1)
  })
})

describe('benefici', () => {
  it('riconosce le abitudini note dal nome', () => {
    expect(trovaProfilo('Smettere di fumare')?.key).toBe('smettere-fumo')
    expect(trovaProfilo('Palestra 4x a settimana')?.key).toBe('palestra')
    expect(trovaProfilo('Alimentazione sana')?.key).toBe('alimentazione')
    expect(trovaProfilo('Leggere un libro tutti i giorni')?.key).toBe('lettura')
  })

  it('usa il fallback generico per abitudini sconosciute', () => {
    const scheda = schedaBenefici('Suonare il theremin', 'altro', 10)
    expect(scheda.specifica).toBe(false)
    expect(scheda.corpo.length).toBeGreaterThan(0)
    expect(scheda.mente.length).toBeGreaterThan(0)
  })

  it('divide traguardi raggiunti e prossimo', () => {
    const scheda = schedaBenefici('Smettere di fumare', 'sostanze', 15)
    expect(scheda.raggiunte.every((m) => m.giorni <= 15)).toBe(true)
    expect(scheda.prossima?.giorni).toBe(30)
  })
})

describe('premi', () => {
  it('sblocca i traguardi raggiunti e non gli altri', () => {
    const h = habit({ kind: 'quit', startDate: '2026-08-10' })
    const premi = valutaPremi(stato([h], []), OGGI)
    const per = (id: string) => premi.find((p) => p.premio.id === id)!
    expect(per('inizio').sbloccato).toBe(true)
    expect(per('streak-7').sbloccato).toBe(true)
    expect(per('streak-30').sbloccato).toBe(false)
    expect(per('streak-30').progresso).toBeCloseTo(0.5, 1)
  })

  it('assegna la Fenice dopo una ricaduta superata', () => {
    const h = habit({ kind: 'quit', startDate: '2026-06-01' })
    const conRicaduta = valutaPremi(stato([h], [log('h1', '2026-08-01', 'relapse')]), OGGI)
    expect(conRicaduta.find((p) => p.premio.id === 'fenice')!.sbloccato).toBe(true)
    const senza = valutaPremi(stato([h], []), OGGI)
    expect(senza.find((p) => p.premio.id === 'fenice')!.sbloccato).toBe(false)
  })

  it('suggerisce sempre un premio reale', () => {
    const premi = valutaPremi(stato([habit()], []), OGGI)
    expect(premi.every((p) => p.premioReale.length > 0)).toBe(true)
  })
})

describe('analisi delle note', () => {
  it('riconosce il tono positivo e negativo', () => {
    expect(analizzaTesti(['Giornata ottima, mi sento carico e soddisfatto']).sentiment).toBeGreaterThan(0)
    expect(analizzaTesti(['Sono stanco, stressato e demotivato, ho mollato tutto']).sentiment).toBeLessThan(0)
  })

  it('estrae i temi ricorrenti', () => {
    const a = analizzaTesti([
      'Troppo stress al lavoro, scadenza domani',
      'Ancora stress, riunione lunghissima',
    ])
    expect(a.temi[0].chiave).toBe('stress')
    expect(a.temi[0].consiglio.length).toBeGreaterThan(20)
  })

  it('produce osservazioni e sintesi', () => {
    const h = habit({ kind: 'quit', name: 'Smettere di fumare', category: 'sostanze', startDate: '2026-08-10' })
    const s = stato([h], [log('h1', '2026-08-12', 'relapse', 'serata con amici, troppo stress')])
    const analisi = analizzaSituazione(s, OGGI)
    expect(analisi.osservazioni.length).toBeGreaterThan(0)
    expect(analisi.sintesi).toContain('abitudine')
  })
})
