# Paulina Hôtel — Menu digital

Menu en ligne du restaurant Paulina Hôtel : les clients consultent les plats et boissons, composent un panier et envoient leur commande par WhatsApp. Un back office permet de gérer le menu, de suivre les commandes et de consulter l'historique.

## Stack

- Next.js 15 (App Router) + React 19, déployé sur Vercel
- Firebase : Firestore (menu et commandes), Authentication (back office), Storage (upload d'images depuis l'admin)
- Les images du menu sont servies depuis `public/`

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de production
```

La configuration Firebase est lue depuis les variables `NEXT_PUBLIC_FIREBASE_*` (avec des valeurs par défaut dans `app/firebase.ts`).

## Paramètres d'URL

Le QR code de chaque table ou chambre ajoute la localisation à la commande :

- `/?table=5` → « Table 5 »
- `/?chambre=12` → « Chambre 12 »
- `/?HP03` → « HP03 »

## Structure

- `app/page.tsx` : navigation (plats, boissons, panier, admin), panier stocké dans `localStorage`
- `app/components/` : pages du menu, panier, back office, historique
- `app/hooks/` : écoute temps réel des collections Firestore, état d'authentification
- `app/lib/commandes.ts` : type, statuts et formatage des commandes
