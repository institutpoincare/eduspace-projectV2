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

        console.log('🔄 DataManager: Initialisation...');

        for (const entity of this.entities) {
            // Vérifier si les données existent déjà dans LocalStorage
            let data = localStorage.getItem(entity);

            if (!data || data === 'undefined' || data === '{}') {
                console.log(`📥 Tentative de chargement de ${entity}...`);

                // Essayer plusieurs chemins possibles pour trouver le fichier JSON
                const paths = [
                    `./data/${entity}.json`,       // Relatif standard
                    `../../data/${entity}.json`,   // Si appelé depuis une sous-page
                    `data/${entity}.json`          // Relatif simple
                ];

                let loaded = false;

                for (const path of paths) {
                    try {
                        const response = await fetch(path);
                        if (response.ok) {
                            const jsonData = await response.json();
                            // Vérifier que le format est correct (objet avec clé du nom de l'entité ou tableau direct)
                            const items = jsonData[entity] || jsonData || [];
                            localStorage.setItem(entity, JSON.stringify({ [entity]: items }));
                            console.log(`✅ ${entity} chargé depuis ${path}`);
                            loaded = true;
                            break;
                        }
                    } catch (e) {
                        // Continuer au prochain chemin
                    }
                }

                if (!loaded) {
                    console.warn(`⚠️ Impossible de charger ${entity}.json. Utilisation de données vides/mock temporaires.`);
                    // Injection de données de secours si échec total (pour éviter le chargement infini)
                    const mockData = this.getFallbackData(entity);
                    localStorage.setItem(entity, JSON.stringify({ [entity]: mockData }));
                }
            }
        }

        this.initialized = true;
        console.log('✅ DataManager initialisé avec succès');
    }

    // Données de secours pour éviter l'écran blanc/chargement infini
    getFallbackData(entity) {
        if (entity === 'instructors') {
            return [
                { id: 'ahmed', name: 'Ahmed Ben Ali', specialty: 'Expert DevOps', rating: 4.9, students: '15k+', image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
                { id: 'sarah', name: 'Sarah M.', specialty: 'UX/UI Design', rating: 5.0, students: '8k+', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
                { id: 'karim', name: 'Karim S.', specialty: 'Dév Mobile iOS', rating: 4.7, students: '5k+', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' },
                { id: 'leila', name: 'Leila K.', specialty: 'Marketing Digital', rating: 4.8, students: '12k+', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }
            ];
        }
        if (entity === 'centers') {
            return [
                { id: 'c1', name: 'GoMyCode', category: 'Coding Bootcamp', location: 'Tunis', description: 'Le premier bootcamp de code en Tunisie.' },
                { id: 'c2', name: 'GMC', category: 'Formation Pro', location: 'Sousse', description: 'Centre de formation accélérée.' }
            ];
        }
        return [];
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
