// Thème clair / sombre / automatique, mémorisé sur l'appareil.
export type Theme = 'auto' | 'clair' | 'sombre'

const CLE = 'cuisto.theme'

export function lireTheme(): Theme {
  try {
    const t = localStorage.getItem(CLE)
    if (t === 'clair' || t === 'sombre') return t
  } catch { /* stockage indisponible */ }
  return 'auto'
}

export function appliquerTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', t === 'clair' ? 'light' : 'dark')
  try { localStorage.setItem(CLE, t) } catch { /* rien */ }
}
