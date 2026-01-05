# PROJET EDUSPACE - SYSTÈME AUTOMATISÉ "DRIVE MIRROR"

## 🎯 Objectif

Affichage automatique du contenu d'un dossier Google Drive (Enregistrements) sans aucune saisie manuelle de liens vidéo par l'instructeur.

## 🏗️ Architecture "Mirror" (Iframe Embedded Folder)

C'est la solution choisie pour garantir une **Automatisation à 100%**.

### 1. Workflow Instructeur ("Drop & Forget")

- L'instructeur upload son fichier vidéo dans le dossier Google Drive de la classe.
- C'est tout. Aucune action sur la plateforme Eduspace.

### 2. Workflow Système

- La plateforme récupère l'URL du dossier (`driveFolderUrl`) depuis l'objet Classe.
- Elle extrait l'ID du dossier.
- Elle génère automatiquement une vue intégrée.

### 3. Interface Étudiant

- L'étudiant clique sur "Enregistrements".
- Il voit apparaître une fenêtre Google Drive (Vue Grille) à l'intérieur de la plateforme.
- Cette fenêtre reflète **en temps réel** le contenu du dossier Drive.

## ⚠️ Contraintes & Compromis (Acceptés)

En utilisant l'Iframe officielle Google (`embeddedfolderview`) :

1.  **Contrôle de lecture** : C'est Google qui gère le clic.
2.  **Nouvel Onglet** : Google force souvent l'ouverture des fichiers dans un nouvel onglet pour des raisons de sécurité (X-Frame-Options sur les viewers complets).
3.  **Bénéfice** : Zéro maintenance. Le prof n'a jamais besoin de copier-coller des liens de vidéo individuels.

## 🛠️ Implémentation Technique

Le code utilise une IIFE (Immediately Invoked Function Expression) dans le template littéral pour gérer la logique d'extraction d'ID proprement :

```javascript
/* student-class-dashboard.js */
src = "https://drive.google.com/embeddedfolderview?id=${folderId}#grid";
```

---

_Dernière mise à jour : 03 Janvier 2026 - Migration vers "Drive Mirror"_
