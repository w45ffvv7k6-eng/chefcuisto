import { Link } from 'react-router-dom'
import { photoPrincipale, urlPhoto, type RecetteComplete } from '../lib/recettes'
import { formaterDuree, tempsTotal } from '../lib/quantites'
import { DIFFICULTES, ORIGINES } from '../lib/types'
import Icone from './Icone'

export default function CarteRecette({ recette }: { recette: RecetteComplete }) {
  const photo = photoPrincipale(recette)
  const total = tempsTotal(recette)

  return (
    <Link to={`/recette/${recette.id}`} className="carte">
      <div className="carte__image">
        {photo ? <img src={urlPhoto(photo.miniature ?? photo.chemin)} alt="" loading="lazy" /> : <div className="carte__sans-photo"><Icone nom="toque" taille={48} /></div>}
        <span className={`badge badge--${recette.origine}`}>{ORIGINES[recette.origine]}</span>
        {recette.favori && <span className="carte__favori" aria-label="Favori"><Icone nom="coeur" taille={18} plein /></span>}
      </div>
      <div className="carte__corps">
        <h3>{recette.titre}</h3>
        <p className="carte__infos">
          {total > 0 && <span><Icone nom="horloge" taille={16} /> {formaterDuree(total)}</span>}
          <span><Icone nom="niveau" taille={16} /> {DIFFICULTES[recette.difficulte]}</span>
        </p>
      </div>
    </Link>
  )
}
