import { NavLink } from 'react-router-dom'
import Icone from './Icone'

const LIENS = [
  { to: '/', label: 'Recettes', icone: 'livre' },
  { to: '/ajouter', label: 'Ajouter', icone: 'plus' },
  { to: '/courses', label: 'Courses', icone: 'panier', bientot: true },
  { to: '/reglages', label: 'Réglages', icone: 'reglages' },
]

export default function BarreNavigation() {
  return (
    <nav className="barre-nav" aria-label="Navigation principale">
      {LIENS.map((l) =>
        l.bientot ? (
          <span key={l.to} className="barre-nav__lien est-inactif" title="Bientôt disponible">
            <Icone nom={l.icone} />
            <span>{l.label}</span>
          </span>
        ) : (
          <NavLink key={l.to} to={l.to} end className="barre-nav__lien">
            <Icone nom={l.icone} />
            <span>{l.label}</span>
          </NavLink>
        ),
      )}
    </nav>
  )
}
