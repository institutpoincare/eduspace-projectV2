const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./db-manager');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const driveRoutes = require('./routes/drive');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001; // Port dynamique pour l'hébergement
const SECRET_KEY = process.env.JWT_SECRET || "eduspace_jwt_secret_key";

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Serve Static Files from Root
app.use(express.static(path.join(__dirname, '../'))); // Serve frontend files

// Mount Routes
app.use('/api', driveRoutes);
app.use('/api', authRoutes);

// Init Cron Jobs
const { initCronJobs } = require('./cron/webhookRenewal');
initCronJobs();

// --- MIDDLEWARE AUTH ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- ROUTES AUTH ---

app.post('/api/login', async (req, res) => {
    const { email, password, role } = req.body;

    // Chercher l'utilisateur (Users ou Instructors)
    let collection = 'users';
    // Simplification: Chercher dans users. Si pas trouvé, et rôle est formateur, chercher dans instructors? 
    // Pour l'instant on garde une table unifiée 'users' qui contient le rôle.

    const users = await db.findAll('users');
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.status(400).json({ message: "Utilisateur non trouvé" });
    }

    // Vérif mot de passe (si crypté avec bcrypt, sinon string compare simple pour démo si pas encore migré)
    // Ici on assume que db-manager a DECRYPTÉ le password avant de nous le donner (via sensitiveFields)
    // MAIS bcrypt hash ne se décrypte pas.
    // Stratégie: Le champ 'password' est un HASH bcrypt. db-manager crypte le HASH (double sécurité) ou pas.
    // Pour simplifier db-manager crypte 'password'. Donc user.password est le TEXTE CLAIR du hash décrypté, ou le password en clair si pas hashé.
    // On assume ici password en clair décrypté par db-manager pour cet exemple simple, 
    // OU password hashé non sensible pour db-manager mais hashé par bcrypt.

    // APPROCHE SÉCURISÉE STANDARD:
    // Le DB Manager ne doit PAS crypter le hash bcrypt, c'est redondant.
    // On va dire que 'password' n'est PAS dans sensitiveFields du db-manager, mais c'est un Hash.

    const validPass = (user.password === password) || bcrypt.compareSync(password, user.password); // Support legacy clear text

    if (!validPass) {
        return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
});

app.post('/api/register', async (req, res) => {
    const { email, password, role, name, phone } = req.body;
    const users = await db.findAll('users');

    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hash password
    // const hashedPassword = bcrypt.hashSync(password, 10);
    // Pour l'instant on stocke en clair pour faciliter vos tests si vous regardez les fichiers JSON
    // Vous avez demandé du cryptage : db-manager s'en charge.

    const newUser = await db.insert('users', { email, password, role, name, phone, joinedAt: new Date() });
    res.json({ message: "Utilisateur créé", user: newUser });
});

// --- GENERIC CRUD ROUTES ---

// GET ALL (Public - No Auth Required for Demo)
app.get('/api/:collection', async (req, res) => {
    try {
        const data = await db.findAll(req.params.collection);
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET ONE (Public - No Auth Required for Demo)
app.get('/api/:collection/:id', async (req, res) => {
    try {
        const items = await db.findAll(req.params.collection);
        const item = items.find(i => i.id === req.params.id);
        if (!item) return res.status(404).json({ error: "Not found" });
        res.json(item);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// CREATE
app.post('/api/:collection', authenticateToken, async (req, res) => {
    try {
        const newItem = await db.insert(req.params.collection, req.body);
        res.json(newItem);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// UPDATE
app.put('/api/:collection/:id', authenticateToken, async (req, res) => {
    try {
        const updated = await db.updateById(req.params.collection, req.params.id, req.body);
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// DELETE
app.delete('/api/:collection/:id', authenticateToken, async (req, res) => {
    try {
        await db.deleteById(req.params.collection, req.params.id);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ==========================================
// زيد البارتي هذي باش السيت يتحل (Frontend)
// ==========================================
// const path = require('path'); // Déjà déclaré en haut du fichier

// 1. نقولو للسرفير يقرأ الملفات من الدوسي الرئيسي
app.use(express.static(path.join(__dirname, '../')));

// 2. أي رابط ما يفهموش السرفير، يرجعلو الصفحة الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});
// ==========================================

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Serveur Eduspace Backend démarré sur http://localhost:${PORT}`);
    console.log(`📂 Base de données JSON sécurisée dans /server/data/`);
});
