# 🔐 Configuration Google OAuth - Guide Complet

## Vue d'ensemble

L'authentification Google OAuth permet aux utilisateurs de se connecter à EduSpace avec leur compte Google, simplifiant le processus d'inscription et de connexion.

## ✅ Fonctionnalités Implémentées

- ✅ **Connexion avec Google** pour tous les rôles:
  - Étudiant
  - Formateur
  - Parent
  - Entreprise
- ✅ **Inscription avec Google** pour Étudiants et Formateurs
- ✅ Création automatique de compte lors de la première connexion
- ✅ Gestion sécurisée des tokens JWT
- ✅ Interface utilisateur moderne sur toutes les pages de login/inscription
- ✅ Redirection automatique vers le dashboard approprié avec gestion du callback

## 📋 Prérequis

### 1. Créer un Projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ (People API)

### 2. Configurer OAuth 2.0

1. Dans la console Google Cloud, allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Sélectionnez **Web application**
4. Configurez les paramètres:

   - **Nom**: EduSpace OAuth
   - **Authorized JavaScript origins**:
     - `http://localhost:3001`
     - `https://votre-domaine.com` (pour la production)
   - **Authorized redirect URIs**:
     - `http://localhost:3001/api/auth/google/callback`
     - `https://votre-domaine.com/api/auth/google/callback` (pour la production)

5. Cliquez sur **Create**
6. Copiez le **Client ID** et le **Client Secret**

### 3. Configurer les Variables d'Environnement

Ouvrez le fichier `.env` à la racine du projet et mettez à jour:

```env
GOOGLE_CLIENT_ID=votre_client_id_ici
GOOGLE_CLIENT_SECRET=votre_client_secret_ici
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
APP_URL=http://localhost:3001
SECRET_KEY=eduspace_secret_key_2024
```

## 🏗️ Architecture

### Backend (Routes)

**Fichier**: `server/routes/auth.js`

- `GET /api/auth/google/login?role=etudiant` - Initie la connexion Google
- `GET /api/auth/google/callback` - Callback après authentification Google
- `POST /api/auth/logout` - Déconnexion

### Frontend (Scripts)

**Fichier**: `js/core/google-auth.js`

Classe `GoogleAuthManager` qui gère:

- `loginWithGoogle(role)` - Initie la connexion
- `handleCallback()` - Traite le retour de Google
- `logout()` - Déconnexion
- `isAuthenticated()` - Vérifie l'état de connexion
- `getCurrentUser()` - Récupère l'utilisateur actuel

### Pages Modifiées

- ✅ `pages/login-formateur.html` - Bouton Google ajouté
- ✅ `pages/login-etudiant.html` - Bouton Google ajouté
- ✅ `pages/formateur/dashboard.html` - Gestion du callback
- ✅ `pages/etudiant/dashboard.html` - Gestion du callback

## 🎨 Interface Utilisateur

### Bouton Google

Un bouton moderne avec le logo Google officiel a été ajouté sur toutes les pages de connexion:

```html
<button type="button" class="btn-google" id="googleSignInBtn">
  <svg class="google-logo" viewBox="0 0 24 24">
    <!-- Logo Google officiel -->
  </svg>
  Continuer avec Google
</button>
```

**Styles**: `css/google-auth.css`

## 🔄 Flux d'Authentification

### 1. Connexion

```
Utilisateur clique sur "Continuer avec Google"
    ↓
Frontend appelle /api/auth/google/login?role=etudiant
    ↓
Backend génère l'URL d'autorisation Google
    ↓
Redirection vers Google pour authentification
    ↓
Utilisateur se connecte et autorise l'application
    ↓
Google redirige vers /api/auth/google/callback
    ↓
Backend échange le code contre des tokens
    ↓
Backend récupère les infos utilisateur (email, nom, photo)
    ↓
Backend crée ou met à jour l'utilisateur dans la DB
    ↓
Backend génère un JWT token
    ↓
Redirection vers le dashboard avec le token
    ↓
Frontend stocke le token en sessionStorage
    ↓
Utilisateur connecté ✅
```

### 2. Création de Compte Automatique

Lors de la première connexion avec Google:

```javascript
{
    email: "user@gmail.com",
    name: "John Doe",
    role: "etudiant", // ou formateur, parent, entreprise
    googleId: "123456789",
    avatar: "https://lh3.googleusercontent.com/...",
    joinedAt: "2026-01-07T09:00:00.000Z",
    authMethod: "google"
}
```

