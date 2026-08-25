/**
 * Piano alimentare personale (Dott. Igor Mione, schema per Lorenzo Mazza,
 * emesso l'11/06/2026 con validità indicata di 3 settimane).
 *
 * Regole di lettura dello schema, dal documento del nutrizionista:
 * - più alimenti nella stessa icona = alternative, se ne sceglie UNO;
 * - icone separate con un alimento ciascuna = si mangiano TUTTI.
 * Qui ogni "slot" corrisponde a un'icona: se ha più opzioni se ne sceglie una.
 *
 * Le calorie sono STIME per la porzione indicata, calcolate da tabelle di
 * composizione degli alimenti: servono a vedere l'andamento, non sono un dato
 * clinico.
 */

export type Pasto = 'colazione' | 'spuntino' | 'pranzo' | 'merenda' | 'cena'

export const ORDINE_PASTI: Pasto[] = ['colazione', 'spuntino', 'pranzo', 'merenda', 'cena']

export const NOMI_PASTI: Record<Pasto, string> = {
  colazione: 'Colazione',
  spuntino: 'Spuntino del mattino',
  pranzo: 'Pranzo',
  merenda: 'Merenda',
  cena: 'Cena',
}

export const EMOJI_PASTI: Record<Pasto, string> = {
  colazione: '🌅',
  spuntino: '🍎',
  pranzo: '🍽️',
  merenda: '🥛',
  cena: '🌙',
}

/** Orari indicativi, usati per i promemoria. */
export const ORARI_PASTI: Record<Pasto, string> = {
  colazione: '07:30',
  spuntino: '10:30',
  pranzo: '13:00',
  merenda: '16:30',
  cena: '20:00',
}

export interface Alimento {
  nome: string
  /** Quantità come indicata dal nutrizionista. */
  quantita: string
  /** Stima calorica della porzione. */
  kcal: number
}

export interface Opzione {
  id: string
  alimenti: Alimento[]
}

export interface Slot {
  id: string
  /** A cosa serve nello schema: cereale, proteine, grassi... */
  etichetta: string
  opzioni: Opzione[]
  /** Slot che non incide sull'aderenza (es. verdure "a piacere"). */
  libero?: boolean
}

export interface PastoPianificato {
  pasto: Pasto
  slot: Slot[]
  nota?: string
}

/** 0 = lunedì ... 6 = domenica. */
export type IndiceGiorno = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const NOMI_GIORNI = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica']

/* ------------------------------------------------------------------ */
/* Mattoni ricorrenti                                                  */
/* ------------------------------------------------------------------ */

const a = (nome: string, quantita: string, kcal: number): Alimento => ({ nome, quantita, kcal })

const colazione = (): PastoPianificato => ({
  pasto: 'colazione',
  slot: [
    { id: 'col-bevanda', etichetta: 'Bevanda', opzioni: [{ id: 'tisana', alimenti: [a('Tisana in tazza', '250 g (1 tazza)', 0)] }] },
    {
      id: 'col-cereale',
      etichetta: 'Cereale',
      opzioni: [
        { id: 'pane', alimenti: [a('Pane integrale', '80 g', 179)] },
        { id: 'fette', alimenti: [a('Fette biscottate integrali', '50 g (5 fette)', 190)] },
      ],
    },
    {
      id: 'col-spalmabile',
      etichetta: 'Spalmabile',
      opzioni: [
        { id: 'marmellata', alimenti: [a('Marmellata a ridotto zucchero', '15 g (3 cucchiaini)', 27)] },
        { id: 'novi', alimenti: [a('Crema Novi 45% nocciole', '5 g (1 cucchiaino)', 28)] },
      ],
    },
  ],
})

const spuntino = (): PastoPianificato => ({
  pasto: 'spuntino',
  slot: [
    { id: 'spu-frutta', etichetta: 'Frutta', opzioni: [{ id: 'frutta', alimenti: [a('Frutta fresca media', '150 g (1 frutto)', 83)] }] },
    { id: 'spu-formaggio', etichetta: 'Formaggio', opzioni: [{ id: 'parmigiano', alimenti: [a('Parmigiano', '20 g', 78)] }] },
  ],
})

