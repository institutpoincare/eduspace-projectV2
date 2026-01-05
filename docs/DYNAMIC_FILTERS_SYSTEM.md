# Système de Filtres Dynamiques avec Catégories Personnalisées

## 🎯 Vue d'ensemble

Le système de filtres permet aux formateurs de créer des cours avec des **catégories, matières et niveaux personnalisés**. Les catégories créées sont **sauvegardées en base de données** et deviennent disponibles pour **tous les formateurs et étudiants**.

## ✨ Fonctionnalités Principales

### 1. **Catégories Personnalisées** (NOUVEAU !)

Les formateurs peuvent maintenant créer leurs propres catégories :

- ✅ Option **"➕ Nouvelle catégorie..."** dans le select des catégories
- ✅ **Sauvegarde automatique** en base de données
- ✅ **Disponible immédiatement** pour tous les utilisateurs
- ✅ **Visible dans le catalogue étudiant** pour la recherche
- ✅ Marquée avec un **✓ vert** pour les distinguer

**Exemple d'utilisation :**

```
Formateur veut créer une catégorie "Marketing Digital" :

1. Ouvre "Nouveau Cours"
2. Catégorie : Sélectionne "➕ Nouvelle catégorie..."
3. Modal s'ouvre → Saisit "Marketing Digital"
4. Valide → La catégorie est créée et sauvegardée
5. "✓ Marketing Digital" apparaît dans la liste
6. Peut maintenant ajouter des matières et niveaux pour cette catégorie
```

### 2. **Filtrage Proportionnel**

Quand un formateur sélectionne une catégorie, le système filtre automatiquement :

- ✅ Les **matières** liées à cette catégorie
- ✅ Les **niveaux** adaptés à cette catégorie

**Catégories de base :**

- **Langue** → Matières : Français, Anglais, Arabe... → Niveaux : A1.1 à C2 (CECR)
- **Suivi Scolaire** → Matières : Maths, Physique, SVT... → Niveaux : 1ère année à Bac
- **Sciences** → Matières : Biologie, Chimie... → Niveaux : Lycée à Doctorat
- **Informatique** → Matières : Programmation, IA... → Niveaux : Débutant à Expert
- **Arts** → Matières : Dessin, Musique... → Niveaux : Débutant à Professionnel
- **Business** → Matières : Marketing, Finance... → Niveaux : Débutant à Master

### 3. **Matières et Niveaux Personnalisés**

Pour chaque catégorie (y compris les nouvelles), les formateurs peuvent ajouter :

- ✅ Des **matières personnalisées** via "➕ Autre..."
- ✅ Des **niveaux personnalisés** via "➕ Autre niveau..."

## 🔄 Flux Complet

### Scénario : Créer un cours de "Marketing Digital" niveau "Expert Certifié"

```
1. Catégorie : Clic sur "➕ Nouvelle catégorie..."
   → Modal s'ouvre
   → Saisie : "Marketing Digital"
   → Validation
   → ✅ Catégorie créée et sauvegardée en BDD

2. "✓ Marketing Digital" apparaît et est sélectionné
   → Les matières se mettent à jour (vide pour l'instant)
   → Les niveaux se mettent à jour (vide pour l'instant)

3. Matière : Clic sur "➕ Ajouter une matière..."
   → Modal s'ouvre
   → Saisie : "SEO et Référencement"
   → Validation
   → "✓ SEO et Référencement" apparaît

4. Niveau : Clic sur "➕ Ajouter un niveau..."
   → Modal s'ouvre
   → Saisie : "Expert Certifié Google"
   → Validation
   → "✓ Expert Certifié Google" apparaît

5. ✅ Cours créé avec succès !
   → La catégorie "Marketing Digital" est maintenant disponible pour tous
   → Les étudiants peuvent filtrer par cette catégorie dans le catalogue
```

## 💾 Architecture Technique

### Frontend (`dynamic-filters.js`)

```javascript
// Chargement des catégories au démarrage
await loadCustomCategories();

// Création d'une nouvelle catégorie
const newCategoryValue = await saveCustomCategory(categoryLabel);

// Les catégories sont ajoutées dynamiquement à filterData
filterData.categories.push({
  value: categoryData.value,
  label: `✓ ${categoryData.label}`,
  userCreated: true,
});
```

### Backend (`server.js`)

```javascript
// Endpoint: GET /api/custom-categories
// Récupère toutes les catégories personnalisées

// Endpoint: POST /api/custom-categories
// Crée une nouvelle catégorie
{
    "value": "custom-cat-marketing-digital-1735478400000",
    "label": "Marketing Digital",
    "createdAt": "2025-12-29T14:00:00.000Z"
}

// Endpoint: PUT /api/custom-categories/:value/increment
// Incrémente le compteur d'utilisation

// Endpoint: DELETE /api/custom-categories/:value
// Supprime une catégorie (admin)
```

