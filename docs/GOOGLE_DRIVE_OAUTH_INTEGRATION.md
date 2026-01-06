# 🎓 Guide Complet : Intégration Google Drive OAuth 2.0 pour EduSpace

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Configuration Google Cloud Console](#configuration-google-cloud-console)
4. [Installation](#installation)
5. [Configuration](#configuration)
6. [Utilisation](#utilisation)
7. [Webhooks & Synchronisation](#webhooks--synchronisation)
8. [Déploiement Production](#déploiement-production)
9. [Dépannage](#dépannage)
10. [Sécurité](#sécurité)

---

## 🎯 Vue d'ensemble

Cette intégration permet aux professeurs de :

- ✅ Connecter leur compte Google Drive personnel
- ✅ Configurer un dossier d'enregistrements OBS
- ✅ Synchroniser automatiquement les nouveaux fichiers
- ✅ Afficher les vidéos aux étudiants sans clés Service Account

### Architecture

```
OBS Recording → Google Drive → Webhook → EduSpace API → MongoDB → Interface Étudiant
```

---

## 📦 Prérequis

### Logiciels Requis

- **Node.js** : v16+ ([Télécharger](https://nodejs.org/))
- **MongoDB** : v5+ ([Télécharger](https://www.mongodb.com/try/download/community))
- **npm** ou **yarn** : Gestionnaire de paquets

### Dépendances NPM

```bash
npm install googleapis express mongoose dotenv cors
```

---

## ☁️ Configuration Google Cloud Console

### Étape 1 : Créer un Projet

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Cliquez sur **"Sélectionner un projet"** → **"Nouveau projet"**
3. Nom du projet : `EduSpace-Drive-Integration`
4. Cliquez sur **"Créer"**

### Étape 2 : Activer l'API Google Drive

1. Dans le menu, allez à **"APIs & Services"** → **"Bibliothèque"**
2. Recherchez **"Google Drive API"**
3. Cliquez sur **"Activer"**

### Étape 3 : Créer des Identifiants OAuth 2.0

1. Allez à **"APIs & Services"** → **"Identifiants"**
2. Cliquez sur **"Créer des identifiants"** → **"ID client OAuth"**
3. Type d'application : **"Application Web"**
4. Nom : `EduSpace OAuth Client`
5. **URI de redirection autorisés** :
   ```
   http://localhost:3000/api/auth/google/callback
   https://votre-domaine.tn/api/auth/google/callback
   ```
6. Cliquez sur **"Créer"**
7. **Copiez** le `Client ID` et le `Client Secret`

### Étape 4 : Configurer l'Écran de Consentement

1. Allez à **"APIs & Services"** → **"Écran de consentement OAuth"**
2. Type d'utilisateur : **"Externe"** (ou "Interne" si G Suite)
3. Remplissez les informations :
   - Nom de l'application : `EduSpace`
   - E-mail d'assistance : votre email
   - Logo (optionnel)
4. **Scopes** :
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.metadata.readonly`
5. **Utilisateurs de test** : Ajoutez les emails des professeurs
6. Cliquez sur **"Enregistrer et continuer"**

---

## 🚀 Installation

### 1. Cloner le Projet

```bash
cd d:\files\Eduspace\eduspace-vanilla
```

### 2. Installer les Dépendances

```bash
npm install googleapis express mongoose dotenv cors
```

### 3. Créer le Fichier `.env`

```bash
cp .env.example .env
```

### 4. Configurer les Variables

Éditez `.env` et remplacez les valeurs :

```env
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnop
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
APP_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/eduspace
JWT_SECRET=votre-secret-super-securise-changez-moi
```

---

## ⚙️ Configuration

### 1. Mettre à Jour `server.js`

Ajoutez les routes Drive :

```javascript
// server.js
const driveRoutes = require("./backend/routes/driveRoutes");

// ... autres imports

app.use("/api", driveRoutes);
```

### 2. Ajouter les Boutons dans le Dashboard Professeur

Dans `pages/formateur/dashboard.html`, ajoutez :

```html
<!-- Section Google Drive -->
<div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
  <div class="flex justify-between items-center mb-4">
    <h3 class="font-bold text-gray-900 flex items-center gap-2">
      <i data-lucide="hard-drive" class="w-5 h-5 text-blue-600"></i>
      Google Drive
    </h3>
    <span
      id="drive-status-badge"
      class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold"
    >
      Non connecté
    </span>
  </div>

  <div class="space-y-2">
    <!-- Bouton de connexion -->
    <button
      id="connect-drive-btn"
      class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
    >
      <i data-lucide="link" class="w-4 h-4"></i>
      Connecter Google Drive
    </button>

    <!-- Bouton de configuration (caché par défaut) -->
    <button
      id="config-folder-btn"
      class="hidden w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
    >
      <i data-lucide="folder" class="w-4 h-4"></i>
      Configurer le Dossier
    </button>

    <!-- Bouton de synchronisation (caché par défaut) -->
    <button
      id="sync-now-btn"
      class="hidden w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
    >
      <i data-lucide="refresh-cw" class="w-4 h-4"></i>
      Synchroniser Maintenant
    </button>

    <!-- Bouton de déconnexion (caché par défaut) -->
    <button
      id="disconnect-drive-btn"
      class="hidden w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2"
    >
      <i data-lucide="unlink" class="w-4 h-4"></i>
      Déconnecter
    </button>
  </div>
</div>

<!-- Script -->
<script src="/js/teacherDrive.js"></script>
```

### 3. Créer la Page Enregistrements Étudiant

Créez `pages/etudiant/recordings.html` :

```html
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Enregistrements - EduSpace</title>
    <link rel="stylesheet" href="/css/main.css" />
    <script src="https://unpkg.com/lucide@latest"></script>
  </head>
  <body class="bg-gray-50">
    <div class="container mx-auto px-4 py-8">
      <div id="recordings-container"></div>
    </div>

    <script src="/js/studentRecordings.js"></script>
  </body>
</html>
```

---

## 🎬 Utilisation

### Pour les Professeurs

#### 1. Connecter Google Drive

1. Ouvrez le **Dashboard Formateur**
2. Cliquez sur **"Connecter Google Drive"**
3. Autorisez l'accès dans la popup Google
4. Vous serez redirigé vers le dashboard

#### 2. Configurer le Dossier

1. Cliquez sur **"Configurer le Dossier"**
2. Collez l'URL de votre dossier Drive :
   ```
   https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9I0J
   ```
3. Cliquez sur **"Configurer"**
4. La synchronisation initiale démarre automatiquement

#### 3. Enregistrer avec OBS

1. Configurez OBS pour sauvegarder dans un dossier local
2. Utilisez **Google Drive Desktop** pour synchroniser ce dossier
3. Les nouveaux fichiers apparaîtront automatiquement dans EduSpace

#### 4. Synchronisation Manuelle

- Cliquez sur **"Synchroniser Maintenant"** pour forcer une mise à jour

### Pour les Étudiants

1. Accédez à la page **"Enregistrements"** de la classe
2. Les vidéos s'affichent automatiquement
3. Cliquez sur **"Regarder"** pour voir la vidéo
4. Cliquez sur l'icône externe pour ouvrir dans Drive

---

## 🔔 Webhooks & Synchronisation

### Fonctionnement des Webhooks

Google Drive envoie une notification à EduSpace à chaque modification du dossier :

```
Nouveau fichier → Webhook → EduSpace → Synchronisation → Affichage
```

### Configuration Développement (ngrok)

Pour tester les webhooks en local :

```bash
# Installer ngrok
npm install -g ngrok

# Lancer ngrok
ngrok http 3000

# Copier l'URL HTTPS (ex: https://abc123.ngrok.io)
# Mettre à jour .env
APP_URL=https://abc123.ngrok.io
```

### Renouvellement Automatique

Les webhooks Google expirent après 24h. Un cron job les renouvelle automatiquement :

```javascript
// backend/cron/renewWebhooks.js
const cron = require("node-cron");

// Toutes les 20 heures
cron.schedule("0 */20 * * *", async () => {
  console.log("🔄 Renouvellement des webhooks...");
  // Logique de renouvellement
});
```

### Synchronisation de Secours (Polling)

Si les webhooks échouent, un polling de secours s'active :

```javascript
// Toutes les 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("🔄 Synchronisation de secours...");
  // Logique de synchronisation
});
```

---

## 🌐 Déploiement Production

### 1. Préparer l'Environnement

```bash
# Variables de production
NODE_ENV=production
APP_URL=https://eduspace.tn
GOOGLE_REDIRECT_URI=https://eduspace.tn/api/auth/google/callback
```

### 2. Configurer HTTPS

Les webhooks Google **requièrent HTTPS**. Utilisez :

- **Nginx** avec Let's Encrypt
- **Cloudflare** (proxy SSL)
- **Heroku** (SSL automatique)

### 3. Mettre à Jour Google Cloud Console

Ajoutez l'URI de production :

```
https://eduspace.tn/api/auth/google/callback
```

### 4. Démarrer le Serveur

```bash
npm start
```

### 5. Configurer PM2 (Recommandé)

```bash
npm install -g pm2
pm2 start server.js --name eduspace
pm2 save
pm2 startup
```

---

## 🔧 Dépannage

### Erreur : "redirect_uri_mismatch"

**Cause** : L'URI de redirection ne correspond pas à celle configurée dans Google Cloud Console.

**Solution** :

1. Vérifiez `.env` → `GOOGLE_REDIRECT_URI`
2. Vérifiez Google Cloud Console → Identifiants → URIs autorisés
3. Assurez-vous qu'ils sont **identiques**

### Erreur : "invalid_grant"

**Cause** : Le refresh token a expiré ou est invalide.

**Solution** :

1. Déconnectez Google Drive dans le dashboard
2. Reconnectez-vous
3. Assurez-vous que `prompt: 'consent'` est dans `getAuthUrl()`

### Webhooks ne fonctionnent pas

**Cause** : URL non HTTPS ou inaccessible.

**Solution** :

1. Vérifiez que `APP_URL` est HTTPS
2. Testez l'URL avec `curl https://votre-url/api/webhooks/google-drive`
3. Vérifiez les logs serveur

### Synchronisation lente

**Cause** : Trop de fichiers dans le dossier.

**Solution** :

1. Augmentez `pageSize` dans `listFolderFiles()`
2. Implémentez la pagination
3. Utilisez un cache Redis

---

## 🔒 Sécurité

### Bonnes Pratiques

✅ **Tokens** : Stockés chiffrés en base de données  
✅ **HTTPS** : Obligatoire en production  
✅ **JWT** : Validation sur toutes les routes API  
✅ **Rate Limiting** : Limite les requêtes par IP  
✅ **Input Validation** : Sanitisation des URLs  
✅ **CORS** : Configuré pour votre domaine uniquement

### Checklist Sécurité

- [ ] `.env` dans `.gitignore`
- [ ] JWT secret complexe (32+ caractères)
- [ ] HTTPS activé
- [ ] Rate limiting configuré
- [ ] Validation des inputs
- [ ] Logs d'erreurs sécurisés (pas de tokens)
- [ ] Backup MongoDB régulier

---

## 📊 Monitoring

### Logs Importants

```javascript
// Connexion réussie
✅ Tokens OAuth sauvegardés pour le professeur 123abc

// Synchronisation
✅ Synchronisation terminée: 5 nouveaux, 2 mis à jour

// Webhook reçu
📥 Webhook reçu: change pour channel xyz789

// Erreur
❌ Erreur lors de la synchronisation: Token expired
```

### Métriques à Surveiller

- Nombre de professeurs connectés
- Nombre d'enregistrements synchronisés
- Taux de succès des webhooks
- Temps de synchronisation moyen

---

## 🆘 Support

### Ressources

- **Documentation Google Drive API** : https://developers.google.com/drive/api/v3/about-sdk
- **OAuth 2.0 Guide** : https://developers.google.com/identity/protocols/oauth2
- **MongoDB Docs** : https://docs.mongodb.com/

### Contact

Pour toute question :

- 📧 Email : support@eduspace.tn
- 💬 Discord : EduSpace Community
- 📱 WhatsApp : +216 XX XXX XXX

---

## 📝 Changelog

### Version 1.0.0 (2026-01-05)

- ✅ Implémentation OAuth 2.0 complète
- ✅ Synchronisation automatique via webhooks
- ✅ Interface professeur et étudiant
- ✅ Renouvellement automatique des webhooks
- ✅ Polling de secours
- ✅ Documentation complète

---

**Développé avec ❤️ pour EduSpace Tunisie** 🇹🇳
