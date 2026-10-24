import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { appliquerTheme, lireTheme, type Theme } from '../lib/theme'

const THEMES: { valeur: Theme; label: string }[] = [
  { valeur: 'auto', label: 'Automatique' },
  { valeur: 'clair', label: 'Clair' },
  { valeur: 'sombre', label: 'Sombre' },
]

export default function Reglages({ email }: { email: string }) {
  const [theme, setTheme] = useState<Theme>(lireTheme())

  function choisir(t: Theme) {
    setTheme(t)
    appliquerTheme(t)
  }

  return (
    <section className="page">
      <header className="page__entete">
        <h1>Réglages</h1>
      </header>

      <div className="bloc">
        <h2>Apparence</h2>
        <div className="segments" role="radiogroup" aria-label="Thème">
          {THEMES.map((t) => (
            <button key={t.valeur} role="radio" aria-checked={theme === t.valeur}
              className={theme === t.valeur ? 'segment est-actif' : 'segment'}
              onClick={() => choisir(t.valeur)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bloc">
        <h2>Compte</h2>
        <p className="discret">Connecté avec {email}</p>
        <button className="bouton" onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </div>
    </section>
  )
}
