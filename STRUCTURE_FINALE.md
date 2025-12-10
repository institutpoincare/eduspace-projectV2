# Structure Finale du Projet EduSpace

Ce document récapitule l'organisation des fichiers de votre plateforme EduSpace après les mises à jour majeures de design et de fonctionnalité.

## 1. Page d'Accueil (`index.html`)
- **Design :** Version "Premium" avec police Outfit et Glassmorphism.
- **Fonctionnalité :** Chargement hybride (JSON + Fallback Hardcoded) pour garantir l'affichage des formateurs à 100%.
- **Interactivité :** 
    - Boutons "Voir CV" (Ouvre une modale).
    - Boutons "Chat" (Redirige vers `pages/etudiant/messages.html`).
    - Boutons "Détails" des centres (Simulation de demande d'info).

## 2. Dossier JavaScript (`js/`)
- **`js/core/data-manager.js`** : Le cerveau de l'application. Gère la base de données locale (JSON/LocalStorage).
- **`js/landing-interactions.js`** : Gère toutes les interactions de la page d'accueil (Modales, Notifications, Recherche).
- **`js/pages/home.js`** : Injecte le contenu des formateurs et centres dans la page d'accueil.
- **`js/data/*.js`** : Fichiers de données (optionnels maintenant, car tout est dans `dataManager` ou hardcodé pour la sécurité).

## 3. Dossier Pages (`pages/`)
Organisé par rôle pour plus de clarté :

### 🎓 Étudiant (`pages/etudiant/`)
- `dashboard.html` : Tableau de bord principal.
- `catalogue.html` : Liste complète des cours et formateurs.
- `messages.html` : Système de chat complet.
- `mes-cours.html` : Cours auxquels l'étudiant est inscrit.

### 👨‍🏫 Formateur (`pages/formateur/`)
- `dashboard.html` : Gestion des cours et revenus.
- `profil.html` : Page de profil public (NOUVEAU - pour éviter les erreurs 404).
- `classes.html` : Gestion des sessions live.

### 🏢 Entreprise (`pages/entreprise/`)
- `dashboard.html` : Suivi des employés en formation.

### 🏡 Parent (`pages/parent/`)
- `dashboard.html` : Suivi des enfants.

## 4. Dossier Données (`data/`)
Contient les fichiers JSON initiaux (base de données) :
- `instructors.json`
- `centers.json`
- `courses.json`
- `users.json`
- `messages.json`

## Guide de Démarrage Rapide

1.  Ouvrez `index.html` dans votre navigateur.
2.  Tout doit s'afficher immédiatement.
3.  Pour vous connecter en tant qu'étudiant, utilisez les identifiants présents dans `data/users.json` (ou créez un nouveau compte).
4.  Pour modifier les formateurs affichés, changez les données dans `js/pages/home.js` (section HARDCODED) ou mettez à jour `data/instructors.json`.

---
*Généré par votre Assistant IA - EduSpace V2*
