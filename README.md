# AFRICANUT INDUSTRY GROUP – Starter (React + Vite + Tailwind)

Starter local pour l'administration et la gestion du groupe avec pages :
Accueil, Entreprises, Personnel, Comptabilité, Tableau de bord.

## Lancer en local
```bash
npm install
npm run dev
```

## Contenu
- `src/pages/*` : pages principales
- `src/data/companies.js` : données des entités
- Stockage **localStorage** pour la démo (RH & Comptabilité).

## Personnalisation
- Couleurs du thème dans `tailwind.config.js` et `src/index.css`.
- Logo à remplacer dans `public/logo.jpg`.
- Connectez un backend (Express + MongoDB/PostgreSQL) en remplaçant localStorage par des appels API.
