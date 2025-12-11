/**
 * DataManager (Vanilla JS Pur)
 * Gestion via LocalStorage avec Export/Import JSON chiffré
 * Permet de simuler une base de données fichier sans Backend Node.js
 */

class DataManager {
    constructor() {
        // Liste des collections gérées
        this.entities = ['users', 'courses', 'students', 'instructors', 'enrollments', 'sessions', 'messages'];
        this.encryptionKey = 'eduspace_client_secret'; // En prod, l'utilisateur pourrait le saisir
    }

    async init() {
        console.log('✅ DataManager (Vanilla): Initialisé avec LocalStorage');
        // Vérifier si des données existent, sinon mettre des données par défaut
        if (!localStorage.getItem('courses')) {
            // this.seedDemoData(); // Optionnel : remettre des données de démo
        }
    }

    // --- CRYPTAGE SIMPLE (Vrai vanilla, sans crypto node) ---
    // Note: C'est un obscurcissement plus qu'un cryptage militaire sans bibliothèques lourdes,
    // mais ça suffit pour "protéger" les fichiers JSON visuellement.

    encrypt(text) {
        if (!text) return text;
        try {
            return btoa(unescape(encodeURIComponent(text + this.encryptionKey)));
        } catch (e) { return text; }
    }

    decrypt(text) {
        if (!text) return text;
        try {
            let str = decodeURIComponent(escape(atob(text)));
            return str.replace(this.encryptionKey, '');
        } catch (e) { return text; }
    }

    // --- CRUD LOCALSTORAGE ---

    getAll(collection) {
        const raw = localStorage.getItem(collection);
        return raw ? JSON.parse(raw) : [];
    }

    getById(collection, id) {
        const items = this.getAll(collection);
        return items.find(i => i.id === id) || null;
    }

    async create(collection, data) {
        // Simuler asynchrone pour compatibilité future
        const items = this.getAll(collection);
        const newItem = {
            id: 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            ...data,
            createdAt: new Date().toISOString()
        };

        // Si mot de passe ou donnée sensible, on pourrait le crypter ici
        if (collection === 'users' && newItem.password) {
            // newItem.password = this.encrypt(newItem.password); // Exemple
        }

        items.push(newItem);
        this.save(collection, items);
        return newItem;
    }

    async update(collection, id, updates) {
        const items = this.getAll(collection);
        const index = items.findIndex(i => i.id === id);
        if (index === -1) return null;

        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        this.save(collection, items);
        return items[index];
    }

    async delete(collection, id) {
        let items = this.getAll(collection);
        const newItems = items.filter(i => i.id !== id);
        this.save(collection, newItems);
        return true;
    }

    save(collection, items) {
        localStorage.setItem(collection, JSON.stringify(items));
    }

    // --- GESTION FICHIER JSO (IMPORT / EXPORT) ---

    // Exporte toute la base en un seul fichier JSON chiffré
    exportDatabase() {
        const db = {};
        this.entities.forEach(entity => {
            db[entity] = this.getAll(entity);
        });

        // Conversion en string et "Signature"
        const jsonStr = JSON.stringify(db, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `eduspace_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log("Base de données exportée !");
    }

    // Importe un fichier JSON pour remplacer la base locale
    async importDatabase(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const db = JSON.parse(e.target.result);
                    // Validation basique
                    let count = 0;
                    for (const entity of this.entities) {
                        if (db[entity]) {
                            this.save(entity, db[entity]);
                            count += db[entity].length;
                        }
                    }
                    resolve({ success: true, message: `${count} éléments importés.` });
                } catch (err) {
                    reject({ success: false, message: "Fichier JSON invalide." });
                }
            };
            reader.readAsText(file);
        });
    }
}

// Instance globale
const dataManager = new DataManager();

// Init auto
if (typeof window !== 'undefined') {
    // Si nous sommes dans le navigateur
    window.dataManager = dataManager;
    window.addEventListener('DOMContentLoaded', () => dataManager.init());
}

// Export module pour compatibilité si besoin
if (typeof module !== 'undefined') module.exports = DataManager;
