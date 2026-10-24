-- Cuisto : structure de la base de données.
-- Chaque ligne appartient à un utilisateur (user_id) et les règles de sécurité
-- (RLS) garantissent que personne d'autre ne peut la lire ni la modifier.

create table public.recettes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  titre text not null,
  description text not null default '',
  categorie text not null default 'plat',
  tags text[] not null default '{}',
  temps_preparation integer check (temps_preparation >= 0),  -- minutes
  temps_cuisson integer check (temps_cuisson >= 0),
  temps_repos integer check (temps_repos >= 0),
  difficulte text not null default 'facile' check (difficulte in ('facile', 'moyen', 'difficile')),
  portions integer not null default 4 check (portions > 0),
  origine text not null default 'autre' check (origine in ('maman', 'web', 'autre')),
  source text not null default '',          -- lien du site ou « carnet de Maman, p. 12 »
  ingredients jsonb not null default '[]',  -- liste d'Ingredient (voir src/lib/types.ts)
  etapes jsonb not null default '[]',       -- liste d'Etape
  notes text not null default '',
  favori boolean not null default false,
  note smallint not null default 0 check (note between 0 and 5),
  photo_principale uuid,
  cree_le timestamptz not null default now(),
  modifie_le timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  recette_id uuid not null references public.recettes on delete cascade,
  chemin text not null,       -- chemin de l'image dans le stockage « photos »
  miniature text,             -- chemin de la version réduite
  type text not null default 'plat' check (type in ('plat', 'etape', 'manuscrit', 'autre')),
  legende text not null default '',
  ordre integer not null default 0,
  largeur integer,
  hauteur integer,
  cree_le timestamptz not null default now()
);

alter table public.recettes
  add constraint recettes_photo_principale_fkey
  foreign key (photo_principale) references public.photos on delete set null;

create index recettes_user_idx on public.recettes (user_id);
create index photos_recette_idx on public.photos (recette_id);

-- Met à jour modifie_le automatiquement.
create function public.toucher_modifie_le() returns trigger
language plpgsql as $$
begin
  new.modifie_le = now();
  return new;
end $$;

create trigger recettes_modifie_le before update on public.recettes
  for each row execute function public.toucher_modifie_le();

-- Sécurité : chacun ne voit et ne modifie que ses propres lignes.
alter table public.recettes enable row level security;
alter table public.photos enable row level security;

create policy "mes recettes" on public.recettes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "mes photos" on public.photos for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Stockage des photos. Le dossier de chaque fichier est l'identifiant de
-- l'utilisateur : seul lui peut y ajouter, modifier ou supprimer des images.
-- Les images sont lisibles par lien (adresses longues et impossibles à deviner),
-- ce qui permet de les garder en cache pour le mode hors connexion.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "lister mes photos" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "ajouter mes photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "modifier mes photos" on storage.objects for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "supprimer mes photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
