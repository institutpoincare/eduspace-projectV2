/**
 * Student Catalogue - Trouver un Formateur
 */

class StudentCatalogue {
    constructor() {
        this.instructors = [];
        this.centers = [];
        this.filteredInstructors = [];
        this.filteredCenters = [];
    }

    async init() {
        console.log('🎓 Initialisation Catalogue Étudiant');
        await dataManager.init();
        
        await this.loadData();
        this.initializeEvents();
        
        console.log('✅ Catalogue chargé');
    }

    async loadData() {
        try {
            // Chargement des utilisateurs réels (filtrés par rôle formateur)
            // et des centres
            const [usersData, centersData] = await Promise.all([
                dataManager.getAll('users'),
                dataManager.getAll('centers')
            ]);
            
            // Filtrer uniquement les formateurs de la base de données réelle
            const realInstructors = (usersData || [])
                .filter(user => user.role === 'formateur')
                .map(user => {
                    // Enrichissement des données pour l'affichage (car users.json est minimal)
                    return {
                        id: user.id,
                        name: user.name,
                        // Capitalize specialty or default
                        specialty: user.specialite ? user.specialite.charAt(0).toUpperCase() + user.specialite.slice(1) : 'Enseignant',
                        location: user.location || 'Tunisie',
                        // Image déterministe ou placeholder
                        image: user.image || this.getAvatar(user.name),
                        isLive: Math.random() < 0.3, // Simulation d'état (à remplacer par réel si dispo)
                        students: Math.floor(Math.random() * 200) + 50, // Simulation stats
                        bio: user.bio || `Formateur expérimenté en ${user.specialite || 'diverses matières'}. Contactez-moi pour en savoir plus.`,
                        services: ['videos', 'live', 'presentiel'].sort(() => 0.5 - Math.random()).slice(0, 2),
                        cv: { experience: [{ description: "Formateur certifié EduSpace" }] }
                    };
                });

            this.instructors = realInstructors;
            this.centers = centersData || [];
            this.filteredInstructors = [...this.instructors];
            this.filteredCenters = [...this.centers];
            
            this.renderAll();
        } catch (error) {
            console.error('❌ Erreur chargement données:', error);
        }
    }

