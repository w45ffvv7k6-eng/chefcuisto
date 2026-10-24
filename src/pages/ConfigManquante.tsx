// Affiché quand l'adresse et la clé Supabase n'ont pas été fournies.
export default function ConfigManquante() {
  return (
    <div className="connexion">
      <div className="connexion__carte">
        <h1>Cuisto</h1>
        <p>L'application n'est pas encore reliée à Supabase.</p>
        <p className="discret">
          Ajoute <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> dans le
          fichier <code>.env.local</code> (sur ton ordinateur) ou dans les variables du dépôt
          GitHub (en ligne). Le README explique comment.
        </p>
      </div>
    </div>
  )
}
