import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Étape 1 : vérifie simplement que la base répond. La galerie arrive à l'étape 2.
export default function Accueil() {
  const [nombre, setNombre] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    supabase.from('recettes').select('id', { count: 'exact', head: true }).then(({ count, error }) => {
      if (error) setErreur(error.message)
      else setNombre(count ?? 0)
    })
  }, [])

  return (
    <section className="page">
      <header className="page__entete">
        <p className="surtitre">Mon carnet</p>
        <h1>Recettes</h1>
      </header>
      <div className="vide">
        {erreur ? (
          <p className="erreur">La base de données ne répond pas : {erreur}</p>
        ) : nombre === null ? (
          <p>Chargement…</p>
        ) : (
          <>
            <p className="vide__titre">Tout est prêt.</p>
            <p>La connexion à ta base fonctionne ({nombre} recette{nombre > 1 ? 's' : ''}). La galerie arrive à la prochaine étape.</p>
          </>
        )}
      </div>
    </section>
  )
}
