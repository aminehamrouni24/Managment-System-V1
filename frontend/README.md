# KETHIRI - Système de Gestion Commerciale

Application complète de gestion commerciale avec support bilingue (Français/Arabe) et architecture moderne React + Supabase.

## Fonctionnalités

### 🏪 Gestion Complète
- **Produits**: Gestion de stock avec alertes de stock minimum
- **Fournisseurs**: Gestion des fournisseurs et factures d'achat
- **Clients**: Gestion clientèle et facturation de vente
- **Stock**: Suivi des mouvements de stock (entrées/sorties)
- **Factures**: Création et suivi des factures clients
- **Rapports**: Analyses de ventes, marges et dettes
- **Exports**: Export de données Excel/PDF

### 🌍 Bilingue (FR/AR)
- Interface complète en Français et Arabe
- Support RTL (Right-to-Left) pour l'arabe
- Changement de langue en temps réel
- Persistance de la préférence linguistique

### 🔐 Authentification
- Système d'authentification sécurisé via Supabase Auth
- Gestion des rôles (ADMIN / EMPLOYEE)
- Profils utilisateurs
- Session persistante

### 📊 Tableau de Bord
- KPIs en temps réel
- Alertes de stock faible
- Suivi des paiements en attente
- Vue d'ensemble des ventes et marges mensuelles

### 🛡️ Sécurité
- Row Level Security (RLS) Supabase
- Policies de sécurité granulaires
- Validation des données côté serveur
- Protection contre les accès non autorisés

## Architecture

### Frontend
- **React 18** avec Hooks
- **Vite** pour le build ultra-rapide
- **TailwindCSS** pour le design
- **Lucide React** pour les icônes
- **JavaScript** (pas TypeScript pour simplicité)

### Backend
- **Supabase** (PostgreSQL + Edge Functions)
- **Row Level Security** pour la sécurité
- **Supabase Auth** pour l'authentification
- **Edge Functions** pour les endpoints API

### Base de Données
Tables principales:
- `users` - Utilisateurs et profils
- `products` - Produits et stock
- `suppliers` - Fournisseurs
- `customers` - Clients
- `supplier_invoices` - Factures fournisseurs
- `customer_invoices` - Factures clients
- `stock_movements` - Mouvements de stock
- `payments` - Paiements
- `activity_logs` - Logs d'activité

## Installation

### Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase (gratuit)

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd project
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration Supabase**

Le projet est déjà configuré avec Supabase. Les variables d'environnement sont dans `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Migrations de base de données**

Les migrations ont déjà été appliquées via l'outil MCP Supabase. Votre base de données est prête!

5. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

6. **Build de production**
```bash
npm run build
npm run preview
```

## Structure du Projet

```
project/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── Navbar.jsx
│   │       └── Sidebar.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── LanguageContext.jsx
│   ├── lib/
│   │   ├── supabase.js
│   │   └── translations.js
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Products.jsx
│   │   ├── Suppliers.jsx
│   │   ├── Customers.jsx
│   │   ├── Invoices.jsx
│   │   ├── Stock.jsx
│   │   ├── Reports.jsx
│   │   ├── Exports.jsx
│   │   └── Settings.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   └── functions/
│       └── option/
│           └── index.ts
└── public/
    └── KETHIRI.svg
```

## API Endpoint

### GET /api/option/:lang

Endpoint bilingue pour récupérer les informations système.

**Paramètres:**
- `lang`: `fr` ou `ar`

**Réponse:**
```json
{
  "optionTitle": "Gestion Complète",
  "description": "Système de gestion commerciale intégré",
  "sections": [...],
  "ui": {...}
}
```

**Exemple:**
```bash
curl https://your-project.supabase.co/functions/v1/option/fr \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Utilisation

### Première Connexion

1. Créez un compte via l'interface de registration
2. Le premier utilisateur créé devrait être manuellement promu ADMIN dans la base de données:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'votre@email.com';
```

### Gestion des Produits

1. Accédez à **Produits** dans le menu
2. Cliquez sur **Ajouter Produit**
3. Remplissez les informations:
   - Nom, marque, catégorie
   - Prix d'achat et de vente
   - Quantité en stock
   - Seuil d'alerte stock minimum

### Création de Factures

1. Accédez à **Factures** dans le menu
2. Sélectionnez un client
3. Ajoutez des produits à la facture
4. Le stock sera automatiquement mis à jour

### Suivi du Stock

Les mouvements de stock sont automatiquement enregistrés lors de:
- Création de factures clients (sortie)
- Création de factures fournisseurs (entrée)
- Ajustements manuels

## Sécurité

### Row Level Security (RLS)

Toutes les tables sont protégées par RLS:

- **ADMIN**: Accès complet (lecture, écriture, suppression)
- **EMPLOYEE**: Lecture + création (pas de suppression)
- **Unauthenticated**: Aucun accès

### Bonnes Pratiques

- Changez régulièrement les mots de passe
- N'utilisez jamais la clé `service_role` côté client
- Sauvegardez régulièrement votre base de données
- Activez 2FA sur votre compte Supabase

## Support Multi-langue

### Ajouter une Nouvelle Langue

1. Éditez `src/lib/translations.js`
2. Ajoutez votre langue (ex: `en`, `es`)
3. Traduisez toutes les clés
4. Mettez à jour le sélecteur de langue dans `Navbar.jsx`

## Performance

- Build optimisé avec Vite
- Code splitting automatique
- Images lazy-loaded
- Requêtes Supabase optimisées avec indexes

## Développement

### Scripts Disponibles

```bash
npm run dev       # Serveur de développement
npm run build     # Build de production
npm run preview   # Prévisualisation du build
npm run lint      # Linter ESLint
```

### Recommandations

- Utilisez les React DevTools
- Configurez ESLint dans votre éditeur
- Testez en mode RTL (arabe) régulièrement
- Vérifiez la sécurité RLS avant déploiement

## Déploiement

### Vercel (Recommandé)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Variables d'Environnement

N'oubliez pas de configurer:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Contribution

Les contributions sont les bienvenues! Merci de:
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT.

## Support

Pour toute question ou problème:
- Ouvrez une issue sur GitHub
- Consultez la documentation Supabase: https://supabase.com/docs
- Documentation React: https://react.dev

---

**Développé avec ❤️ par KETHIRI Team**

Version: 1.0.0
