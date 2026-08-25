import { useMemo, useState } from 'react'
import { useStore, CHIAVE_STORAGE, normalizzaStato } from '../state/store'
import { calcolaProgresso } from '../domain/xp'
import { formatLungo } from '../domain/dates'
import { naviga } from '../App'
import { useToast } from '../components/toast'

export default function Impostazioni() {
  const { state, dispatch, oggi } = useStore()
  const toast = useToast()
  const [nome, setNome] = useState(state.profile.name)
  const [conferma, setConferma] = useState(false)
  const progresso = useMemo(() => calcolaProgresso(state, oggi), [state, oggi])

  const esporta = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abitudini-backup-${oggi}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('Backup scaricato')
  }

  const importa = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const dati = normalizzaStato(JSON.parse(String(reader.result)))
        dispatch({ type: 'importa', state: dati })
        toast('Dati importati')
      } catch {
        toast('File non valido')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="schermata">
      <header className="intestazione">
        <button className="icona-btn" onClick={() => naviga('oggi')} aria-label="Indietro">←</button>
        <div className="crescita"><h1 style={{ fontSize: 22 }}>Impostazioni</h1></div>
      </header>

      <section className="card">
        <label className="etichetta">Come ti chiamo</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => dispatch({ type: 'nome', nome: nome.trim() })}
          placeholder="Il tuo nome"
        />
        <div className="micro" style={{ marginTop: 8 }}>
          Attivo dal {formatLungo(new Date(state.profile.createdAt).toISOString().slice(0, 10))} ·
          {' '}{progresso.xp} XP · livello {progresso.livello}
        </div>
      </section>

      <section className="sezione">
        <h2>Preferenze</h2>
        <div className="card">
          <label className="riga-spazio" style={{ cursor: 'pointer' }}>
            <div className="crescita">
              <b style={{ fontSize: 14.5 }}>Settimana da lunedì</b>
              <div className="micro">Se disattivo, la settimana parte da domenica</div>
            </div>
            <input
              type="checkbox"
              checked={state.settings.weekStartsMonday}
              onChange={(e) => dispatch({ type: 'impostazioni', patch: { weekStartsMonday: e.target.checked } })}
              style={{ width: 22, height: 22 }}
            />
          </label>
        </div>
        <div className="card">
          <label className="riga-spazio" style={{ cursor: 'pointer' }}>
            <div className="crescita">
              <b style={{ fontSize: 14.5 }}>Riduci le animazioni</b>
              <div className="micro">Meno movimento, stessa app</div>
            </div>
            <input
              type="checkbox"
              checked={state.settings.reduceMotion}
              onChange={(e) => dispatch({ type: 'impostazioni', patch: { reduceMotion: e.target.checked } })}
              style={{ width: 22, height: 22 }}
            />
          </label>
        </div>
      </section>

      <section className="sezione">
        <h2>I tuoi dati</h2>
        <div className="card">
          <p className="piccolo">
            Tutto quello che scrivi resta sul tuo telefono: nessun account, nessun server, nessuna condivisione.
            Fai un backup ogni tanto, così puoi spostare i dati su un altro dispositivo.
          </p>
          <div className="colonna" style={{ marginTop: 14 }}>
            <button className="btn btn-pieno" onClick={esporta}>⬇️ Esporta backup (.json)</button>
            <label className="btn btn-pieno" style={{ cursor: 'pointer' }}>
              ⬆️ Importa backup
              <input
                type="file"
                accept="application/json"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importa(f) }}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="sezione">
        <h2>Zona pericolosa</h2>
        {conferma ? (
          <div className="avviso attenzione">
            <b>Cancello tutto?</b>
            <p>Abitudini, giorni registrati, note e premi: sparisce tutto e non si torna indietro.</p>
            <div className="riga" style={{ marginTop: 10 }}>
              <button
                className="btn btn-pericolo crescita"
                onClick={() => {
                  localStorage.removeItem(CHIAVE_STORAGE)
                  dispatch({ type: 'azzera' })
                  setConferma(false)
                  toast('Dati cancellati')
                  naviga('oggi')
                }}
              >
                Sì, cancella
              </button>
              <button className="btn crescita" onClick={() => setConferma(false)}>Annulla</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-pieno btn-pericolo" onClick={() => setConferma(true)}>
            Cancella tutti i dati
          </button>
        )}
      </section>

      <section className="sezione">
        <div className="card">
          <b style={{ fontSize: 14 }}>Come installarla sul telefono</b>
          <p className="piccolo" style={{ marginTop: 8 }}>
            <b>iPhone:</b> apri il link in Safari → tasto Condividi → "Aggiungi a Home".<br />
            <b>Android:</b> apri in Chrome → menu ⋮ → "Installa app" o "Aggiungi a schermata Home".
          </p>
          <p className="micro" style={{ marginTop: 8 }}>
            Una volta installata funziona anche senza connessione.
          </p>
        </div>
      </section>

      <p className="micro centro" style={{ marginTop: 20 }}>
        Le informazioni sui benefici sono divulgative e non sostituiscono un parere medico.
      </p>
    </div>
  )
}
