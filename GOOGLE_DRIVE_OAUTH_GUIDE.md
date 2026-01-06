# 🚀 GUIDE COMPLET: Intégration Google Drive avec OAuth 2.0

## 📋 Vue d'ensemble

Cette solution évite les **Service Account Keys** (bloqués par votre organisation) et utilise **OAuth 2.0** pour que chaque professeur autorise l'accès à son propre Google Drive.

---

## ✅ AVANTAGES de cette solution

1. ✅ **Pas besoin de Service Account Key** → Contourne le blocage de votre organisation
2. ✅ **Sécurisé** → Chaque prof contrôle l'accès à son Drive
3. ✅ **Automatique** → Synchronisation en temps réel via webhooks
4. ✅ **Facile** → Le prof clique juste sur "Connecter Google Drive"

---

## 🛠️ ÉTAPE 1: Configuration Google Cloud Console

### 1.1 Créer un projet Google Cloud

1. Allez sur: https://console.cloud.google.com/
2. Créez un nouveau projet "EduSpace"
3. Activez l'API **Google Drive API**

### 1.2 Configurer OAuth 2.0

1. Allez dans **APIs & Services** → **Credentials**
2. Cliquez sur **Create Credentials** → **OAuth 2.0 Client ID**
3. Choisissez **Web Application**
4. Remplissez:
   ```
   Name: EduSpace OAuth Client
   
   Authorized JavaScript origins:
   - http://localhost:3000
   - https://votre-domaine.com
   
   Authorized redirect URIs:
   - http://localhost:3000/auth/google/callback
   - https://votre-domaine.com/auth/google/callback
   ```
5. Cliquez sur **Create**
6. **COPIEZ le Client ID et Client Secret** → vous en aurez besoin !

### 1.3 Configurer l'écran de consentement OAuth

1. Allez dans **OAuth consent screen**
2. Choisissez **External** (ou Internal si vous avez un workspace)
3. Remplissez les informations de base
4. Ajoutez ces **scopes**:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
5. Sauvegardez

---

## 🔧 ÉTAPE 2: Configuration Backend

### 2.1 Installer les dépendances

```bash
npm install googleapis express dotenv mongodb
```

### 2.2 Créer le fichier `.env`

```env
# Google OAuth
GOOGLE_CLIENT_ID=VOTRE_CLIENT_ID_ICI
GOOGLE_CLIENT_SECRET=VOTRE_CLIENT_SECRET_ICI
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Backend
BACKEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/eduspace
```

### 2.3 Créer le fichier `server.js`

```javascript
require('dotenv').config();
const express = require('express');
const driveRoutes = require('./backend/routes/driveRoutes');

const app = express();
app.use(express.json());

// Routes Google Drive
app.use('/api', driveRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
```

---

## 🎨 ÉTAPE 3: Interface Frontend (Professeur)

### 3.1 Page Dashboard Professeur

Créez `pages/teacher/dashboard.html`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Dashboard Professeur</title>
  <style>
    .drive-connect-btn {
      background: linear-gradient(135deg, #4285F4, #34A853);
      color: white;
      padding: 15px 30px;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .drive-connect-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(66, 133, 244, 0.3);
    }
    
    .drive-folder-setup {
      margin-top: 20px;
      padding: 20px;
      background: #f9f9f9;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Dashboard Professeur</h1>
    
    <!-- Bouton pour connecter Google Drive -->
    <button id="connectDriveBtn" class="drive-connect-btn">
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path fill="currentColor" d="M7.71,3.5L1.15,15L4.58,21L11.13,9.5M9.73,15L6.3,21H19.42L22.85,15M22.28,14L15.42,2H8.58L8.57,2L15.43,13.5"/>
      </svg>
      Connecter Google Drive
    </button>
    
    <!-- Interface de configuration du dossier -->
    <div id="driveFolderSetup" class="drive-folder-setup" style="display: none;">
      <h3>Configuration du dossier Drive</h3>
      <p>Collez l'URL de votre dossier Drive contenant les enregistrements:</p>
      <input type="text" id="driveFolderUrl" placeholder="https://drive.google.com/drive/folders/xxx">
      <button id="setupFolderBtn">Configurer</button>
    </div>
    
    <!-- Liste des classes -->
    <div id="classesList">
      <!-- Les classes seront listées ici -->
    </div>
  </div>
  
  <script src="../../js/teacher-drive.js"></script>
</body>
</html>
```

### 3.2 JavaScript Frontend

Créez `js/teacher-drive.js`:

```javascript
// Connecter Google Drive
document.getElementById('connectDriveBtn').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/auth/google-drive', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Ouvrir la fenêtre d'autorisation Google
      window.location.href = data.authUrl;
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la connexion à Google Drive');
  }
});

// Configurer le dossier Drive
document.getElementById('setupFolderBtn').addEventListener('click', async () => {
  const folderUrl = document.getElementById('driveFolderUrl').value;
  
  // Extraire l'ID du dossier depuis l'URL
  const match = folderUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
  
  if (!match) {
    alert('URL de dossier invalide');
    return;
  }
  
  const folderId = match[1];
  const classId = 'VOTRE_CLASS_ID'; // À récupérer dynamiquement
  
  try {
    const response = await fetch('/api/drive/watch-folder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ folderId, classId })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('✅ Dossier configuré avec succès ! Les nouveaux fichiers seront automatiquement ajoutés.');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la configuration du dossier');
  }
});