const merenda = (): PastoPianificato => ({
  pasto: 'merenda',
  nota: 'Nei giorni in cui ti alleni sostituisci la merenda con 80 g di pane integrale + 30 g di affettati magri.',
  slot: [
    { id: 'mer-frutta', etichetta: 'Frutta', opzioni: [{ id: 'frutta', alimenti: [a('Frutta fresca media', '150 g (1 frutto)', 83)] }] },
    {
      id: 'mer-base',
      etichetta: 'Base',
      opzioni: [
        { id: 'milkpro', alimenti: [a('Milk Pro 20 crema dessert (o simile, <5 g zucchero/100 g)', '200 g (1 vasetto)', 100)] },
        { id: 'gallette', alimenti: [a('Gallette di grano saraceno', '40 g', 152)] },
      ],
    },
    {
      id: 'mer-spalmabile',
      etichetta: 'Spalmabile',
      opzioni: [
        { id: 'marmellata', alimenti: [a('Marmellata a ridotto zucchero', '15 g (3 cucchiaini)', 27)] },
        { id: 'novi', alimenti: [a('Crema Novi 45% nocciole', '5 g (1 cucchiaino)', 28)] },
      ],
    },
  ],
})

/** Sostituzione della merenda nei giorni di allenamento. */
export const MERENDA_ALLENAMENTO: Slot[] = [
  { id: 'mer-all-pane', etichetta: 'Cereale', opzioni: [{ id: 'pane', alimenti: [a('Pane integrale', '80 g', 179)] }] },
  { id: 'mer-all-affettati', etichetta: 'Proteine', opzioni: [{ id: 'affettati', alimenti: [a('Affettati magri', '30 g', 45)] }] },
]

const verdure = (id: string): Slot => ({
  id,
  etichetta: 'Verdure di stagione',
  libero: true,
  opzioni: [{ id: 'verdure', alimenti: [a('Verdure di stagione', 'a piacere (80 g a foglia / 200 g altri ortaggi)', 40)] }],
})

const olio = (id: string, cucchiai: 1 | 2): Slot => ({
  id,
  etichetta: 'Condimento',
  opzioni: [{
    id: 'evo',
    alimenti: [a('Olio extravergine d\'oliva a crudo', `${cucchiai * 10} g (${cucchiai} ${cucchiai === 1 ? 'cucchiaio' : 'cucchiai'})`, cucchiai * 90)],
  }],
})

/** Il Wasa integrale compare come alternativa al cereale in quasi tutti i pranzi. */
const wasa = () => ({ id: 'wasa', alimenti: [a('Wasa integrale (Barilla)', '60 g', 204)] })

const cenaBase = (id: string): Slot => ({
  id,
  etichetta: 'Cereale / tubero',
  opzioni: [
    { id: 'patate', alimenti: [a('Patate', '300 g', 240)] },
    { id: 'pane', alimenti: [a('Pane integrale', '80 g', 179)] },
  ],
})

/* ------------------------------------------------------------------ */
/* Il piano, giorno per giorno                                         */
/* ------------------------------------------------------------------ */

