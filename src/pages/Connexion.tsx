import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import Icone from '../components/Icone'
import AnimationShader from '../components/AnimationShader'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function seConnecter(e: FormEvent) {
    e.preventDefault()
    setErreur('')
    setEnCours(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    setEnCours(false)
    if (error) {
      setErreur(error.message === 'Invalid login credentials'
        ? 'E-mail ou mot de passe incorrect.'
        : `Connexion impossible : ${error.message}`)
    }
  }

  return (
    <div className="connexion connexion--animee">
      <AnimationShader />
      <div className="connexion__carte">
        <div className="connexion__logo"><Icone nom="toque" taille={44} /></div>
        <h1>Cuisto</h1>
        <p className="connexion__accroche">Les recettes de Maman, et toutes les autres.</p>
        <form onSubmit={seConnecter}>
          <label>
            E-mail
            <input type="email" autoComplete="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Mot de passe
            <input type="password" autoComplete="current-password" required value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)} />
          </label>
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
          <button className="bouton bouton--principal" disabled={enCours}>
            {enCours ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
