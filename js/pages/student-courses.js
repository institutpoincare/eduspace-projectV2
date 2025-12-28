/**
 * Mes Cours - Logique dynamique
 */

class StudentCourses {
    constructor() {
        this.currentStudent = null;
        this.myCourses = [];
        this.currentTab = 'live'; // 'live' or 'recorded'
    }

    async init() {
        console.log('📚 Initialisation Mes Cours');
        await dataManager.init();

        // Get current user from session
        const user = sessionStorage.getItem('user');
        if (user) {
            this.currentStudent = JSON.parse(user);
        } else {
            window.location.href = '../../pages/login-etudiant.html';
            return;
        }

        console.log('👤 Utilisateur connecté:', this.currentStudent.name, 'ID:', this.currentStudent.id);

        await this.loadMyCourses();
        this.renderCourses();
        this.initializeEvents();
    }

    async loadMyCourses() {
        try {
            const allEnrollments = await dataManager.getAll('enrollments');
            console.log('📋 Total enrollments:', allEnrollments.length);
            
            const myEnrollments = allEnrollments.filter(e => e.userId === this.currentStudent.id);
            console.log('✅ Mes enrollments:', myEnrollments.length, myEnrollments);

            this.myCourses = await Promise.all(
                myEnrollments.map(async (enrollment) => {
                    const course = await dataManager.getById('courses', enrollment.courseId);
                    if (!course) {
                        console.warn('⚠️ Cours non trouvé pour enrollment:', enrollment.courseId);
                        return null;
                    }
                    return { ...course, enrollment };
                })
            );
            
            // Filter out null courses
            this.myCourses = this.myCourses.filter(c => c !== null);
            console.log('📚 Cours chargés:', this.myCourses.length, this.myCourses.map(c => c.title));
        } catch (error) {
            console.error('❌ Erreur chargement cours:', error);
            this.myCourses = [];
        }
    }

    renderCourses() {
        this.renderGrid('live');
        this.renderGrid('recorded');
    }

    renderGrid(type) {
        const containerId = type === 'live' ? 'grid-live' : 'grid-recorded';
        const container = document.getElementById(containerId);
        if (!container) return;

        let filtered = [];
        if (type === 'live') {
            filtered = this.myCourses.filter(c => c.type === 'Live');
        } else {
            filtered = this.myCourses.filter(c => c.type !== 'Live' || c.enrollment.status === 'completed');
        }

        container.innerHTML = '';
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8">
                     <p class="text-gray-500">Aucun cours trouvé dans cette section.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(({ enrollment, ...course }) => {
            const isPending = enrollment.status === 'pending';
            const statusLabel = isPending ? 'En attente' : (enrollment.status === 'completed' ? 'Terminé' : 'En registré');
            const statusColor = isPending ? 'amber' : (enrollment.status === 'completed' ? 'green' : 'blue');
            const statusIcon = isPending ? 'clock' : (enrollment.status === 'completed' ? 'check-circle' : 'play-circle');
            
            return `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-2">
                <div class="relative h-48 overflow-hidden bg-gray-100">
                    <img src="${course.image || 'https://placehold.co/600x400'}" alt="${course.title}"
                        class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ${isPending ? 'opacity-50 grayscale' : ''}">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    
                    <div class="absolute top-3 left-3 px-3 py-1 bg-${statusColor}-600 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                        <i data-lucide="${statusIcon}" class="w-3 h-3"></i> ${statusLabel}
                    </div>

                    ${!isPending ? `
                    <div class="absolute bottom-3 left-3 right-3">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-white text-xs font-bold">${enrollment.progress || 0}% complété</span>
                            <span class="text-white text-xs">${enrollment.completedLessons || 0}/${enrollment.totalLessons || 0} leçons</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                            <div class="h-full bg-${course.type === 'Live' ? 'blue' : 'green'}-500 transition-all duration-500" style="width: ${enrollment.progress || 0}%"></div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                <div class="p-5">
                    <h3 class="font-bold text-gray-900 text-lg mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        ${course.title}
                    </h3>
                    <p class="text-sm text-gray-500 flex items-center gap-1 mb-3"><i data-lucide="award"
                            class="w-3 h-3"></i> ${course.instructor || 'Instructeur'}</p>

                    ${isPending ? `
                        <button disabled class="w-full py-3 bg-gray-100 text-gray-400 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                            <i data-lucide="lock" class="w-4 h-4"></i> Validation en cours
                        </button>
                    ` : `
                        <button onclick="window.location.href='/pages/etudiant/course-view.html?id=${course.id}'"
                            class="w-full py-3 bg-${course.type === 'Live' ? 'blue' : 'green'}-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg">
                            <i data-lucide="${course.type === 'Live' ? 'play' : 'download'}" class="w-4 h-4"></i> ${course.type === 'Live' ? 'Continuer' : 'Accéder au cours'}
                        </button>
                    `}
                </div>
            </div>
        `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    initializeEvents() {
        // Search functionality
        const searchInput = document.querySelector('input[placeholder="Rechercher un cours..."]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                // Implement search filtering if needed (client side)
                const term = e.target.value.toLowerCase();
                 // This would require a local filtered list variable, logic similar to others
            });
        }
    }
}

const studentCourses = new StudentCourses();
document.addEventListener('DOMContentLoaded', () => {
    studentCourses.init();
});
