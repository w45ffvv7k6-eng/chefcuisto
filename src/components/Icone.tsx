// Petites icônes dessinées à la main (traits arrondis), sans bibliothèque externe.
const CHEMINS: Record<string, string> = {
  livre: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5',
  plus: 'M12 5v14M5 12h14',
  panier: 'M3 6h18l-2 11H5zM8 6l2-3M16 6l-2-3M9 10v4M15 10v4',
  reglages: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  horloge: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  etoile: 'M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8z',
  coeur: 'M12 20s-7-4.4-9.2-8.6A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5.4C19 15.6 12 20 12 20z',
  retour: 'M15 18l-6-6 6-6',
  moins: 'M5 12h14',
  personnes: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.7',
  niveau: 'M4 20v-4M10 20v-9M16 20V8M22 20V4',
  lien: 'M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  photo: 'M4 8h3l2-3h6l2 3h3v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  croix: 'M6 6l12 12M18 6L6 18',
  haut: 'M6 15l6-6 6 6',
  bas: 'M6 9l6 6 6-6',
  crayon: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  toque: 'M6 14a4 4 0 0 1-.5-8A5 5 0 0 1 12 3a5 5 0 0 1 6.5 3 4 4 0 0 1-.5 8v6H6zM6 17h12',
}

export default function Icone({ nom, taille = 24, plein = false }: { nom: string; taille?: number; plein?: boolean }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill={plein ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={CHEMINS[nom]} />
    </svg>
  )
}
