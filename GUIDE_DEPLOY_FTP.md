# Guide d'installation sur Hébergement Partagé (cPanel / FTP)

Puisque tu as des accès FTP (Hôte: 196.203.251.39), cela ressemble à un hébergement tunisien classique (ex: Ooredoo, Topnet, ou revendeur local).

## ⚠️ Important : Node.js est-il disponible ?

Pour que ton site fonctionne (Login, Inscription, Sauvegarde), ton hébergeur **DOIT supporter Node.js**.
Si ton hébergement supporte seulement PHP/HTML, le "Backend" (server.js) ne marchera pas directement.

### Comment vérifier ?

1. Connecte-toi à ton **cPanel** (souvent `http://196.203.251.39:2083` ou `cpanel.ton-domaine.com`).
2. Cherche une icône **"Setup Node.js App"** ou **"Node.js"**.
3. ❌ Si tu ne trouves pas ça : Tu ne peux pas héberger ce site complet sur cet offre. Il faudra demander à ton hébergeur d'activer Node.js ou prendre un VPS.

---

## Si tu as "Setup Node.js App" (La méthode correcte)

1. **Préparer les fichiers pour l'upload** :

   - Sélectionne TOUS les fichiers de ton dossier projet.
   - ⚠️ **NE PAS** uploader le dossier `node_modules` (il est trop lourd, on l'installera là-bas).
   - Fais un fichier **ZIP** de tout le reste (dossiers `server`, `js`, `css`, `pages`, fichiers `package.json`, `server.js`).

2. **Upload via FTP** :

   - Utilise FileZilla avec tes accès :
     - Hôte : `196.203.251.39`
     - User : `care631296`
     - Pass : (Ton mot de passe)
   - Crée un dossier à la racine (ex: `eduspace`).
   - Mets ton ZIP dedans et décompresse-le (via le Gestionnaire de Fichiers du cPanel).

3. **Configuration Node.js (Sur cPanel)** :

   - Va dans **"Setup Node.js App"**.
   - Clique sur **"Create Application"**.
   - **Node.js Version** : Choisis 16, 18 ou 20.
   - **Application Mode** : `Production`.
   - **Application Root** : Mets le nom du dossier (ex: `eduspace`).
   - **Application URL** : Choisis ton domaine (ex: `mon-site.tn`).
   - **Application Startup File** : `server.js` (C'est bon, j'ai créé un fichier à la racine qui pointe vers le bon endroit).
   - Clique sur **CREATE**.

4. **Installer les dépendances** :

   - Une fois l'app créée, clique sur le bouton **"Run NPM Install"** s'il existe.
   - Sinon, il faut copier la "Command to enter to virtual environment" (en haut de page), la coller dans le Terminal du cPanel, et taper `npm install`.

5. **Redémarrer** :
   - Clique sur **"Restart"**.

---

## Si tu n'as PAS Node.js (Mode "Dégradé")

Si ton hébergement ne supporte pas Node.js, tu peux seulement mettre les fichiers HTML/CSS/JS.

- Le site s'affichera.
- ❌ MAIS : Le Login, l'Inscription et la liste des cours ne marcheront pas (car ils ont besoin du serveur).

**Solution recommandée** : Demande à ton hébergeur si tu peux utiliser Node.js, ou passe sur **Render.com** (voir le guide précédent).
