const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');

// Clé de cryptage (devrait être dans .env en prod, ici en dur pour la démo)
const ENCRYPTION_KEY = crypto.scryptSync('eduspace_secret_key_2025', 'salt', 32);
const IV_LENGTH = 16;

class JsonDB {
    constructor(dataDir) {
        this.dataDir = dataDir;
        this.lockFile = path.join(dataDir, 'db.lock');
        this.writing = false;

        // Initialiser le dossier
        fs.ensureDirSync(dataDir);
    }

    // --- CRYPTAGE ---

    encrypt(text) {
        if (!text) return text;
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    decrypt(text) {
        if (!text || !text.includes(':')) return text;
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (e) {
            console.error("Erreur décryptage:", e.message);
            return text; // Retourner brut si échec
        }
    }

    processDataBeforeSave(data, sensitiveFields = []) {
        if (!sensitiveFields.length) return data;
        // Deep copy simple
        const processed = JSON.parse(JSON.stringify(data));

        const encryptRecursive = (obj) => {
            for (let key in obj) {
                if (sensitiveFields.includes(key) && typeof obj[key] === 'string') {
                    obj[key] = this.encrypt(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    encryptRecursive(obj[key]);
                }
            }
        };

        if (Array.isArray(processed)) {
            processed.forEach(item => encryptRecursive(item));
        } else {
            encryptRecursive(processed);
        }
        return processed;
    }

    processDataAfterLoad(data, sensitiveFields = []) {
        if (!sensitiveFields.length) return data;

        const decryptRecursive = (obj) => {
            for (let key in obj) {
                if (sensitiveFields.includes(key) && typeof obj[key] === 'string') {
                    obj[key] = this.decrypt(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    decryptRecursive(obj[key]);
                }
            }
        };

        if (Array.isArray(data)) {
            data.forEach(item => decryptRecursive(item));
        } else {
            decryptRecursive(data);
        }
        return data;
    }

    // --- FILE OPERATIONS ---

    async getFilePath(collection) {
        return path.join(this.dataDir, `${collection}.json`);
    }

    async read(collection, sensitiveFields = []) {
        const filePath = await this.getFilePath(collection);
        if (!fs.existsSync(filePath)) {
            return [];
        }
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            return this.processDataAfterLoad(data, sensitiveFields);
        } catch (error) {
            console.error(`Erreur lecture ${collection}:`, error);
            return [];
        }
    }

    async write(collection, data, sensitiveFields = []) {
        // Simple Spinlock pour la concurrence basique
        while (this.writing) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        this.writing = true;

        try {
            const filePath = await this.getFilePath(collection);
            const dataToSave = this.processDataBeforeSave(data, sensitiveFields);
            await fs.writeJson(filePath, dataToSave, { spaces: 2 });
        } finally {
            this.writing = false;
        }
    }

    // --- CRUD ---

    async getAll(collection, sensitiveFields = []) {
        return await this.read(collection, sensitiveFields);
    }

    async getById(collection, id, sensitiveFields = []) {
        const items = await this.read(collection, sensitiveFields);
        return items.find(i => i.id === id);
    }

    async create(collection, item, sensitiveFields = []) {
        const items = await this.read(collection, sensitiveFields);
        const newItem = {
            id: crypto.randomUUID(),
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        items.push(newItem);
        await this.write(collection, items, sensitiveFields);
        return newItem;
    }

    async update(collection, id, updates, sensitiveFields = []) {
        const items = await this.read(collection, sensitiveFields);
        const index = items.findIndex(i => i.id === id);

        if (index === -1) throw new Error(`${collection} ${id} not found`);

        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        await this.write(collection, items, sensitiveFields);
        return items[index];
    }

    async delete(collection, id) {
        // Pour supprimer, on n'a pas besoin de décrypter, mais pour réécrire après si...
        // Le plus simple : lire décrypté, filtrer, réécrire (et re-crypter).
        // Cela évite de gérer le mix crypté/non-crypté.

        // Impossible de savoir les sensitiveFields ici sans config.
        // On va devoir utiliser deleteById qui a la config.
        throw new Error("Use deleteById instead");
    }

    // CONFIG CENTRALISÉE des champs sensibles
    getSensitiveFields(collection) {
        const map = {
            'users': ['password', 'email', 'phone'],
            'students': ['email', 'phone', 'amountPaid'],
            'enrollments': ['amountPaid'],
            'instructors': ['email', 'phone'],
            'teacherTokens': ['access_token', 'refresh_token']
        };
        return map[collection] || [];
    }

    // WRAPPERS PUBLICS
    async findAll(collection) {
        return await this.read(collection, this.getSensitiveFields(collection));
    }

    async insert(collection, data) {
        return await this.create(collection, data, this.getSensitiveFields(collection));
    }

    async updateById(collection, id, data) {
        return await this.update(collection, id, data, this.getSensitiveFields(collection));
    }

    async deleteById(collection, id) {
        const fields = this.getSensitiveFields(collection);
        const items = await this.read(collection, fields);
        const newItems = items.filter(i => i.id !== id);
        if (items.length === newItems.length) return false; // Not found
        await this.write(collection, newItems, fields);
        return true;
    }
}

module.exports = new JsonDB(path.join(__dirname, 'data'));
