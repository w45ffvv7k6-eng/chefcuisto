import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { chargerRecette, modifierRecette, photoPrincipale, urlPhoto, type RecetteComplete } from '../lib/recettes'
import { formaterDuree, formaterQuantite, tempsTotal } from '../lib/quantites'
import { CATEGORIES, DIFFICULTES, ORIGINES, type Ingredient, type Photo } from '../lib/types'
import Icone from '../components/Icone'
import Etoiles from '../components/Etoiles'

// Regroupe les éléments par leur champ « groupe » en gardant l'ordre d'origine.
function parGroupe<T extends { groupe?: string }>(liste: T[]): [string, T[]][] {
  const groupes = new Map<string, T[]>()
  for (const el of liste) {
    const g = el.groupe ?? ''
    if (!groupes.has(g)) groupes.set(g, [])
    groupes.get(g)!.push(el)
  }
  return [...groupes.entries()]
}

export default function FicheRecette() {
  const { id } = useParams()
  const naviguer = useNavigate()
  const [recette, setRecette] = useState<RecetteComplete | null | undefined>(undefined)
  const [portions, setPortions] = useState(4)
  const [erreur, setErreur] = useState('')
  const [agrandie, setAgrandie] = useState<Photo | null>(null)

  useEffect(() => {
    chargerRecette(id!).then((r) => {
      setRecette(r)
      if (r) setPortions(r.portions)
    }).catch((e) => setErreur(e.message))
  }, [id])

  if (erreur) return <section className="page"><p className="erreur">Oups : {erreur}</p></section>
  if (recette === undefined) return <section className="page"><div className="fiche__hero carte--fantome" /></section>
  if (recette === null) return (
    <section className="page vide">
      <p className="vide__titre">Recette introuvable</p>
      <Link to="/" className="bouton">Retour aux recettes</Link>
    </section>
  )

  const r = recette
  const facteur = portions / r.portions
  const principale = photoPrincipale(r)
  const autres = r.photos.filter((p) => p.id !== principale?.id && !r.etapes.some((e) => e.photo === p.id))
  const total = tempsTotal(r)
  const estLien = /^https?:\/\//.test(r.source)

  // Enregistre un changement tout de suite à l'écran, puis dans la base.
  function changer(champs: Partial<RecetteComplete>) {
    setRecette({ ...r, ...champs })
    modifierRecette(r.id, champs).catch((e) => setErreur(e.message))
  }

  return (
    <article className="fiche">
      <div className="fiche__hero">
        {principale
          ? <img src={urlPhoto(principale.chemin)} alt={r.titre} onClick={() => setAgrandie(principale)} />
          : <div className="carte__sans-photo"><Icone nom="toque" taille={64} /></div>}
        <button className="bouton-rond fiche__retour" onClick={() => naviguer(-1)} aria-label="Retour">
          <Icone nom="retour" />
        </button>
        <Link to={`/recette/${r.id}/modifier`} className="bouton-rond fiche__modifier" aria-label="Modifier la recette">
          <Icone nom="crayon" />
        </Link>
        <button className={r.favori ? 'bouton-rond fiche__favori est-actif' : 'bouton-rond fiche__favori'}
          onClick={() => changer({ favori: !r.favori })} aria-pressed={r.favori}
          aria-label={r.favori ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
          <Icone nom="coeur" plein={r.favori} />
        </button>
      </div>

      <div className="fiche__contenu">
        <header className="fiche__entete">
          <div className="fiche__etiquettes">
            <span className={`badge badge--${r.origine}`}>{ORIGINES[r.origine]}</span>
            <span className="puce">{CATEGORIES[r.categorie]}</span>
            {r.tags.map((t) => <span key={t} className="puce puce--douce">{t}</span>)}
          </div>
          <h1>{r.titre}</h1>
          {r.description && <p className="fiche__description">{r.description}</p>}
          <Etoiles note={r.note} onChange={(note) => changer({ note })} />
        </header>

        <dl className="fiche__temps">
          {r.temps_preparation ? <div><dt>Préparation</dt><dd>{formaterDuree(r.temps_preparation)}</dd></div> : null}
          {r.temps_cuisson ? <div><dt>Cuisson</dt><dd>{formaterDuree(r.temps_cuisson)}</dd></div> : null}
          {r.temps_repos ? <div><dt>Repos</dt><dd>{formaterDuree(r.temps_repos)}</dd></div> : null}
          {total > 0 && <div className="est-total"><dt>Total</dt><dd>{formaterDuree(total)}</dd></div>}
          <div><dt>Difficulté</dt><dd>{DIFFICULTES[r.difficulte]}</dd></div>
        </dl>

        <div className="fiche__colonnes">
          <section className="fiche__ingredients">
            <div className="fiche__titre-section">
              <h2>Ingrédients</h2>
              <div className="portions" aria-label="Nombre de portions">
                <button className="bouton-rond bouton-rond--petit" onClick={() => setPortions((p) => Math.max(1, p - 1))} aria-label="Une portion de moins">
                  <Icone nom="moins" taille={18} />
                </button>
                <span><strong>{portions}</strong> {portions > 1 ? 'portions' : 'portion'}</span>
                <button className="bouton-rond bouton-rond--petit" onClick={() => setPortions((p) => p + 1)} aria-label="Une portion de plus">
                  <Icone nom="plus" taille={18} />
                </button>
              </div>
            </div>
            {parGroupe<Ingredient>(r.ingredients).map(([groupe, ings]) => (
              <div key={groupe} className="groupe">
                {groupe && <h3>{groupe}</h3>}
                <ul className="ingredients">
                  {ings.map((ing, i) => (
                    <li key={i}>
                      <span className="ingredients__quantite">{formaterQuantite(ing, facteur)}</span>
                      <span>{ing.nom}{ing.precision && <span className="discret">, {ing.precision}</span>}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>

          <section className="fiche__etapes">
            <h2>Préparation</h2>
            <ol className="etapes">
              {r.etapes.map((e, i) => {
                const photo = e.photo ? r.photos.find((p) => p.id === e.photo) : undefined
                return (
                  <li key={i}>
                    {e.groupe && <h3>{e.groupe}</h3>}
                    <p>{e.texte}</p>
                    {photo && <img src={urlPhoto(photo.chemin)} alt={`Étape ${i + 1}`} onClick={() => setAgrandie(photo)} />}
                  </li>
                )
              })}
            </ol>
          </section>
        </div>

        {r.notes && (
          <section className="fiche__notes">
            <h2>Notes et astuces</h2>
            <p>{r.notes}</p>
          </section>
        )}

        {autres.length > 0 && (
          <section>
            <h2>Photos</h2>
            <div className="galerie">
              {autres.map((p) => (
                <button key={p.id} onClick={() => setAgrandie(p)} className="galerie__vignette">
                  <img src={urlPhoto(p.miniature ?? p.chemin)} alt={p.legende} loading="lazy" />
                </button>
              ))}
            </div>
          </section>
        )}

        {r.source && (
          <p className="fiche__source">
            <Icone nom="lien" taille={16} /> Origine :{' '}
            {estLien ? <a href={r.source} target="_blank" rel="noreferrer">{new URL(r.source).hostname.replace(/^www\./, '')}</a> : r.source}
          </p>
        )}
      </div>

      {agrandie && (
        <div className="visionneuse" onClick={() => setAgrandie(null)} role="dialog" aria-label="Photo agrandie">
          <img src={urlPhoto(agrandie.chemin)} alt={agrandie.legende} />
          {agrandie.legende && <p>{agrandie.legende}</p>}
        </div>
      )}
    </article>
  )
}
