# 📹 Course Recording Management System - Documentation Complète

## Vue d'ensemble

Le système de gestion des enregistrements de cours permet aux formateurs d'ajouter des vidéos de séances et aux étudiants de les visionner directement dans la plateforme, sans redirection externe.

---

## 🎯 Fonctionnalités Principales

### Pour les Formateurs

#### 1. **Dossier "Enregistrements" Dédié**

- Un dossier virtuel rouge avec icône "play-circle"
- Affiche le nombre total de vidéos enregistrées
- Accessible depuis la vue racine du tableau de bord

#### 2. **Ajout d'Enregistrements**

- Bouton "Ajouter un Enregistrement" dans la vue Enregistrements
- Formulaire modal avec :
  - **Titre de la séance** (ex: "Séance 1 - Introduction")
  - **Lien URL** (Google Drive, YouTube, fichier direct)
  - **Source** (optionnel : Drive, YouTube, Fichier)
- Sauvegarde automatique dans `course.recordings`

#### 3. **Importation en Masse**

- Bouton "📥 Importer Liste" dans les dossiers standards
- Permet de coller plusieurs liens Google Drive
- Extraction automatique via regex
- Ajout rapide de multiples vidéos

#### 4. **Gestion des Enregistrements**

- Affichage en grille de cartes vidéo
- Bouton de suppression sur chaque carte
- Lecture interne via popup modal

### Pour les Étudiants

#### 1. **Accès aux Enregistrements**

- Dossier "Enregistrements" visible sur le tableau de bord
- Affiche le nombre de vidéos disponibles
- Navigation simple par clic

#### 2. **Grille Style Poincaré**

- Cartes vidéo élégantes avec fond sombre (`bg-slate-900`)
- Icône "Play" centrale avec effet hover
- Badge "Lecture Interne" en bleu
- Animation au survol

#### 3. **Lecteur Vidéo Interne**

- Popup modal noir opaque (`bg-black/95`)
- Barre de titre avec nom de la vidéo
- Bouton de fermeture (✕)
- Iframe intégré pour lecture directe
- Conversion automatique des liens Drive en format `/preview`
- Aucune redirection externe

---

## 📊 Structure des Données

### Modèle `course.recordings`

```javascript
course.recordings = [
  {
    id: 1736095200000, // Timestamp unique
    title: "Séance 1 - Introduction", // Titre de la vidéo
    url: "https://drive.google.com/file/d/ABC123/view", // URL originale
    link: "https://drive.google.com/file/d/ABC123/view", // Copie pour compatibilité
    type: "drive", // Type de source (drive, youtube, file)
    date: "2026-01-05T16:00:00.000Z", // Date d'ajout (ISO 8601)
  },
];
```

### Différence avec `course.resources`

| Propriété     | `recordings`                    | `resources`                   |
| ------------- | ------------------------------- | ----------------------------- |
| **Usage**     | Vidéos de séances uniquement    | Tous types de fichiers        |
| **Affichage** | Dossier "Enregistrements" dédié | Dossiers "Ressources & Liens" |
| **Ajout**     | Modal spécialisé                | Modal générique               |
| **Lecteur**   | Popup interne obligatoire       | Ouverture externe possible    |

---

## 🛠️ Guide d'Utilisation

### Pour les Formateurs

#### Ajouter un Enregistrement (Méthode Manuelle)

1. **Accéder au tableau de bord de la classe**

   - Ouvrir `pages/formateur/class-dashboard.html?id=VOTRE_ID_CLASSE`

2. **Ouvrir le dossier Enregistrements**

   - Cliquer sur la carte rouge "Enregistrements" dans la vue racine

3. **Ajouter une vidéo**

   - Cliquer sur "Ajouter un Enregistrement"
   - Remplir le formulaire :
     - **Titre** : "Séance 1 - Introduction aux Bases"
     - **URL** : Coller le lien Google Drive (format `/view`)
     - **Source** : Sélectionner "Google Drive"
   - Cliquer sur "Sauvegarder"

4. **Vérifier l'ajout**
   - La vidéo apparaît immédiatement dans la grille
   - Le compteur du dossier se met à jour

#### Ajouter des Enregistrements en Masse

1. **Préparer vos liens**

   - Copier tous vos liens Google Drive dans un fichier texte
   - Format accepté : `https://drive.google.com/file/d/ID/view`

2. **Utiliser l'importation en masse**

   - Ouvrir un dossier standard (pas "Enregistrements")
   - Cliquer sur "📥 Importer Liste"
   - Coller tous vos liens (un par ligne ou en bloc)
   - Cliquer sur OK

3. **Résultat**
   - Les vidéos sont ajoutées avec des titres automatiques ("Séance 1 (Importée)", etc.)
   - Vous pouvez ensuite les renommer individuellement si nécessaire

#### Supprimer un Enregistrement

