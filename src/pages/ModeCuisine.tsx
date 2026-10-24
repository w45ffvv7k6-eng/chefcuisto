import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { chargerRecette, urlPhoto, type RecetteComplete } from '../lib/recettes'
import { formaterQuantite } from '../lib/quantites'
import { detecterDurees } from '../lib/durees'
import { useMinuteurs } from '../lib/minuteurs'
import { useEcranAllume } from '../lib/ecranAllume'
import BandeauMinuteurs from '../components/BandeauMinuteurs'
import Icone from '../components/Icone'

// Mémorise les ingrédients cochés pour cette recette, le temps de la session.
function useCoches(id: string) {
  const cle = `cuisto.coches.${id}`
  const [coches, setCoches] = useState<number[]>(() => {
    try { return JSON.parse(sessionStorage.getItem(cle) ?? '[]') } catch { return [] }
  })
  useEffect(() => { try { sessionStorage.setItem(cle, JSON.stringify(coches)) } catch { /* rien */ } }, [cle, coches])
  const basculer = (i: number) => setCoches((c) => (c.includes(i) ? c.filter((x) => x !== i) : [...c, i]))
  return [coches, basculer] as const
}

export default function ModeCuisine() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const naviguer = useNavigate()
  const [recette, setRecette] = useState<RecetteComplete | null>(null)
  const [erreur, setErreur] = useState('')
  const [etape, setEtape] = useState(-1) // -1 = écran des ingrédients
  const [panneau, setPanneau] = useState(false)
  const [coches, basculer] = useCoches(id!)
  const ecranAllume = useEcranAllume()
  const { lancer } = useMinuteurs()
  const depart = useRef<number | null>(null)

  useEffect(() => {
    chargerRecette(id!).then((r) => (r ? setRecette(r) : setErreur('Recette introuvable'))).catch((e) => setErreur(e.message))
  }, [id])

  const total = recette?.etapes.length ?? 0
  const aller = (i: number) => setEtape(Math.max(-1, Math.min(total - 1, i)))

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') aller(etape + 1)
      if (e.key === 'ArrowLeft') aller(etape - 1)
      if (e.key === 'Escape') naviguer(-1)
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  if (erreur) return <div className="cuisine"><p className="erreur">Oups : {erreur}</p></div>
  if (!recette) return <div className="cuisine" />

  const portions = Number(params.get('portions')) || recette.portions
  const facteur = portions / recette.portions
  const e = etape >= 0 ? recette.etapes[etape] : null
  const photo = e?.photo ? recette.photos.find((p) => p.id === e.photo) : undefined
  const durees = e ? detecterDurees(e.texte) : []

  const listeIngredients = (
    <ul className="cuisine__ingredients">
      {recette.ingredients.map((ing, i) => (
        <li key={i}>
          {(i === 0 || ing.groupe !== recette.ingredients[i - 1].groupe) && ing.groupe && <h3>{ing.groupe}</h3>}
          <label className={coches.includes(i) ? 'est-coche' : ''}>
            <input type="checkbox" checked={coches.includes(i)} onChange={() => basculer(i)} />
            <span><strong>{formaterQuantite(ing, facteur)}</strong> {ing.nom}{ing.precision && <span className="discret">, {ing.precision}</span>}</span>
          </label>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="cuisine"
      onTouchStart={(ev) => { depart.current = ev.touches[0].clientX }}
      onTouchEnd={(ev) => {
        if (depart.current == null || panneau) return
        const dx = ev.changedTouches[0].clientX - depart.current
        if (Math.abs(dx) > 70) aller(etape + (dx < 0 ? 1 : -1))
        depart.current = null
      }}>
      <header className="cuisine__entete">
        <button className="bouton-rond" onClick={() => naviguer(-1)} aria-label="Quitter le mode cuisine"><Icone nom="croix" /></button>
        <div className="cuisine__titre">
          <strong>{recette.titre}</strong>
          <span>{etape < 0 ? `${portions} portions` : `Étape ${etape + 1} sur ${total}`}{ecranAllume && ' · écran allumé'}</span>
        </div>
        {etape >= 0 && (
          <button className={panneau ? 'bouton-rond est-actif' : 'bouton-rond'} onClick={() => setPanneau(!panneau)} aria-label="Afficher les ingrédients" aria-pressed={panneau}>
            <Icone nom="panier" />
          </button>
        )}
      </header>

      <div className="cuisine__progression" aria-hidden="true">
        <div style={{ width: `${((etape + 1) / Math.max(1, total)) * 100}%` }} />
      </div>

      <main className="cuisine__corps">
        {etape < 0 ? (
          <section>
            <h1>Rassemble tes ingrédients</h1>
            <p className="discret">Coche-les au fur et à mesure.</p>
            {listeIngredients}
          </section>
        ) : (
          <section className="cuisine__etape" key={etape}>
            <span className="cuisine__numero">{etape + 1}</span>
            <p className="cuisine__texte">{e!.texte}</p>
            {durees.length > 0 && (
              <div className="cuisine__minuteurs">
                {durees.map((d, i) => (
                  <button key={i} className="bouton bouton--minuteur" onClick={() => lancer(`Étape ${etape + 1} · ${d.libelle}`, d.secondes)}>
                    <Icone nom="horloge" taille={22} /> Lancer {d.libelle}
                  </button>
                ))}
              </div>
            )}
            {photo && <img src={urlPhoto(photo.chemin)} alt="" className="cuisine__photo" />}
          </section>
        )}
      </main>

      {panneau && (
        <aside className="cuisine__panneau" aria-label="Ingrédients">
          <h2>Ingrédients · {portions} portions</h2>
          {listeIngredients}
        </aside>
      )}

      <BandeauMinuteurs haut />

      <footer className="cuisine__pied">
        <button className="bouton cuisine__nav" onClick={() => aller(etape - 1)} disabled={etape < 0}>
          <Icone nom="retour" /> Précédent
        </button>
        {etape < total - 1 ? (
          <button className="bouton bouton--principal cuisine__nav" onClick={() => aller(etape + 1)}>
            {etape < 0 ? 'Commencer' : 'Suivant'} <span className="tourne"><Icone nom="retour" /></span>
          </button>
        ) : (
          <button className="bouton bouton--principal cuisine__nav" onClick={() => naviguer(-1)}>Bon appétit !</button>
        )}
      </footer>
    </div>
  )
}
