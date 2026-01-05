// API pour gérer les catégories personnalisées
// Ce fichier gère le stockage et la récupération des catégories créées par les formateurs

const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Chemin vers le fichier de stockage des catégories personnalisées
const CATEGORIES_FILE = path.join(__dirname, '../data/custom-categories.json');

/**
 * Initialise le fichier de catégories s'il n'existe pas
 */
async function initializeCategoriesFile() {
    try {
        await fs.access(CATEGORIES_FILE);
    } catch (error) {
        // Le fichier n'existe pas, le créer
        const initialData = {
            categories: [],
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(initialData, null, 2));
    }
}

/**
 * Lit les catégories personnalisées
 */
async function readCategories() {
    await initializeCategoriesFile();
    const data = await fs.readFile(CATEGORIES_FILE, 'utf8');
    return JSON.parse(data);
}

/**
 * Écrit les catégories personnalisées
 */
async function writeCategories(data) {
    data.lastUpdated = new Date().toISOString();
    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(data, null, 2));
}

/**
 * GET /api/custom-categories
 * Récupère toutes les catégories personnalisées
 */
router.get('/custom-categories', async (req, res) => {
    try {
        const data = await readCategories();
        res.json(data);
    } catch (error) {
        console.error('Erreur lors de la lecture des catégories:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des catégories',
            categories: [] 
        });
    }
});

/**
 * POST /api/custom-categories
 * Ajoute une nouvelle catégorie personnalisée
 */
router.post('/custom-categories', async (req, res) => {
    try {
        const { value, label, createdAt } = req.body;
        
        // Validation
        if (!value || !label) {
            return res.status(400).json({ 
                error: 'Les champs value et label sont requis' 
            });
        }
        
        const data = await readCategories();
        
        // Vérifier si la catégorie existe déjà
        const exists = data.categories.find(cat => cat.value === value);
        if (exists) {
            return res.status(409).json({ 
                error: 'Cette catégorie existe déjà' 
            });
        }
        
        // Ajouter la nouvelle catégorie
        const newCategory = {
            value,
            label,
            createdAt: createdAt || new Date().toISOString(),
            usageCount: 0 // Pour suivre l'utilisation
        };
        
        data.categories.push(newCategory);
        await writeCategories(data);
        
        res.status(201).json({
            success: true,
            category: newCategory
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la catégorie:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'ajout de la catégorie' 
        });
    }
});

/**
 * PUT /api/custom-categories/:value/increment
 * Incrémente le compteur d'utilisation d'une catégorie
 */
router.put('/custom-categories/:value/increment', async (req, res) => {
    try {
        const { value } = req.params;
        const data = await readCategories();
        
        const category = data.categories.find(cat => cat.value === value);
        if (!category) {
            return res.status(404).json({ 
                error: 'Catégorie non trouvée' 
            });
        }
        
        category.usageCount = (category.usageCount || 0) + 1;
        category.lastUsed = new Date().toISOString();
        
        await writeCategories(data);
        
        res.json({
            success: true,
            category
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour' 
        });
    }
});

/**
 * DELETE /api/custom-categories/:value
 * Supprime une catégorie personnalisée (admin uniquement)
 */
router.delete('/custom-categories/:value', async (req, res) => {
    try {
        const { value } = req.params;
        const data = await readCategories();
        
        const initialLength = data.categories.length;
        data.categories = data.categories.filter(cat => cat.value !== value);
        
        if (data.categories.length === initialLength) {
            return res.status(404).json({ 
                error: 'Catégorie non trouvée' 
            });
        }
        
        await writeCategories(data);
        
        res.json({
            success: true,
            message: 'Catégorie supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression' 
        });
    }
});

/**
 * GET /api/custom-categories/stats
 * Récupère les statistiques d'utilisation des catégories
 */
router.get('/custom-categories/stats', async (req, res) => {
    try {
        const data = await readCategories();
        
        const stats = {
            totalCategories: data.categories.length,
            mostUsed: data.categories
                .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
                .slice(0, 10),
            recentlyAdded: data.categories
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 10),
            lastUpdated: data.lastUpdated
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des stats:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la récupération des statistiques' 
        });
    }
});

module.exports = router;
