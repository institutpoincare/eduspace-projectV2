# Structure du Projet EduSpace (Vanilla JS)

Ce document décrit l'organisation des fichiers et dossiers du projet après la migration vers le système dynamique.

## 📂 Architecture des Dossiers

```
eduspace-vanilla/
├── data/                  # Bases de données JSON (Source de vérité)
│   ├── instructors.json   # Liste des formateurs
│   ├── courses.json       # Liste des cours
│   ├── users.json         # Utilisateurs (étudiants, profs, ent)
│   ├── ...                # (centers, enrollments, messages, sessions)
│
├── js/                    # Logique JavaScript
│   ├── core/              # Noyau du système
│   │   └── data-manager.js # Gestionnaire CRUD universel (LocalStorage + JSON)
│   │
│   ├── pages/             # Scripts spécifiques par page (Loaders)
│   │   ├── home.js                 # Charge index.html
│   │   ├── instructor-dashboard.js # Dashboard formateur
│   │   ├── student-dashboard.js    # Dashboard étudiant
│   │   ├── message.js              # Messagerie
│   │   ├── mes-cours.js            # Logique cours étudiant
│   │   └── ...
│   │
│   ├── components/        # Composants réutilisables
│   │   ├── navbar.js
│   │   ├── footer.js
│   │   └── sidebar-*.js
│   │
│   └── utils/             # Utilitaires
│
├── pages/                 # Pages HTML (Contenu structurel)
│   ├── etudiant/          # Espace Étudiant
│   ├── formateur/         # Espace Formateur
│   ├── entreprise/        # Espace Entreprise
│   ├── parent/            # Espace Parent
│   └── ...                # Pages communes (login, inscription)
│
├── css/                   # Styles CSS
│   ├── main.css           # Styles globaux
│   └── dashboard.css      # Styles dashboards
│
└── index.html             # Page d'accueil (Point d'entrée)
```

## 🔄 Flux de Données (Data Flow)

1.  **Chargement** : Au démarrage, `DataManager` (`js/core/data-manager.js`) charge les données des fichiers JSON (`data/*.json`) dans le `LocalStorage` du navigateur.
2.  **Affichage** : Les scripts de page (`js/pages/*.js`) demandent les données au `DataManager` et génèrent le HTML dynamiquement.
3.  **Interaction** : Les actions utilisateur (Inscription, Ajout cours, Message) utilisent les méthodes du `DataManager` (`create`, `update`, `delete`).
4.  **Persistance** : Les modifications sont sauvegardées instantanément dans le `LocalStorage`.

## 🛠️ Maintenance

*   **Ajouter une page** : Créer le HTML dans `pages/` et inclure `<script src="../../js/core/data-manager.js"></script>`.
*   **Modifier des données par défaut** : Éditer les fichiers JSON dans `data/`.
*   **Réinitialiser les données** : Appeler `DataManager.reset()` dans la console du navigateur.

---
*Dernière mise à jour : Décembre 2025*
