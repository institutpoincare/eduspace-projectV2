/**
 * Mes Cours - Logique dynamique
 */

class StudentCourses {
    constructor() {
        this.currentStudent = null;
        this.myCourses = [];
        this.filter = 'all'; // all, in-progress, completed
        this.searchTerm = '';
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
            
            // Fixed: use studentId instead of userId
            const myEnrollments = allEnrollments.filter(e => 
                e.studentId === this.currentStudent.id && e.status === 'active'
            );
            console.log('✅ Mes enrollments:', myEnrollments.length, myEnrollments);

            this.myCourses = await Promise.all(
                myEnrollments.map(async (enrollment) => {
                    const course = await dataManager.getById('courses', enrollment.courseId);
                    if (!course) {
                        console.warn('⚠️ Cours non trouvé pour enrollment:', enrollment.courseId);
                        return null;
                    }
                    // Map 'cover' field to 'image' for consistent rendering
                    return { 
                        ...course, 
                        image: course.cover || course.image, // Use cover if available, fallback to image
                        enrollment 
                    };
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
        const container = document.getElementById('grid-recorded');
        if (!container) return;

        // Filter courses
        let filteredCourses = this.myCourses.filter(c => c.type !== 'Live');

        // Apply Search
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filteredCourses = filteredCourses.filter(c => 
                c.title.toLowerCase().includes(term) || 
                (c.instructor && c.instructor.toLowerCase().includes(term))
            );
        }

        // Apply Tab Filter
        if (this.filter === 'in-progress') {
            filteredCourses = filteredCourses.filter(c => c.enrollment.status !== 'completed' && c.enrollment.status !== 'pending');
        } else if (this.filter === 'completed') {
            filteredCourses = filteredCourses.filter(c => c.enrollment.status === 'completed');
        }
        // 'all' includes everything

        container.innerHTML = '';
        
        if (filteredCourses.length === 0) {
            container.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <i data-lucide="book-open" class="w-8 h-8"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Aucun cours trouvé</h3>
                    <p class="text-gray-500 max-w-md mx-auto">
                        ${this.searchTerm ? 'Essayez de modifier votre recherche.' : 'Vous n\'avez pas encore de cours dans cette catégorie.'}
                    </p>
                    <button onclick="window.location.href='catalogue.html'" class="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center gap-2">
                        <i data-lucide="search" class="w-4 h-4"></i> Parcourir le catalogue
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }

        container.innerHTML = filteredCourses.map(({ enrollment, ...course }) => {
            const isPending = enrollment.status === 'pending';
            // Status Logic
            let statusConfig = {
                label: 'Enregistré',
                color: 'blue',
                icon: 'play-circle'
            };

            if (isPending) {
                statusConfig = { label: 'En attente', color: 'amber', icon: 'clock' };
            } else if (enrollment.status === 'completed') {
                statusConfig = { label: 'Terminé', color: 'green', icon: 'check-circle' };
            }

            const progress = enrollment.progress || 0;
            
            return `
            <div class="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full ring-1 ring-gray-100/50">
                <!-- Image Container -->
                <div class="relative h-48 overflow-hidden bg-gray-100">
                    <img src="${course.image || 'https://placehold.co/600x400'}" alt="${course.title}"
                        class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ${isPending ? 'grayscale opacity-60' : ''}">
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent"></div>
                    
                    <div class="absolute top-3 left-3">
                        <span class="px-3 py-1 bg-white/95 backdrop-blur-sm text-xs font-bold text-gray-900 rounded-lg shadow-sm flex items-center gap-1.5">
                            <i data-lucide="${statusConfig.icon}" class="w-3.5 h-3.5 text-${statusConfig.color}-600"></i>
                            ${statusConfig.label}
                        </span>
                    </div>

                     ${!isPending ? `
                    <div class="absolute bottom-3 left-3 right-3">
                        <div class="flex items-center justify-between mb-1.5 text-white/90 text-xs font-medium">
                            <span>${progress}% complété</span>
                            <span>${enrollment.completedLessons || 0}/${enrollment.totalLessons || 0} leçons</span>
                        </div>
                        <div class="w-full bg-white/30 rounded-full h-1.5 backdrop-blur-sm overflow-hidden">
                            <div class="h-full bg-${statusConfig.color}-500 rounded-full transition-all duration-1000" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <!-- Content -->
                <div class="p-5 flex flex-col flex-1">
                    <h3 class="font-bold text-lg text-gray-900 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                        ${course.title}
                    </h3>
                    
                    <div class="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                            <i data-lucide="user" class="w-3.5 h-3.5"></i>
                        </div>
                        <span class="truncate">${course.instructor || 'Instructeur'}</span>
                    </div>

                    <div class="mt-auto pt-4 border-t border-gray-50">
                        ${isPending ? `
                            <button disabled class="w-full py-2.5 bg-gray-50 text-gray-400 font-medium rounded-xl cursor-not-allowed border border-gray-100 flex items-center justify-center gap-2 text-sm">
                                <i data-lucide="lock" class="w-4 h-4"></i>
                                <span>En attente de validation</span>
                            </button>
                        ` : `
                            <button onclick="window.location.href='details-cours.html?id=${course.id}'"
                                class="w-full py-2.5 bg-gray-900 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-300 shadow-lg shadow-gray-200 hover:shadow-blue-200 flex items-center justify-center gap-2 group/btn text-sm">
                                <span>Accéder au cours</span>
                                <i data-lucide="arrow-right" class="w-4 h-4 group-hover/btn:translate-x-1 transition-transform"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
        }).join('');

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    initializeEvents() {
        // Search
        const searchInput = document.querySelector('input[placeholder="Rechercher un cours..."]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.renderCourses();
            });
        }

        // Tabs
        const tabs = document.querySelectorAll('#course-filters button');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Update active state
                tabs.forEach(t => {
                    t.classList.remove('bg-blue-50', 'text-blue-600');
                    t.classList.add('text-gray-500', 'hover:text-gray-900', 'hover:bg-gray-50');
                });
                tab.classList.remove('text-gray-500', 'hover:text-gray-900', 'hover:bg-gray-50');
                tab.classList.add('bg-blue-50', 'text-blue-600');

                // Update filter and render
                this.filter = tab.dataset.filter;
                this.renderCourses();
            });
        });
    }
}

const studentCourses = new StudentCourses();
document.addEventListener('DOMContentLoaded', () => {
    studentCourses.init();
});
