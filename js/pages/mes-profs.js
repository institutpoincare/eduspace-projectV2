/**
 * Mes Professeurs - Page Dynamique Étudiant
 * Affiche tous les formateurs avec possibilité de contacter
 */

class MesProfsPage {
    constructor() {
        this.instructors = [];
        this.myInstructors = [];
    }

    async init() {
        console.log('👨‍🏫 Initialisation Mes Professeurs');
        await dataManager.init();

        await this.loadInstructors();
        this.initializeEvents();
    }

    async loadInstructors() {
        try {
            // Charger tous les formateurs
            this.instructors = await dataManager.getAll('instructors');

            // Identifier mes formateurs (ceux dont je suis les cours)
            const enrollments = await dataManager.getAll('enrollments');
            const currentUserId = localStorage.getItem('currentUserId') || 'user-1';
            const myEnrollments = enrollments.filter(e => e.userId === currentUserId);

            const myInstructorIds = new Set();
            for (const enrollment of myEnrollments) {
                const course = await dataManager.getById('courses', enrollment.courseId);
                if (course) myInstructorIds.add(course.instructorId);
            }

            this.myInstructors = this.instructors.filter(i => myInstructorIds.has(i.id));

            this.renderInstructors();
            console.log(`✅ ${this.instructors.length} formateurs chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement formateurs:', error);
        }
    }

    renderInstructors() {
        const container = document.getElementById('instructorsContainer') ||
            document.querySelector('.grid');

        if (!container) return;

        const instructorsToShow = this.myInstructors.length > 0 ? this.myInstructors : this.instructors;

        container.innerHTML = instructorsToShow.map(instructor => `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 p-6">
                <div class="flex items-start gap-4 mb-4">
                    <div class="relative">
                        <img src="${instructor.image}" alt="${instructor.name}" 
                             class="w-20 h-20 rounded-xl object-cover border-2 border-white shadow-lg">
                        <div class="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-1">${instructor.name}</h3>
                        <p class="text-sm text-gray-500 mb-2">${instructor.specialty}</p>
                        <div class="flex items-center gap-2">
                            <div class="flex text-yellow-400">
                                ${Array(5).fill('<i data-lucide="star" class="w-3 h-3 fill-current"></i>').join('')}
                            </div>
                            <span class="text-xs font-bold text-gray-400">${instructor.rating}</span>
                        </div>
                    </div>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <i data-lucide="users" class="w-4 h-4"></i>
                        <span>${instructor.students}+ étudiants</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <i data-lucide="briefcase" class="w-4 h-4"></i>
                        <span>${instructor.experience}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <i data-lucide="dollar-sign" class="w-4 h-4"></i>
                        <span>${instructor.price} TND/h</span>
                    </div>
                </div>

                <div class="flex gap-2">
                    <button onclick="mesProfsPage.viewCV('${instructor.id}')"
                            class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                        <i data-lucide="file-text" class="w-4 h-4"></i> Voir CV
                    </button>
                    <button onclick="startChat('${instructor.id}', 'instructor')"
                            class="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-bold text-sm">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> Contacter
                    </button>
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    viewCV(instructorId) {
        // Utiliser la fonction globale si elle existe
        if (typeof viewInstructorCV === 'function') {
            viewInstructorCV(instructorId);
        } else {
            window.location.href = `../formateur/profil.html?id=${instructorId}`;
        }
    }

    initializeEvents() {
        const searchInput = document.getElementById('searchInstructors');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterInstructors(e.target.value);
            });
        }
    }

    filterInstructors(query) {
        const filtered = this.instructors.filter(instructor =>
            instructor.name.toLowerCase().includes(query.toLowerCase()) ||
            instructor.specialty.toLowerCase().includes(query.toLowerCase())
        );

        const container = document.getElementById('instructorsContainer');
        if (!container) return;

        // Re-render with filtered list
        // Similar to renderInstructors but with filtered array
    }
}

// Instance globale
const mesProfsPage = new MesProfsPage();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    mesProfsPage.init();
});