// Vérifier si la connexion Drive a réussi
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('drive_connected') === 'true') {
  // Afficher l'interface de configuration du dossier
  document.getElementById('driveFolderSetup').style.display = 'block';
  alert('✅ Google Drive connecté avec succès !');
}
```

---

## 👨‍🎓 ÉTAPE 4: Interface Étudiant

Créez `pages/student/class-recordings.html`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Enregistrements de cours</title>
  <style>
    .recording-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .recording-thumbnail {
      width: 120px;
      height: 90px;
      object-fit: cover;
      border-radius: 4px;
    }
    
    .recording-info {
      flex: 1;
    }
    
    .recording-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .recording-date {
      color: #666;
      font-size: 14px;
    }
    
    .view-btn {
      background: #4285F4;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Enregistrements de cours</h1>
    
    <div id="recordingsList">
      <!-- Les enregistrements seront affichés ici -->
    </div>
  </div>
  
  <script>
    async function loadRecordings() {
      const classId = 'VOTRE_CLASS_ID'; // À récupérer dynamiquement
      
      const response = await fetch(`/api/class/${classId}/recordings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        const container = document.getElementById('recordingsList');
        
        data.recordings.forEach(recording => {
          const card = document.createElement('div');
          card.className = 'recording-card';
          card.innerHTML = `
            ${recording.thumbnail ? 
              `<img src="${recording.thumbnail}" class="recording-thumbnail">` :
              '<div class="recording-thumbnail" style="background: #ddd;"></div>'
            }
            <div class="recording-info">
              <div class="recording-title">${recording.title}</div>
              <div class="recording-date">
                Ajouté le ${new Date(recording.addedAt).toLocaleDateString('fr-FR')}
              </div>
            </div>
            <button class="view-btn" onclick="window.open('${recording.url}', '_blank')">
              Voir
            </button>
          `;
          container.appendChild(card);
        });
      }
    }
    
    loadRecordings();
  </script>
</body>
</html>
```

---

## 🔄 ÉTAPE 5: Comment ça marche (Flow complet)

### Scénario: Le prof enregistre sur OBS et upload sur Drive

1. **Professeur connecte son Drive** (une seule fois)
   - Clique sur "Connecter Google Drive"
   - Autorise l'application
   - Colle l'URL de son dossier Drive

2. **Configuration automatique**
   - Le système surveille ce dossier
   - Webhook configuré pour recevoir les notifications

3. **Prof enregistre avec OBS**
   - Enregistrement terminé
   - Upload du fichier vers le dossier Drive configuré

4. **Synchronisation automatique**
   - Google envoie une notification webhook
   - Le système détecte le nouveau fichier
   - Ajoute automatiquement à la liste des enregistrements

5. **Étudiants voient le cours**
   - Accèdent à leur interface
   - Voient le nouveau cours automatiquement
   - Cliquent pour regarder sur Google Drive

---

## 🚀 ÉTAPE 6: Lancer l'application

```bash
# Installer les dépendances
npm install

# Démarrer le serveur
node server.js
```

---

## 📝 Notes importantes

### Webhooks en développement local

Pour tester les webhooks en local, vous devez exposer votre serveur:

```bash
# Avec ngrok (gratuit)
npx ngrok http 3000
```

Puis mettez à jour votre `.env`:
```env
BACKEND_URL=https://VOTRE-URL-NGROK.ngrok.io
```

### Renouvellement des webhooks

Les webhooks Google Drive expirent après 24h. Ajoutez un cron job pour les renouveler:

```javascript
// À ajouter dans server.js
const cron = require('node-cron');

// Renouveler tous les webhooks chaque jour
cron.schedule('0 0 * * *', async () => {
  const classes = await db.collection('classes').find({ driveFolderId: { $exists: true } }).toArray();
  
  for (const classData of classes) {
    await driveService.watchFolder(
      classData.driveFolderId,
      classData.instructorId,
      classData._id
    );
  }
});
```

---

## ❓ Questions fréquentes

**Q: Le prof doit-il reconnecter son Drive à chaque fois ?**
Non, les tokens sont sauvegardés. Il ne connecte qu'une seule fois.

**Q: Que se passe-t-il si le token expire ?**
Le refresh token permet de renouveler automatiquement l'accès.

**Q: Les étudiants doivent-ils avoir un compte Google ?**
Non, ils voient juste le lien vers le fichier sur Drive (si public).

**Q: Peut-on télécharger les fichiers ?**
Oui, vous pouvez ajouter une fonction de téléchargement dans le service.

---

## ✅ Checklist finale

- [ ] Projet Google Cloud créé
- [ ] OAuth 2.0 Client configuré
- [ ] `.env` avec les credentials
- [ ] Backend démarré
- [ ] Interface professeur fonctionnelle
- [ ] Webhook testé
- [ ] Interface étudiant affiche les enregistrements

---

**Besoin d'aide ?** N'hésitez pas à demander ! 🚀
