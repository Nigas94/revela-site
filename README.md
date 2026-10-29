# Révéla · site revela-motion.fr

Site vitrine de Révéla, studio de vidéos et de posts explicatifs en motion design.

## Mise en ligne

Le site est relié à Netlify : chaque push sur la branche `main` met en ligne la nouvelle version, en général en moins d'une minute. L'historique des versions est dans l'onglet **Deploys** de Netlify, avec un retour en arrière possible en un clic.

`netlify.toml` indique à Netlify de publier le dossier `site/`, sans commande de build.

## Contenu de `site/`

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page d'accueil : méthode, formules, réalisations, déroulé, contact et devis |
| `mentions-legales.html` | Mentions légales |
| `confidentialite.html` | Politique de confidentialité (RGPD, vidéos YouTube) |
| `cgv.html` | Conditions générales de vente (clients professionnels), version datée |
| `assets/site.css`, `assets/site.js` | Styles et scripts du site |
| `assets/fonts/` | Polices hébergées sur le site (licence SIL OFL), aucune connexion à Google Fonts |
| `realisations/` | Aperçus muets (`apercus/`) et vignettes des vidéos, hébergés sur le site |
| `_headers` | En-têtes de sécurité (CSP, HSTS…) appliqués par Netlify |
| `robots.txt`, `sitemap.xml` | Référencement |

## Ajouter ou changer une vidéo des réalisations

Les réalisations sont deux carrousels tournants (MR BONPLAN Pare-Brise, AMK Dépannage), 4 vidéos chacun. Chaque carte montre un aperçu muet de 6 secondes hébergé sur le site ; au clic, la vidéo complète s'ouvre depuis YouTube.

1. Créer l'aperçu et sa vignette depuis le master de la vidéo (540 × 960, sans le son, environ 100 à 600 Ko) :

   ```
   ffmpeg -ss <début en s> -t 6 -i <master>.mp4 -an -vf "scale=540:960:flags=lanczos,fps=30" -c:v libx264 -preset slow -crf 29 -profile:v main -pix_fmt yuv420p -movflags +faststart site/realisations/apercus/<nom>.mp4
   ffmpeg -ss 1.5 -i site/realisations/apercus/<nom>.mp4 -frames:v 1 -q:v 5 site/realisations/apercus/<nom>.jpg
   ```

2. Dans `site/index.html`, dans le carrousel du client, changer le bloc `<li class="diapo …">` de la carte : titre, type, durée, nom de l'aperçu et identifiant YouTube. Une carte sans vidéo YouTube affiche « Bientôt en entier » et ne s'ouvre pas.

Garder des aperçus courts et légers : sur l'offre gratuite de Netlify, chaque Go envoyé aux visiteurs coûte 20 crédits sur 300 par mois, et chaque mise en ligne 15 crédits.

Les vidéos complètes ne se chargent depuis YouTube (youtube-nocookie.com) qu'au clic du visiteur : ne pas ajouter d'intégration qui se charge toute seule, sinon un bandeau de consentement aux cookies devient obligatoire.

## Modifier les CGV

Les devis renvoient à `cgv.html` et à sa version (date). Avant de modifier les CGV :

1. Copier `site/cgv.html` en `site/cgv-AAAA-MM-JJ.html` (date de l'ancienne version) : elle reste valable pour les devis déjà signés.
2. Modifier `site/cgv.html` et changer sa date de version.
3. Mettre la nouvelle date dans l'onglet « Mes infos » du modèle de devis (ligne « Version des CGV »).