export const PIANO: PastoPianificato[][] = [
  // Lunedì
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'lun-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [
            { id: 'basmati', alimenti: [a('Riso Basmati', '80 g', 280)] },
            { id: 'parboiled', alimenti: [a('Riso parboiled', '80 g', 280)] },
            wasa(),
          ],
        },
        verdure('lun-pra-verdure'),
        olio('lun-pra-olio', 1),
        {
          id: 'lun-pra-proteine',
          etichetta: 'Proteine',
          opzioni: [
            { id: 'bresaola', alimenti: [a('Bresaola', '60 g', 91)] },
            { id: 'fiocchi', alimenti: [a('Fiocchi di latte', '100 g', 100)] },
            { id: 'ricotta', alimenti: [a('Ricotta di vacca', '120 g', 175)] },
          ],
        },
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      slot: [
        cenaBase('lun-cen-base'),
        {
          id: 'lun-cen-proteine',
          etichetta: 'Proteine',
          opzioni: [
            { id: 'pesce', alimenti: [a('Pesce di mare (con lisca)', '200 g', 145)] },
            { id: 'molluschi', alimenti: [a('Molluschi (media)', '180 g', 125)] },
          ],
        },
        verdure('lun-cen-verdure'),
        olio('lun-cen-olio', 2),
      ],
    },
  ],

  // Martedì
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'mar-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [
            { id: 'farro', alimenti: [a('Farro o pasta di farro', '80 g', 268)] },
            wasa(),
          ],
        },
        verdure('mar-pra-verdure'),
        olio('mar-pra-olio', 1),
        {
          id: 'mar-pra-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'legumi', alimenti: [a('Legumi cotti scolati (ceci, fagioli, lenticchie, piselli)', '130 g', 156)] }],
        },
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      slot: [
        cenaBase('mar-cen-base'),
        {
          id: 'mar-cen-proteine',
          etichetta: 'Proteine',
          opzioni: [
            { id: 'bistecca', alimenti: [a('Maiale, bistecca', '160 g', 251)] },
            { id: 'arista', alimenti: [a('Maiale leggero, arista', '160 g', 208)] },
          ],
        },
        verdure('mar-cen-verdure'),
        olio('mar-cen-olio', 2),
      ],
    },
  ],

  // Mercoledì
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'mer-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [{ id: 'couscous', alimenti: [a('Cous cous', '80 g', 286)] }, wasa()],
        },
        verdure('mer-pra-verdure'),
        olio('mer-pra-olio', 1),
        {
          id: 'mer-pra-proteine',
          etichetta: 'Proteine',
          opzioni: [
            { id: 'parma', alimenti: [a('Prosciutto crudo di Parma magro', '60 g', 134)] },
            { id: 'sandaniele', alimenti: [a('Prosciutto crudo San Daniele magro', '60 g', 134)] },
          ],
        },
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      slot: [
        cenaBase('mer-cen-base'),
        {
          id: 'mer-cen-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'legumi', alimenti: [a('Legumi cotti scolati (ceci, fagioli, lenticchie, piselli)', '240 g', 288)] }],
        },
        verdure('mer-cen-verdure'),
        olio('mer-cen-olio', 2),
      ],
    },
  ],

  // Giovedì
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'gio-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [{ id: 'saraceno', alimenti: [a('Pasta di grano saraceno', '80 g', 280)] }, wasa()],
        },
        verdure('gio-pra-verdure'),
        olio('gio-pra-olio', 1),
        {
          id: 'gio-pra-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'salmone', alimenti: [a('Salmone affumicato', '100 g', 147)] }],
        },
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      slot: [
        cenaBase('gio-cen-base'),
        {
          id: 'gio-cen-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'manzo', alimenti: [a('Manzo, tagli magri', '160 g', 208)] }],
        },
        verdure('gio-cen-verdure'),
        olio('gio-cen-olio', 2),
      ],
    },
  ],

  // Venerdì
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'ven-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [{ id: 'couscous', alimenti: [a('Cous cous', '80 g', 286)] }, wasa()],
        },
        verdure('ven-pra-verdure'),
        olio('ven-pra-olio', 1),
        {
          id: 'ven-pra-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'legumi', alimenti: [a('Legumi cotti scolati (ceci, fagioli, lenticchie, piselli)', '130 g', 156)] }],
        },
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      slot: [
        cenaBase('ven-cen-base'),
        {
          id: 'ven-cen-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'uova', alimenti: [a('Uova di gallina intere', '180 g (3 uova)', 257)] }],
        },
        verdure('ven-cen-verdure'),
        olio('ven-cen-olio', 2),
      ],
    },
  ],

  // Sabato
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'sab-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [{ id: 'integrale', alimenti: [a('Pasta di semola integrale', '80 g', 270)] }, wasa()],
        },
        verdure('sab-pra-verdure'),
        olio('sab-pra-olio', 1),
        {
          id: 'sab-pra-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'tonno', alimenti: [a('Tonno al naturale (Asdomar o equivalente)', '112 g (2 scatolette)', 115)] }],
        },
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      nota: 'Nello schema del nutrizionista la cena di sabato non è indicata: è il pasto libero settimanale previsto dai consigli generali. Se il tuo nutrizionista intendeva altro, correggi la sera libera nelle impostazioni del piano.',
      slot: [
        {
          id: 'sab-cen-libero',
          etichetta: 'Pasto libero',
          libero: true,
          opzioni: [{ id: 'libero', alimenti: [a('Pasto libero settimanale', 'quantità a tua scelta', 800)] }],
        },
      ],
    },
  ],

  // Domenica
  [
    colazione(),
    spuntino(),
    {
      pasto: 'pranzo',
      slot: [
        {
          id: 'dom-pra-cereale',
          etichetta: 'Cereale',
          opzioni: [
            { id: 'basmati', alimenti: [a('Riso Basmati', '100 g', 350)] },
            { id: 'parboiled', alimenti: [a('Riso parboiled', '100 g', 350)] },
          ],
        },
        verdure('dom-pra-verdure'),
        olio('dom-pra-olio', 1),
      ],
    },
    merenda(),
    {
      pasto: 'cena',
      slot: [
        cenaBase('dom-cen-base'),
        {
          id: 'dom-cen-proteine',
          etichetta: 'Proteine',
          opzioni: [{ id: 'pollo', alimenti: [a('Pollo, petto', '200 g', 220)] }],
        },
        verdure('dom-cen-verdure'),
        olio('dom-cen-olio', 2),
      ],
    },
  ],
]

