import Dieta from './Dieta'
import Palestra from './Palestra'
import { naviga } from '../App'

/** Contenitore delle due schede prescritte: alimentare e di allenamento. */
export default function Piano({ sezione }: { sezione: 'dieta' | 'palestra' }) {
  return (
    <div>
      <div className="segmenti">
        <button
          className={sezione === 'dieta' ? 'attivo' : ''}
          onClick={() => naviga('piano')}
        >
          🥗 Dieta
        </button>
        <button
          className={sezione === 'palestra' ? 'attivo' : ''}
          onClick={() => naviga('piano/palestra')}
        >
          🏋️ Palestra
        </button>
      </div>
      {sezione === 'dieta' ? <Dieta /> : <Palestra />}
    </div>
  )
}
