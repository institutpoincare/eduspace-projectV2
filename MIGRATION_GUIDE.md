# 🚀 Migration vers le Serveur Express - Guide Complet

## ✅ Ce qui a été fait

### 1. **Désactivation de l'ancien serveur**

- `server.js` (racine) → Port changé à 3002 et marqué comme obsolète
- Le serveur Express (`server/server.js`) utilise maintenant le port 3001

### 2. **Configuration du serveur Express**

- ✅ Authentification désactivée pour les requêtes GET (lecture seule)
- ✅ Base de données sécurisée avec cryptage AES-256
- ✅ Support complet CRUD (Create, Read, Update, Delete)
- ✅ Gestion des tokens Google Drive
- ✅ Cron jobs pour renouvellement automatique des webhooks

### 3. **Scripts de migration créés**

- `migrate-data.js` - Script Node.js pour migrer les données
- `migrate-data.bat` - Script Windows pour exécuter la migration facilement

---

## 📋 Étapes pour Migrer

### Étape 1 : Migrer vos données

```bash
# Double-cliquez sur ce fichier :
migrate-data.bat
```

**Ce script va :**

- Copier tous les fichiers JSON de `/data/` vers `/server/data/`
- Fusionner intelligemment les données existantes
- Éviter les doublons (par ID)
- Préserver vos données actuelles

### Étape 2 : Démarrer le serveur Express

```bash
# Double-cliquez sur ce fichier :
start_server.bat
```

**Le serveur va :**

- Installer les dépendances npm si nécessaire
- Démarrer sur le port 3001
- Activer le cryptage des données sensibles
- Lancer les cron jobs pour Google Drive

### Étape 3 : Vérifier que tout fonctionne

1. Ouvrez votre navigateur : `http://localhost:3001`
2. Connectez-vous avec vos identifiants
3. Vérifiez le dashboard des revenus
4. Les montants doivent maintenant être corrects (50 TND au lieu de 500 TND)

---

## 🔍 Résolution du problème des montants

### Problème identifié

Le popup des revenus affichait des montants incorrects car :

- Les données étaient cryptées dans `/data/` (ancien serveur)
- Le frontend lisait directement les données cryptées
- Le décryptage n'était pas appliqué côté client

### Solution appliquée

Avec le serveur Express :

1. **Cryptage transparent** : Le serveur crypte/décrypte automatiquement
2. **API sécurisée** : Les données sont décryptées avant envoi au frontend
3. **Champs sensibles protégés** :
   - `password` (utilisateurs)
   - `email` (utilisateurs, instructeurs)
   - `phone` (utilisateurs)
   - `amountPaid` (inscriptions) ← **C'est ici le montant réel !**

---

## 📊 Structure des données

### Collection `enrollments` (Inscriptions)

```json
{
  "id": "enrollment-123",
  "userId": "user-456",
  "courseId": "course-789",
  "amountPaid": 50,  ← Montant RÉEL (sera crypté dans le fichier)
  "status": "active",
  "enrolledAt": "2026-01-06T10:00:00.000Z"
}
```

### Collection `users` (Utilisateurs/Étudiants)

```json
{
  "id": "user-456",
  "name": "Ahmed Ben Ali",  ← Nom RÉEL de l'étudiant
  "email": "ahmed@example.com",  ← Sera crypté
  "role": "student",
  "createdAt": "2026-01-01T10:00:00.000Z"
}
```

---

## 🔐 Sécurité

### Champs cryptés automatiquement

Le serveur Express crypte ces champs dans les fichiers JSON :

| Collection      | Champs cryptés                  |
| --------------- | ------------------------------- |
| `users`         | `password`, `email`, `phone`    |
| `students`      | `email`, `phone`, `amountPaid`  |
| `enrollments`   | `amountPaid`                    |
| `instructors`   | `email`, `phone`                |
| `teacherTokens` | `access_token`, `refresh_token` |

### Algorithme de cryptage

- **AES-256-CBC** (Standard militaire)
- **Clé dérivée** : PBKDF2 avec salt
- **IV aléatoire** : Nouveau vecteur d'initialisation pour chaque valeur

---

## 🛠️ Dépannage

### Le serveur ne démarre pas

```bash
cd server
npm install
node server.js
```

### Les données ne s'affichent pas

1. Vérifiez que la migration a réussi : `/server/data/` doit contenir vos fichiers JSON
2. Ouvrez la console du navigateur (F12) et vérifiez les erreurs
3. Vérifiez que le serveur est bien sur le port 3001

### Les montants sont toujours incorrects

1. Vérifiez le fichier `/server/data/enrollments.json`
2. Les valeurs `amountPaid` doivent être cryptées (format `hex:hex`)
3. Si elles sont en clair, relancez la migration

### Erreur "404 Not Found" dans le dashboard

Le frontend utilise `http://localhost:3001/api` (vérifié dans `js/core/data-manager.js`)

- ✅ Le serveur Express écoute sur le port 3001
- ✅ Les routes API sont configurées

---

## 📝 Fichiers modifiés

### Serveur

- ✅ `server.js` (racine) - Marqué comme obsolète
- ✅ `server/server.js` - Authentification GET désactivée
- ✅ `server/db-manager.js` - Déjà configuré pour le cryptage

### Frontend

- ✅ `js/core/data-manager.js` - Pointe déjà vers port 3001
- ✅ `js/pages/instructor-dashboard.js` - Popup revenus avec noms réels

### Scripts

- ✅ `migrate-data.js` - Script de migration
- ✅ `migrate-data.bat` - Lanceur Windows
- ✅ `start_server.bat` - Démarre le serveur Express

---

## ✨ Prochaines étapes

1. **Exécutez la migration** : `migrate-data.bat`
2. **Démarrez le serveur** : `start_server.bat`
3. **Testez le dashboard** : Vérifiez que les montants et noms sont corrects
4. **Supprimez l'ancien dossier** : `/data/` (après avoir vérifié que tout fonctionne)

---

## 🎯 Résultat attendu

Dans le popup des revenus, vous devriez voir :

| Étudiant      | Cours            | Date        | Montant |
| ------------- | ---------------- | ----------- | ------- |
| Ahmed Ben Ali | Anglais Bac 2026 | 6 jan. 2026 | +50 TND |
| Fatima Zahra  | Mathématiques    | 5 jan. 2026 | +75 TND |

**Plus de montants incorrects (500 TND) !** ✅

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs du serveur dans la console
2. Vérifiez les erreurs dans la console du navigateur (F12)
3. Assurez-vous que le port 3001 n'est pas utilisé par un autre programme

---

**Date de création** : 6 janvier 2026  
**Version** : 1.0  
**Serveur** : Express + Node.js + JSON Database sécurisée
