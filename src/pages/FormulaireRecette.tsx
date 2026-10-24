import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { brouillonDepuisRecette, brouillonVide, cle, enMinutes, type Brouillon, type EtapeBrouillon } from '../lib/brouillon'
import { preparerImage } from '../lib/images'
import { lireIngredients } from '../lib/ingredientsTexte'
import { formaterQuantite } from '../lib/quantites'
import {
  chargerRecette, enregistrerRecette, supprimerRecette, urlPhoto,
  type PhotoFormulaire, type RecetteComplete,
} from '../lib/recettes'
import { CATEGORIES, DIFFICULTES, ORIGINES, type Categorie, type Difficulte, type Origine, type Photo, type TypePhoto } from '../lib/types'
import Etoiles from '../components/Etoiles'
import Icone from '../components/Icone'

const TYPES_PHOTO: Record<TypePhoto, string> = {
  plat: 'Plat fini', etape: 'Étape', manuscrit: 'Recette manuscrite', autre: 'Autre',
}

function apercuPhoto(p: PhotoFormulaire) {
  return p.apercu ?? urlPhoto(p.miniature ?? p.chemin)
}

// Petit groupe de boutons où un seul choix est actif.
function Choix<T extends string>({ valeur, options, onChange, nom }: { valeur: T; options: Record<T, string>; onChange: (v: T) => void; nom: string }) {
  return (
    <div className="segments" role="radiogroup" aria-label={nom}>
      {(Object.keys(options) as T[]).map((k) => (
        <button key={k} type="button" role="radio" aria-checked={valeur === k}
          className={valeur === k ? 'segment est-actif' : 'segment'} onClick={() => onChange(k)}>
          {options[k]}
        </button>
      ))}
    </div>
  )
}

