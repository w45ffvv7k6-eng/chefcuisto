import { useEffect, useState } from 'react'
import { chargerRecettes, type RecetteComplete } from '../lib/recettes'
import { installerExemples } from '../lib/exemples'
import { supabase } from '../lib/supabase'
import CarteRecette from '../components/CarteRecette'

export default function Accueil() {
  const [recettes, setRecettes] = useState<RecetteComplete[] | null>(null)
  const [erreur, setErreur] = useState('')
  const [installation, setInstallation] = useState(false)

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
          <p>Ajoute 3 recettes d'exemple pour voir à quoi ressemble Cuisto. Tu pourras les supprimer ensuite.</p>
          <button className="bouton bouton--principal" onClick={ajouterExemples} disabled={installation}>
            {installation ? 'Ajout en cours…' : 'Ajouter les recettes d’exemple'}
          </button>
        </div>
      )}

      {recettes && recettes.length > 0 && (
        <div className="grille">
          {recettes.map((r) => <CarteRecette key={r.id} recette={r} />)}
        </div>
      )}
    </section>
  )
}
