/**
 * Student Dashboard - Gestion Dynamique des Inscriptions
 * Inscription aux cours, suivi de progression, mes cours
 */

class StudentDashboard {
    constructor() {
        this.currentStudent = null;
        this.availableCourses = [];
        this.myCourses = [];
        this.myEnrollments = [];
    }

    /**
     * Initialiser le dashboard
     */
    async init() {
        console.log('🎓 Initialisation Dashboard Étudiant');

        await dataManager.init();

        // Récupérer l'étudiant connecté
        this.currentStudent = await this.getCurrentStudent();

        if (!this.currentStudent) {
            console.error('❌ Aucun étudiant connecté');
            window.location.href = '/pages/etudiant/login.html';
            return;
        }

        // Charger les données
        await this.loadAvailableCourses();
        await this.loadMyCourses();
        await this.loadStats();

        // Initialiser les événements
        this.initializeEvents();

        console.log('✅ Dashboard étudiant chargé');
    }

    /**
     * Récupérer l'étudiant connecté
     */
    async getCurrentStudent() {
        // Simulation - En production, récupérer depuis session
        const studentId = localStorage.getItem('currentUserId') || 'user-1';
        return await dataManager.getById('users', studentId);
    }

    /**
     * Charger les cours disponibles
     */
    async loadAvailableCourses() {
        try {
            this.availableCourses = await dataManager.getAll('courses');
            this.renderAvailableCourses();
            console.log(`✅ ${this.availableCourses.length} cours disponibles`);
        } catch (error) {
            console.error('❌ Erreur chargement cours:', error);
        }
    }