/* ------------------------------------------------------------------ */
/* Consigli generali e stagionalità                                    */
/* ------------------------------------------------------------------ */

export const REGOLE_PIANO: string[] = [
  'Inizia i pasti dalle verdure.',
  'Olio extravergine sempre a crudo, niente soffritti.',
  'Obiettivo idratazione 1,5-2 litri: bevi poco e spesso, anche fuori dai pasti, e poco durante i pasti.',
  'Le grammature si riferiscono agli alimenti crudi e al netto degli scarti (eccetto i legumi in scatola, già cotti e scolati).',
  'Mangia lentamente: un pasto dovrebbe durare almeno 20-30 minuti, senza TV né telefono.',
  'Varia i colori di frutta e verdura: giallo, viola-blu, bianco, rosso, verde.',
  'Pesce almeno 3 volte a settimana, carne rossa massimo 1, uova massimo 2.',
  'Caffè massimo 3 al giorno. Limita il sale e lo zucchero bianco.',
  'È previsto un pasto libero a settimana.',
  'Spezie, erbe, aceto, limone e brodo vegetale sono sempre consentiti.',
]

/** Frutta e verdura di stagione, mese per mese (indice 0 = gennaio). */
export const STAGIONALITA: { frutta: string[]; verdura: string[] }[] = [
  { frutta: ['Arance', 'Clementine', 'Kiwi', 'Limoni', 'Mandarini', 'Mele', 'Pere', 'Pompelmi'], verdura: ['Bietole da coste', 'Carciofi', 'Carote', 'Broccoli', 'Cavolfiori', 'Cavoli', 'Cicoria', 'Finocchi', 'Radicchio', 'Rape', 'Spinaci', 'Zucche'] },
  { frutta: ['Arance', 'Clementine', 'Kiwi', 'Limoni', 'Mandarini', 'Mele', 'Pere', 'Pompelmi'], verdura: ['Bietole da coste', 'Carciofi', 'Carote', 'Broccoli', 'Cavolfiori', 'Cavoli', 'Cicoria', 'Finocchi', 'Radicchio', 'Rape', 'Sedano', 'Spinaci', 'Zucche'] },
  { frutta: ['Arance', 'Kiwi', 'Limoni', 'Mele', 'Pere', 'Pompelmi'], verdura: ['Asparagi', 'Bietole da coste', 'Carciofi', 'Carote', 'Broccoli', 'Cavolfiori', 'Cavoli', 'Cicoria', 'Cipolline', 'Finocchi', 'Insalata', 'Radicchio', 'Rape', 'Sedano', 'Spinaci'] },
  { frutta: ['Arance', 'Fragole', 'Kiwi', 'Limoni', 'Mele', 'Nespole', 'Pere', 'Pompelmi'], verdura: ['Aglio', 'Asparagi', 'Bietole da coste', 'Carciofi', 'Carote', 'Cavolfiori', 'Cavoli', 'Cicoria', 'Cipolline', 'Finocchi', 'Insalata', 'Radicchio', 'Ravanelli', 'Sedano', 'Spinaci'] },
  { frutta: ['Ciliegie', 'Fragole', 'Kiwi', 'Lamponi', 'Mele', 'Meloni', 'Nespole', 'Pere', 'Pompelmi'], verdura: ['Aglio', 'Asparagi', 'Bietole da coste', 'Carote', 'Cavoli', 'Cicoria', 'Cipolline', 'Finocchi', 'Insalata', 'Pomodori', 'Radicchio', 'Ravanelli', 'Sedano', 'Spinaci'] },
  { frutta: ['Albicocche', 'Amarene', 'Ciliegie', 'Fichi', 'Fragole', 'Lamponi', 'Meloni', 'Pesche', 'Susine'], verdura: ['Aglio', 'Asparagi', 'Bietole da coste', 'Carciofi', 'Carote', 'Cavoli', 'Cetrioli', 'Cicoria', 'Insalate', 'Melanzane', 'Peperoni', 'Pomodori', 'Radicchio', 'Ravanelli', 'Sedano', 'Zucchine'] },
  { frutta: ['Albicocche', 'Amarene', 'Angurie', 'Ciliegie', 'Fichi', 'Fragole', 'Lamponi', 'Meloni', 'Mirtilli', 'Pesche', 'Prugne', 'Susine'], verdura: ['Aglio', 'Bietole da coste', 'Carote', 'Cavoli', 'Cetrioli', 'Cicoria', 'Insalate', 'Melanzane', 'Peperoni', 'Pomodori', 'Radicchio', 'Ravanelli', 'Sedano', 'Zucchine'] },
  { frutta: ['Angurie', 'Fichi', 'Fragole', 'Lamponi', 'Mele', 'Meloni', 'Mirtilli', 'Pere', 'Pesche', 'Prugne', 'Susine', 'Uva'], verdura: ['Aglio', 'Bietole da coste', 'Carote', 'Cavoli', 'Cetrioli', 'Cicoria', 'Insalate', 'Melanzane', 'Peperoni', 'Pomodori', 'Radicchio', 'Ravanelli', 'Sedano', 'Zucche', 'Zucchine'] },
  { frutta: ['Fichi', 'Lamponi', 'Mele', 'Meloni', 'Mirtilli', 'Pere', 'Pesche', 'Prugne', 'Susine', 'Uva'], verdura: ['Aglio', 'Bietole da coste', 'Carote', 'Broccoli', 'Cavoli', 'Cetrioli', 'Cicoria', 'Insalate', 'Melanzane', 'Peperoni', 'Pomodori', 'Radicchio', 'Ravanelli', 'Sedano', 'Spinaci', 'Zucche', 'Zucchine'] },
  { frutta: ['Clementine', 'Feijoa', 'Kaki', 'Lamponi', 'Limoni', 'Mele', 'Pere', 'Uva'], verdura: ['Aglio', 'Bietole da coste', 'Carote', 'Broccoli', 'Cavolfiore', 'Cavoli', 'Cicoria', 'Finocchi', 'Insalate', 'Melanzane', 'Peperoni', 'Radicchio', 'Rape', 'Ravanelli', 'Sedano', 'Spinaci', 'Zucche'] },
  { frutta: ['Arance', 'Clementine', 'Feijoa', 'Kaki', 'Kiwi', 'Limoni', 'Mandarini', 'Mele', 'Melagrane', 'Pere', 'Pompelmi', 'Uva'], verdura: ['Aglio', 'Bietole da coste', 'Carote', 'Broccoli', 'Cavolfiore', 'Cavoli', 'Cicoria', 'Finocchi', 'Insalate', 'Radicchio', 'Rape', 'Sedano', 'Spinaci', 'Zucche'] },
  { frutta: ['Arance', 'Clementine', 'Kaki', 'Kiwi', 'Limoni', 'Mandarini', 'Mele', 'Melagrane', 'Pere', 'Pompelmi'], verdura: ['Bietole da coste', 'Carote', 'Broccoli', 'Cavolfiore', 'Cavoli', 'Cicoria', 'Finocchi', 'Insalate', 'Radicchio', 'Rape', 'Spinaci', 'Zucche'] },
]

/** Alimenti fuori piano di uso comune, per registrare gli extra in un tocco. */
export const EXTRA_RAPIDI: { nome: string; kcal: number }[] = [
  { nome: 'Caffè', kcal: 2 },
  { nome: 'Caffè con zucchero', kcal: 22 },
  { nome: 'Cappuccino', kcal: 110 },
  { nome: 'Birra media', kcal: 150 },
  { nome: 'Bicchiere di vino', kcal: 125 },
  { nome: 'Pizza margherita', kcal: 850 },
  { nome: 'Panino al bar', kcal: 450 },
  { nome: 'Gelato', kcal: 250 },
  { nome: 'Dolce / fetta di torta', kcal: 350 },
  { nome: 'Snack salato', kcal: 200 },
  { nome: 'Cioccolato (30 g)', kcal: 160 },
  { nome: 'Frutta secca (30 g)', kcal: 180 },
]

export const INFO_PIANO = {
  autore: 'Dott. Igor Mione, biologo nutrizionista',
  emesso: '11/06/2026',
  validita: '3 settimane',
  intestatario: 'Lorenzo Mazza',
}