## 🔒 Sécurité

### Tokens JWT

Les tokens JWT contiennent:

```javascript
{
    id: "user_id",
    role: "etudiant",
    name: "John Doe",
    email: "user@gmail.com",
    exp: 1704708000 // Expiration 24h
}
```

### Protection CSRF

Un token `state` encodé en base64 est utilisé pour prévenir les attaques CSRF:

```javascript
{
    role: "etudiant",
    timestamp: 1704621600000,
    type: "user_auth"
}
```

## 🧪 Tests

### Test en Local

1. Démarrez le serveur: `npm start` ou `.\start_server.bat`
2. Ouvrez `http://localhost:3001`
3. Cliquez sur "Connexion" pour un rôle (Étudiant, Formateur, etc.)
4. Cliquez sur "Continuer avec Google"
5. Connectez-vous avec votre compte Google
6. Vous devriez être redirigé vers le dashboard approprié

### Vérification

- ✅ Le token est stocké dans `sessionStorage.authToken`
- ✅ Les infos utilisateur sont dans `sessionStorage.currentUser`
- ✅ L'utilisateur est créé dans `data/users.json`

## 🚀 Déploiement en Production

### 1. Mettre à jour les URLs

Dans Google Cloud Console:

- Ajoutez votre domaine de production dans **Authorized JavaScript origins**
- Ajoutez `https://votre-domaine.com/api/auth/google/callback` dans **Authorized redirect URIs**

### 2. Mettre à jour `.env`

```env
GOOGLE_REDIRECT_URI=https://votre-domaine.com/api/auth/google/callback
APP_URL=https://votre-domaine.com
```

### 3. Configurer HTTPS

Assurez-vous que votre serveur utilise HTTPS en production (requis par Google OAuth).

## 📝 Ajouter Google OAuth à d'autres Pages

Pour ajouter le bouton Google à une nouvelle page de login:

### 1. Ajouter le CSS

```html
<link rel="stylesheet" href="../css/google-auth.css" />
```

### 2. Ajouter le Bouton

```html
<div class="divider">
  <span>OU</span>
</div>

<button type="button" class="btn-google" id="googleSignInBtn">
  <svg
    class="google-logo"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <!-- Logo Google -->
  </svg>
  Continuer avec Google
</button>
```

### 3. Ajouter le Script

```html
<script src="../js/core/google-auth.js"></script>
<script>
  document
    .getElementById("googleSignInBtn")
    .addEventListener("click", async function () {
      this.disabled = true;
      try {
        await window.googleAuth.loginWithGoogle("ROLE_ICI"); // etudiant, formateur, parent, entreprise
      } catch (error) {
        console.error("Erreur:", error);
        this.disabled = false;
      }
    });
</script>
```

## 🐛 Dépannage

### Erreur: "redirect_uri_mismatch"

- Vérifiez que l'URL de redirection dans `.env` correspond exactement à celle configurée dans Google Cloud Console
- Assurez-vous d'inclure le protocole (`http://` ou `https://`)

### Erreur: "invalid_client"

- Vérifiez que `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont corrects dans `.env`
- Assurez-vous que les credentials n'ont pas expiré

### L'utilisateur n'est pas redirigé après connexion

- Vérifiez que `APP_URL` est correct dans `.env`
- Vérifiez que le script `google-auth.js` est bien chargé sur la page de dashboard

### Le token n'est pas stocké

- Ouvrez la console du navigateur et vérifiez les erreurs
- Vérifiez que `handleCallback()` est appelé sur la page de dashboard

## 📚 Ressources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)
- [JWT.io](https://jwt.io/) - Pour décoder et vérifier les tokens JWT

## ✨ Améliorations Futures

- [ ] Ajouter la connexion avec Facebook, GitHub, etc.
- [ ] Implémenter le "Se souvenir de moi" avec refresh tokens
- [ ] Ajouter la vérification d'email pour les comptes non-Google
- [ ] Implémenter la récupération de mot de passe
- [ ] Ajouter l'authentification à deux facteurs (2FA)

---

**Créé le**: 2026-01-07  
**Dernière mise à jour**: 2026-01-07  
**Version**: 1.0.0
