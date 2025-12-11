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

// --- MIME TYPES ---
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
};

// --- SERVEUR HTTP (Frontend + Backend) ---

const server = http.createServer((req, res) => {
    // 1. Gérer CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // 2. API ROUTING (Backend)
    if (req.url.startsWith('/api/')) {
        handleApiRequest(req, res);
        return;
    }

    // 3. STATIC FILE SERVING (Frontend)
    // Retirer les paramètres d'URL (ex: ?role=admin) pour trouver le fichier
    const urlPath = req.url.split('?')[0];
    let filePath = '.' + urlPath;
    if (filePath === './') filePath = './index.html';

    // Prevent directory traversal
    const safePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
    const absolutePath = path.join(__dirname, safePath);

    const extname = path.extname(absolutePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(absolutePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Page not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`<h1>404 Not Found</h1><p>Le fichier ${req.url} n'existe pas.</p>`, 'utf-8');
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// --- API HANDLER (Exctracted for clarity) ---
function handleApiRequest(req, res) {
    const urlParts = req.url.split('/').filter(p => p.length > 0);
    // urlParts = ['api', 'collection', 'id']
    const collection = urlParts[1];
    const id = urlParts[2];

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
        let payload = null;
        try { if (body) payload = JSON.parse(body); } catch (e) { }

        try {
            // GET 
            if (req.method === 'GET' && !id) {
                const data = readJSON(collection);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(data));
                return;
            }
            if (req.method === 'GET' && id) {
                const data = readJSON(collection);
                const item = data.find(i => i.id === id);
                if (item) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(item));
                } else { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: "Not found" })); }
                return;
            }
            // POST
            if (req.method === 'POST') {
                const data = readJSON(collection);
                if (collection === 'login') {
                    const users = readJSON('users');
                    const user = users.find(u => u.email === payload.email && u.password === payload.password);
                    if (user) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ token: "fake-jwt-" + user.id, user }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Login failed" }));
                    }
                    return;
                }
                const newItem = { id: crypto.randomUUID(), ...payload, createdAt: new Date().toISOString() };
                data.push(newItem);
                writeJSON(collection, data);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newItem));
                return;
            }
            // PUT
            if (req.method === 'PUT' && id) {
                const data = readJSON(collection);
                const index = data.findIndex(i => i.id === id);
                if (index !== -1) {
                    data[index] = { ...data[index], ...payload, updatedAt: new Date().toISOString() };
                    writeJSON(collection, data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(data[index]));
                } else { res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); }
                return;
            }
            // DELETE
            if (req.method === 'DELETE' && id) {
                let data = readJSON(collection);
                const initialLen = data.length;
                data = data.filter(i => i.id !== id);
                if (data.length !== initialLen) {
                    writeJSON(collection, data);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                } else { res.writeHead(404); res.end(JSON.stringify({ error: "Not found" })); }
                return;
            }

            res.writeHead(404);
            res.end(JSON.stringify({ error: "API Endpoint not found" }));

        } catch (err) {
            console.error(err);
            res.writeHead(500);
            res.end(JSON.stringify({ error: err.message }));
        }
    });
}

server.listen(PORT, () => {
    console.log(`
    🚀 EDUSPACE COMPLET (Vanilla JS)
    --------------------------------
    🌍 Site Web: http://localhost:${PORT}
    📡 API Base: http://localhost:${PORT}/api/
    📁 Données : ${DATA_DIR}
    `);
});