1. Ouvrir le dossier "Enregistrements"
2. Survoler la carte vidéo
3. Cliquer sur l'icône "Poubelle" (trash-2)
4. Confirmer la suppression

### Pour les Étudiants

#### Visionner un Enregistrement

1. **Accéder au tableau de bord de la classe**

   - Ouvrir `pages/etudiant/class-dashboard.html?id=VOTRE_ID_CLASSE`

2. **Ouvrir les Enregistrements**

   - Cliquer sur la carte "Enregistrements" (rouge)

3. **Lancer une vidéo**

   - Cliquer sur la carte de la vidéo souhaitée
   - Le lecteur s'ouvre automatiquement en popup

4. **Contrôles du lecteur**
   - **Fermer** : Cliquer sur ✕ en haut à droite
   - **Pause/Play** : Utiliser les contrôles de l'iframe
   - **Plein écran** : Utiliser le bouton plein écran de l'iframe

---

## 🎨 Personnalisation

### Modifier le Style des Cartes Vidéo

Les styles sont définis dans `instructor-class-dashboard.js` et `student-class-dashboard.js` :

```javascript
// Couleur de fond de la carte
background: #1f2937; // Gris foncé

// Couleur du bouton Play au survol
background: #ef4444; // Rouge

// Bordure de la carte
border: 1px solid #374151; // Gris moyen
```

### Modifier le Style du Modal

Dans `student-class-dashboard.js`, fonction `openPoincareModal` :

```javascript
// Opacité du fond
bg-black/95 // 95% opaque

// Taille maximale du lecteur
max-w-5xl // Largeur maximale

// Ratio d'aspect
aspect-video // 16:9
```

---

## 🔧 Dépannage

### Problème : La vidéo ne se charge pas

**Causes possibles :**

1. Lien Google Drive incorrect
2. Vidéo non partagée publiquement
3. Format de lien non supporté

**Solutions :**

1. Vérifier que le lien est au format `/file/d/ID/view`
2. Partager la vidéo avec "Toute personne disposant du lien"
3. Utiliser la conversion automatique en `/preview`

### Problème : Le bouton "Open in new window" de Drive apparaît

**Explication :**

- Google Drive affiche toujours ce bouton dans l'iframe
- Le bouton est **désactivé** via `sandbox="allow-scripts allow-same-origin allow-presentation"`
- Il est visible mais non fonctionnel (aucune redirection)

**Vérification :**

- Cliquer sur le bouton ne devrait rien faire
- La vidéo reste dans le popup

### Problème : Le dossier "Enregistrements" n'apparaît pas

**Causes possibles :**

1. Fichier JavaScript non chargé
2. Erreur dans le code
3. Cache du navigateur

**Solutions :**

1. Vérifier la console pour les erreurs
2. Rafraîchir la page (Ctrl+F5)
3. Vider le cache du navigateur

---

## 📝 Notes Techniques

### Conversion des URLs

#### Google Drive

```javascript
// Entrée
https://drive.google.com/file/d/ABC123/view

// Sortie (pour iframe)
https://drive.google.com/file/d/ABC123/preview
```

#### YouTube

```javascript
// Entrée
https://www.youtube.com/watch?v=VIDEO_ID

// Sortie (pour iframe)
https://www.youtube.com/embed/VIDEO_ID?autoplay=1
```

### Sécurité de l'Iframe

```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-presentation"
  allow="autoplay; encrypted-media"
  allowfullscreen
></iframe>
```

**Permissions :**

- `allow-scripts` : Permet l'exécution du lecteur vidéo
- `allow-same-origin` : Permet l'accès aux ressources Drive
- `allow-presentation` : Permet le mode plein écran

**Restrictions :**

- Pas de `allow-top-navigation` : Empêche les redirections
- Pas de `allow-popups` : Empêche l'ouverture de nouveaux onglets

---

## 🚀 Améliorations Futures

### Fonctionnalités Suggérées

1. **Édition des Enregistrements**

   - Modifier le titre et l'URL après ajout
   - Réorganiser l'ordre des vidéos

2. **Métadonnées Enrichies**

   - Durée de la vidéo
   - Date de la séance
   - Miniature personnalisée

3. **Filtres et Recherche**

   - Recherche par titre
   - Filtrage par date
   - Tri personnalisé

4. **Statistiques**

   - Nombre de vues par vidéo
   - Temps de visionnage moyen
   - Vidéos les plus populaires

5. **Téléchargement**
   - Option de téléchargement pour visionnage hors ligne
   - Format de téléchargement configurable

---

## 📞 Support

Pour toute question ou problème :

1. Consulter cette documentation
2. Vérifier les logs de la console navigateur
3. Contacter l'équipe de développement

---

**Version :** 1.0  
**Date :** 5 janvier 2026  
**Auteur :** Équipe Eduspace
