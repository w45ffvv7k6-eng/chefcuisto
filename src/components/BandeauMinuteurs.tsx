import { formaterCompte } from '../lib/durees'
import { restant, useMinuteurs } from '../lib/minuteurs'
import Icone from './Icone'

// Les minuteurs en cours, toujours visibles en bas de l'écran.
export default function BandeauMinuteurs({ haut = false }: { haut?: boolean }) {
  const { minuteurs, maintenant, basculerPause, ajouter, arreter } = useMinuteurs()
  if (!minuteurs.length) return null

  return (
    <div className={haut ? 'minuteurs minuteurs--cuisine' : 'minuteurs'} role="region" aria-label="Minuteurs">
      {minuteurs.map((m) => {
        const s = restant(m, maintenant)
        const fini = s <= 0
        return (
          <div key={m.id} className={fini ? 'minuteur est-fini' : m.pause != null ? 'minuteur est-pause' : 'minuteur'}>
            <Icone nom="horloge" taille={20} />
            <div className="minuteur__texte">
              <strong aria-live={fini ? 'assertive' : 'off'}>{fini ? 'Terminé !' : formaterCompte(s)}</strong>
              <span>{m.libelle}</span>
            </div>
            {!fini && (
              <>
                <button type="button" className="minuteur__bouton" onClick={() => ajouter(m.id, 60)} aria-label="Une minute de plus">+1</button>
                <button type="button" className="minuteur__bouton" onClick={() => basculerPause(m.id)}>
                  {m.pause != null ? 'Reprendre' : 'Pause'}
                </button>
              </>
            )}
            <button type="button" className="minuteur__bouton minuteur__bouton--fort" onClick={() => arreter(m.id)}>
              {fini ? 'OK' : <Icone nom="croix" taille={18} />}
            </button>
          </div>
        )
      })}
    </div>
  )
}
