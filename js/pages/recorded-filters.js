// Dynamic Filters for Contenu Enregistré

const subcategories = {
    'langues': [
        { value: 'francais', label: 'Français' },
        { value: 'anglais', label: 'Anglais' },
        { value: 'arabe', label: 'Arabe' },
        { value: 'espagnol', label: 'Espagnol' },
        { value: 'allemand', label: 'Allemand' }
    ],
    'informatique': [
        { value: 'programmation', label: 'Programmation' },
        { value: 'reseaux', label: 'Réseaux' },
        { value: 'web', label: 'Développement Web' },
        { value: 'data', label: 'Data Science' },
        { value: 'cybersecurite', label: 'Cybersécurité' }
    ],
    'sciences': [
        { value: 'biologie', label: 'Biologie' },
        { value: 'geologie', label: 'Géologie' },
        { value: 'svt', label: 'SVT' }
    ],
    'histoire': [
        { value: 'histoire', label: 'Histoire' },
        { value: 'geographie', label: 'Géographie' },
        { value: 'civique', label: 'Éducation Civique' }
    ]
};

const niveaux = {
    'scolaire': [
        { value: '7eme', label: '7ème année' },
        { value: '8eme', label: '8ème année' },
        { value: '9eme', label: '9ème année' },
        { value: '1ere', label: '1ère année secondaire' },
        { value: '2eme', label: '2ème année secondaire' },
        { value: '3eme', label: '3ème année secondaire' },
        { value: '4eme', label: '4ème année secondaire (Bac)' }
    ],
    'universitaire': [
        { value: 'l1', label: 'Licence 1' },
        { value: 'l2', label: 'Licence 2' },
        { value: 'l3', label: 'Licence 3' },
        { value: 'm1', label: 'Master 1' },
        { value: 'm2', label: 'Master 2' },
        { value: 'doctorat', label: 'Doctorat' }
    ],
    'professionnel': [
        { value: 'debutant', label: 'Débutant' },
        { value: 'intermediaire', label: 'Intermédiaire' },
        { value: 'avance', label: 'Avancé' },
        { value: 'expert', label: 'Expert' }
    ]
};

function updateNiveauOptionsRec() {
    const type = document.getElementById('w-type').value;
    const niveauSelect = document.getElementById('w-lvl');
    
    niveauSelect.innerHTML = '';
    
    const options = niveaux[type] || [];
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        niveauSelect.appendChild(option);
    });
}

function updateSubcategoryOptionsRec() {
    const category = document.getElementById('w-cat').value;
    const subcategorySelect = document.getElementById('w-subcat');
    
    subcategorySelect.innerHTML = '<option value="">Général</option>';
    
    const subs = subcategories[category] || [];
    subs.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.value;
        option.textContent = sub.label;
        subcategorySelect.appendChild(option);
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('w-type')) {
        updateNiveauOptionsRec();
    }
});
