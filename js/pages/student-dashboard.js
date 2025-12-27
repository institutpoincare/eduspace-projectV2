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
        this.updateHeader();
        await this.loadAvailableCourses();
        await this.loadMyCourses();
        await this.loadStats();
        await this.loadNextLiveSession();

        // Initialiser les événements
        this.initializeEvents();

        console.log('✅ Dashboard étudiant chargé');
    }

    /**
     * Mettre à jour l'en-tête avec les infos de l'étudiant
     */
    updateHeader() {
        const headerTitle = document.querySelector('header h1');
        const avatar = document.querySelector('header .bg-gradient-to-tr');
        
        if (this.currentStudent) {
            if (headerTitle) {
                headerTitle.textContent = `Bonjour, ${this.currentStudent.name} 👋`;
            }
            if (avatar) {
                // Initials
                const initials = this.currentStudent.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                avatar.textContent = initials;
            }
        }
    }

    /**
     * Charger le prochain cours en direct
     */
    async loadNextLiveSession() {
        const container = document.getElementById('liveSessionContainer');
        if (!container) return;

        // Trouver le prochain live à venir dans MES cours
        const now = new Date();
        const upcomingLiveCourses = this.myCourses
            .filter(c => c.type === 'Live' && c.nextSession)
            .map(c => ({
                ...c,
                sessionDate: new Date(c.nextSession)
            }))
            .filter(c => c.sessionDate > now)
            .sort((a, b) => a.sessionDate - b.sessionDate);

        if (upcomingLiveCourses.length === 0) {
            container.innerHTML = '';
            container.style.display = 'none';
            return;
        }

        const nextCourse = upcomingLiveCourses[0];
        const timeDiff = nextCourse.sessionDate - now;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

        container.style.display = 'block';
        container.innerHTML = `
            <div class="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
                <div class="relative z-10 flex items-center gap-6">
                    <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-red-200">
                        <i data-lucide="video" class="w-8 h-8"></i>
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="relative flex h-3 w-3">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <h2 class="text-sm font-bold text-red-600 uppercase tracking-wider">Prochain Cours en Direct</h2>
                        </div>
                        <h3 class="text-xl font-bold text-gray-900">${nextCourse.title}</h3>
                        <p class="text-gray-500 font-medium">avec ${nextCourse.instructor} • ${nextCourse.sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <div class="relative z-10 flex items-center gap-4">
                    <div class="flex gap-2">
                        <div class="bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-2 rounded-lg text-center min-w-[60px]">
                            <div class="text-xl font-bold text-gray-900">${hours}</div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Heures</div>
                        </div>
                        <div class="bg-white/80 backdrop-blur-sm border border-gray-100 px-3 py-2 rounded-lg text-center min-w-[60px]">
                            <div class="text-xl font-bold text-gray-900">${minutes}</div>
                            <div class="text-[10px] text-gray-500 font-bold uppercase">Min</div>
                        </div>
                    </div>
                    <button onclick="studentDashboard.viewCourse('${nextCourse.id}')"
                        class="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 flex items-center gap-2">
                        Rejoindre
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Récupérer l'étudiant connecté
     */
    async getCurrentStudent() {
        const user = dataManager.getCurrentUser();
        if (user && user.role === 'etudiant') {
            return user;
        }
        return null; // Don't redirect here, let init handle it or caller
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
            container.classList.remove('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-6');
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

        container.classList.add('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4', 'gap-6');

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
