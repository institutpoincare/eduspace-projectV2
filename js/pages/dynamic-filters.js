// Système de filtres dynamiques et proportionnels pour les formateurs
// Ce système permet un filtrage intelligent basé sur la catégorie sélectionnée

const filterData = {
    // Catégories de base (peuvent être étendues dynamiquement)
    categories: [
        { value: 'langue', label: 'Langue' },
        { value: 'suivi-scolaire', label: 'Suivi Scolaire' },
        { value: 'sciences', label: 'Sciences' },
        { value: 'informatique', label: 'Informatique' },
        { value: 'arts', label: 'Arts' },
        { value: 'business', label: 'Business' },
        { value: 'autre-categorie', label: '➕ Nouvelle catégorie...', custom: true }
    ],
    
    // Matières par catégorie
    subjects: {
        'langue': [
            { value: 'francais', label: 'Français' },
            { value: 'anglais', label: 'Anglais' },
            { value: 'arabe', label: 'Arabe' },
            { value: 'allemand', label: 'Allemand' },
            { value: 'espagnol', label: 'Espagnol' },
            { value: 'italien', label: 'Italien' },
            { value: 'chinois', label: 'Chinois' },
            { value: 'autre-langue', label: '➕ Autre langue...', custom: true }
        ],
        'suivi-scolaire': [
            { value: 'mathematiques', label: 'Mathématiques' },
            { value: 'physique', label: 'Physique' },
            { value: 'chimie', label: 'Chimie' },
            { value: 'svt', label: 'SVT (Sciences de la Vie)' },
            { value: 'francais-scolaire', label: 'Français' },
            { value: 'arabe-scolaire', label: 'Arabe' },
            { value: 'anglais-scolaire', label: 'Anglais' },
            { value: 'histoire-geo', label: 'Histoire-Géographie' },
            { value: 'philosophie', label: 'Philosophie' },
            { value: 'economie', label: 'Économie' },
            { value: 'autre-scolaire', label: '➕ Autre matière...', custom: true }
        ],
        'sciences': [
            { value: 'mathematiques', label: 'Mathématiques' },
            { value: 'physique', label: 'Physique' },
            { value: 'chimie', label: 'Chimie' },
            { value: 'biologie', label: 'Biologie' },
            { value: 'geologie', label: 'Géologie' },
            { value: 'astronomie', label: 'Astronomie' },
            { value: 'autre-science', label: '➕ Autre science...', custom: true }
        ],
        'informatique': [
            { value: 'programmation', label: 'Programmation' },
            { value: 'web-dev', label: 'Développement Web' },
            { value: 'data-science', label: 'Data Science' },
            { value: 'cybersecurite', label: 'Cybersécurité' },
            { value: 'reseaux', label: 'Réseaux' },
            { value: 'ia', label: 'Intelligence Artificielle' },
            { value: 'autre-info', label: '➕ Autre...', custom: true }
        ],
        'arts': [
            { value: 'dessin', label: 'Dessin' },
            { value: 'peinture', label: 'Peinture' },
            { value: 'musique', label: 'Musique' },
            { value: 'theatre', label: 'Théâtre' },
            { value: 'photographie', label: 'Photographie' },
            { value: 'autre-art', label: '➕ Autre art...', custom: true }
        ],
        'business': [
            { value: 'marketing', label: 'Marketing' },
            { value: 'finance', label: 'Finance' },
            { value: 'management', label: 'Management' },
            { value: 'entrepreneuriat', label: 'Entrepreneuriat' },
            { value: 'comptabilite', label: 'Comptabilité' },
            { value: 'autre-business', label: '➕ Autre...', custom: true }
        ]
    },
    
    // Niveaux par catégorie
    levels: {
        'langue': [
            { value: 'a1.1', label: 'A1.1 - Débutant' },
            { value: 'a1.2', label: 'A1.2 - Débutant' },
            { value: 'a2.1', label: 'A2.1 - Élémentaire' },
            { value: 'a2.2', label: 'A2.2 - Élémentaire' },
            { value: 'b1.1', label: 'B1.1 - Intermédiaire' },
            { value: 'b1.2', label: 'B1.2 - Intermédiaire' },
            { value: 'b2.1', label: 'B2.1 - Intermédiaire Avancé' },
            { value: 'b2.2', label: 'B2.2 - Intermédiaire Avancé' },
            { value: 'c1', label: 'C1 - Avancé' },
            { value: 'c2', label: 'C2 - Maîtrise' },
            { value: 'autre-niveau-langue', label: '➕ Autre niveau...', custom: true }
        ],
        'suivi-scolaire': [
            { value: '1ere-annee', label: '1ère année de base' },
            { value: '2eme-annee', label: '2ème année de base' },
            { value: '3eme-annee', label: '3ème année de base' },
            { value: '4eme-annee', label: '4ème année de base' },
            { value: '5eme-annee', label: '5ème année de base' },
            { value: '6eme-annee', label: '6ème année de base' },
            { value: '7eme-annee', label: '7ème année de base' },
            { value: '8eme-annee', label: '8ème année de base' },
            { value: '9eme-annee', label: '9ème année de base' },
            { value: '1ere-secondaire', label: '1ère année secondaire' },
            { value: '2eme-secondaire', label: '2ème année secondaire' },
            { value: '3eme-secondaire', label: '3ème année secondaire' },
            { value: '4eme-secondaire', label: '4ème année secondaire (Bac)' },
            { value: 'autre-niveau-scolaire', label: '➕ Autre niveau...', custom: true }
        ],
        'sciences': [
            { value: 'lycee', label: 'Lycée' },
            { value: 'licence-1', label: 'Licence 1' },
            { value: 'licence-2', label: 'Licence 2' },
            { value: 'licence-3', label: 'Licence 3' },
            { value: 'master-1', label: 'Master 1' },
            { value: 'master-2', label: 'Master 2' },
            { value: 'doctorat', label: 'Doctorat' },
            { value: 'professionnel', label: 'Professionnel' },
            { value: 'autre-niveau-science', label: '➕ Autre niveau...', custom: true }
        ],
        'informatique': [
            { value: 'debutant', label: 'Débutant' },
            { value: 'intermediaire', label: 'Intermédiaire' },
            { value: 'avance', label: 'Avancé' },
            { value: 'expert', label: 'Expert' },
            { value: 'licence-1', label: 'Licence 1' },
            { value: 'licence-2', label: 'Licence 2' },
            { value: 'licence-3', label: 'Licence 3' },
            { value: 'master', label: 'Master' },
            { value: 'autre-niveau-info', label: '➕ Autre niveau...', custom: true }
        ],
        'arts': [
            { value: 'debutant', label: 'Débutant' },
            { value: 'intermediaire', label: 'Intermédiaire' },
            { value: 'avance', label: 'Avancé' },
            { value: 'professionnel', label: 'Professionnel' },
            { value: 'autre-niveau-art', label: '➕ Autre niveau...', custom: true }
        ],
        'business': [
            { value: 'debutant', label: 'Débutant' },
            { value: 'intermediaire', label: 'Intermédiaire' },
            { value: 'avance', label: 'Avancé' },
            { value: 'licence', label: 'Licence' },
            { value: 'master', label: 'Master' },
            { value: 'professionnel', label: 'Professionnel' },
            { value: 'autre-niveau-business', label: '➕ Autre niveau...', custom: true }
        ]
    }
};

