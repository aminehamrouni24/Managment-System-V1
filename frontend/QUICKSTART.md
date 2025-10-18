# 🚀 Guide de Démarrage Rapide - KETHIRI

## Installation en 5 Minutes

### 1. Prérequis
```bash
node --version  # v18+ requis
npm --version   # v9+ requis
```

### 2. Installation
```bash
npm install
```

### 3. Configuration (Déjà fait!)
Le fichier `.env` est déjà configuré avec Supabase.

### 4. Lancer l'application
```bash
npm run dev
```

Ouvrez http://localhost:5173

### 5. Première Connexion

1. Cliquez sur **"Pas de compte?"** pour créer un compte
2. Remplissez: nom, email, mot de passe (min 6 caractères)
3. Cliquez **"S'inscrire"**
4. Vous êtes connecté!

### 6. Promouvoir en ADMIN (Optionnel)

Pour avoir accès complet (supprimer des éléments), connectez-vous à Supabase et exécutez:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'votre@email.com';
```

## Utilisation Rapide

### Ajouter un Produit
1. Menu **Produits**
2. Bouton **Ajouter Produit**
3. Remplir le formulaire
4. **Enregistrer**

### Ajouter un Client
1. Menu **Clients**
2. Bouton **Ajouter Client**
3. Nom, Contact, Adresse
4. **Enregistrer**

### Créer une Facture
1. Menu **Factures**
2. La liste des factures existantes s'affiche
3. Les factures sont liées aux clients

### Voir le Tableau de Bord
1. Menu **Tableau de Bord**
2. Visualisez vos KPIs en temps réel

### Changer la Langue
- Cliquez sur **FR** ou **AR** en haut à droite
- L'interface change instantanément

## Build Production

```bash
npm run build
npm run preview
```

## Déploiement

### Vercel (1 minute)
```bash
npm install -g vercel
vercel
```

### Netlify (1 minute)
```bash
npm run build
netlify deploy --prod --dir=dist
```

N'oubliez pas de configurer les variables d'environnement:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Endpoints API

### Option Endpoint
```bash
# Français
curl https://your-project.supabase.co/functions/v1/option/fr \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Arabe
curl https://your-project.supabase.co/functions/v1/option/ar \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Commandes Utiles

```bash
npm run dev      # Développement
npm run build    # Build production
npm run preview  # Prévisualiser build
npm run lint     # Linter
```

## Données de Test

Pour tester rapidement, ajoutez quelques produits:

1. **Produit 1**
   - Nom: Laptop HP
   - Marque: HP
   - Catégorie: Informatique
   - Quantité: 10
   - Prix Achat: 5000 DH
   - Prix Vente: 7000 DH

2. **Produit 2**
   - Nom: Souris Logitech
   - Marque: Logitech
   - Catégorie: Accessoires
   - Quantité: 50
   - Prix Achat: 150 DH
   - Prix Vente: 250 DH

## Résolution de Problèmes

### Erreur "Missing Supabase environment variables"
- Vérifiez `.env` à la racine
- Assurez-vous que les variables commencent par `VITE_`

### Erreur de build
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Erreur de connexion Supabase
- Vérifiez votre connexion Internet
- Vérifiez les clés Supabase dans `.env`
- Testez l'URL Supabase dans un navigateur

## Support

- 📖 Documentation complète: voir `README.md`
- 📝 Liste fonctionnalités: voir `FEATURES.md`
- 🐛 Issues: GitHub Issues
- 📧 Email: support@kethiri.com

## Vidéo Demo

[À ajouter: Lien vers vidéo démo]

---

**Temps total de setup: ~5 minutes ⚡**

Bon développement! 🎉
