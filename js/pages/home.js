/**
 * Home Page Logic
 * Gère l'affichage dynamique de la page d'accueil
 */

let allInstructors = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Initialisation
    try {
        await dataManager.init();
        await loadDynamicContent();
    } catch (error) {
        console.error('Erreur initialisation home:', error);
        hideLoaders();
    }
});

async function loadDynamicContent() {
    console.log("🚀 Démarrage du chargement du contenu...");

    try {
        const [instructors, centers] = await Promise.all([
            dataManager.getAll('instructors'),
            dataManager.getAll('centers')
        ]);

        allInstructors = instructors || [];
        const finalCenters = centers || [];

        // Setup Filters
        setupFilters();
        
        // Initial render (Filtered by Sales by default)
        filterAndRender('sales');
        
        renderCenters(finalCenters);

    } catch (error) {
        console.error("⚠️ Erreur chargement des données", error);
        hideLoaders();
    }
}

function setupFilters() {
    const btnSales = document.getElementById('filter-sales');
    const btnRating = document.getElementById('filter-rating');
    const btnNew = document.getElementById('filter-new');

    if(btnSales) btnSales.addEventListener('click', () => filterAndRender('sales'));
    if(btnRating) btnRating.addEventListener('click', () => filterAndRender('rating'));
    if(btnNew) btnNew.addEventListener('click', () => filterAndRender('new'));
}

function filterAndRender(criteria) {
    // Visual update of buttons
    updateActiveButton(criteria);

    // Sorting logic
    let sorted = [...allInstructors];
    switch (criteria) {
        case 'sales':
            // Sort by students count (descending)
            sorted.sort((a, b) => parseStudents(b.students) - parseStudents(a.students));
            break;
        case 'rating':
            // Sort by rating (descending)
            sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'new':
            // Sort by join date (descending, newest first)
            // If no joinedDate, fallback to ID or index (assuming later in array = newer if push based)
            sorted.sort((a, b) => {
                const dateA = new Date(a.joinedDate || 0);
                const dateB = new Date(b.joinedDate || 0);
                return dateB - dateA;
            });
            break;
    }

    renderInstructors(sorted);
}

function parseStudents(val) {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
        const lower = val.toLowerCase();
        if (lower.includes('k')) {
            return parseFloat(lower.replace('k', '')) * 1000;
        }
        return parseFloat(val) || 0;
    }
    return 0;
}

function updateActiveButton(activeType) {
    const map = {
        'sales': 'filter-sales',
        'rating': 'filter-rating',
        'new': 'filter-new'
    };

    const activeClass = "px-6 py-3 bg-white text-gray-900 rounded-lg font-bold shadow-sm hover:shadow-md transition-all whitespace-nowrap filter-btn";
    const inactiveClass = "px-6 py-3 text-gray-500 hover:bg-white/50 hover:text-gray-900 rounded-lg font-bold transition-all whitespace-nowrap filter-btn";

    Object.entries(map).forEach(([type, id]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.className = (type === activeType) ? activeClass : inactiveClass;
        }
    });
}

function renderInstructors(instructors) {
    const container = document.getElementById('instructorsGrid');

    if (!container) return;

    if (!instructors || instructors.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-10">Aucun formateur disponible pour le moment.</div>';
        return;
    }

    // Limit to 4 items max
    container.innerHTML = instructors.slice(0, 4).map(instructor => `
        <div class="group bg-white rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col relative transform hover:-translate-y-2 h-full">
            <!-- Hover Glow Effect -->
            <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

            <div class="relative p-8 z-10 flex flex-col h-full bg-white">
                <!-- Header -->
                <div class="flex items-start justify-between mb-8">
                    <div class="flex gap-5 items-center">
                        <div class="relative w-24 h-24">
                            <!-- Profile Image with Ring Animation -->
                            <div class="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 animate-pulse opacity-50 blur"></div>
                            <img src="${instructor.image || 'https://ui-avatars.com/api/?name=' + instructor.name}" class="w-24 h-24 rounded-3xl object-cover shadow-xl relative z-10 border-4 border-white">
                            
                            <!-- Status Indicator -->
                            ${instructor.isLive ? `
                            <div class="absolute -bottom-2 -right-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full border-4 border-white shadow-sm flex items-center gap-1.5 z-20">
                                <span class="w-2 h-2 bg-white rounded-full animate-ping"></span>
                                Live
                            </div>` : ''}
                        </div>

                        <div>
                            <h3 class="font-bold text-2xl text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight mb-1">${instructor.name}</h3>
                            <p class="text-indigo-600 font-medium text-sm bg-indigo-50 px-3 py-1 rounded-lg inline-block">${instructor.specialty}</p>
                            <div class="flex items-center gap-2 mt-3">
                                <div class="flex text-yellow-400 gap-0.5">
                                    <i data-lucide="star" class="w-4 h-4 fill-current"></i>
                                    <span class="font-bold text-gray-900 ml-1">${instructor.rating}</span>
                                </div>
                                <span class="text-sm font-bold text-gray-400">(${typeof instructor.students === 'number' ? instructor.students + ' étudiants' : instructor.students})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <p class="text-gray-600 text-base mb-8 leading-relaxed line-clamp-3 flex-1">
                    ${instructor.bio || "Expert qualifié prêt à vous accompagner dans votre apprentissage et à booster vos compétences."}
                </p>

                <!-- Actions -->
                <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50 mt-auto">
                    <button onclick="startChat('${instructor.id}', 'instructor')" class="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all flex items-center justify-center gap-2">
                        <i data-lucide="message-circle" class="w-4 h-4"></i>
                        Discuter
                    </button>
                    <button onclick="window.location.href='pages/formateur/profil.html?id=${instructor.id}'" class="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-105 active:scale-95 duration-200">
                        Voir CV
                        <i data-lucide="arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

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
        const gradients = [
            'from-indigo-600 to-purple-600',
            'from-blue-600 to-cyan-600',
            'from-pink-600 to-rose-600'
        ];
        const gradient = gradients[index % gradients.length];

        return `
        <div class="bg-gradient-to-br ${gradient} rounded-[2.5rem] p-10 text-white relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all cursor-pointer transform hover:-translate-y-2 h-full flex flex-col">
            <div class="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 transition-all group-hover:scale-150 duration-700"></div>
            
            <div class="relative z-10 flex flex-col h-full">
                <div class="flex items-start justify-between mb-8">
                    <div class="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-3xl shadow-xl">
                        ${index + 1}
                    </div>
                    <span class="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm font-bold border border-white/20 uppercase tracking-widest">
                        ${center.category || 'Formation'}
                    </span>
                </div>

                <h3 class="text-3xl font-extrabold mb-4 leading-tight">${center.name}</h3>
                <p class="text-white/80 mb-8 flex-1 text-lg leading-relaxed line-clamp-3">${center.description}</p>

                <div class="flex items-center gap-4 text-base font-medium pt-8 border-t border-white/10">
                    <span class="flex items-center gap-2"><i data-lucide="map-pin" class="w-5 h-5"></i> ${center.location}</span>
                </div>
                
                <div class="mt-8 flex gap-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                     <button onclick="requestCenterInfo('${center.id}')" class="flex-1 bg-white text-gray-900 py-4 rounded-xl font-bold text-sm hover:bg-gray-50 shadow-lg">Détails</button>
                     <button onclick="startChat('${center.id}', 'center')" class="px-6 py-4 bg-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/30 backdrop-blur-md"><i data-lucide="message-circle" class="w-6 h-6"></i></button>
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
