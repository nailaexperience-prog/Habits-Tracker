# Livelli · Tracker di abitudini a livelli

App per tracciare le abitudini come se fosse un videogioco: guadagni XP, sali di livello,
sblocchi premi e vedi giorno per giorno che cosa stanno facendo le tue abitudini al tuo corpo
e alla tua mente.

Funziona sul telefono (si installa come app), **senza account e senza server**: tutti i dati
restano sul dispositivo.

## Cosa fa

**Tre modi di tracciare**, scelti in base a quello che scrivi:

| Tipo | Quando si usa | Cosa conta |
|------|---------------|------------|
| **Smettere** | fumo, alcol, zuccheri, social | i giorni consecutivi senza ricadute, con record personale |
| **Ogni giorno** | alimentazione sana, lettura, meditazione | la serie di giorni consecutivi e la percentuale di aderenza |
| **N volte a settimana** | palestra 4x, corsa 3x | le sessioni della settimana e le settimane chiuse a obiettivo |

Per le abitudini di tipo "smettere" puoi indicare una **data passata** ("ho smesso il 10 agosto"):
l'app conta tutti i giorni da lì a oggi.

**Benefici riconosciuti automaticamente.** Scrivendo il nome dell'abitudine l'app la riconosce e
mostra una scheda con gli effetti sul corpo e sulla mente e una linea del tempo dei traguardi
fisiologici (20 minuti, 72 ore, 1 mese, 1 anno...). Il catalogo copre fumo, alcol, zuccheri,
palestra, corsa, alimentazione, sonno, lettura, studio, meditazione, journaling, doccia fredda,
acqua, social, ordine e relazioni; per tutto il resto usa i benefici tipici della categoria.

**Livelli e premi.** Ogni giorno registrato dà XP: giorni puliti, sessioni, traguardi, note scritte
e — sì — anche le ricadute registrate onestamente. Salendo di livello cambia il titolo
(da "Seme" a "Leggenda") e si sbloccano 27 premi. Ogni premio sbloccato propone anche un
**premio reale**, scelto in base alle categorie delle tue abitudini.

**Calendario modificabile.** Puoi correggere qualsiasi giorno passato, aggiungere o togliere una
registrazione, allegare una nota e un umore.

**Piano alimentare personale.** La scheda *Dieta* contiene lo schema del nutrizionista giorno per
giorno (7 giorni × 5 pasti) con le grammature esatte. Per ogni portata scegli fra le alternative
previste dallo schema e segni *tutto / metà / saltato*; l'app somma le calorie in tempo reale,
tiene il conto degli alimenti fuori piano, mostra media e andamento su 14 giorni e ti dice se stai
andando sopra o sotto il piano. Include la sostituzione della merenda nei giorni di allenamento,
la frutta e verdura di stagione del mese corrente e le regole generali del nutrizionista.

Il programma di allenamento riproduce le schede "Ipertrofia A" e "Ipertrofia B" di Jacopo Palloni
(personal trainer) su 5 settimane. I carichi suggeriti sono calcolati dalla variazione di
ripetizioni e buffer fra una settimana e l'altra: sono un punto di partenza, non una prescrizione.
Il riferimento resta il personal trainer. Quando
la giornata è completa, l'abitudine "alimentazione sana" si spunta da sola.

**Scheda di allenamento.** La sezione *Palestra* contiene il programma del personal trainer:
schede A e B con la prescrizione di ogni esercizio per ciascuna delle 5 settimane (serie,
ripetizioni, buffer, recupero). L'app decide quale scheda tocca — A e B si alternano sempre, e la
sessione col personal trainer non rompe l'alternanza — ti mostra i carichi dell'ultima volta e
propone quello di oggi seguendo la regola del PT: quando la scheda chiede meno ripetizioni o meno
buffer il carico sale, quando ne chiede di più scende. Registri peso e ripetizioni serie per serie,
e la sezione *Carichi* mostra la progressione di ogni esercizio nel tempo. Chiudere l'allenamento
spunta l'abitudine "palestra" della giornata.