// Stockage des valeurs personnalisées
let customValues = {
    categories: [], // Nouvelles catégories ajoutées
    subjects: {},
    levels: {}
};

/**
 * Charge les catégories personnalisées depuis la base de données
 */
async function loadCustomCategories() {
    try {
        const response = await fetch('/api/custom-categories');
        if (response.ok) {
            const data = await response.json();
            if (data.categories && Array.isArray(data.categories)) {
                customValues.categories = data.categories;
                // Ajouter les catégories personnalisées à filterData
                data.categories.forEach(cat => {
                    // Vérifier si la catégorie n'existe pas déjà
                    const exists = filterData.categories.find(c => c.value === cat.value);
                    if (!exists) {
                        // Insérer avant l'option "Autre catégorie"
                        const insertIndex = filterData.categories.length - 1;
                        filterData.categories.splice(insertIndex, 0, {
                            value: cat.value,
                            label: `✓ ${cat.label}`,
                            custom: false,
                            userCreated: true
                        });
                        
                        // Initialiser les matières et niveaux pour cette catégorie
                        if (!filterData.subjects[cat.value]) {
                            filterData.subjects[cat.value] = [
                                { value: `autre-${cat.value}`, label: '➕ Ajouter une matière...', custom: true }
                            ];
                        }
                        if (!filterData.levels[cat.value]) {
                            filterData.levels[cat.value] = [
                                { value: `autre-niveau-${cat.value}`, label: '➕ Ajouter un niveau...', custom: true }
                            ];
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.warn('Impossible de charger les catégories personnalisées:', error);
    }
}

/**
 * Sauvegarde une nouvelle catégorie en base de données
 */
async function saveCustomCategory(categoryLabel) {
    const categoryValue = categoryLabel.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, ''); // Retirer les tirets au début et à la fin
    
    const categoryData = {
        value: `custom-cat-${categoryValue}-${Date.now()}`,
        label: categoryLabel,
        createdAt: new Date().toISOString()
    };
    
    try {
        const response = await fetch('/api/custom-categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            // Ajouter localement
            customValues.categories.push(categoryData);
            
            // Ajouter à filterData
            const insertIndex = filterData.categories.length - 1;
            filterData.categories.splice(insertIndex, 0, {
                value: categoryData.value,
                label: `✓ ${categoryData.label}`,
                custom: false,
                userCreated: true
            });
            
            // Initialiser les matières et niveaux pour cette nouvelle catégorie
            filterData.subjects[categoryData.value] = [
                { value: `autre-${categoryData.value}`, label: '➕ Ajouter une matière...', custom: true }
            ];
            filterData.levels[categoryData.value] = [
                { value: `autre-niveau-${categoryData.value}`, label: '➕ Ajouter un niveau...', custom: true }
            ];
            
            return categoryData.value;
        } else {
            throw new Error('Erreur lors de la sauvegarde');
        }
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la catégorie:', error);
        alert('Erreur lors de la sauvegarde de la catégorie. Elle sera disponible uniquement pour cette session.');
        
        // Sauvegarder localement même en cas d'erreur
        const localValue = categoryData.value;
        customValues.categories.push(categoryData);
        
        const insertIndex = filterData.categories.length - 1;
        filterData.categories.splice(insertIndex, 0, {
            value: localValue,
            label: `✓ ${categoryData.label}`,
            custom: false,
            userCreated: true
        });
        
        filterData.subjects[localValue] = [
            { value: `autre-${localValue}`, label: '➕ Ajouter une matière...', custom: true }
        ];
        filterData.levels[localValue] = [
            { value: `autre-niveau-${localValue}`, label: '➕ Ajouter un niveau...', custom: true }
        ];
        
        return localValue;
    }
}

/**
 * Initialise le système de filtres dynamiques
 */
async function initializeDynamicFilters() {
    // Charger les catégories personnalisées d'abord
    await loadCustomCategories();
    
    const categorySelect = document.getElementById('w-cat');
    const subjectSelect = document.getElementById('w-subject');
    const levelSelect = document.getElementById('w-lvl');
    
    if (!categorySelect || !subjectSelect || !levelSelect) {
        console.warn('Filtres dynamiques: éléments non trouvés');
        return;
    }
    
    // Remplir le select des catégories
    updateCategorySelect();
    
    // Événement sur changement de catégorie
    categorySelect.addEventListener('change', function() {
        const category = this.value;
        handleCategoryChange(category);
    });
    
    // Événement sur changement de matière (pour détecter "Autre")
    subjectSelect.addEventListener('change', function() {
        handleCustomSubject(this.value);
    });
    
    // Événement sur changement de niveau (pour détecter "Autre")
    levelSelect.addEventListener('change', function() {
        const category = categorySelect.value;
        handleCustomLevel(this.value, category);
    });
    
    // Initialisation au chargement
    const initialCategory = categorySelect.value;
    if (initialCategory) {
        updateSubjects(initialCategory);
        updateLevels(initialCategory);
    }
}

/**
 * Met à jour le select des catégories
 */
function updateCategorySelect() {
    const categorySelect = document.getElementById('w-cat');
    if (!categorySelect) return;
    
    const currentValue = categorySelect.value;
    
    // Vider et reconstruire
    categorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
    
    filterData.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.value;
        option.textContent = cat.label;
        
        if (cat.custom) {
            option.dataset.custom = 'true';
            option.style.fontWeight = 'bold';
            option.style.color = '#2563eb';
        } else if (cat.userCreated) {
            option.style.color = '#10b981';
            option.style.fontWeight = 'bold';
        }
        
        categorySelect.appendChild(option);
    });
    
    // Restaurer la valeur si elle existe
    if (currentValue && Array.from(categorySelect.options).some(opt => opt.value === currentValue)) {
        categorySelect.value = currentValue;
    }
}

/**
 * Gère le changement de catégorie
 */
function handleCategoryChange(category) {
    const categorySelect = document.getElementById('w-cat');
    const selectedOption = categorySelect.options[categorySelect.selectedIndex];
    
    // Vérifier si c'est l'option "Nouvelle catégorie"
    if (selectedOption && selectedOption.dataset.custom === 'true') {
        showCustomInputModal('catégorie', async (customLabel) => {
            // Sauvegarder la nouvelle catégorie
            const newCategoryValue = await saveCustomCategory(customLabel);
            
            // Mettre à jour le select
            updateCategorySelect();
            
            // Sélectionner la nouvelle catégorie
            categorySelect.value = newCategoryValue;
            
            // Mettre à jour les matières et niveaux
            updateSubjects(newCategoryValue);
            updateLevels(newCategoryValue);
        });
    } else {
        // Catégorie normale, mettre à jour les matières et niveaux
        updateSubjects(category);
        updateLevels(category);
    }
}

/**
 * Met à jour les matières en fonction de la catégorie
 */
function updateSubjects(category) {
    const subjectSelect = document.getElementById('w-subject');
    if (!subjectSelect) return;
    
    // Sauvegarder la valeur actuelle
    const currentValue = subjectSelect.value;
    
    // Vider le select
    subjectSelect.innerHTML = '<option value="">Sélectionner une matière</option>';
    
    if (!category) return;
    
    // Récupérer les matières pour cette catégorie
    const subjects = filterData.subjects[category] || [];
    
    // Ajouter les options
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.value;
        option.textContent = subject.label;
        
        // Marquer les options personnalisées
        if (subject.custom) {
            option.dataset.custom = 'true';
            option.style.fontWeight = 'bold';
            option.style.color = '#2563eb';
        }
        
        subjectSelect.appendChild(option);
    });
    
    // Ajouter les valeurs personnalisées sauvegardées pour cette catégorie
    if (customValues.subjects[category]) {
        Object.entries(customValues.subjects[category]).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = `✓ ${label}`;
            option.style.color = '#10b981';
            option.style.fontWeight = 'bold';
            subjectSelect.insertBefore(option, subjectSelect.lastChild);
        });
    }
    
    // Restaurer la valeur si elle existe toujours
    if (currentValue && Array.from(subjectSelect.options).some(opt => opt.value === currentValue)) {
        subjectSelect.value = currentValue;
    }
    
    // Animation
    subjectSelect.classList.add('animate-[fadeIn_0.3s_ease-out]');
    setTimeout(() => subjectSelect.classList.remove('animate-[fadeIn_0.3s_ease-out]'), 300);
}

