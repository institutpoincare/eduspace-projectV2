# Guide d'Hébergement (Hosting) - Eduspace 🇹🇳

Famma barcha torog bech ta3mel hébergement (hosting) lel site mte3ek. Houni a7sen 7all (Solution) illi temchi m3a Node.js w Express.

## ⚠️ Mouchkla Mohimma (Data Persistence)

Le site mte3ek tawwa yesta3mel **Fichiers JSON** bech ysa3jel (save) les données (Utilisateurs, Cours, etc.) fi dossier `server/data`.

- ❌ **Problème**: 3ala les serveurs gratuits (kima Render Free, Vercel, Heroku), ken le serveur yrodemarri (restart), **les fichiers JSON yetfas7ou w tarja3 à zéro**.
- ✅ **L7all**:
  1. **Version Gratuite (Test)**: A3mel hosting 3adi, ema a3raf illi les données yetfas7ou ki serveur yorto9d.
  2. **Version Pro (Recommandé)**: Yelzem testa3mel base de données externe kima **MongoDB Atlas** (Gratuit) walla tخلص serveur VPS.

---

## Étape 1: Préparer le Code (C'est fait ✅)

J'ai déjà modifié `package.json` et `server.js` pour qu'ils soient prêts.

- `npm start` lance maintenant le bon serveur (`server/server.js`).
- Le port est dynamique (`process.env.PORT`).

## Étape 2: Mettre sur GitHub

1. Crée un nouveau Repository sur GitHub (ex: `eduspace-v2`).
2. Upload tout ton code dessus.
   ```bash
   git add .
   git commit -m "Ready for deploy"
   git push origin main
   ```

## Étape 3: Hébergement sur Render (Gratuit & Facile)

Render est le plus simple pour Node.js.

1. Emchi l [render.com](https://render.com) w a3mel compte.
2. Anzel "New +" -> "Web Service".
3. Connecti compte GitHub mte3ek w 5tar el repo `eduspace-v2`.
4. **Configuration**:
   - **Name**: `eduspace-app` (walli t7eb)
   - **Region**: Frankfurt (a9reb l Tounes 🇹🇳)
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables** (Aazel "Advanced" -> "Environment Variables"):
   - Ajoute les variables importantes qui sont dans ton fichier `.env`:
     - `JWT_SECRET`: (Ex: `nizar_secret_key_123`)
     - `APP_URL`: L'URL que Render va te donner (ex: `https://eduspace-app.onrender.com`)
     - `GOOGLE_...` (ken 3andek Google Auth)
6. Anzel **Create Web Service**.

## Étape 4: Google Auth (Ken testa3mel fih)

Ken testa3mel Login avec Google, lazem temchi l **Google Cloud Console**:

1. Badel el **Authorized Redirect URI** lel lien jdid mta3 Render:
   - `https://nom-de-ton-app.onrender.com/api/auth/google/callback`

---

## Alternative: VPS (DigitalOcean / Hetzner) - Pour garder les données

Ken t7eb tgarder les données (JSON) blech ma yetfas7ou, a3mel serveur VPS simple (ex: 5€/mois).

1. Connecti SSH.
2. Installi Node.js.
3. `git clone ...`
4. `npm install` w `npm start`.
   Haka les fichiers JSON yo93dou labes 3lihom.
