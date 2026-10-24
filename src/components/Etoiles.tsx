import Icone from './Icone'

// Note sur 5. Cliquable si onChange est fourni (recliquer sur la note actuelle la remet à 0).
export default function Etoiles({ note, onChange, taille = 22 }: { note: number; onChange?: (n: number) => void; taille?: number }) {
  return (
    <div className="etoiles" aria-label={`Note : ${note} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button key={n} type="button" className={n <= note ? 'etoile est-pleine' : 'etoile'}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`} onClick={() => onChange(n === note ? 0 : n)}>
            <Icone nom="etoile" taille={taille} plein={n <= note} />
          </button>
        ) : (
          <span key={n} className={n <= note ? 'etoile est-pleine' : 'etoile'}>
            <Icone nom="etoile" taille={taille} plein={n <= note} />
          </span>
        ),
      )}
    </div>
  )
}
