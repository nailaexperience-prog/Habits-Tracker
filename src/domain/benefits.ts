import type { HabitCategory, HabitKind } from './types'

export interface Milestone {
  giorni: number
  titolo: string
  testo: string
}

export interface BenefitProfile {
  key: string
  label: string
  emoji: string
  category: HabitCategory
  kindHint: HabitKind
  keywords: string[]
  /** Frase di sintesi mostrata in cima alla scheda. */
  sintesi: string
  corpo: string[]
  mente: string[]
  timeline: Milestone[]
  consigli: string[]
}

/**
 * Catalogo dei benefici. Le informazioni sono divulgative e servono a motivare:
 * non sostituiscono il parere di un medico.
 */
export const PROFILI: BenefitProfile[] = [
  {
    key: 'smettere-fumo',
    label: 'Smettere di fumare',
    emoji: '🚭',
    category: 'sostanze',
    kindHint: 'quit',
    keywords: ['fumo', 'fumare', 'sigaretta', 'sigarette', 'nicotina', 'tabacco', 'svapo', 'vape', 'iqos'],
    sintesi: 'Ogni giorno senza fumo il tuo corpo ripara qualcosa che il fumo stava rompendo. Il recupero inizia dopo 20 minuti e non si ferma più.',
    corpo: [
      'Pressione e battito cardiaco tornano a valori normali',
      'Ossigeno nel sangue in risalita: meno fiato corto',
      'Polmoni che si puliscono e tosse che si riduce',
      'Gusto e olfatto che tornano a funzionare davvero',
      'Pelle più luminosa e meno invecchiamento cutaneo',
      'Rischio cardiovascolare e oncologico che cala nel tempo',
    ],
    mente: [
      'Meno ansia di fondo: la nicotina la alimentava, non la curava',
      'Senso di controllo: hai smesso di obbedire a un impulso',
      'Sonno più profondo dopo le prime settimane',
      'Autostima che cresce ogni giorno che resisti',
    ],
    timeline: [
      { giorni: 0, titolo: '20 minuti', testo: 'Battito e pressione iniziano a normalizzarsi.' },
      { giorni: 1, titolo: '24 ore', testo: 'Il monossido di carbonio è quasi sparito dal sangue: più ossigeno ai tessuti.' },
      { giorni: 2, titolo: '48 ore', testo: 'Le terminazioni nervose si rigenerano: gusto e olfatto tornano.' },
      { giorni: 3, titolo: '72 ore', testo: 'Nicotina fuori dal corpo. È il picco della crisi: dopo questo, si scende.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Il craving diventa più raro e più corto. Respiri meglio salendo le scale.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Circolazione migliorata: mani e piedi più caldi, più resistenza fisica.' },
      { giorni: 30, titolo: '1 mese', testo: 'Funzione polmonare in netto aumento, meno tosse e meno affanno.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Capacità polmonare fino al +10%. L\'attività fisica diventa un\'altra cosa.' },
      { giorni: 270, titolo: '9 mesi', testo: 'Le ciglia dei bronchi sono tornate a funzionare: meno infezioni respiratorie.' },
      { giorni: 365, titolo: '1 anno', testo: 'Rischio di malattia coronarica circa dimezzato rispetto a chi fuma.' },
      { giorni: 1825, titolo: '5 anni', testo: 'Rischio di ictus che si avvicina a quello di un non fumatore.' },
      { giorni: 3650, titolo: '10 anni', testo: 'Rischio di tumore al polmone circa dimezzato.' },
    ],
    consigli: [
      'Identifica i tre momenti in cui il craving arriva sempre (caffè, auto, dopo cena) e prepara in anticipo un gesto sostitutivo.',
      'Il craving dura 3-5 minuti: imposta un timer e aspetta che passi, invece di combatterlo.',
      'Calcola i soldi risparmiati e destinali a qualcosa che vedi (un fondo visibile, non il conto corrente).',
    ],
  },
  {
    key: 'palestra',
    label: 'Allenamento / palestra',
    emoji: '🏋️',
    category: 'movimento',
    kindHint: 'weekly',
    keywords: ['palestra', 'allenamento', 'allenarsi', 'pesi', 'workout', 'gym', 'fitness', 'calisthenics', 'crossfit'],
    sintesi: 'L\'allenamento di forza è l\'unica cosa che aumenta contemporaneamente massa muscolare, densità ossea, sensibilità insulinica e umore.',
    corpo: [
      'Aumento di forza e massa muscolare',
      'Metabolismo basale più alto: consumi di più anche a riposo',
      'Densità ossea che cresce (protezione a lungo termine)',
      'Migliore sensibilità insulinica e controllo della glicemia',
      'Postura e mal di schiena che migliorano',
    ],
    mente: [
      'Endorfine e dopamina: umore più stabile nelle ore dopo l\'allenamento',
      'Riduzione documentata di ansia e sintomi depressivi',
      'Disciplina trasferibile: chi tiene fede all\'allenamento tiene fede al resto',
      'Immagine corporea e sicurezza in crescita',
    ],
    timeline: [
      { giorni: 1, titolo: 'Prima sessione', testo: 'Aumento immediato di endorfine e attivazione neuromuscolare.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Adattamenti neurali: sollevi di più senza aver ancora messo muscolo.' },
      { giorni: 30, titolo: '1 mese', testo: 'Meno DOMS, più energia quotidiana, sonno più profondo.' },
      { giorni: 56, titolo: '8 settimane', testo: 'Ipertrofia visibile e composizione corporea che cambia davvero.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Pressione a riposo più bassa, VO2max e resistenza in aumento.' },
      { giorni: 180, titolo: '6 mesi', testo: 'Densità ossea misurabilmente migliorata, forza quasi raddoppiata sui fondamentali.' },
      { giorni: 365, titolo: '1 anno', testo: 'Rischio cardiovascolare e metabolico ridotto in modo strutturale.' },
    ],
    consigli: [
      'Prepara la borsa la sera prima: la maggior parte degli allenamenti si perde a casa, non in palestra.',
      'Meglio 3 sessioni corte fatte sempre che 5 lunghe fatte a settimane alterne.',
      'Traccia i carichi: vedere i numeri salire è il vero carburante.',
    ],
  },
  {
    key: 'alimentazione',
    label: 'Alimentazione sana',
    emoji: '🥗',
    category: 'alimentazione',
    kindHint: 'daily',
    keywords: ['alimentazione', 'mangiare', 'dieta', 'cibo', 'sano', 'verdura', 'frutta', 'proteine', 'nutrizione'],
    sintesi: 'Mangiare bene non è un sacrificio quotidiano: è la variabile che influenza energia, umore e sonno più di qualsiasi altra.',
    corpo: [
      'Energia stabile durante la giornata (niente crolli post-pasto)',
      'Digestione e microbiota intestinale più sani',
      'Composizione corporea che migliora senza diete estreme',
      'Colesterolo, glicemia e infiammazione in calo',
      'Pelle e capelli visibilmente migliori',
    ],
    mente: [
      'Meno nebbia mentale e concentrazione più lunga',
      'Umore più stabile: l\'intestino produce gran parte della serotonina',
      'Meno fame nervosa quando i pasti sono strutturati',
    ],
    timeline: [
      { giorni: 3, titolo: '3 giorni', testo: 'Meno gonfiore e ritenzione, energia più costante nel pomeriggio.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Il palato si ricalibra: i cibi molto zuccherati iniziano a sembrare eccessivi.' },
      { giorni: 21, titolo: '3 settimane', testo: 'Microbiota in cambiamento, digestione regolare, sonno migliore.' },
      { giorni: 60, titolo: '2 mesi', testo: 'Valori ematici (glicemia, trigliceridi) misurabilmente migliori.' },
      { giorni: 180, titolo: '6 mesi', testo: 'Nuovo set point: mangiare bene è diventato il default, non lo sforzo.' },
    ],
    consigli: [
      'Decidi i pasti la sera prima: la forza di volontà a fine giornata è la risorsa più scarsa che hai.',
      'Regola pratica: proteine + verdura in ogni pasto principale, il resto viene da sé.',
      'Non puntare al 100%: 6 giorni su 7 fatti bene battono la perfezione che dura due settimane.',
    ],
  },
  {
    key: 'lettura',
    label: 'Leggere',
    emoji: '📚',
    category: 'studio',
    kindHint: 'daily',
    keywords: ['leggere', 'lettura', 'libro', 'libri', 'pagine', 'kindle'],
    sintesi: 'Leggere ogni giorno allena l\'attenzione profonda, l\'unica capacità che il mondo digitale ti sta togliendo.',
    corpo: [
      'Riduzione misurabile del cortisolo dopo pochi minuti di lettura',
      'Leggere prima di dormire (su carta) accorcia i tempi di addormentamento',
    ],
    mente: [
      'Capacità di attenzione sostenuta che si allunga',
      'Vocabolario e capacità di esprimersi in crescita',
      'Empatia e comprensione degli altri (soprattutto con la narrativa)',
      'Memoria di lavoro più allenata, meno bisogno di stimoli veloci',
    ],
    timeline: [
      { giorni: 1, titolo: 'Giorno 1', testo: '6 minuti di lettura abbassano lo stress fino al 60%: parte da subito.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Ti accorgi di riuscire a stare più a lungo su una pagina senza cercare il telefono.' },
      { giorni: 30, titolo: '1 mese', testo: '~1-2 libri completati. L\'attenzione profonda torna ad essere accessibile.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Vocabolario e capacità di sintesi visibilmente migliorati.' },
      { giorni: 365, titolo: '1 anno', testo: '12-20 libri: un cambio reale del modo in cui pensi e parli.' },
    ],
    consigli: [
      'Lega la lettura a un momento fisso (caffè del mattino, letto la sera): l\'orario batte la motivazione.',
      'Minimo accettabile: 2 pagine. Nei giorni no salva la catena, nei giorni buoni diventano 20.',
      'Tieni il libro dove tieni il telefono. Vince quello che hai più a portata di mano.',
    ],
  },
  {
    key: 'meditazione',
    label: 'Meditazione / respirazione',
    emoji: '🧘',
    category: 'mente',
    kindHint: 'daily',
    keywords: ['meditazione', 'meditare', 'mindfulness', 'respirazione', 'respiro', 'yoga nidra', 'calma'],
    sintesi: 'Meditare non serve a svuotare la mente: serve ad accorgerti dei pensieri prima che ti trascinino via.',
    corpo: [
      'Frequenza cardiaca e pressione più basse',
      'Cortisolo ridotto, sistema nervoso parasimpatico più attivo',
      'Migliore qualità del sonno',
    ],
    mente: [
      'Meno reattività emotiva: cresce lo spazio tra stimolo e risposta',
      'Attenzione e memoria di lavoro più solide',
      'Riduzione di ansia e ruminazione',
      'Maggiore consapevolezza dei propri trigger (utilissimo con le dipendenze)',
    ],
    timeline: [
      { giorni: 1, titolo: 'Prima sessione', testo: 'Attivazione del sistema parasimpatico: battito e respiro rallentano.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Ti accorgi prima quando stai per reagire d\'impulso.' },
      { giorni: 21, titolo: '3 settimane', testo: 'Riduzione misurabile di ansia percepita e ruminazione serale.' },
      { giorni: 56, titolo: '8 settimane', testo: 'Cambiamenti nell\'attività dell\'amigdala documentati nei programmi MBSR.' },
      { giorni: 180, titolo: '6 mesi', testo: 'Baseline emotiva più bassa: serve molto di più per farti perdere la calma.' },
    ],
    consigli: [
      'Cinque minuti veri battono venti minuti immaginati. Parti corto.',
      'Se la mente scappa non stai sbagliando: accorgertene È l\'esercizio.',
      'Ancorala a un gesto che fai già (dopo i denti, prima del caffè).',
    ],
  },
  {
    key: 'sonno',
    label: 'Dormire bene',
    emoji: '😴',
    category: 'sonno',
    kindHint: 'daily',
    keywords: ['sonno', 'dormire', 'letto', 'riposo', 'sveglia presto', 'andare a letto'],
    sintesi: 'Il sonno è l\'unica attività che ripara insieme cervello, ormoni, muscoli e umore. Nessuna abitudine rende quanto questa.',
    corpo: [
      'Recupero muscolare e produzione di ormone della crescita',
      'Sistema immunitario più efficiente',
      'Appetito regolato (grelina e leptina tornano in equilibrio)',
      'Pressione e salute cardiovascolare migliori',
    ],
    mente: [
      'Consolidamento della memoria e apprendimento',
      'Regolazione emotiva: dormire poco amplifica ansia e irritabilità',
      'Attenzione, riflessi e capacità decisionale migliori',
    ],
    timeline: [
      { giorni: 1, titolo: 'Prima notte piena', testo: 'Attenzione e umore già misurabilmente migliori il giorno dopo.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Il ritmo circadiano si stabilizza: ti svegli poco prima della sveglia.' },
      { giorni: 21, titolo: '3 settimane', testo: 'Meno fame nervosa e voglia di zuccheri: gli ormoni della fame si riequilibrano.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Pressione, glicemia e recupero sportivo migliorati in modo stabile.' },
    ],
    consigli: [
      'L\'ora della sveglia conta più dell\'ora in cui vai a letto: tienila fissa anche nel weekend.',
      'Ultimo caffè entro le 14: la caffeina ha 5-6 ore di emivita.',
      'Luce naturale nei primi 30 minuti dal risveglio: è il segnale più forte per il tuo orologio interno.',
    ],
  },
  {
    key: 'alcol',
    label: 'Smettere con l\'alcol',
    emoji: '🚫',
    category: 'sostanze',
    kindHint: 'quit',
    keywords: ['alcol', 'alcool', 'bere', 'birra', 'vino', 'drink', 'sober', 'sobrietà'],
    sintesi: 'Togliere l\'alcol migliora sonno, fegato, pelle e umore in tempi sorprendentemente brevi.',
    corpo: [
      'Sonno REM che torna: il vero riposo riparte',
      'Fegato che si rigenera (i grassi epatici calano già nel primo mese)',
      'Pelle più idratata e meno gonfia',
      'Pressione più bassa e peso in calo senza altre modifiche',
    ],
    mente: [
      'Ansia mattutina che sparisce (l\'alcol la alimentava)',
      'Umore più stabile e meno oscillazioni',
      'Lucidità e memoria migliori',
    ],
    timeline: [
      { giorni: 3, titolo: '72 ore', testo: 'Idratazione e sonno iniziano a normalizzarsi.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Sonno profondo e REM in recupero: ti svegli più riposato.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Meno gonfiore, pelle migliore, digestione più regolare.' },
      { giorni: 30, titolo: '1 mese', testo: 'Grasso epatico ridotto in modo significativo, pressione più bassa.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Sistema immunitario e valori del fegato nettamente migliorati.' },
      { giorni: 365, titolo: '1 anno', testo: 'Riduzione stabile del rischio cardiovascolare e oncologico.' },
    ],
    consigli: [
      'Prepara la risposta da dare quando ti offrono da bere: l\'imbarazzo sociale è il vero trigger.',
      'Sostituisci il rituale, non solo la sostanza: stesso bicchiere, stesso momento, contenuto diverso.',
    ],
  },
  {
    key: 'zucchero',
    label: 'Meno zucchero / junk food',
    emoji: '🍬',
    category: 'alimentazione',
    kindHint: 'quit',
    keywords: ['zucchero', 'zuccheri', 'dolci', 'junk', 'merendine', 'fast food', 'schifezze', 'snack'],
    sintesi: 'Lo zucchero crea un ciclo picco-crollo che ti fa sentire stanco e affamato. Uscirne richiede circa due settimane.',
    corpo: [
      'Glicemia stabile: niente più crolli di energia',
      'Meno infiammazione e meno gonfiore',
      'Pelle migliore (meno glicazione)',
      'Perdita di grasso più semplice senza contare calorie',
    ],
    mente: [
      'Umore più costante nell\'arco della giornata',
      'Meno fame nervosa e meno pensieri ossessivi sul cibo',
      'Concentrazione migliore nel pomeriggio',
    ],
    timeline: [
      { giorni: 3, titolo: '72 ore', testo: 'Fase difficile: il craving è al massimo. Passa.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Energia più stabile, meno crollo delle 16:00.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Il palato si ricalibra: la frutta inizia a sembrare dolcissima.' },
      { giorni: 30, titolo: '1 mese', testo: 'Meno gonfiore, pelle migliore, peso in calo.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Sensibilità insulinica migliorata: il corpo gestisce meglio i carboidrati.' },
    ],
    consigli: [
      'Non tenerlo in casa: la forza di volontà perde sempre contro la disponibilità.',
      'Mangia proteine a colazione: taglia il craving di zuccheri del pomeriggio.',
    ],
  },
  {
    key: 'social',
    label: 'Meno social / telefono',
    emoji: '📵',
    category: 'digitale',
    kindHint: 'quit',
    keywords: ['social', 'instagram', 'tiktok', 'telefono', 'smartphone', 'scroll', 'schermo', 'youtube', 'reels'],
    sintesi: 'Ogni scroll è una micro-dose di dopamina. Toglierla per qualche settimana ti restituisce noia, e con la noia le idee.',
    corpo: [
      'Meno affaticamento visivo e tensione cervicale',
      'Addormentamento più rapido senza schermi prima di dormire',
    ],
    mente: [
      'Attenzione che si allunga: torni a reggere cose lente',
      'Meno confronto sociale, meno ansia da inadeguatezza',
      'Più tempo reale disponibile (di solito 2-3 ore al giorno)',
      'Creatività che riemerge dalla noia',
    ],
    timeline: [
      { giorni: 2, titolo: '48 ore', testo: 'Fase di irrequietezza: la mano cerca il telefono da sola. Normale.' },
      { giorni: 7, titolo: '1 settimana', testo: 'Il bisogno compulsivo di controllare cala nettamente.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Attenzione più lunga, meno ansia di fondo, sonno migliore.' },
      { giorni: 30, titolo: '1 mese', testo: 'Recuperi decine di ore. La noia torna ad essere produttiva.' },
    ],
    consigli: [
      'Togli l\'app, non l\'accesso: se serve, usa il browser. L\'attrito fa il lavoro al posto tuo.',
      'Telefono fuori dalla camera da letto: risolve mattina e sera in un colpo solo.',
    ],
  },
  {
    key: 'corsa',
    label: 'Corsa / cardio',
    emoji: '🏃',
    category: 'movimento',
    kindHint: 'weekly',
    keywords: ['corsa', 'correre', 'running', 'cardio', 'bici', 'nuoto', 'camminata', 'passi', 'camminare'],
    sintesi: 'Il cardio regolare è il modo più diretto per aumentare l\'energia disponibile ogni giorno.',
    corpo: [
      'VO2max e capacità aerobica in crescita',
      'Cuore più efficiente, battito a riposo più basso',
      'Pressione e colesterolo migliori',
      'Sistema immunitario più reattivo',
    ],
    mente: [
      'Effetto antidepressivo documentato, paragonabile a interventi clinici leggeri',
      'Riduzione dello stress subito dopo la sessione',
      'Chiarezza mentale: molte decisioni si sbloccano correndo',
    ],
    timeline: [
      { giorni: 7, titolo: '1 settimana', testo: 'Il sonno migliora e l\'umore si stabilizza.' },
      { giorni: 21, titolo: '3 settimane', testo: 'Battito a riposo in calo, stessa distanza con meno fatica.' },
      { giorni: 60, titolo: '2 mesi', testo: 'VO2max misurabilmente più alto, resistenza quotidiana diversa.' },
      { giorni: 180, titolo: '6 mesi', testo: 'Profilo cardiovascolare da persona più giovane della tua età anagrafica.' },
    ],
    consigli: [
      'Vai più piano di quanto vorresti: la maggior parte dei principianti corre troppo forte per durare.',
      'Conta le uscite, non i chilometri, nei primi due mesi.',
    ],
  },
  {
    key: 'acqua',
    label: 'Bere acqua',
    emoji: '💧',
    category: 'alimentazione',
    kindHint: 'daily',
    keywords: ['acqua', 'idratazione', 'bere acqua', 'idratarsi'],
    sintesi: 'Una disidratazione anche lieve (1-2%) peggiora attenzione, umore e prestazione fisica.',
    corpo: ['Energia fisica e prestazione migliori', 'Digestione e transito regolari', 'Pelle più idratata', 'Meno mal di testa'],
    mente: ['Concentrazione migliore', 'Meno stanchezza percepita nel pomeriggio'],
    timeline: [
      { giorni: 3, titolo: '3 giorni', testo: 'Meno mal di testa e stanchezza pomeridiana.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Pelle e digestione visibilmente migliori.' },
      { giorni: 30, titolo: '1 mese', testo: 'Diventa automatico: il corpo ti chiede acqua prima che tu ci pensi.' },
    ],
    consigli: ['Bottiglia sempre in vista: bevi quello che vedi.', 'Un bicchiere appena sveglio: recuperi le ore di notte.'],
  },
  {
    key: 'studio',
    label: 'Studio / apprendimento',
    emoji: '🎯',
    category: 'studio',
    kindHint: 'daily',
    keywords: ['studio', 'studiare', 'corso', 'lingua', 'inglese', 'imparare', 'università', 'esame', 'skill'],
    sintesi: 'Poco e ogni giorno batte molto e ogni tanto: la memoria si costruisce sulla ripetizione distribuita.',
    corpo: ['Riserva cognitiva che protegge il cervello nel lungo periodo'],
    mente: [
      'Nuove connessioni neurali e memoria a lungo termine',
      'Capacità di concentrazione profonda in crescita',
      'Fiducia nelle proprie capacità di imparare cose nuove',
    ],
    timeline: [
      { giorni: 7, titolo: '1 settimana', testo: 'Il rituale inizia a formarsi: costa meno iniziare.' },
      { giorni: 30, titolo: '1 mese', testo: '~15 ore accumulate: si vedono i primi risultati concreti.' },
      { giorni: 90, titolo: '3 mesi', testo: 'Competenza utilizzabile nel mondo reale.' },
      { giorni: 365, titolo: '1 anno', testo: '~180 ore: la soglia oltre la quale si diventa davvero bravi in qualcosa.' },
    ],
    consigli: [
      'Sessioni da 25 minuti senza telefono valgono più di 2 ore distratte.',
      'Chiudi ogni sessione scrivendo la prima cosa da fare alla successiva: riparti senza attrito.',
    ],
  },
  {
    key: 'journaling',
    label: 'Scrivere / journaling',
    emoji: '✍️',
    category: 'mente',
    kindHint: 'daily',
    keywords: ['scrivere', 'diario', 'journal', 'journaling', 'gratitudine', 'riflessione'],
    sintesi: 'Mettere per iscritto quello che senti riduce l\'intensità emotiva: il cervello passa dal reagire al descrivere.',
    corpo: ['Riduzione dello stress fisiologico', 'Sonno migliore se scrivi la sera'],
    mente: [
      'Chiarezza sui propri pattern e trigger',
      'Riduzione della ruminazione notturna',
      'Migliore regolazione emotiva',
      'Memoria del proprio percorso: vedi da dove sei partito',
    ],
    timeline: [
      { giorni: 3, titolo: '3 giorni', testo: 'Scarico mentale: la testa è meno affollata la sera.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Iniziano a emergere pattern ricorrenti nei tuoi appunti.' },
      { giorni: 60, titolo: '2 mesi', testo: 'Hai una mappa dei tuoi trigger e delle tue giornate migliori.' },
    ],
    consigli: ['Tre righe bastano.', 'Scrivi anche i giorni storti: sono quelli che contengono le informazioni utili.'],
  },
  {
    key: 'doccia-fredda',
    label: 'Doccia fredda',
    emoji: '🧊',
    category: 'mente',
    kindHint: 'daily',
    keywords: ['doccia fredda', 'freddo', 'ghiaccio', 'crioterapia'],
    sintesi: 'Il freddo è un allenamento volontario al disagio: insegna al cervello che puoi scegliere di fare cose scomode.',
    corpo: ['Circolazione stimolata', 'Recupero muscolare più rapido', 'Risposta immunitaria stimolata'],
    mente: ['Aumento marcato di noradrenalina e dopamina', 'Tolleranza allo stress che cresce', 'Vittoria facile appena sveglio'],
    timeline: [
      { giorni: 1, titolo: 'Giorno 1', testo: 'Picco di noradrenalina: sveglio e lucido per ore.' },
      { giorni: 14, titolo: '2 settimane', testo: 'Il disagio iniziale si riduce, la tolleranza cresce.' },
      { giorni: 30, titolo: '1 mese', testo: 'Migliore risposta allo stress anche fuori dalla doccia.' },
    ],
    consigli: ['Ultimi 30 secondi freddi bastano per iniziare.', 'Respira lentamente invece di irrigidirti: è lì che alleni la mente.'],
  },
  {
    key: 'ordine',
    label: 'Ordine / casa',
    emoji: '🧹',
    category: 'altro',
    kindHint: 'daily',
    keywords: ['ordine', 'pulire', 'casa', 'riordinare', 'letto', 'pulizia'],
    sintesi: 'L\'ambiente esterno e lo stato mentale si copiano a vicenda. Ordinare fuori costa poco e rende molto dentro.',
    corpo: ['Movimento leggero quotidiano', 'Ambiente più sano (polvere, allergeni)'],
    mente: ['Meno carico cognitivo residuo', 'Senso di controllo immediato', 'Meno procrastinazione a catena'],
    timeline: [
      { giorni: 7, titolo: '1 settimana', testo: 'Le stanze restano in ordine con metà dello sforzo.' },
      { giorni: 30, titolo: '1 mese', testo: 'Il disordine smette di accumularsi: manutenzione invece di emergenze.' },
    ],
    consigli: ['Regola dei 2 minuti: se richiede meno di due minuti, si fa ora.'],
  },
  {
    key: 'relazioni',
    label: 'Relazioni e persone',
    emoji: '❤️',
    category: 'relazioni',
    kindHint: 'weekly',
    keywords: ['famiglia', 'amici', 'chiamare', 'relazioni', 'partner', 'sociale', 'tempo insieme'],
    sintesi: 'La qualità delle relazioni è il predittore più forte di felicità e longevità che la ricerca conosca.',
    corpo: ['Meno cortisolo cronico', 'Longevità associata a legami sociali forti'],
    mente: ['Senso di appartenenza', 'Protezione da ansia e depressione', 'Prospettiva esterna sui propri problemi'],
    timeline: [
      { giorni: 14, titolo: '2 settimane', testo: 'Le conversazioni tornano ad essere naturali, non "recuperi".' },
      { giorni: 90, titolo: '3 mesi', testo: 'Rete di supporto reale: hai chi chiamare nei giorni difficili.' },
    ],
    consigli: ['Metti un promemoria ricorrente: non è freddo, è realistico.'],
  },
]

