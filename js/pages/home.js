/**
 * Home Page Logic
 * Gère l'affichage dynamique de la page d'accueil
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Initialisation
    try {
        await dataManager.init();
        await loadDynamicContent();
    } catch (error) {
        console.error('Erreur initialisation home:', error);
        // En cas d'erreur, on essaie quand même d'afficher quelque chose ou de cacher les loaders
        hideLoaders();
    }
});

async function loadDynamicContent() {
    console.log("🚀 Démarrage du chargement du contenu...");

    // Données de secours GARANTIES (Hardcoded) pour affichage immédiat
    const HARDCODED_INSTRUCTORS = [
        {
            id: 'ahmed',
            name: 'Ahmed Ben Ali',
            specialty: 'Expert DevOps & Cloud',
            rating: 4.9,
            students: '15k+',
            image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            bio: 'Formateur certifié AWS et Kubernetes avec 10 ans d\'expérience.'
        },
        {
            id: 'sarah',
            name: 'Sarah M.',
            specialty: 'Design UX/UI',
            rating: 5.0,
            students: '8k+',
            image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            bio: 'Expert en design système et prototypage interactif.'
        },
        {
            id: 'karim',
            name: 'Karim S.',
            specialty: 'Dév Mobile iOS',
            rating: 4.7,
            students: '5k+',
            image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            bio: 'Développeur senior Swift et SwiftUI.'
        },
        {
            id: 'leila',
            name: 'Leila K.',
            specialty: 'Marketing Digital',
            rating: 4.8,
            students: '12k+',
            image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
            bio: 'Spécialiste SEO et Growth Hacking.'
        }
    ];

    const HARDCODED_CENTERS = [
        {
            id: 'c1',
            name: 'GoMyCode',
            category: 'Coding Bootcamp',
            location: 'Tunis',
            description: 'Le premier bootcamp de code en Tunisie, formant la prochaine génération de développeurs.',
            image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'c2',
            name: 'RBK Tunisia',
            category: 'Fullstack JS',
            location: 'Ariana',
            description: 'Formation intensive en développement logiciel pour changer de carrière en 4 mois.',
            image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: 'c3',
            name: 'GMC Sousse',
            category: 'Tech Hub',
            location: 'Sousse',
            description: 'Un espace d\'innovation et d\'apprentissage au cœur du Sahel.',
            image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    ];

    try {
        // Tenter de charger depuis le DataManager
        const [instructors, centers] = await Promise.all([
            dataManager.getAll('instructors'),
            dataManager.getAll('centers')
        ]);

        // Si DataManager renvoie vide, utiliser les données en dur
        const finalInstructors = (instructors && instructors.length > 0) ? instructors : HARDCODED_INSTRUCTORS;
        const finalCenters = (centers && centers.length > 0) ? centers : HARDCODED_CENTERS;

        renderInstructors(finalInstructors);
        renderCenters(finalCenters);

    } catch (error) {
        console.error("⚠️ Erreur chargement, utilisation des données de secours", error);
        // En cas d'erreur fatale, afficher les données en dur DIRECTEMENT
        renderInstructors(HARDCODED_INSTRUCTORS);
        renderCenters(HARDCODED_CENTERS);
    }
}

function renderInstructors(instructors) {
    const container = document.getElementById('instructorsGrid');

    if (!container) return;

    // Si pas de données, afficher un message ou des explications
    if (!instructors || instructors.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Aucun formateur disponible pour le moment.</div>';
        return;
    }

    // Vider le loader
    container.innerHTML = instructors.slice(0, 4).map(instructor => `
        <div class="group bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col relative transform hover:-translate-y-2">
            <!-- Hover Glow Effect -->
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

            <div class="relative p-6 z-10 flex flex-col h-full bg-white">
                <!-- Header -->
                <div class="flex items-start justify-between mb-6">
                    <div class="flex gap-5 items-center">
                        <div class="relative w-20 h-20">
                            <!-- Profile Image with Ring Animation -->
                            <div class="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse opacity-50 blur"></div>
                            <img src="${instructor.image || 'https://ui-avatars.com/api/?name=' + instructor.name}" class="w-20 h-20 rounded-2xl object-cover shadow-xl relative z-10 border-2 border-white">
                            
                            <!-- Status Indicator -->
                            <div class="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1 z-20">
                                <span class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                                Live
                            </div>
                        </div>

                        <div>
                            <h3 class="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">${instructor.name}</h3>
                            <p class="text-gray-500 font-medium">${instructor.specialty}</p>
                            <div class="flex items-center gap-2 mt-2">
                                <div class="flex text-yellow-400">
                                    ${Array(5).fill('<i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>').join('')}
                                </div>
                                <span class="text-xs font-bold text-gray-400">(${instructor.rating} avis)</span>
                            </div>
                        </div>
                    </div>

                    <button class="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all">
                        <i data-lucide="heart" class="w-5 h-5"></i>
                    </button>
                </div>

                <p class="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-2">
                    ${instructor.bio || "Expert qualifié prêt à vous accompagner dans votre apprentissage."}
                </p>

                <!-- Action Buttons -->
                <div class="mt-auto flex gap-3">
                    <button onclick="viewInstructorCV('${instructor.id}')" class="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2 text-sm">
                        Voir CV <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                    <button onclick="startChat('${instructor.id}', 'instructor')" class="px-5 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 hover:border-gray-200 rounded-xl font-bold transition-colors text-sm">
                        Chat
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Réinitialiser les icônes Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderCenters(centers) {
    const container = document.getElementById('centersGrid');

    if (!container) return;

    if (!centers || centers.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Aucun centre partenaire affiché.</div>';
        return;
    }

    container.innerHTML = centers.slice(0, 3).map((center, index) => {
        // Styles alternés pour la variété visuelle
        const gradients = [
            'from-indigo-600 to-purple-600',
            'from-blue-600 to-cyan-600',
            'from-pink-600 to-rose-600'
        ];
        const gradient = gradients[index % gradients.length];

        return `
        <div class="bg-gradient-to-br ${gradient} rounded-3xl p-8 text-white relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all cursor-pointer">
            <div class="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 transition-all group-hover:scale-150"></div>
            
            <div class="relative z-10 flex flex-col h-full">
                <div class="flex items-start justify-between mb-6">
                    <div class="w-16 h-16 bg-white rounded-xl flex items-center justify-center text-indigo-600 font-bold text-2xl shadow-lg">
                        ${index + 1}
                    </div>
                    <span class="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/20">
                        ${center.category || 'Formation'}
                    </span>
                </div>

                <h3 class="text-2xl font-bold mb-2">${center.name}</h3>
                <p class="text-white/80 mb-6 flex-1 line-clamp-3">${center.description}</p>

                <div class="flex items-center gap-4 text-sm font-medium pt-6 border-t border-white/10">
                    <span><i data-lucide="map-pin" class="w-4 h-4 inline mr-1"></i> ${center.location}</span>
                </div>
                
                <div class="mt-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                     <button class="flex-1 bg-white text-gray-900 py-2 rounded-lg font-bold text-sm hover:bg-gray-50">Détails</button>
                     <button onclick="startChat('${center.id}', 'center')" class="px-4 py-2 bg-white/20 text-white rounded-lg font-bold text-sm hover:bg-white/30"><i data-lucide="message-circle" class="w-4 h-4"></i></button>
                </div>
            </div>
        </div>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function hideLoaders() {
    const instructorsGrid = document.getElementById('instructorsGrid');
    if (instructorsGrid && instructorsGrid.innerHTML.includes('Chargement')) {
        instructorsGrid.innerHTML = '<div class="col-span-full text-center text-gray-400">Données non disponibles</div>';
    }

    const centersGrid = document.getElementById('centersGrid');
    if (centersGrid && centersGrid.innerHTML.includes('Chargement')) {
        centersGrid.innerHTML = '<div class="col-span-full text-center text-gray-400">Données non disponibles</div>';
    }
}