/**
 * Met à jour les niveaux en fonction de la catégorie
 */
function updateLevels(category) {
    const levelSelect = document.getElementById('w-lvl');
    if (!levelSelect) return;
    
    // Sauvegarder la valeur actuelle
    const currentValue = levelSelect.value;
    
    // Vider le select
    levelSelect.innerHTML = '<option value="">Sélectionner un niveau</option>';
    
    if (!category) return;
    
    // Récupérer les niveaux pour cette catégorie
    const levels = filterData.levels[category] || [];
    
    // Ajouter les options
    levels.forEach(level => {
        const option = document.createElement('option');
        option.value = level.value;
        option.textContent = level.label;
        
        // Marquer les options personnalisées
        if (level.custom) {
            option.dataset.custom = 'true';
            option.style.fontWeight = 'bold';
            option.style.color = '#2563eb';
        }
        
        levelSelect.appendChild(option);
    });
    
    // Ajouter les valeurs personnalisées sauvegardées pour cette catégorie
    if (customValues.levels[category]) {
        Object.entries(customValues.levels[category]).forEach(([value, label]) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = `✓ ${label}`;
            option.style.color = '#10b981';
            option.style.fontWeight = 'bold';
            levelSelect.insertBefore(option, levelSelect.lastChild);
        });
    }
    
    // Restaurer la valeur si elle existe toujours
    if (currentValue && Array.from(levelSelect.options).some(opt => opt.value === currentValue)) {
        levelSelect.value = currentValue;
    }
    
    // Animation
    levelSelect.classList.add('animate-[fadeIn_0.3s_ease-out]');
    setTimeout(() => levelSelect.classList.remove('animate-[fadeIn_0.3s_ease-out]'), 300);
}

