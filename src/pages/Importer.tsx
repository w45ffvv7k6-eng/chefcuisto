import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { importerDepuisUrl } from '../lib/importer'
import Icone from '../components/Icone'

export default function Importer() {
  const naviguer = useNavigate()
  const [url, setUrl] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  async function coller() {
    try {
      const texte = await navigator.clipboard.readText()
      const lien = texte.match(/https?:\/\/\S+/)?.[0]
      if (lien) setUrl(lien)
    } catch { /* le navigateur a refusé : il reste le collage à la main */ }
  }

  async function importer(e: FormEvent) {
    e.preventDefault()
    const lien = url.trim().match(/https?:\/\/\S+/)?.[0]
    if (!lien) return setErreur('Colle l’adresse complète de la page, qui commence par https://')
    setErreur('')
    setEnCours(true)
    try {
      const brouillon = await importerDepuisUrl(lien)
      naviguer('/ajouter', { state: { brouillon, importee: true } })
    } catch (err) {
      setErreur((err as Error).message)
      setEnCours(false)
    }
  }

  return (
    <form className="page formulaire" onSubmit={importer}>
      <header className="page__entete">
        <p className="surtitre">Depuis le web</p>
        <h1>Importer une recette</h1>
      </header>
      <section className="bloc">
        <p className="aide">
          Copie le lien d'une recette (Marmiton, Betty Bossi, 750g…) et colle-le ici. Cuisto récupère
          le titre, la photo, les ingrédients, les étapes et les temps. Tu pourras tout relire avant d'enregistrer.
        </p>
        <label>Lien de la recette
          <input type="url" inputMode="url" autoComplete="off" value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.marmiton.org/recettes/…" />
        </label>
        <div className="rangee-boutons">
          <button type="button" className="bouton" onClick={coller}>
            <Icone nom="lien" taille={18} /> Coller le lien
          </button>
          <button className="bouton bouton--principal" disabled={enCours || !url.trim()}>
            {enCours ? 'Lecture de la page…' : 'Importer'}
          </button>
        </div>
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
      </section>
    </form>
  )
}
