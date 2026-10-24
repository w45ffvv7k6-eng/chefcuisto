import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { chargerRecettes, type RecetteComplete } from '../lib/recettes'
import { installerExemples } from '../lib/exemples'
import { supabase } from '../lib/supabase'
import CarteRecette from '../components/CarteRecette'
import Icone from '../components/Icone'
import { filtrer, filtresActifs, filtresVides, type Filtres } from '../lib/recherche'
import { CATEGORIES, ORIGINES, type Categorie, type Origine } from '../lib/types'

const CLE_FILTRES = 'cuisto.filtres'

function lireFiltres(): Filtres {
  try { return { ...filtresVides, ...JSON.parse(sessionStorage.getItem(CLE_FILTRES) ?? '{}') } } catch { return filtresVides }
}

function Puce({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={actif ? 'filtre est-actif' : 'filtre'} aria-pressed={actif} onClick={onClick}>{children}</button>
}

export default function Accueil() {
  const [recettes, setRecettes] = useState<RecetteComplete[] | null>(null)
  const [erreur, setErreur] = useState('')
  const [installation, setInstallation] = useState(false)
  const [filtres, setFiltres] = useState<Filtres>(lireFiltres)

  useEffect(() => {
    try { sessionStorage.setItem(CLE_FILTRES, JSON.stringify(filtres)) } catch { /* rien */ }
  }, [filtres])

  const maj = (f: Partial<Filtres>) => setFiltres((x) => ({ ...x, ...f }))
  const resultats = useMemo(() => (recettes ? filtrer(recettes, filtres) : []), [recettes, filtres])
  const categories = useMemo(() => [...new Set(recettes?.map((r) => r.categorie))] as Categorie[], [recettes])
  const tags = useMemo(() => {
    const compte = new Map<string, number>()
    recettes?.forEach((r) => r.tags.forEach((t) => compte.set(t, (compte.get(t) ?? 0) + 1)))
    return [...compte.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([t]) => t)
  }, [recettes])
  const filtrage = Boolean(filtres.texte.trim()) || filtresActifs(filtres) > 0

  function charger() {
    chargerRecettes().then(setRecettes).catch((e) => setErreur(e.message))
  }
  useEffect(charger, [])

  async function ajouterExemples() {
    setInstallation(true)
    setErreur('')
    try {
      const { data } = await supabase.auth.getUser()
      await installerExemples(data.user!.id)
      charger()
    } catch (e) {
      setErreur((e as Error).message)
    } finally {
      setInstallation(false)
    }
  }

  return (
    <section className="page">
      <header className="page__entete">
        <p className="surtitre">Mon carnet</p>
        <h1>Recettes</h1>
      </header>

      {erreur && <p className="erreur" role="alert">Oups : {erreur}</p>}

      {recettes === null && !erreur && (
        <div className="grille">{[0, 1, 2].map((i) => <div key={i} className="carte carte--fantome" />)}</div>
      )}

      {recettes?.length === 0 && (
        <div className="vide">
          <p className="vide__titre">Ton carnet est encore vide</p>
          <p><Link to="/ajouter" className="bouton bouton--principal">Ajouter ma première recette</Link></p>
          <p>Ajoute 3 recettes d'exemple pour voir à quoi ressemble Cuisto. Tu pourras les supprimer ensuite.</p>
          <button className="bouton" onClick={ajouterExemples} disabled={installation}>
            {installation ? 'Ajout en cours…' : 'Ajouter les recettes d’exemple'}
          </button>
        </div>
      )}

      {recettes && recettes.length > 0 && (
        <>
          <div className="recherche">
            <div className="recherche__champ">
              <Icone nom="loupe" taille={20} />
              <input type="search" value={filtres.texte} onChange={(e) => maj({ texte: e.target.value })}
                placeholder="Une recette, un ingrédient…" aria-label="Rechercher" enterKeyHint="search" />
              {filtres.texte && (
                <button type="button" className="recherche__effacer" onClick={() => maj({ texte: '' })} aria-label="Effacer">
                  <Icone nom="croix" taille={18} />
                </button>
              )}
            </div>
            <div className="filtres" aria-label="Filtres">
              <Puce actif={filtres.favoris} onClick={() => maj({ favoris: !filtres.favoris })}>
                <Icone nom="coeur" taille={15} plein={filtres.favoris} /> Favoris
              </Puce>
              {(Object.keys(ORIGINES) as Origine[]).map((o) => (
                <Puce key={o} actif={filtres.origine === o} onClick={() => maj({ origine: filtres.origine === o ? null : o })}>{ORIGINES[o]}</Puce>
              ))}
              {categories.length > 1 && categories.map((c) => (
                <Puce key={c} actif={filtres.categorie === c} onClick={() => maj({ categorie: filtres.categorie === c ? null : c })}>{CATEGORIES[c]}</Puce>
              ))}
            </div>
            {tags.length > 0 && (
              <div className="filtres filtres--tags" aria-label="Tags">
                {tags.map((t) => (
                  <Puce key={t} actif={filtres.tag === t} onClick={() => maj({ tag: filtres.tag === t ? null : t })}>#{t}</Puce>
                ))}
              </div>
            )}
          </div>

          {filtrage && (
            <p className="resultats">
              {resultats.length} recette{resultats.length > 1 ? 's' : ''}
              <button type="button" className="lien" onClick={() => setFiltres(filtresVides)}>Tout afficher</button>
            </p>
          )}

          {resultats.length > 0 ? (
            <div className="grille">
              {resultats.map((r) => <CarteRecette key={r.id} recette={r} />)}
            </div>
          ) : (
            <div className="vide">
              <p className="vide__titre">Aucune recette trouvée</p>
              <p>Essaie un autre mot, ou retire un filtre.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
