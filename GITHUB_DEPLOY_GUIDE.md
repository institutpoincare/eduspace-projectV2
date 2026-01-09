# Guide de Déploiement via GitHub

Ce guide vous explique comment mettre votre projet EduSpace sur GitHub et le lancer sur un autre PC.

## 1. Préparation sur le PC Actuel (Source)

Avant de partager le code, assurez-vous que tout est prêt.

### Étape 1 : Vérifier les fichiers ignorés

Le fichier `.gitignore` a été mis à jour pour ignorer les fichiers secrets (`.env`, `credentials.json`, etc.). C'est important pour la sécurité.

### Étape 2 : Créer le Repository GitHub (si ce n'est pas déjà fait)

1. Allez sur [GitHub.com](https://github.com) et créez un nouveau repository (ex: `eduspace-v2`).
2. Ne cochez **PAS** "Initialize with README" ou .gitignore (vous les avez déjà).

### Étape 3 : Envoyer le code

Ouvrez votre terminal dans le dossier du projet (`d:\files\Eduspace\eduspace-vanilla`) et lancez ces commandes :

```bash
# Initialiser git si ce n'est pas fait
git init

# Ajouter les fichiers
git add .

# Créer le commit
git commit -m "Mise à jour complète pour migration"

# Lier au repository distant (remplacez URL_DU_REPO par le lien de votre repo GitHub)
git remote add origin https://github.com/VOTRE_NOM/eduspace-v2.git
# Si 'origin' existe déjà, utilisez : git remote set-url origin https://github.com/VOTRE_NOM/eduspace-v2.git

# Mettre la bonne branche
git branch -M main

# Envoyer vers GitHub
git push -u origin main
```

---

## 2. Installation sur le Nouveau PC (Destination)

### Prérequis

- **Node.js** doit être installé. Téléchargez la version LTS ici : [nodejs.org](https://nodejs.org/).
- **Git** doit être installé : [git-scm.com](https://git-scm.com/).

### Étape 1 : Cloner le projet

Ouvrez un terminal (PowerShell ou CMD) là où vous voulez installer le projet :

```bash
git clone https://github.com/VOTRE_NOM/eduspace-v2.git
cd eduspace-v2
```

### Étape 2 : Configurer les secrets

Les fichiers secrets comme `.env` ne sont pas sur GitHub pour des raisons de sécurité. Vous devez les recréer manuellement.

1. Créez un fichier `.env` dans le dossier racine (ou copiez celui de l'ancien PC via clé USB/mail).
2. Vérifiez si vous avez des fichiers de clés Google (ex: `credentials.json`, `token.json`) dans `server/` ou à la racine. Copiez-les également manuellement si nécessaire.

### Étape 3 : Lancer le projet

Sur Windows, c'est très simple grâce au script inclus.

1. Double-cliquez sur le fichier **`start_server.bat`**.
2. Le script va automatiquement :
   - Installer les dépendances manquantes (dans le dossier `server`).
   - Lancer le serveur.

**Note pour Linux/Mac :**
Si le nouveau PC n'est pas sous Windows, lancez ces commandes manuellement :

```bash
cd server
npm install
node server.js
```
