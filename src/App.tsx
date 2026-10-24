import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from './lib/session'
import { supabaseConfigure } from './lib/supabase'
import BarreNavigation from './components/BarreNavigation'
import Connexion from './pages/Connexion'
import Accueil from './pages/Accueil'
import Reglages from './pages/Reglages'
import FicheRecette from './pages/FicheRecette'
import FormulaireRecette from './pages/FormulaireRecette'
import ConfigManquante from './pages/ConfigManquante'

export default function App() {
  const session = useSession()

  if (!supabaseConfigure) return <ConfigManquante />
  if (session === undefined) return <div className="chargement" aria-label="Chargement" />
  if (session === null) return <Connexion />

  return (
    <div className="app">
      <main className="contenu">
        <Routes>
          <Route path="/" element={<Accueil />} />
          <Route path="/recette/:id" element={<FicheRecette />} />
          <Route path="/recette/:id/modifier" element={<FormulaireRecette />} />
          <Route path="/ajouter" element={<FormulaireRecette />} />
          <Route path="/reglages" element={<Reglages email={session.user.email ?? ''} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BarreNavigation />
    </div>
  )
}
