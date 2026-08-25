import { useCallback, useEffect, useMemo, useState } from 'react'
import { useStore } from './state/store'
import { calcolaProgresso } from './domain/xp'
import { premioPerId, premioRealeSuggerito } from './domain/rewards'
import { Celebrazione, Toast } from './components/ui'
import Oggi from './screens/Oggi'
import Abitudini from './screens/Abitudini'
import DettaglioAbitudine from './screens/DettaglioAbitudine'
import Calendario from './screens/Calendario'
import Diario from './screens/Diario'
import Premi from './screens/Premi'
import Impostazioni from './screens/Impostazioni'
import { ToastContext } from './components/toast'

type Percorso = { schermata: string; parametro?: string }

function leggiHash(): Percorso {
  const raw = window.location.hash.replace(/^#\/?/, '')
  const [schermata, parametro] = raw.split('/')
  return { schermata: schermata || 'oggi', parametro }
}

export function naviga(a: string) {
  window.location.hash = `#/${a}`
}

const VOCI = [
  { id: 'oggi', ico: '🎯', label: 'Oggi' },
  { id: 'abitudini', ico: '📋', label: 'Abitudini' },
  { id: 'calendario', ico: '🗓️', label: 'Calendario' },
  { id: 'diario', ico: '📓', label: 'Diario' },
  { id: 'premi', ico: '🏆', label: 'Premi' },
]

export default function App() {
  const { state, dispatch, oggi } = useStore()
  const [percorso, setPercorso] = useState<Percorso>(leggiHash)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    const onHash = () => {
      setPercorso(leggiHash())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('riduci-movimento', state.settings.reduceMotion)
  }, [state.settings.reduceMotion])

  const progresso = useMemo(() => calcolaProgresso(state, oggi), [state, oggi])

  // Premio appena sbloccato da mostrare in celebrazione.
  const premioNuovo = state.rewards.find((r) => !r.seen)
  const salitoDiLivello = progresso.livello > state.profile.lastSeenLevel

  const mostraToast = useCallback((t: string) => setToast(t), [])

  const schermata = () => {
    switch (percorso.schermata) {
      case 'abitudini':
        return percorso.parametro
          ? <DettaglioAbitudine id={percorso.parametro} />
          : <Abitudini />
      case 'calendario': return <Calendario />
      case 'diario': return <Diario />
      case 'premi': return <Premi />
      case 'impostazioni': return <Impostazioni />
      default: return <Oggi />
    }
  }

  const dettaglioPremio = premioNuovo ? premioPerId(premioNuovo.id) : undefined

  return (
    <ToastContext.Provider value={mostraToast}>
      <div className="app">
        {schermata()}

        <nav className="nav">
          {VOCI.map((v) => (
            <button
              key={v.id}
              className={percorso.schermata === v.id ? 'attivo' : ''}
              onClick={() => naviga(v.id)}
              aria-label={v.label}
            >
              <span className="ico">{v.ico}</span>
              {v.label}
            </button>
          ))}
        </nav>

        {toast && <Toast testo={toast} onFine={() => setToast(null)} />}

        {dettaglioPremio && (
          <Celebrazione
            emoji={dettaglioPremio.emoji}
            titolo={`Premio sbloccato: ${dettaglioPremio.nome}`}
            testo={dettaglioPremio.messaggio}
            sottotesto={
              dettaglioPremio.premioReale ??
              premioRealeSuggerito(state, dettaglioPremio.nome.length)
            }
            onChiudi={() => dispatch({ type: 'premiVisti' })}
          />
        )}

        {!dettaglioPremio && salitoDiLivello && (
          <Celebrazione
            emoji="⚡"
            titolo={`Livello ${progresso.livello}`}
            testo={`Sei diventato "${progresso.titolo}". Ogni giorno registrato ti ha portato qui.`}
            onChiudi={() => dispatch({ type: 'livelloVisto', livello: progresso.livello })}
          />
        )}
      </div>
    </ToastContext.Provider>
  )
}
