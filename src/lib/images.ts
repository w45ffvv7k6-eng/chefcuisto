// Réduction et compression des photos dans le navigateur, avant l'envoi.
// Une photo d'iPhone (3 à 5 Mo) devient une image d'environ 200 à 400 Ko.

export interface ImagePrete {
  blob: Blob
  miniature: Blob
  largeur: number
  hauteur: number
}

async function redimensionner(source: ImageBitmap, cote: number, qualite: number): Promise<{ blob: Blob; largeur: number; hauteur: number }> {
  const echelle = Math.min(1, cote / Math.max(source.width, source.height))
  const largeur = Math.round(source.width * echelle)
  const hauteur = Math.round(source.height * echelle)
  const canvas = document.createElement('canvas')
  canvas.width = largeur
  canvas.height = hauteur
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(source, 0, 0, largeur, hauteur)
  const blob = await new Promise<Blob>((ok, ko) =>
    canvas.toBlob((b) => (b ? ok(b) : ko(new Error('Compression impossible'))), 'image/jpeg', qualite))
  return { blob, largeur, hauteur }
}

export async function preparerImage(fichier: Blob): Promise<ImagePrete> {
  // « from-image » applique la rotation enregistrée par l'appareil photo.
  const bitmap = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  try {
    const grande = await redimensionner(bitmap, 1600, 0.82)
    const petite = await redimensionner(bitmap, 600, 0.75)
    return { blob: grande.blob, miniature: petite.blob, largeur: grande.largeur, hauteur: grande.hauteur }
  } finally {
    bitmap.close()
  }
}