export default function FormulaireRecette() {
  const { id } = useParams()
  const naviguer = useNavigate()
  const location = useLocation()
  const [b, setB] = useState<Brouillon | null>(null)
  const [origine, setOrigine] = useState<RecetteComplete | null>(null)
  const [supprimees, setSupprimees] = useState<Photo[]>([])
  const [enCours, setEnCours] = useState('')
  const [erreur, setErreur] = useState('')
  const [survol, setSurvol] = useState(false)
  const entreePhotos = useRef<HTMLInputElement>(null)
  const etapePourPhoto = useRef<string | null>(null)

  useEffect(() => {
    if (id) {
      chargerRecette(id).then((r) => {
        if (!r) return setErreur('Recette introuvable')
        setOrigine(r)
        setB(brouillonDepuisRecette(r))
      }).catch((e) => setErreur(e.message))
    } else {
      // Un brouillon peut être transmis par l'import depuis une URL.
      const transmis = (location.state as { brouillon?: Partial<Brouillon> } | null)?.brouillon
      setB({ ...brouillonVide(), ...transmis })
    }
  }, [id, location.state])

  const importee = Boolean((location.state as { importee?: boolean } | null)?.importee)
  const ingredients = useMemo(() => lireIngredients(b?.ingredients ?? ''), [b?.ingredients])

  if (erreur && !b) return <section className="page"><p className="erreur">Oups : {erreur}</p></section>
  if (!b) return <section className="page"><p>Chargement…</p></section>

  const maj = (champs: Partial<Brouillon>) => setB((x) => ({ ...x!, ...champs }))
  const majEtape = (k: string, champs: Partial<EtapeBrouillon>) =>
    maj({ etapes: b.etapes.map((e) => (e.cle === k ? { ...e, ...champs } : e)) })

  async function ajouterFichiers(fichiers: FileList | File[], pourEtape: string | null = null) {
    const images = [...fichiers].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    if (!images.length) return
    setEnCours('Préparation des photos…')
    try {
      const nouvelles: PhotoFormulaire[] = []
      for (const f of images) {
        const img = await preparerImage(f)
        nouvelles.push({
          cle: cle(), nouvelle: img, apercu: URL.createObjectURL(img.miniature),
          type: pourEtape ? 'etape' : 'plat', legende: '',
        })
      }
      setB((x) => {
        const etapes = pourEtape ? x!.etapes.map((e) => (e.cle === pourEtape ? { ...e, photo: nouvelles[0].cle } : e)) : x!.etapes
        return { ...x!, photos: [...x!.photos, ...nouvelles], etapes, principale: x!.principale ?? (pourEtape ? null : nouvelles[0].cle) }
      })
    } catch {
      setErreur("Une photo n'a pas pu être lue. Essaie avec une image JPEG ou PNG.")
    } finally {
      setEnCours('')
    }
  }

  function retirerPhoto(p: PhotoFormulaire) {
    if (p.id && origine) {
      const existante = origine.photos.find((x) => x.id === p.id)
      if (existante) setSupprimees((s) => [...s, existante])
    }
    const photos = b!.photos.filter((x) => x.cle !== p.cle)
    maj({
      photos,
      principale: b!.principale === p.cle ? photos.find((x) => x.type !== 'etape')?.cle ?? null : b!.principale,
      etapes: b!.etapes.map((e) => (e.photo === p.cle ? { ...e, photo: null } : e)),
    })
  }

  function deplacerEtape(i: number, sens: -1 | 1) {
    const etapes = [...b!.etapes]
    const j = i + sens
    if (j < 0 || j >= etapes.length) return
    ;[etapes[i], etapes[j]] = [etapes[j], etapes[i]]
    maj({ etapes })
  }

  function deposer(e: DragEvent) {
    e.preventDefault()
    setSurvol(false)
    ajouterFichiers(e.dataTransfer.files)
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault()
    if (!b!.titre.trim()) return setErreur('Il manque le titre de la recette.')
    setErreur('')
    setEnCours('Enregistrement…')
    try {
      const nouvelId = await enregistrerRecette(id, {
        titre: b!.titre.trim(),
        description: b!.description.trim(),
        categorie: b!.categorie,
        tags: b!.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        temps_preparation: enMinutes(b!.temps_preparation),
        temps_cuisson: enMinutes(b!.temps_cuisson),
        temps_repos: enMinutes(b!.temps_repos),
        difficulte: b!.difficulte,
        portions: Math.max(1, parseInt(b!.portions, 10) || 1),
        origine: b!.origine,
        source: b!.source.trim(),
        ingredients,
        etapes: b!.etapes.filter((x) => x.texte.trim()).map((x) => ({ texte: x.texte.trim(), photo: x.photo })),
        notes: b!.notes.trim(),
        favori: b!.favori,
        note: b!.note,
      }, b!.photos, b!.principale, supprimees)
      naviguer(`/recette/${nouvelId}`, { replace: true })
    } catch (err) {
      setErreur((err as Error).message)
      setEnCours('')
    }
  }

  async function supprimer() {
    if (!origine || !confirm(`Supprimer définitivement « ${origine.titre} » et ses photos ?`)) return
    setEnCours('Suppression…')
    try {
      await supprimerRecette(origine)
      naviguer('/', { replace: true })
    } catch (err) {
      setErreur((err as Error).message)
      setEnCours('')
    }
  }

  const photosEtapes = b.photos

  return (
    <form className="page formulaire" onSubmit={enregistrer}>
      <header className="page__entete">
        <p className="surtitre">{id ? 'Modifier' : 'Nouvelle recette'}</p>
        <h1>{id ? b.titre || 'Recette' : 'Ajouter une recette'}</h1>
      </header>

      {!id && (importee ? (
        <p className="bandeau">Recette importée : relis-la et corrige ce qu'il faut, puis enregistre.</p>
      ) : (
        <Link to="/importer" className="bandeau bandeau--lien">
          <Icone nom="lien" taille={20} /> <span>Tu as trouvé une recette sur le web ? <strong>Importe-la depuis son lien</strong></span>
        </Link>
      ))}

      <section className="bloc">
        <h2>Photos</h2>
        <div className={survol ? 'depot est-survole' : 'depot'}
          onDragOver={(e) => { e.preventDefault(); setSurvol(true) }}
          onDragLeave={() => setSurvol(false)} onDrop={deposer}>
          <Icone nom="photo" taille={32} />
          <p>Glisse tes photos ici, ou</p>
          <button type="button" className="bouton" onClick={() => { etapePourPhoto.current = null; entreePhotos.current?.click() }}>
            Choisir ou prendre une photo
          </button>
          <input ref={entreePhotos} type="file" accept="image/*" multiple hidden
            onChange={(e) => { if (e.target.files) ajouterFichiers(e.target.files, etapePourPhoto.current); e.target.value = '' }} />
        </div>
        {b.photos.length > 0 && (
          <ul className="photos-form">
            {b.photos.map((p) => (
              <li key={p.cle} className={b.principale === p.cle ? 'est-principale' : ''}>
                <img src={apercuPhoto(p)} alt="" />
                <div className="photos-form__actions">
                  <button type="button" className="bouton-rond bouton-rond--petit" onClick={() => maj({ principale: p.cle })}
                    aria-label="Photo principale" title="Photo principale" aria-pressed={b.principale === p.cle}>
                    <Icone nom="etoile" taille={18} plein={b.principale === p.cle} />
                  </button>
                  <button type="button" className="bouton-rond bouton-rond--petit" onClick={() => retirerPhoto(p)} aria-label="Retirer la photo">
                    <Icone nom="croix" taille={18} />
                  </button>
                </div>
                <select value={p.type} aria-label="Type de photo"
                  onChange={(e) => maj({ photos: b.photos.map((x) => (x.cle === p.cle ? { ...x, type: e.target.value as TypePhoto } : x)) })}>
                  {Object.entries(TYPES_PHOTO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </li>
            ))}
          </ul>
        )}
        {b.photos.length > 1 && <p className="aide">L'étoile choisit la photo affichée en grand sur la carte et la fiche.</p>}
      </section>

      <section className="bloc">
        <h2>L'essentiel</h2>
        <label>Titre<input value={b.titre} onChange={(e) => maj({ titre: e.target.value })} placeholder="Tarte aux pommes de Maman" required /></label>
        <label>Description courte
          <textarea rows={2} value={b.description} onChange={(e) => maj({ description: e.target.value })} placeholder="En une ou deux phrases, ce qui la rend spéciale" />
        </label>
        <label>Catégorie
          <select value={b.categorie} onChange={(e) => maj({ categorie: e.target.value as Categorie })}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label>Tags <span className="aide">séparés par des virgules</span>
          <input value={b.tags} onChange={(e) => maj({ tags: e.target.value })} placeholder="végétarien, hiver, rapide" />
        </label>
        <div className="champ">
          <span className="champ__label">Origine</span>
          <Choix nom="Origine" valeur={b.origine} options={ORIGINES} onChange={(v: Origine) => maj({ origine: v })} />
        </div>
        <label>{b.origine === 'web' ? 'Lien de la recette' : 'Où la trouver'}
          <input value={b.source} onChange={(e) => maj({ source: e.target.value })}
            placeholder={b.origine === 'web' ? 'https://www.marmiton.org/…' : b.origine === 'maman' ? 'Carnet de Maman, p. 12' : 'Livre, ami, magazine…'} />
        </label>
      </section>

      <section className="bloc">
        <h2>Temps et portions</h2>
        <div className="rangee">
          <label>Préparation <span className="aide">min</span><input inputMode="numeric" value={b.temps_preparation} onChange={(e) => maj({ temps_preparation: e.target.value })} /></label>
          <label>Cuisson <span className="aide">min</span><input inputMode="numeric" value={b.temps_cuisson} onChange={(e) => maj({ temps_cuisson: e.target.value })} /></label>
          <label>Repos <span className="aide">min</span><input inputMode="numeric" value={b.temps_repos} onChange={(e) => maj({ temps_repos: e.target.value })} /></label>
          <label>Portions<input inputMode="numeric" value={b.portions} onChange={(e) => maj({ portions: e.target.value })} /></label>
        </div>
        <div className="champ">
          <span className="champ__label">Difficulté</span>
          <Choix nom="Difficulté" valeur={b.difficulte} options={DIFFICULTES} onChange={(v: Difficulte) => maj({ difficulte: v })} />
        </div>
      </section>

      <section className="bloc">
        <h2>Ingrédients</h2>
        <p className="aide">Un ingrédient par ligne, par exemple « 250 g de farine » ou « 2 c. à s. de sucre ». Pour faire des groupes, écris une ligne qui finit par deux-points, comme « Pour la pâte : ».</p>
        <textarea rows={8} value={b.ingredients} onChange={(e) => maj({ ingredients: e.target.value })}
          placeholder={'Pour la pâte :\n250 g de farine\n125 g de beurre, froid\n1 pincée de sel'} />
        {ingredients.length > 0 && (
          <details className="apercu-ingredients">
            <summary>Voir comment Cuisto a compris ({ingredients.length})</summary>
            <ul className="ingredients">
              {ingredients.map((ing, i) => (
                <li key={i}>
                  <span className="ingredients__quantite">{formaterQuantite(ing) || '—'}</span>
                  <span>{ing.nom}{ing.precision && <span className="discret">, {ing.precision}</span>}{ing.groupe && <span className="discret"> · {ing.groupe}</span>}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="bloc">
        <h2>Étapes</h2>
        <ol className="etapes-form">
          {b.etapes.map((e, i) => {
            const photo = b.photos.find((p) => p.cle === e.photo)
            return (
              <li key={e.cle}>
                <div className="etapes-form__tete">
                  <span className="etapes-form__numero">{i + 1}</span>
                  <div className="etapes-form__boutons">
                    <button type="button" className="bouton-rond bouton-rond--petit" onClick={() => deplacerEtape(i, -1)} disabled={i === 0} aria-label="Monter l'étape">
                      <Icone nom="haut" taille={18} />
                    </button>
                    <button type="button" className="bouton-rond bouton-rond--petit" onClick={() => deplacerEtape(i, 1)} disabled={i === b.etapes.length - 1} aria-label="Descendre l'étape">
                      <Icone nom="bas" taille={18} />
                    </button>
                    <button type="button" className="bouton-rond bouton-rond--petit" onClick={() => maj({ etapes: b.etapes.filter((x) => x.cle !== e.cle) })} aria-label="Supprimer l'étape">
                      <Icone nom="croix" taille={18} />
                    </button>
                  </div>
                </div>
                <textarea rows={3} value={e.texte} onChange={(ev) => majEtape(e.cle, { texte: ev.target.value })}
                  placeholder={i === 0 ? 'Préchauffer le four à 180 °C…' : 'Étape suivante…'} aria-label={`Étape ${i + 1}`} />
                <div className="etapes-form__photo">
                  {photo && <img src={apercuPhoto(photo)} alt="" />}
                  <select value={e.photo ?? ''} aria-label="Photo de l'étape"
                    onChange={(ev) => majEtape(e.cle, { photo: ev.target.value || null })}>
                    <option value="">Pas de photo</option>
                    {photosEtapes.map((p, n) => <option key={p.cle} value={p.cle}>Photo {n + 1} ({TYPES_PHOTO[p.type].toLowerCase()})</option>)}
                  </select>
                  <button type="button" className="bouton bouton--discret"
                    onClick={() => { etapePourPhoto.current = e.cle; entreePhotos.current?.click() }}>
                    <Icone nom="photo" taille={18} /> Nouvelle photo
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
        <button type="button" className="bouton" onClick={() => maj({ etapes: [...b.etapes, { cle: cle(), texte: '', photo: null }] })}>
          <Icone nom="plus" taille={18} /> Ajouter une étape
        </button>
      </section>

      <section className="bloc">
        <h2>Notes et astuces</h2>
        <textarea rows={4} value={b.notes} onChange={(e) => maj({ notes: e.target.value })} placeholder="Ce que Maman disait toujours…" />
        <div className="rangee rangee--centree">
          <label className="case">
            <input type="checkbox" checked={b.favori} onChange={(e) => maj({ favori: e.target.checked })} /> Favori
          </label>
          <Etoiles note={b.note} onChange={(note) => maj({ note })} />
        </div>
      </section>

      {id && (
        <button type="button" className="bouton bouton--danger" onClick={supprimer}>Supprimer cette recette</button>
      )}

      <div className="barre-enregistrer">
        {erreur && <p className="erreur" role="alert">{erreur}</p>}
        <div className="barre-enregistrer__boutons">
          <button type="button" className="bouton" onClick={() => naviguer(-1)} disabled={Boolean(enCours)}>Annuler</button>
          <button className="bouton bouton--principal" disabled={Boolean(enCours)}>{enCours || 'Enregistrer'}</button>
        </div>
      </div>
    </form>
  )
}
