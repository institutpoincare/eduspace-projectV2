const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// CONFIGURATION
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const SENSITIVE_FIELDS = ['password', 'email', 'phone', 'amountPaid']; // Champs à crypter

// Clé de cryptage (pour la démo)
const ENCRYPTION_KEY = crypto.scryptSync('eduspace_secret', 'salt', 32);
const IV_LENGTH = 16;

// Initialiser le dossier de données
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- UTILITAIRES DE CRYPTAGE (Vanilla Node Crypto) ---

function encrypt(text) {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(String(text));
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) { return text; }
}

function processData(data, encryptMode = true) {
    // Copie profonde simple
    const processed = JSON.parse(JSON.stringify(data));
    const processRecursive = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                processRecursive(obj[key]);
            } else if (SENSITIVE_FIELDS.includes(key)) {
                obj[key] = encryptMode ? encrypt(obj[key]) : decrypt(obj[key]);
            }
        }
    };

    if (Array.isArray(processed)) processed.forEach(processRecursive);
    else processRecursive(processed);

    return processed;
}

// --- FONCTIONS BASE DE DONNÉES FICHIER ---

function readJSON(collection) {
    const filePath = path.join(DATA_DIR, collection + '.json');
    if (!fs.existsSync(filePath)) return [];
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);
        return processData(data, false); // Décrypter à la lecture
    } catch (e) { return []; }
}

function writeJSON(collection, data) {
    const filePath = path.join(DATA_DIR, collection + '.json');
    const secureData = processData(data, true); // Crypter à l'écriture
    fs.writeFileSync(filePath, JSON.stringify(secureData, null, 2));
}

// --- SERVEUR HTTP (Sans Framework) ---

const server = http.createServer((req, res) => {
    // 1. Gérer CORS (pour que le frontend puisse parler au serveur)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 2. Parser l'URL
    // Format attendu: /api/collection/id
    const urlParts = req.url.split('/').filter(p => p.length > 0);
    // urlParts = ['api', 'users', '123']

    if (urlParts[0] !== 'api') {
        res.writeHead(404);
        res.end("Not Found");
        return;
    }

    const collection = urlParts[1];
    const id = urlParts[2];

    // 3. Lire le Body de la requête
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        let payload = null;
        try { if (body) payload = JSON.parse(body); } catch (e) { }

        // --- ROUTING API REST ---

        try {
            // GET /api/collection
            if (req.method === 'GET' && !id) {
                const data = readJSON(collection);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
                return;
            }

            // GET /api/collection/id
            if (req.method === 'GET' && id) {
                const data = readJSON(collection);
                const item = data.find(i => i.id === id);
                if (item) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(item));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: "Not found" }));
                }
                return;
            }

            // POST /api/collection (Create)
            if (req.method === 'POST') {
                const data = readJSON(collection);

                // Login Special Case
                if (collection === 'login') {
                    // Chercher dans Users
                    const users = readJSON('users');
                    const user = users.find(u => u.email === payload.email && u.password === payload.password);
                    if (user) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ token: "fake-jwt-" + user.id, user }));
                    } else {
                        res.writeHead(401);
                        res.end(JSON.stringify({ error: "Login failed" }));
                    }
                    return;
                }

                const newItem = {
                    id: crypto.randomUUID(),
                    ...payload,
                    createdAt: new Date().toISOString()
                };
                data.push(newItem);
                writeJSON(collection, data);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newItem));
                return;
            }

            // PUT /api/collection/id (Update)
            if (req.method === 'PUT' && id) {
                const data = readJSON(collection);
                const index = data.findIndex(i => i.id === id);
                if (index !== -1) {
                    data[index] = { ...data[index], ...payload, updatedAt: new Date().toISOString() };
                    writeJSON(collection, data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data[index]));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: "Not found" }));
                }
                return;
            }

            // DELETE /api/collection/id
            if (req.method === 'DELETE' && id) {
                let data = readJSON(collection);
                const initialLen = data.length;
                data = data.filter(i => i.id !== id);
                if (data.length !== initialLen) {
                    writeJSON(collection, data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: "Not found" }));
                }
                return;
            }

        } catch (err) {
            console.error(err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        }
    });
});

server.listen(PORT, () => {
    console.log(`
    🚀 SERVEUR VANILLA JS DÉMARRÉ
    ----------------------------
    📡 Port: ${PORT}
    📁 Base de données: ${DATA_DIR}
    🔒 Cryptage: ACTIF
    
    ✅ Prêt à recevoir les requêtes du DataManager.
    `);
});