### Base de Données (`data/custom-categories.json`)

```json
{
  "categories": [
    {
      "value": "custom-cat-marketing-digital-1735478400000",
      "label": "Marketing Digital",
      "createdAt": "2025-12-29T14:00:00.000Z",
      "usageCount": 5,
      "lastUsed": "2025-12-29T15:30:00.000Z"
    }
  ],
  "lastUpdated": "2025-12-29T15:30:00.000Z"
}
```

## 🎨 Interface Utilisateur

### Indicateurs Visuels

1. **Catégories** :

   - Catégories de base : Texte normal
   - **"➕ Nouvelle catégorie..."** : Bleu et gras
   - **"✓ Catégorie créée"** : Vert et gras

2. **Matières** :

   - **"➕ Autre..."** : Bleu et gras
   - **"✓ Matière créée"** : Vert et gras

3. **Niveaux** :
   - **"➕ Autre niveau..."** : Bleu et gras
   - **"✓ Niveau créé"** : Vert et gras

### Modal de Création

- ✨ Animation d'entrée fluide
- 🎨 Design moderne avec glassmorphism
- 📝 Validation en temps réel
- ⌨️ Support clavier (Enter/Escape)
- ⚠️ Animation "shake" en cas d'erreur
- 💾 Sauvegarde automatique en BDD

## 📊 Avantages

### Pour les Formateurs

- ✅ **Liberté totale** : Créent leurs propres catégories
- ✅ **Rapidité** : Options pré-remplies pour les cas courants
- ✅ **Visibilité** : Leurs catégories sont visibles par tous
- ✅ **Flexibilité** : S'adapte à tous les types de cours

### Pour les Étudiants

- ✅ **Choix élargi** : Plus de catégories disponibles
- ✅ **Recherche précise** : Filtres plus pertinents
- ✅ **Découverte** : Nouvelles catégories de cours
- ✅ **Actualité** : Catalogue toujours à jour

### Pour la Plateforme

- ✅ **Évolutivité** : Croissance organique du catalogue
- ✅ **Données** : Statistiques d'utilisation des catégories
- ✅ **Qualité** : Les catégories populaires peuvent être officialisées
- ✅ **Innovation** : Les formateurs proposent de nouvelles niches

## 📈 Statistiques et Suivi

Le système enregistre :

- 📊 **Nombre d'utilisations** de chaque catégorie
- 📅 **Date de dernière utilisation**
- 📈 **Catégories les plus populaires**
- 🆕 **Catégories récemment ajoutées**

Endpoint : `GET /api/custom-categories/stats`

## 🔒 Sécurité

- ✅ Validation des données côté serveur
- ✅ Vérification des doublons
- ✅ Sanitization des noms de catégories
- ✅ Gestion des erreurs robuste
- ✅ Fallback en cas d'échec réseau

## 🚀 Évolutions Futures

1. **Modération** : Système de validation admin avant publication
2. **Suggestions** : IA suggère des catégories basées sur le titre du cours
3. **Traductions** : Catégories multilingues
4. **Icônes** : Permettre aux formateurs de choisir des icônes
5. **Hiérarchie** : Sous-catégories et catégories parentes
6. **Analytics** : Dashboard des catégories les plus demandées

## 📁 Fichiers du Système

1. **`js/pages/dynamic-filters.js`** - Logique frontend
2. **`server.js`** - API backend (handler `handleCustomCategories`)
3. **`data/custom-categories.json`** - Stockage des catégories
4. **`pages/formateur/enregistre.html`** - Interface formateur

## 🎯 Exemple Réel

Un formateur spécialisé en **"Développement Personnel"** peut :

1. Créer la catégorie **"Développement Personnel"**
2. Ajouter des matières :
   - "Gestion du Stress"
   - "Leadership"
   - "Communication Efficace"
   - "Intelligence Émotionnelle"
3. Définir des niveaux :
   - "Découverte"
   - "Pratique"
   - "Maîtrise"
   - "Coaching Professionnel"

Cette catégorie devient immédiatement disponible pour :

- ✅ Tous les autres formateurs
- ✅ Tous les étudiants dans le catalogue
- ✅ Les filtres de recherche
- ✅ Les statistiques de la plateforme

---

**Créé le :** 29 Décembre 2025  
**Version :** 2.0  
**Statut :** ✅ Implémenté avec sauvegarde BDD  
**Nouveauté :** 🆕 Catégories personnalisées sauvegardées et partagées