/**
 * Gère l'ajout d'une matière personnalisée
 */
function handleCustomSubject(value) {
    const subjectSelect = document.getElementById('w-subject');
    const categorySelect = document.getElementById('w-cat');
    
    if (!subjectSelect || !categorySelect) return;
    
    const selectedOption = subjectSelect.options[subjectSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.custom === 'true') {
        // Afficher un modal pour saisir la matière personnalisée
        showCustomInputModal('matière', (customLabel) => {
            const category = categorySelect.value;
            const customValue = `custom-subject-${Date.now()}`;
            
            // Sauvegarder la valeur personnalisée
            if (!customValues.subjects[category]) {
                customValues.subjects[category] = {};
            }
            customValues.subjects[category][customValue] = customLabel;
            
            // Rafraîchir les options
            updateSubjects(category);
            
            // Sélectionner la nouvelle valeur
            subjectSelect.value = customValue;
        });
    }
}

/**
 * Gère l'ajout d'un niveau personnalisé
 */
function handleCustomLevel(value, category) {
    const levelSelect = document.getElementById('w-lvl');
    
    if (!levelSelect) return;
    
    const selectedOption = levelSelect.options[levelSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.custom === 'true') {
        // Afficher un modal pour saisir le niveau personnalisé
        showCustomInputModal('niveau', (customLabel) => {
            const customValue = `custom-level-${Date.now()}`;
            
            // Sauvegarder la valeur personnalisée
            if (!customValues.levels[category]) {
                customValues.levels[category] = {};
            }
            customValues.levels[category][customValue] = customLabel;
            
            // Rafraîchir les options
            updateLevels(category);
            
            // Sélectionner la nouvelle valeur
            levelSelect.value = customValue;
        });
    }
}