/** Benefici generici per categoria, usati quando non c'è un profilo specifico. */
const GENERICI: Record<HabitCategory, { corpo: string[]; mente: string[] }> = {
  movimento: {
    corpo: ['Più energia e resistenza', 'Cuore e circolazione più efficienti', 'Postura e forza migliori'],
    mente: ['Umore più stabile', 'Stress in calo', 'Sonno più profondo'],
  },
  alimentazione: {
    corpo: ['Energia più costante', 'Digestione migliore', 'Composizione corporea in miglioramento'],
    mente: ['Meno nebbia mentale', 'Meno fame nervosa'],
  },
  mente: {
    corpo: ['Battito e cortisolo più bassi'],
    mente: ['Meno reattività emotiva', 'Attenzione più solida', 'Consapevolezza dei propri trigger'],
  },
  sonno: {
    corpo: ['Recupero fisico e ormonale', 'Immunità più forte'],
    mente: ['Memoria e attenzione migliori', 'Umore più regolato'],
  },
  studio: {
    corpo: ['Riserva cognitiva a lungo termine'],
    mente: ['Nuove competenze', 'Concentrazione allenata', 'Fiducia nelle proprie capacità'],
  },
  sostanze: {
    corpo: ['Il corpo ripara i danni accumulati', 'Sonno e energia in recupero'],
    mente: ['Senso di controllo', 'Meno ansia di fondo', 'Autostima in crescita'],
  },
  digitale: {
    corpo: ['Meno affaticamento visivo', 'Sonno migliore'],
    mente: ['Attenzione più lunga', 'Meno confronto sociale', 'Più tempo reale'],
  },
  relazioni: {
    corpo: ['Meno stress cronico'],
    mente: ['Senso di appartenenza', 'Supporto nei momenti difficili'],
  },
  altro: {
    corpo: ['Il corpo beneficia di ogni routine stabile'],
    mente: ['Senso di controllo e di identità: diventi il tipo di persona che fa questa cosa'],
  },
}