    getAvatar(name) {
        // Génère un avatar UI Avatars basé sur le nom pour un look propre
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=256&font-size=0.4`;
    }

    renderAll() {
        this.renderInstructors();
        this.renderCenters();
    }

    renderInstructors() {
        const container = document.querySelector('.grid.grid-cols-1');
        if (!container) {
            console.error('❌ Container not found');
            return;
        }

        console.log('📋 Rendering', this.filteredInstructors.length, 'instructors');
        container.innerHTML = '';

        if (this.filteredInstructors.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-gray-500 text-lg">Aucun formateur trouvé.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.filteredInstructors.map(instructor => `
            <div class="group bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col relative transform hover:-translate-y-2">
                <!-- Hover Glow Effect -->
                <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>

                <div class="relative p-6 z-10 flex flex-col h-full bg-white">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex gap-5 items-center">
                            <div class="relative w-20 h-20">
                                <img src="${instructor.image}" class="w-20 h-20 rounded-2xl object-cover shadow-xl relative z-10 border-2 border-white">
                                ${instructor.isLive ? `
                                <div class="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1 z-20">
                                    <span class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> Live
                                </div>
                                ` : `
                                <div class="absolute -bottom-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1 z-20">
                                    <i data-lucide="map-pin" class="w-3 h-3"></i> ${instructor.location || 'Tunis'}
                                </div>
                                `}
                            </div>
                            <div>
                                <h3 class="font-bold text-xl text-gray-900 group-hover:text-indigo-600 transition-colors">${instructor.name}</h3>
                                <p class="text-gray-500 font-medium">${instructor.specialty}</p>
                                <div class="flex items-center gap-2 mt-2">
                                    <div class="flex text-yellow-400">
                                        ${Array(5).fill('<i data-lucide="star" class="w-3.5 h-3.5 fill-current"></i>').join('')}
                                    </div>
                                    <span class="text-xs font-bold text-gray-400">(${instructor.students}+ avis)</span>
                                </div>
                            </div>
                        </div>
                        <button class="w-10 h-10 rounded-full bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all">
                            <i data-lucide="heart" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <p class="text-gray-600 text-sm mb-6 leading-relaxed">
                        ${instructor.cv && instructor.cv.experience && instructor.cv.experience.length > 0 ? instructor.cv.experience[0].description : instructor.bio || 'Expert qualifié prêt à vous accompagner dans votre apprentissage.'}
                    </p>

                    <div class="grid grid-cols-2 gap-3 mb-6">
                         ${(instructor.services || []).map(service => this.createServiceBadge(service)).join('')}
                    </div>

                    <div class="mt-auto flex gap-3">
                        <button onclick="window.location.href='../formateur/profil.html?id=${instructor.id}'" class="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                            Voir Profil <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                        <button onclick="startChat('${instructor.id}', 'instructor')" class="px-5 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 hover:border-gray-200 rounded-xl font-bold transition-colors">
                            Discuter
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    createServiceBadge(service) {
        if (service === 'live') {
            return `
                 <div class="bg-gradient-to-br from-red-50 to-orange-50 p-3 rounded-2xl border border-red-100 flex items-center gap-3">
                    <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-red-500">
                        <i data-lucide="video" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-gray-900 uppercase tracking-wider">Live</p>
                        <span class="inline-block px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">Dispo</span>
                    </div>
                </div>
            `;
        } else if (service === 'videos') {
            return `
                <div class="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500">
                        <i data-lucide="play-circle" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-gray-900 uppercase tracking-wider">Vidéos</p>
                        <p class="text-xs text-gray-500">Modules</p>
                    </div>
                </div>
            `;
        } else if (service === 'presentiel') {
            return `
                <div class="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                        <i data-lucide="users" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-gray-900 uppercase tracking-wider">Présentiel</p>
                        <span class="inline-block px-2 py-0.5 bg-white/50 text-emerald-800 rounded text-[10px] font-bold">Centre</span>
                    </div>
                </div>
             `;
        }
        return `
             <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded-2xl border border-purple-100 flex items-center gap-3">
                <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-purple-500">
                    <i data-lucide="user" class="w-5 h-5"></i>
                </div>
                <div>
                   <p class="text-xs font-bold text-gray-900 uppercase tracking-wider">Autre</p>
                </div>
            </div>
        `;
    }

    renderCenters() {
        const container = document.querySelector('.grid.grid-cols-1');
        if (!container) return;

        if (this.filteredCenters.length === 0) {
            // If no centers are found, and instructors were also not found, the "Aucun..." message is already set.
            // If instructors were found, we just don't add any center HTML.
            return;
        }

        // Add centers after instructors
        const centersHTML = this.filteredCenters.map(center => `
            <div class="group bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden flex flex-col relative transform hover:-translate-y-2">
                <div class="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500"></div>
                
                <div class="relative p-6 z-10 flex flex-col h-full bg-white">
                    <div class="flex items-start justify-between mb-6">
                        <div class="flex gap-5 items-center">
                            <div class="relative w-20 h-20">
                                <img src="${center.image}" class="w-20 h-20 rounded-2xl object-cover shadow-xl relative z-10 border-2 border-white">
                                <div class="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1 z-20">
                                    <i data-lucide="building" class="w-3 h-3"></i> Centre
                                </div>
                            </div>
                            <div>
                                <h3 class="font-bold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">${center.name}</h3>
                                <p class="text-gray-500 font-medium">${center.category}</p>
                                <div class="flex items-center gap-2 mt-2">
                                    <i data-lucide="map-pin" class="w-3.5 h-3.5 text-blue-600"></i>
                                    <span class="text-xs font-bold text-gray-600">${center.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p class="text-gray-600 text-sm mb-6 leading-relaxed">
                        ${center.description || 'Centre de formation professionnel'}
                    </p>

                    <div class="mt-auto flex gap-3">
                        <button onclick="viewCenterProfile('${center.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
                            Voir Centre <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                        <button onclick="startChat('${center.id}', 'center')" class="px-5 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-100 hover:border-gray-200 rounded-xl font-bold transition-colors">
                            Contacter
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML += centersHTML;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initializeEvents() {
        // Implement search/filter logic here if needed
        const searchInput = document.querySelector('input[placeholder="Nom, Compétence..."]');
        if(searchInput) {
            searchInput.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                this.filteredInstructors = this.instructors.filter(i => 
                    i.name.toLowerCase().includes(term) || 
                    i.specialty.toLowerCase().includes(term)
                );
                this.filteredCenters = this.centers.filter(c =>
                    c.name.toLowerCase().includes(term) ||
                    c.category.toLowerCase().includes(term) ||
                    c.location.toLowerCase().includes(term)
                );
                this.renderAll();
            });
        }
    }
}

const studentCatalogue = new StudentCatalogue();
document.addEventListener('DOMContentLoaded', () => {
    studentCatalogue.init();
});