**Promemoria dei pasti e degli allenamenti.** Due strade: le notifiche del browser (funzionano finché l'app resta
aperta, anche in secondo piano) e l'esportazione in un file `.ics` con 35 promemoria settimanali —
uno per ogni pasto di ogni giorno, con l'elenco di cosa mangiare — da importare nel calendario del
telefono, dove le notifiche arrivano anche ad app chiusa. Lo stesso vale per gli allenamenti, con
un promemoria ricorrente nei giorni scelti. Senza un server non è possibile mandare push vere, e
l'app lo dice apertamente invece di fingere.

**Diario con analisi.** L'app legge quello che scrivi e ne ricava: il tono generale, i temi
ricorrenti (stress, sonno, noia, contesti sociali, ansia, cibo...), il giorno della settimana in
cui salti più spesso, il confronto con la settimana precedente e le abitudini che stanno
scivolando — con un consiglio concreto per ciascuna cosa.

## Come si usa sul telefono

1. Apri il link dell'app pubblicata (vedi sotto).
2. **iPhone (Safari):** tasto Condividi → *Aggiungi a Home*.
   **Android (Chrome):** menu ⋮ → *Installa app*.
3. Da quel momento si apre a schermo intero e funziona anche offline.

I dati stanno nel browser del telefono. Dalle Impostazioni puoi **esportare un backup .json**
e reimportarlo su un altro dispositivo.

## Pubblicare l'app (GitHub Pages)

Nel repository c'è il workflow `.github/workflows/deploy.yml`, che pubblica a ogni push.
Due condizioni, una tantum:

1. Il repository deve essere **pubblico** (su repo privati Pages richiede un piano a pagamento).
2. La prima attivazione va fatta a mano: *Settings* → *Pages* → *Build and deployment* →
   **Source: GitHub Actions**. Il token delle Action non ha i permessi per creare il sito Pages
   da solo, quindi finché non lo attivi il passo `configure-pages` fallisce.

Fatto questo, *Actions* → *Pubblica su GitHub Pages* → **Re-run all jobs**, e da lì in avanti
ogni push pubblica da solo.

L'indirizzo è `https://nailaexperience-prog.github.io/Habits-Tracker/`: aprilo dal telefono
e aggiungilo alla schermata Home.

## Sviluppo

```bash
npm install
npm run dev      # sviluppo su http://localhost:5173
npm test         # test della logica (streak, XP, premi, analisi)
npm run build    # build di produzione in dist/
npm run preview  # anteprima della build
```

Le icone della PWA si rigenerano con `node scripts/genera-icone.mjs`.

### Struttura

```
src/
  domain/      logica pura e testata: date, statistiche, XP, premi, benefici, analisi,
               piano alimentare (dieta.ts, dietaLog.ts), programma di allenamento
               (allenamento.ts, allenamentoLog.ts) e promemoria (.ics)
  state/       store con reducer e persistenza su localStorage
  components/  pezzi riutilizzabili (anello livello, sheet, riga abitudine, form)
  screens/     Oggi, Abitudini, Dettaglio, Calendario, Diario, Premi, Impostazioni
```

Le XP non vengono accumulate in modo incrementale ma **ricalcolate dallo stato**: correggere un
giorno nel passato aggiorna correttamente livelli e premi.

## Nota

Le informazioni sui benefici sono divulgative, basate su letteratura pubblica di divulgazione
sanitaria, e non sostituiscono il parere di un medico.

Il piano alimentare riproduce lo schema del Dott. Igor Mione (biologo nutrizionista) emesso
l'11/06/2026 con validità indicata di 3 settimane. Le calorie sono **stime** calcolate dalle
grammature dello schema con tabelle di composizione degli alimenti: servono a leggere l'andamento,
non sono un dato clinico. Per qualsiasi modifica allo schema, il riferimento resta il
nutrizionista.
