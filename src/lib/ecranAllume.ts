import { useEffect, useState } from 'react'

// Garde l'écran allumé tant que le composant est affiché (API « Wake Lock », Safari 16.4 et plus).
// Le verrou est perdu quand on quitte l'app : on le redemande au retour.
export function useEcranAllume(): boolean {
  const [actif, setActif] = useState(false)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let verrou: WakeLockSentinel | null = null
    let fini = false

    async function demander() {
      try {
        verrou = await navigator.wakeLock.request('screen')
        if (fini) return verrou.release()
        setActif(true)
        verrou.addEventListener('release', () => setActif(false))
      } catch { setActif(false) }
    }
    const auRetour = () => { if (document.visibilityState === 'visible') demander() }

    demander()
    document.addEventListener('visibilitychange', auRetour)
    return () => {
      fini = true
      document.removeEventListener('visibilitychange', auRetour)
      verrou?.release()
    }
  }, [])

  return actif
}
