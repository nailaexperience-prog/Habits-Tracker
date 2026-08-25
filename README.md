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

Nel repository c'è il workflow `.github/workflows/deploy.yml`, che abilita Pages da solo
(`configure-pages` con `enablement: true`) e pubblica a ogni push. Serve solo che il
repository sia **pubblico**, altrimenti Pages richiede un piano GitHub a pagamento.

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
  domain/      logica pura e testata: date, statistiche, XP, premi, benefici, analisi
  state/       store con reducer e persistenza su localStorage
  components/  pezzi riutilizzabili (anello livello, sheet, riga abitudine, form)
  screens/     Oggi, Abitudini, Dettaglio, Calendario, Diario, Premi, Impostazioni
```

Le XP non vengono accumulate in modo incrementale ma **ricalcolate dallo stato**: correggere un
giorno nel passato aggiorna correttamente livelli e premi.

## Nota

Le informazioni sui benefici sono divulgative, basate su letteratura pubblica di divulgazione
sanitaria, e non sostituiscono il parere di un medico.
