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
            // Chargement des utilisateurs réels, des centres et des cours
            const [usersData, centersData, coursesData] = await Promise.all([
                dataManager.getAll('users'),
                dataManager.getAll('centers'),
                dataManager.getAll('courses')
            ]);
            
            // Filtrer uniquement les formateurs de la base de données réelle
            const realInstructors = (usersData || [])
                .filter(user => user.role === 'formateur')
                .map(user => {
                    // Enrichissement des données pour l'affichage
                    // استخدام الخدمات من قاعدة البيانات أو الافتراضي إذا لم توجد
                    let servicesList = [];
                    if (user.services) {
                        if (user.services.live && user.services.live.active) servicesList.push({ type: 'live', url: user.services.live.url });
                        if (user.services.videos && user.services.videos.active) servicesList.push({ type: 'videos', url: user.services.videos.url });
                        if (user.services.presentiel && user.services.presentiel.active) servicesList.push({ type: 'presentiel', location: user.services.presentiel.location });
                    } else {
                        // Fallback services if not defined in DB (empty list or default)
                        servicesList = []; 
                    }

                    // Get courses for this instructor
                    const instructorCourses = (coursesData || []).filter(course => course.instructorId === user.id);

                    return {
                        id: user.id,
                        name: user.name,
                        specialty: user.specialite ? user.specialite.charAt(0).toUpperCase() + user.specialite.slice(1) : 'Enseignant',
                        location: user.location || 'Tunisie',
                        image: user.image || this.getAvatar(user.name),
                        isLive: user.services?.live?.active || false, // Real status
                        students: user.students || 0,
                        bio: user.bio || `Formateur expérimenté en ${user.specialite || 'diverses matières'}.`,
                        services: servicesList,
                        courses: instructorCourses,
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

        container.innerHTML = this.filteredInstructors.map(instructor => {
            // Determine available formats
            const hasLive = instructor.services.some(s => s.type === 'live');
            const hasVideo = instructor.services.some(s => s.type === 'videos');
            const hasPresentiel = instructor.services.some(s => s.type === 'presentiel');

            return `
            <div class="group bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col h-full relative">
                <!-- Decorative Top Gradient (Subtle) -->
                <div class="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-gray-50 to-white pt-6 px-6"></div>

                <div class="relative p-6 flex flex-col h-full z-10">
                    
                    <!-- Header: Avatar + Info -->
                    <div class="flex items-start gap-4 mb-5">
                        <div class="relative flex-shrink-0">
                            <div class="w-16 h-16 rounded-2xl overflow-hidden shadow-md border-2 border-white ring-1 ring-gray-100">
                                <img src="${instructor.image}" class="w-full h-full object-cover" alt="${instructor.name}">
                            </div>
                            ${instructor.isLive ? `
                            <span class="absolute -bottom-1 -right-1 flex h-4 w-4">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                            </span>
                            ` : ''}
                        </div>
                        
                        <div class="flex-1 min-w-0 pt-1">
                            <div class="flex justify-between items-start">
                                <h3 class="font-bold text-lg text-gray-900 truncate pr-2 group-hover:text-indigo-600 transition-colors">${instructor.name}</h3>
                                <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                    <i data-lucide="star" class="w-3.5 h-3.5 text-yellow-500 fill-current"></i>
                                    <span class="text-xs font-bold text-gray-700">4.9</span>
                                </div>
                            </div>
                            <p class="text-indigo-600 text-sm font-medium mb-1">${instructor.specialty}</p>
                            <p class="text-xs text-gray-400 flex items-center gap-1">
                                <i data-lucide="map-pin" class="w-3 h-3"></i> ${instructor.location}
                            </p>
                        </div>
                    </div>

                    <!-- Description -->
                    <div class="mb-5">
                        <p class="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
                            ${instructor.cv && instructor.cv.experience && instructor.cv.experience.length > 0 ? instructor.cv.experience[0].description : instructor.bio || 'Expert passionné prêt à partager ses connaissances et à vous aider à progresser.'}
                        </p>
                        
                        ${instructor.courses && instructor.courses.length > 0 ? `
                        <div class="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100">
                            <h4 class="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-2 flex items-center gap-1">
                                <i data-lucide="video" class="w-3 h-3 text-indigo-600"></i> Cours Enregistrés
                            </h4>
                            <div class="space-y-1.5">
                                ${instructor.courses.slice(0, 2).map(course => `
                                    <div class="flex items-center gap-2 group/course">
                                        <div class="w-1 h-1 rounded-full bg-indigo-400 group-hover/course:bg-indigo-600 transition-colors"></div>
                                        <span class="text-xs text-gray-600 group-hover/course:text-indigo-700 font-medium truncate flex-1 transition-colors" title="${course.title}">
                                            ${course.title}
                                        </span>
                                    </div>
                                `).join('')}
                                ${instructor.courses.length > 2 ? `
                                    <div class="text-[10px] text-indigo-500 font-bold pl-3 pt-0.5">
                                        +${instructor.courses.length - 2} autres cours
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Course Formats Tags -->
                    <div class="flex flex-wrap gap-2 mb-6 mt-auto">
                        ${hasLive ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-100">
                            <i data-lucide="video" class="w-3.5 h-3.5"></i>
                            Live
                        </span>` : ''}
                        
                        ${hasVideo ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                            <i data-lucide="play-circle" class="w-3.5 h-3.5"></i>
                            Vidéos
                        </span>` : ''}

                        ${hasPresentiel ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            <i data-lucide="users" class="w-3.5 h-3.5"></i>
                            Présentiel
                        </span>` : ''}

                        ${!hasLive && !hasVideo && !hasPresentiel ? `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-500 border border-gray-100">
                            <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                            Cours
                        </span>
                        ` : ''}
                    </div>

                    <!-- Actions -->
                    <div class="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                        <button onclick="startChat('${instructor.id}', 'instructor')" class="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all flex items-center justify-center gap-2">
                            <i data-lucide="message-circle" class="w-4 h-4"></i>
                            Discuter
                        </button>
                        <button onclick="window.location.href='../formateur/profil.html?id=${instructor.id}'" class="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 hover:shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-105 active:scale-95 duration-200">
                            Voir Profil
                            <i data-lucide="arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
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
