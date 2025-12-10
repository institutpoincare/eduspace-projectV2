/**
 * DataManager - Gestionnaire CRUD pour base de données JSON
 * Utilise LocalStorage pour la persistance côté client
 */

class DataManager {
    constructor() {
        this.entities = ['instructors', 'centers', 'courses', 'users', 'sessions', 'enrollments', 'messages'];
        this.initialized = false;
    }

    /**
     * Initialiser la base de données
     * Charge les données JSON dans LocalStorage si pas déjà fait
     */
    async init() {
        if (this.initialized) return;

        for (const entity of this.entities) {
            // Vérifier si les données existent déjà dans LocalStorage
            const existingData = localStorage.getItem(entity);

            if (!existingData) {
                // Charger depuis le fichier JSON
                try {
                    const response = await fetch(`/data/${entity}.json`);
                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem(entity, JSON.stringify(data));
                        console.log(`✅ ${entity} chargé depuis JSON`);
                    }
                } catch (error) {
                    console.warn(`⚠️ Impossible de charger ${entity}.json, initialisation vide`);
                    localStorage.setItem(entity, JSON.stringify({ [entity]: [] }));
                }
            }
        }

        this.initialized = true;
        console.log('✅ DataManager initialisé');
    }

    /**
     * READ - Récupérer toutes les entités
     * @param {string} entity - Nom de l'entité (instructors, centers, etc.)
     * @returns {Array} Liste des entités
     */
    async getAll(entity) {
        await this.init();
        const data = JSON.parse(localStorage.getItem(entity) || '{}');
        return data[entity] || [];
    }

    /**
     * READ - Récupérer une entité par ID
     * @param {string} entity - Nom de l'entité
     * @param {string} id - ID de l'entité
     * @returns {Object|null} L'entité ou null
     */
    async getById(entity, id) {
        const items = await this.getAll(entity);
        return items.find(item => item.id === id) || null;
    }

    /**
     * CREATE - Créer une nouvelle entité
     * @param {string} entity - Nom de l'entité
     * @param {Object} data - Données de la nouvelle entité
     * @returns {Object} L'entité créée
     */
    async create(entity, data) {
        await this.init();
        const items = await this.getAll(entity);

        // Générer un ID unique si pas fourni
        const newItem = {
            id: data.id || this.generateId(),
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        items.push(newItem);
        await this.save(entity, items);

        console.log(`✅ ${entity} créé:`, newItem.id);
        return newItem;
    }

    /**
     * UPDATE - Mettre à jour une entité
     * @param {string} entity - Nom de l'entité
     * @param {string} id - ID de l'entité
     * @param {Object} updates - Données à mettre à jour
     * @returns {Object|null} L'entité mise à jour ou null
     */
    async update(entity, id, updates) {
        await this.init();
        const items = await this.getAll(entity);
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            console.error(`❌ ${entity} avec id ${id} non trouvé`);
            return null;
        }

        items[index] = {
            ...items[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        await this.save(entity, items);
        console.log(`✅ ${entity} mis à jour:`, id);
        return items[index];
    }

    /**
     * DELETE - Supprimer une entité
     * @param {string} entity - Nom de l'entité
     * @param {string} id - ID de l'entité
     * @returns {boolean} true si supprimé, false sinon
     */
    async delete(entity, id) {
        await this.init();
        const items = await this.getAll(entity);
        const filteredItems = items.filter(item => item.id !== id);

        if (filteredItems.length === items.length) {
            console.error(`❌ ${entity} avec id ${id} non trouvé`);
            return false;
        }

        await this.save(entity, filteredItems);
        console.log(`✅ ${entity} supprimé:`, id);
        return true;
    }

    /**
     * SEARCH - Rechercher des entités
     * @param {string} entity - Nom de l'entité
     * @param {string} query - Terme de recherche
     * @param {Array} fields - Champs dans lesquels chercher
     * @returns {Array} Résultats de la recherche
     */
    async search(entity, query, fields = ['name', 'specialty', 'description']) {
        const items = await this.getAll(entity);
        const lowerQuery = query.toLowerCase();

        return items.filter(item => {
            return fields.some(field => {
                const value = item[field];
                return value && value.toString().toLowerCase().includes(lowerQuery);
            });
        });
    }

    /**
     * FILTER - Filtrer des entités selon des critères
     * @param {string} entity - Nom de l'entité
     * @param {Object} criteria - Critères de filtrage
     * @returns {Array} Résultats filtrés
     */
    async filter(entity, criteria) {
        const items = await this.getAll(entity);

        return items.filter(item => {
            return Object.entries(criteria).every(([key, value]) => {
                if (value === '' || value === null || value === undefined) return true;
                return item[key] === value;
            });
        });
    }

    /**
     * SORT - Trier des entités
     * @param {string} entity - Nom de l'entité
     * @param {string} field - Champ de tri
     * @param {string} order - 'asc' ou 'desc'
     * @returns {Array} Résultats triés
     */
    async sort(entity, field, order = 'asc') {
        const items = await this.getAll(entity);

        return items.sort((a, b) => {
            const aVal = a[field];
            const bVal = b[field];

            if (aVal < bVal) return order === 'asc' ? -1 : 1;
            if (aVal > bVal) return order === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Sauvegarder les données dans LocalStorage
     * @private
     */
    async save(entity, items) {
        const data = { [entity]: items };
        localStorage.setItem(entity, JSON.stringify(data));
    }

    /**
     * Générer un ID unique
     * @private
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Réinitialiser toutes les données (DANGER!)
     */
    async reset() {
        if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser toutes les données ?')) {
            this.entities.forEach(entity => {
                localStorage.removeItem(entity);
            });
            this.initialized = false;
            await this.init();
            console.log('✅ Données réinitialisées');
            return true;
        }
        return false;
    }

    /**
     * Exporter toutes les données en JSON
     */
    async export() {
        const exportData = {};
        for (const entity of this.entities) {
            exportData[entity] = await this.getAll(entity);
        }
        return exportData;
    }

    /**
     * Importer des données depuis JSON
     */
    async import(data) {
        for (const [entity, items] of Object.entries(data)) {
            if (this.entities.includes(entity)) {
                await this.save(entity, items);
            }
        }
        console.log('✅ Données importées');
    }
}

// Instance globale
const dataManager = new DataManager();

// Initialiser au chargement de la page
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        dataManager.init();
    });
}

// Export pour utilisation dans d'autres fichiers
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}