/**
 * Affiche un modal pour saisir une valeur personnalisée
 */
function showCustomInputModal(type, callback) {
    // Créer le modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[60] bg-gray-900/60 flex items-center justify-center backdrop-blur-sm px-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-[slideUp_0.2s_ease-out]">
            <div class="flex items-center gap-3 mb-6">
                <div class="p-3 bg-blue-50 text-blue-600 rounded-xl">
                    <i data-lucide="plus-circle" class="w-6 h-6"></i>
                </div>
                <div>
                    <h3 class="text-xl font-bold text-gray-900">Ajouter une ${type}</h3>
                    <p class="text-sm text-gray-500">Personnalisez votre cours</p>
                </div>
            </div>
            
            <div class="mb-6">
                <label class="block text-sm font-bold text-gray-700 mb-2">
                    Nom de la ${type} <span class="text-red-500">*</span>
                </label>
                <input 
                    type="text" 
                    id="custom-input-field"
                    class="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all font-medium" 
                    placeholder="Ex: ${type === 'matière' ? 'Japonais, Portugais...' : 'Niveau personnalisé...'}"
                    autofocus
                >
                <p class="text-xs text-gray-500 mt-2">
                    <i data-lucide="info" class="w-3 h-3 inline"></i>
                    Cette ${type} sera ajoutée à vos options disponibles
                </p>
            </div>
            
            <div class="flex gap-3">
                <button 
                    id="cancel-custom-btn"
                    class="flex-1 px-6 py-3 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                    Annuler
                </button>
                <button 
                    id="confirm-custom-btn"
                    class="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95"
                >
                    Ajouter
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Initialiser les icônes Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    const inputField = modal.querySelector('#custom-input-field');
    const cancelBtn = modal.querySelector('#cancel-custom-btn');
    const confirmBtn = modal.querySelector('#confirm-custom-btn');
    
    // Focus sur l'input
    setTimeout(() => inputField.focus(), 100);
    
    // Fonction pour fermer le modal
    const closeModal = () => {
        modal.classList.add('opacity-0');
        setTimeout(() => modal.remove(), 200);
    };
    
    // Annuler
    cancelBtn.addEventListener('click', () => {
        closeModal();
        // Réinitialiser le select à la première option
        const categorySelect = document.getElementById('w-cat');
        if (type === 'matière') {
            updateSubjects(categorySelect.value);
        } else {
            updateLevels(categorySelect.value);
        }
    });
    
    // Confirmer
    const handleConfirm = () => {
        const value = inputField.value.trim();
        
        if (!value) {
            inputField.classList.add('border-red-500', 'shake');
            setTimeout(() => {
                inputField.classList.remove('border-red-500', 'shake');
            }, 500);
            return;
        }
        
        callback(value);
        closeModal();
    };
    
    confirmBtn.addEventListener('click', handleConfirm);
    
    // Permettre la validation avec Enter
    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleConfirm();
        }
    });
    
    // Fermer avec Escape
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

// Initialiser au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    initializeDynamicFilters();
});

// Exporter pour utilisation externe si nécessaire
window.dynamicFilters = {
    initialize: initializeDynamicFilters,
    updateSubjects,
    updateLevels,
    getCustomValues: () => customValues
};