    /**
     * Afficher les cours disponibles
     */
    renderAvailableCourses() {
        const container = document.getElementById('availableCoursesContainer');
        if (!container) return;

        container.innerHTML = '';

        this.availableCourses.forEach(course => {
            const isEnrolled = this.myEnrollments.some(e => e.courseId === course.id);
            const card = this.createCourseCard(course, isEnrolled);
            container.appendChild(card);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Créer une carte cours
     */
    createCourseCard(course, isEnrolled = false) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow';

        card.innerHTML = `
            <img src="${course.image}" alt="${course.title}" 
                 class="w-full h-48 object-cover">
            <div class="p-6">
                <div class="flex items-start justify-between mb-3">
                    <h3 class="text-xl font-bold text-gray-900 flex-1">${course.title}</h3>
                    <span class="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold ml-2">
                        ${course.type}
                    </span>
                </div>
                
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">${course.description}</p>
                
                <div class="flex items-center gap-4 mb-4 text-sm">
                    <div class="flex items-center gap-1">
                        <i data-lucide="star" class="w-4 h-4 text-yellow-500"></i>
                        <span class="font-bold">${course.rating}</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i data-lucide="users" class="w-4 h-4 text-gray-400"></i>
                        <span>${course.enrolled} inscrits</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <i data-lucide="clock" class="w-4 h-4 text-gray-400"></i>
                        <span>${course.duration}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-4 border-t">
                    <span class="text-2xl font-bold text-indigo-600">${course.price} TND</span>
                    ${isEnrolled ? `
                        <button onclick="studentDashboard.viewCourse('${course.id}')"
                                class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2">
                            <i data-lucide="play-circle" class="w-4 h-4"></i> Continuer
                        </button>
                    ` : `
                        <button onclick="studentDashboard.enrollInCourse('${course.id}')"
                                class="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> S'inscrire
                        </button>
                    `}
                </div>
            </div>
        `;

        return card;
    }

    /**
     * S'inscrire à un cours (CREATE enrollment)
     */
    async enrollInCourse(courseId) {
        try {
            const course = await dataManager.getById('courses', courseId);

            if (!confirm(`Voulez-vous vous inscrire au cours "${course.title}" pour ${course.price} TND?`)) {
                return;
            }

            // Créer l'inscription
            const enrollment = await dataManager.create('enrollments', {
                userId: this.currentStudent.id,
                courseId: courseId,
                instructorId: course.instructorId,
                status: 'active',
                progress: 0,
                completedLessons: 0,
                totalLessons: course.syllabus ? course.syllabus.reduce((sum, ch) => sum + ch.lessons.length, 0) : 0,
                grade: null,
                certificate: null
            });

            // Mettre à jour le nombre d'inscrits du cours
            await dataManager.update('courses', courseId, {
                enrolled: (course.enrolled || 0) + 1
            });

            console.log('✅ Inscription réussie:', enrollment.id);
            await this.loadMyCourses();
            await this.loadAvailableCourses();
            this.showNotification('Inscription réussie! Bon apprentissage 🎉', 'success');
        } catch (error) {
            console.error('❌ Erreur inscription:', error);
            this.showNotification('Erreur lors de l\'inscription', 'error');
        }
    }

    /**
     * Charger mes cours
     */
    async loadMyCourses() {
        try {
            // Récupérer mes inscriptions
            const allEnrollments = await dataManager.getAll('enrollments');
            this.myEnrollments = allEnrollments.filter(e => e.userId === this.currentStudent.id);

            // Charger les cours correspondants
            this.myCourses = await Promise.all(
                this.myEnrollments.map(async (enrollment) => {
                    const course = await dataManager.getById('courses', enrollment.courseId);
                    return { ...course, enrollment };
                })
            );

            this.renderMyCourses();
            console.log(`✅ ${this.myCourses.length} cours chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement mes cours:', error);
        }
    }

    /**
     * Afficher mes cours
     */
    renderMyCourses() {
        const container = document.getElementById('myCoursesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.myCourses.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="book-open" class="w-16 h-16 mx-auto text-gray-400 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">Vous n'êtes inscrit à aucun cours</p>
                    <button onclick="document.getElementById('availableCoursesContainer').scrollIntoView({behavior: 'smooth'})"
                            class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                        Découvrir les cours
                    </button>
                </div>
            `;
            return;
        }

        this.myCourses.forEach(({ enrollment, ...course }) => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow';

            card.innerHTML = `
                <div class="flex gap-4">
                    <img src="${course.image}" alt="${course.title}" 
                         class="w-32 h-32 object-cover rounded-lg">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">${course.title}</h3>
                        <p class="text-gray-600 text-sm mb-3">${course.description}</p>
                        
                        <div class="mb-3">
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-gray-600">Progression</span>
                                <span class="font-bold text-indigo-600">${enrollment.progress}%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-indigo-600 h-2 rounded-full transition-all" 
                                     style="width: ${enrollment.progress}%"></div>
                            </div>
                            <p class="text-xs text-gray-500 mt-1">
                                ${enrollment.completedLessons} / ${enrollment.totalLessons} leçons complétées
                            </p>
                        </div>

                        <div class="flex gap-2">
                            <button onclick="studentDashboard.viewCourse('${course.id}')"
                                    class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                                <i data-lucide="play-circle" class="w-4 h-4"></i> Continuer
                            </button>
                            <button onclick="studentDashboard.unenrollFromCourse('${enrollment.id}')"
                                    class="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2">
                                <i data-lucide="x-circle" class="w-4 h-4"></i> Se désinscrire
                            </button>
                        </div>
                    </div>
                </div>
            `;

            container.appendChild(card);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Se désinscrire d'un cours (DELETE enrollment)
     */
    async unenrollFromCourse(enrollmentId) {
        if (!confirm('Êtes-vous sûr de vouloir vous désinscrire de ce cours?')) {
            return;
        }

        try {
            const enrollment = await dataManager.getById('enrollments', enrollmentId);

            // Supprimer l'inscription
            await dataManager.delete('enrollments', enrollmentId);

            // Mettre à jour le nombre d'inscrits du cours
            const course = await dataManager.getById('courses', enrollment.courseId);
            await dataManager.update('courses', enrollment.courseId, {
                enrolled: Math.max(0, (course.enrolled || 0) - 1)
            });

            console.log('✅ Désinscription réussie');
            await this.loadMyCourses();
            await this.loadAvailableCourses();
            this.showNotification('Désinscription réussie', 'success');
        } catch (error) {
            console.error('❌ Erreur désinscription:', error);
            this.showNotification('Erreur lors de la désinscription', 'error');
        }
    }

    /**
     * Voir un cours
     */
    viewCourse(courseId) {
        window.location.href = `/pages/etudiant/course-view.html?id=${courseId}`;
    }

    /**
     * Charger les statistiques
     */
    async loadStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const totalCourses = this.myCourses.length;
        const completedCourses = this.myEnrollments.filter(e => e.status === 'completed').length;
        const avgProgress = totalCourses > 0
            ? Math.round(this.myEnrollments.reduce((sum, e) => sum + e.progress, 0) / totalCourses)
            : 0;
        const totalHours = this.myCourses.reduce((sum, c) => {
            const hours = parseInt(c.duration) || 0;
            return sum + hours;
        }, 0);

        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <i data-lucide="book-open" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalCourses}</p>
                    <p class="text-blue-100">Cours en cours</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <i data-lucide="check-circle" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${completedCourses}</p>
                    <p class="text-green-100">Cours terminés</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <i data-lucide="trending-up" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${avgProgress}%</p>
                    <p class="text-yellow-100">Progression moyenne</p>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <i data-lucide="clock" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalHours}h</p>
                    <p class="text-purple-100">Temps d'apprentissage</p>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Afficher notification
     */
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.remove(), 3000);
    }

    /**
     * Initialiser les événements
     */
    initializeEvents() {
        // Recherche de cours
        const searchInput = document.getElementById('searchCourses');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCourses(e.target.value);
            });
        }
    }

    /**
     * Filtrer les cours
     */
    filterCourses(query) {
        const filtered = this.availableCourses.filter(course =>
            course.title.toLowerCase().includes(query.toLowerCase()) ||
            course.description.toLowerCase().includes(query.toLowerCase())
        );

        const container = document.getElementById('availableCoursesContainer');
        if (!container) return;

        container.innerHTML = '';
        filtered.forEach(course => {
            const isEnrolled = this.myEnrollments.some(e => e.courseId === course.id);
            const card = this.createCourseCard(course, isEnrolled);
            container.appendChild(card);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Instance globale
const studentDashboard = new StudentDashboard();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard.init();
});
