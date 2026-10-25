// Thème clair / sombre / automatique, mémorisé sur l'appareil.
export type Theme = 'auto' | 'clair' | 'sombre'

// Nouvelle clé : l'ancienne contenait « auto » pour tout le monde, enregistré sans choix de l'utilisateur.
const CLE = 'cuisto.apparence'

export function lireTheme(): Theme {
  try {
    const t = localStorage.getItem(CLE)
    if (t === 'clair' || t === 'sombre' || t === 'auto') return t
  } catch { /* stockage indisponible */ }
  // Par défaut : fond blanc, même si le téléphone ou l'ordinateur est en mode sombre.
  return 'clair'
}

export function appliquerTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', t === 'clair' ? 'light' : 'dark')
}

// Enregistre le choix fait dans les Réglages.
export function choisirTheme(t: Theme) {
  appliquerTheme(t)
  try { localStorage.setItem(CLE, t) } catch { /* rien */ }
}
