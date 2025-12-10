/**
 * Mes Cours - Page Dynamique Étudiant
 * Affiche les cours auxquels l'étudiant est inscrit avec progression
 */

class MesCoursPage {
    constructor() {
        this.currentStudent = null;
        this.myCourses = [];
        this.enrollments = [];
    }

    async init() {
        console.log('📚 Initialisation Mes Cours');
        await dataManager.init();

        this.currentStudent = await this.getCurrentStudent();
        if (!this.currentStudent) {
            window.location.href = 'login.html';
            return;
        }

        await this.loadMyCourses();
        this.initializeEvents();
    }

    async getCurrentStudent() {
        const studentId = localStorage.getItem('currentUserId') || 'user-1';
        return await dataManager.getById('users', studentId);
    }

    async loadMyCourses() {
        try {
            // Récupérer mes inscriptions
            const allEnrollments = await dataManager.getAll('enrollments');
            this.enrollments = allEnrollments.filter(e => e.userId === this.currentStudent.id);

            // Charger les cours correspondants
            this.myCourses = await Promise.all(
                this.enrollments.map(async (enrollment) => {
                    const course = await dataManager.getById('courses', enrollment.courseId);
                    const instructor = await dataManager.getById('users', course.instructorId);
                    return { ...course, enrollment, instructor };
                })
            );

            this.renderCourses();
            console.log(`✅ ${this.myCourses.length} cours chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement cours:', error);
        }
    }

    renderCourses() {
        const container = document.getElementById('myCoursesContainer') ||
            document.querySelector('.grid.grid-cols-1');

        if (!container) return;

        if (this.myCourses.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <i data-lucide="book-open" class="w-20 h-20 mx-auto text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">Aucun cours</h3>
                    <p class="text-gray-500 mb-6">Vous n'êtes inscrit à aucun cours pour le moment</p>
                    <a href="catalogue.html" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700">
                        Découvrir les cours
                    </a>
                </div>
            `;
            return;
        }

        container.innerHTML = this.myCourses.map(({ enrollment, instructor, ...course }) => `
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden">
                <div class="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                    <img src="${course.image}" alt="${course.title}" 
                         class="w-full h-full object-cover opacity-80">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    
                    <!-- Progress Bar -->
                    <div class="absolute bottom-0 left-0 right-0 p-4">
                        <div class="flex justify-between text-white text-sm mb-2">
                            <span class="font-bold">${enrollment.progress}% complété</span>
                            <span>${enrollment.completedLessons}/${enrollment.totalLessons} leçons</span>
                        </div>
                        <div class="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                            <div class="bg-green-400 h-full rounded-full transition-all" 
                                 style="width: ${enrollment.progress}%"></div>
                        </div>
                    </div>
                </div>

                <div class="p-6">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-900 mb-1">${course.title}</h3>
                            <p class="text-sm text-gray-500">par ${instructor?.name || 'Instructeur'}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${enrollment.status === 'completed' ? 'bg-green-100 text-green-700' :
                enrollment.status === 'active' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
            }">
                            ${enrollment.status === 'completed' ? 'Terminé' :
                enrollment.status === 'active' ? 'En cours' : 'Inactif'}
                        </span>
                    </div>

                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${course.description}</p>

                    <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <span class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i> ${course.duration}
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="book-open" class="w-4 h-4"></i> ${course.type}
                        </span>
                        <span class="flex items-center gap-1">
                            <i data-lucide="star" class="w-4 h-4 text-yellow-500"></i> ${course.rating}
                        </span>
                    </div>

                    ${enrollment.status === 'completed' && enrollment.certificate ? `
                        <div class="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                            <div class="flex items-center gap-2 text-green-700">
                                <i data-lucide="award" class="w-5 h-5"></i>
                                <span class="font-bold text-sm">Certificat obtenu</span>
                            </div>
                            <p class="text-xs text-green-600 mt-1">Note: ${enrollment.grade}/100</p>
                        </div>
                    ` : ''}

                    <div class="flex gap-2">
                        <button onclick="mesCoursPage.continueCourse('${course.id}')"
                                class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-bold">
                            <i data-lucide="play-circle" class="w-4 h-4"></i>
                            ${enrollment.progress === 0 ? 'Commencer' : 'Continuer'}
                        </button>
                        ${enrollment.status !== 'completed' ? `
                            <button onclick="mesCoursPage.unenroll('${enrollment.id}')"
                                    class="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                <i data-lucide="x-circle" class="w-4 h-4"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async continueCourse(courseId) {
        // Rediriger vers la page du cours
        window.location.href = `course-view.html?id=${courseId}`;
    }

    async unenroll(enrollmentId) {
        if (!confirm('Êtes-vous sûr de vouloir vous désinscrire de ce cours ?')) {
            return;
        }

        try {
            const enrollment = await dataManager.getById('enrollments', enrollmentId);
            await dataManager.delete('enrollments', enrollmentId);

            // Mettre à jour le nombre d'inscrits du cours
            const course = await dataManager.getById('courses', enrollment.courseId);
            await dataManager.update('courses', enrollment.courseId, {
                enrolled: Math.max(0, (course.enrolled || 0) - 1)
            });

            await this.loadMyCourses();
            this.showNotification('Désinscription réussie', 'success');
        } catch (error) {
            console.error('❌ Erreur désinscription:', error);
            this.showNotification('Erreur lors de la désinscription', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white font-bold`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    initializeEvents() {
        // Recherche
        const searchInput = document.getElementById('searchCourses');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCourses(e.target.value);
            });
        }
    }

    filterCourses(query) {
        const filtered = this.myCourses.filter(course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.description.toLowerCase().includes(query.toLowerCase())
        );

        // Render filtered courses
        // Implementation similar to renderCourses but with filtered array
    }
}

// Instance globale
const mesCoursPage = new MesCoursPage();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    mesCoursPage.init();
});