const TIMELINE_GENERICA: Milestone[] = [
  { giorni: 1, titolo: 'Giorno 1', testo: 'La decisione è la parte più difficile ed è già fatta.' },
  { giorni: 3, titolo: '3 giorni', testo: 'La fase in cui la maggior parte delle persone molla. Superarla cambia tutto.' },
  { giorni: 7, titolo: '1 settimana', testo: 'Il comportamento inizia a diventare familiare: costa meno iniziare.' },
  { giorni: 21, titolo: '3 settimane', testo: 'Il rituale è formato: la resistenza mentale iniziale si è ridotta.' },
  { giorni: 66, titolo: '66 giorni', testo: 'La soglia media in cui un comportamento diventa automatico (studi UCL).' },
  { giorni: 180, titolo: '6 mesi', testo: 'Non è più un\'abitudine che segui: è una parte di come ti descrivi.' },
  { giorni: 365, titolo: '1 anno', testo: 'Un anno intero di prove concrete su chi sei diventato.' },
]

function normalizza(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/** Trova il profilo di benefici più adatto al nome dell'abitudine. */
export function trovaProfilo(nome: string, categoria?: HabitCategory): BenefitProfile | undefined {
  const testo = normalizza(nome)
  let migliore: { p: BenefitProfile; score: number } | undefined
  for (const p of PROFILI) {
    let score = 0
    for (const k of p.keywords) {
      const kk = normalizza(k)
      if (testo === kk) score += 10
      else if (testo.includes(kk)) score += kk.length >= 5 ? 5 : 3
    }
    // Il bonus di categoria affina la scelta ma non basta da solo a fare match.
    if (score === 0) continue
    if (categoria && p.category === categoria) score += 1
    if (!migliore || score > migliore.score) migliore = { p, score }
  }
  return migliore?.p
}

export function profiloPerKey(key?: string): BenefitProfile | undefined {
  return PROFILI.find((p) => p.key === key)
}

export interface SchedaBenefici {
  titolo: string
  emoji: string
  sintesi: string
  corpo: string[]
  mente: string[]
  timeline: Milestone[]
  consigli: string[]
  /** Milestone già raggiunte e prossima da raggiungere. */
  raggiunte: Milestone[]
  prossima?: Milestone
  /** Vero se la scheda viene da un profilo specifico e non dal fallback generico. */
  specifica: boolean
}

/** Costruisce la scheda benefici per un'abitudine, dato il numero di giorni di progresso. */
export function schedaBenefici(
  nome: string,
  categoria: HabitCategory,
  giorni: number,
  key?: string,
): SchedaBenefici {
  const profilo = profiloPerKey(key) ?? trovaProfilo(nome, categoria)
  const generico = GENERICI[categoria] ?? GENERICI.altro
  const timeline = profilo?.timeline ?? TIMELINE_GENERICA
  const raggiunte = timeline.filter((m) => giorni >= m.giorni)
  const prossima = timeline.find((m) => giorni < m.giorni)
  return {
    titolo: profilo?.label ?? nome,
    emoji: profilo?.emoji ?? '⭐',
    sintesi: profilo?.sintesi
      ?? 'Ogni ripetizione rafforza il circuito neurale di questa abitudine: più la fai, meno ti costa farla.',
    corpo: profilo?.corpo ?? generico.corpo,
    mente: profilo?.mente ?? generico.mente,
    timeline,
    consigli: profilo?.consigli ?? [
      'Rendi il primo passo ridicolmente piccolo: l\'inizio è la parte che si salta.',
      'Aggancia l\'abitudine a qualcosa che fai già ogni giorno.',
      'Non saltare mai due volte di fila: è la regola che protegge tutte le altre.',
    ],
    raggiunte,
    prossima,
    specifica: !!profilo,
  }
}
