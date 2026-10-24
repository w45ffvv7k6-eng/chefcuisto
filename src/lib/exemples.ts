// Les 3 recettes d'exemple, ajoutées depuis la galerie vide.
// Photos : Wikimedia Commons (licences libres, auteurs cités dans la légende).
import { supabase } from './supabase'
import type { Recette, TypePhoto } from './types'

type Exemple = Omit<Recette, 'id' | 'photo_principale' | 'cree_le' | 'modifie_le'> & {
  photos: { fichier: string; type: TypePhoto; legende: string }[]
}

const EXEMPLES: Exemple[] = [
  {
    titre: 'Tarte aux pommes de Maman',
    description: 'La tarte du dimanche : une pâte brisée maison, une fine couche de compote et des pommes en rosace bien dorées.',
    categorie: 'dessert',
    tags: ['automne', 'classique', 'goûter'],
    temps_preparation: 30,
    temps_cuisson: 40,
    temps_repos: 30,
    difficulte: 'moyen',
    portions: 8,
    origine: 'maman',
    source: 'Carnet de Maman, p. 12',
    ingredients: [
      { quantite: 250, unite: 'g', nom: 'farine', groupe: 'Pour la pâte' },
      { quantite: 125, unite: 'g', nom: 'beurre', precision: 'froid, en dés', groupe: 'Pour la pâte' },
      { quantite: 1, unite: '', nom: 'jaune d’œuf', groupe: 'Pour la pâte' },
      { quantite: 0.5, unite: 'dl', nom: 'eau froide', groupe: 'Pour la pâte' },
      { quantite: null, unite: 'pincée', nom: 'sel', groupe: 'Pour la pâte' },
      { quantite: 5, quantite_max: 6, unite: '', nom: 'pommes', precision: 'Golden ou Boskoop', groupe: 'Pour la garniture' },
      { quantite: 3, unite: 'c. à s.', nom: 'compote de pommes', groupe: 'Pour la garniture' },
      { quantite: 2, unite: 'c. à s.', nom: 'sucre', groupe: 'Pour la garniture' },
      { quantite: 20, unite: 'g', nom: 'beurre', precision: 'fondu', groupe: 'Pour la garniture' },
      { quantite: 1, unite: 'c. à c.', nom: 'cannelle', groupe: 'Pour la garniture' },
    ],
    etapes: [
      { texte: 'Sabler la farine, le sel et le beurre du bout des doigts. Ajouter le jaune d’œuf et l’eau, former une boule sans trop travailler la pâte.' },
      { texte: 'Envelopper la pâte et la laisser reposer 30 minutes au frais.' },
      { texte: 'Préchauffer le four à 200 °C. Étaler la pâte et foncer un moule de 28 cm. Piquer le fond à la fourchette.' },
      { texte: 'Étaler la compote sur le fond. Éplucher les pommes, les couper en fines lamelles et les disposer en rosace.' },
      { texte: 'Badigeonner de beurre fondu, saupoudrer de sucre et de cannelle. Enfourner 40 minutes, jusqu’à ce que les bords soient bien dorés.' },
    ],
    notes: 'Maman disait toujours : « Des pommes un peu acides, sinon la tarte est fade. » Elle ajoutait une cuillère de confiture d’abricots tiède au pinceau à la sortie du four pour faire briller.',
    favori: true,
    note: 5,
    photos: [
      { fichier: 'tarte-pommes.jpg', type: 'plat', legende: 'Photo : Manuel Flury, CC BY 2.5' },
      { fichier: 'tarte-pommes-part.jpg', type: 'plat', legende: 'Une part avec de la chantilly. Photo : Randalfino, CC BY 2.0' },
    ],
  },
  {
    titre: 'Gratin dauphinois',
    description: 'Des pommes de terre fondantes cuites lentement dans la crème et le lait, avec une pointe d’ail et de muscade.',
    categorie: 'accompagnement',
    tags: ['végétarien', 'hiver', 'familial'],
    temps_preparation: 20,
    temps_cuisson: 75,
    temps_repos: 10,
    difficulte: 'facile',
    portions: 6,
    origine: 'web',
    source: 'https://fr.wikipedia.org/wiki/Gratin_dauphinois',
    ingredients: [
      { quantite: 1.2, unite: 'kg', nom: 'pommes de terre', precision: 'à chair ferme' },
      { quantite: 5, unite: 'dl', nom: 'lait entier' },
      { quantite: 2.5, unite: 'dl', nom: 'crème entière' },
      { quantite: 2, unite: '', nom: 'gousses d’ail' },
      { quantite: 20, unite: 'g', nom: 'beurre' },
      { quantite: null, unite: 'pincée', nom: 'muscade' },
      { quantite: null, unite: '', nom: 'sel et poivre' },
    ],
    etapes: [
      { texte: 'Préchauffer le four à 160 °C. Frotter un plat à gratin avec une gousse d’ail coupée, puis le beurrer.' },
      { texte: 'Éplucher les pommes de terre et les couper en rondelles de 3 mm, sans les laver pour garder l’amidon.' },
      { texte: 'Porter le lait, la crème, l’ail écrasé, le sel, le poivre et la muscade à frémissement. Y plonger les rondelles et cuire 10 minutes en remuant délicatement.' },
      { texte: 'Verser le tout dans le plat et enfourner 1 h 15, jusqu’à ce que le dessus soit doré et que la pointe d’un couteau entre sans résistance.' },
      { texte: 'Laisser reposer 10 minutes avant de servir.' },
    ],
    notes: 'Pas de fromage dans le vrai gratin dauphinois ! La précuisson dans le lait le rend bien crémeux.',
    favori: false,
    note: 4,
    photos: [{ fichier: 'gratin-dauphinois.jpg', type: 'plat', legende: 'Photo : Ludovic Péron, CC BY-SA 3.0' }],
  },
  {
    titre: 'Gratin de courge butternut',
    description: 'Un gratin d’automne tout doux : courge rôtie, sauce légère à la sauge et une croûte de gruyère bien gratinée.',
    categorie: 'plat',
    tags: ['végétarien', 'automne', 'rapide'],
    temps_preparation: 15,
    temps_cuisson: 35,
    temps_repos: null,
    difficulte: 'facile',
    portions: 4,
    origine: 'autre',
    source: 'Inspiré d’une recette d’amie',
    ingredients: [
      { quantite: 1, unite: '', nom: 'courge butternut', precision: 'environ 1 kg' },
      { quantite: 2, unite: 'dl', nom: 'crème' },
      { quantite: 1, unite: '', nom: 'œuf' },
      { quantite: 100, unite: 'g', nom: 'gruyère', precision: 'râpé' },
      { quantite: 6, unite: '', nom: 'feuilles de sauge' },
      { quantite: 1, unite: 'c. à s.', nom: 'huile d’olive' },
      { quantite: null, unite: '', nom: 'sel, poivre, muscade' },
    ],
    etapes: [
      { texte: 'Préchauffer le four à 200 °C. Éplucher la courge, retirer les graines et la couper en cubes de 2 cm.' },
      { texte: 'Disposer les cubes dans un plat, arroser d’huile, saler et poivrer. Rôtir 15 minutes.' },
      { texte: 'Battre la crème avec l’œuf, la sauge ciselée, la muscade, le sel et le poivre.' },
      { texte: 'Verser sur la courge, parsemer de gruyère et gratiner encore 20 minutes.' },
    ],
    notes: 'Délicieux avec une salade verte. Se réchauffe très bien le lendemain.',
    favori: false,
    note: 0,
    photos: [{ fichier: 'gratin-butternut.jpg', type: 'plat', legende: 'Photo : DocteurCosmos, CC BY 3.0' }],
  },
]

// Crée les recettes d'exemple et envoie leurs photos dans le stockage.
export async function installerExemples(userId: string) {
  for (const ex of EXEMPLES) {
    const { photos, ...champs } = ex
    const { data: recette, error } = await supabase.from('recettes').insert(champs).select('id').single()
    if (error) throw error

    let principale: string | null = null
    for (const [ordre, p] of photos.entries()) {
      const fichier = await fetch(`${import.meta.env.BASE_URL}exemples/${p.fichier}`).then((r) => r.blob())
      const chemin = `${userId}/${recette.id}/${crypto.randomUUID()}.jpg`
      const envoi = await supabase.storage.from('photos').upload(chemin, fichier, { contentType: 'image/jpeg' })
      if (envoi.error) throw envoi.error
      const { data: photo, error: err } = await supabase.from('photos')
        .insert({ recette_id: recette.id, chemin, type: p.type, legende: p.legende, ordre })
        .select('id').single()
      if (err) throw err
      principale ??= photo.id
    }
    await supabase.from('recettes').update({ photo_principale: principale }).eq('id', recette.id)
  }
}
