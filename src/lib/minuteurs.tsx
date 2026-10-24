// Minuteurs de cuisine, partagés par toute l'app (ils continuent quand on change d'écran).
// Chaque minuteur retient son heure de fin : même si l'iPhone met l'app en veille,
// le temps restant est juste au retour.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface Minuteur {
  id: string
  libelle: string
  fin: number          // horodatage de fin (ms)
  duree: number        // secondes
  pause?: number       // secondes restantes, si en pause
}

interface Contexte {
  minuteurs: Minuteur[]
  maintenant: number
  lancer: (libelle: string, secondes: number) => void
  basculerPause: (id: string) => void
  ajouter: (id: string, secondes: number) => void
  arreter: (id: string) => void
}

const Ctx = createContext<Contexte | null>(null)
const CLE = 'cuisto.minuteurs'

export const restant = (m: Minuteur, maintenant: number) => (m.pause ?? (m.fin - maintenant) / 1000)

function lire(): Minuteur[] {
  try { return JSON.parse(localStorage.getItem(CLE) ?? '[]') } catch { return [] }
}

// Petite sonnerie générée par le navigateur (pas de fichier son à charger).
function creerSonnerie() {
  let ctx: AudioContext | null = null
  return {
    // À appeler pendant un toucher de l'utilisateur : iOS n'autorise le son qu'après un geste.
    deverrouiller() {
      ctx ??= new AudioContext()
      if (ctx.state === 'suspended') ctx.resume()
    },
    sonner() {
      if (!ctx) return
      const t = ctx.currentTime
      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.0001, t + i * 0.35)
        gain.gain.exponentialRampToValueAtTime(0.5, t + i * 0.35 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.35 + 0.25)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t + i * 0.35)
        osc.stop(t + i * 0.35 + 0.3)
      }
      navigator.vibrate?.([300, 150, 300])
    },
  }
}

export function MinuteursProvider({ children }: { children: ReactNode }) {
  const [minuteurs, setMinuteurs] = useState<Minuteur[]>(lire)
  const [maintenant, setMaintenant] = useState(Date.now())
  const sonnerie = useRef(creerSonnerie())

  useEffect(() => {
    try { localStorage.setItem(CLE, JSON.stringify(minuteurs)) } catch { /* rien */ }
  }, [minuteurs])

  const actifs = minuteurs.length > 0
  useEffect(() => {
    if (!actifs) return
    const t = setInterval(() => setMaintenant(Date.now()), 250)
    return () => clearInterval(t)
  }, [actifs])

  // Sonne tant qu'un minuteur terminé n'a pas été arrêté (toutes les 2 secondes).
  const termine = minuteurs.some((m) => m.pause == null && m.fin <= maintenant)
  useEffect(() => {
    if (!termine) return
    sonnerie.current.sonner()
    const t = setInterval(() => sonnerie.current.sonner(), 2000)
    return () => clearInterval(t)
  }, [termine])

  const lancer = useCallback((libelle: string, secondes: number) => {
    sonnerie.current.deverrouiller()
    setMinuteurs((l) => [...l, { id: crypto.randomUUID(), libelle, duree: secondes, fin: Date.now() + secondes * 1000 }])
    setMaintenant(Date.now())
  }, [])

  const basculerPause = useCallback((id: string) => {
    sonnerie.current.deverrouiller()
    setMinuteurs((l) => l.map((m) => {
      if (m.id !== id) return m
      if (m.pause != null) return { ...m, fin: Date.now() + m.pause * 1000, pause: undefined }
      return { ...m, pause: Math.max(0, (m.fin - Date.now()) / 1000) }
    }))
  }, [])

  const ajouter = useCallback((id: string, secondes: number) => {
    setMinuteurs((l) => l.map((m) => {
      if (m.id !== id) return m
      if (m.pause != null) return { ...m, pause: m.pause + secondes }
      return { ...m, fin: Math.max(m.fin, Date.now()) + secondes * 1000 }
    }))
  }, [])

  const arreter = useCallback((id: string) => setMinuteurs((l) => l.filter((m) => m.id !== id)), [])

  return <Ctx.Provider value={{ minuteurs, maintenant, lancer, basculerPause, ajouter, arreter }}>{children}</Ctx.Provider>
}

export function useMinuteurs() {
  const c = useContext(Ctx)
  if (!c) throw new Error('MinuteursProvider manquant')
  return c
}
