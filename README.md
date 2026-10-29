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
| `realisations/` | Vignettes des vidéos, hébergées sur le site |
| `_headers` | En-têtes de sécurité (CSP, HSTS…) appliqués par Netlify |
| `robots.txt`, `sitemap.xml` | Référencement |

## Ajouter une vidéo aux réalisations

1. Mettre sa vignette verticale (450 × 800, JPG) dans `site/realisations/<id YouTube>.jpg`.
2. Copier un bloc `<li>` de la galerie dans `site/index.html` et changer l'id YouTube, le titre et la durée.

Les vidéos ne se chargent depuis YouTube (youtube-nocookie.com) qu'au clic du visiteur : ne pas ajouter d'intégration qui se charge toute seule, sinon un bandeau de consentement aux cookies devient obligatoire.

## Modifier les CGV

Les devis renvoient à `cgv.html` et à sa version (date). Avant de modifier les CGV :

1. Copier `site/cgv.html` en `site/cgv-AAAA-MM-JJ.html` (date de l'ancienne version) : elle reste valable pour les devis déjà signés.
2. Modifier `site/cgv.html` et changer sa date de version.
3. Mettre la nouvelle date dans l'onglet « Mes infos » du modèle de devis (ligne « Version des CGV »).
