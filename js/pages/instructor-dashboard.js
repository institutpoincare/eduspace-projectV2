/**
 * Instructor Dashboard - Gestion Dynamique des Cours
 * CRUD complet : Create, Read, Update, Delete
 */

class InstructorDashboard {
    constructor() {
        this.currentInstructor = null;
        this.courses = [];
        this.students = [];
    }

    /**
     * Initialiser le dashboard
     */
    async init() {
        console.log('📊 Initialisation Dashboard Formateur');

        // Attendre DataManager
        await dataManager.init();

        // Récupérer l'utilisateur connecté (simulation)
        this.currentInstructor = await this.getCurrentInstructor();

        if (!this.currentInstructor) {
            console.error('❌ Aucun formateur connecté');
            window.location.href = '/pages/formateur/login.html';
            return;
        }

        // Charger les données
        await this.loadMyCourses();
        await this.loadMyStudents();
        await this.loadStats();

        // Initialiser les événements
        this.initializeEvents();

        console.log('✅ Dashboard formateur chargé');
    }

    /**
     * Récupérer le formateur connecté
     */
    async getCurrentInstructor() {
        // Simulation - En production, récupérer depuis session/localStorage
        const instructorId = localStorage.getItem('currentUserId') || 'ahmed';
        return await dataManager.getById('users', instructorId);
    }

    /**
     * Charger mes cours
     */
    async loadMyCourses() {
        try {
            const allCourses = await dataManager.getAll('courses');
            this.courses = allCourses.filter(c => c.instructorId === this.currentInstructor.id);

            this.renderCourses();
            console.log(`✅ ${this.courses.length} cours chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement cours:', error);
        }
    }

    /**
     * Afficher les cours
     */
    renderCourses() {
        const container = document.getElementById('coursesContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.courses.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12">
                    <i data-lucide="book-open" class="w-16 h-16 mx-auto text-gray-400 mb-4"></i>
                    <p class="text-gray-500 text-lg mb-4">Aucun cours pour le moment</p>
                    <button onclick="instructorDashboard.showCreateCourseModal()" 
                            class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                        Créer mon premier cours
                    </button>
                </div>
            `;
            return;
        }

        this.courses.forEach(course => {
            const card = this.createCourseCard(course);
            container.appendChild(card);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Créer une carte cours
     */
    createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow';

        const statusColors = {
            active: 'bg-green-100 text-green-700',
            draft: 'bg-gray-100 text-gray-700',
            archived: 'bg-red-100 text-red-700'
        };

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${course.title}</h3>
                    <p class="text-gray-600 text-sm mb-3">${course.description}</p>
                    <div class="flex gap-2 flex-wrap">
                        <span class="${statusColors[course.status] || statusColors.draft} px-3 py-1 rounded-full text-xs font-bold">
                            ${course.status}
                        </span>
                        <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                            ${course.type}
                        </span>
                        <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold">
                            ${course.level}
                        </span>
                    </div>
                </div>
                <img src="${course.image}" alt="${course.title}" 
                     class="w-24 h-24 object-cover rounded-lg ml-4">
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="text-center">
                    <i data-lucide="users" class="w-5 h-5 mx-auto text-gray-400 mb-1"></i>
                    <p class="text-2xl font-bold text-gray-900">${course.enrolled || 0}</p>
                    <p class="text-xs text-gray-500">Inscrits</p>
                </div>
                <div class="text-center">
                    <i data-lucide="star" class="w-5 h-5 mx-auto text-yellow-500 mb-1"></i>
                    <p class="text-2xl font-bold text-gray-900">${course.rating || 0}</p>
                    <p class="text-xs text-gray-500">Note</p>
                </div>
                <div class="text-center">
                    <i data-lucide="dollar-sign" class="w-5 h-5 mx-auto text-green-500 mb-1"></i>
                    <p class="text-2xl font-bold text-gray-900">${course.price}</p>
                    <p class="text-xs text-gray-500">TND</p>
                </div>
                <div class="text-center">
                    <i data-lucide="clock" class="w-5 h-5 mx-auto text-blue-500 mb-1"></i>
                    <p class="text-2xl font-bold text-gray-900">${course.duration}</p>
                    <p class="text-xs text-gray-500">Durée</p>
                </div>
            </div>

            <div class="flex gap-2">
                <button onclick="instructorDashboard.editCourse('${course.id}')"
                        class="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="edit" class="w-4 h-4"></i> Modifier
                </button>
                <button onclick="instructorDashboard.viewCourseDetails('${course.id}')"
                        class="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="eye" class="w-4 h-4"></i> Détails
                </button>
                <button onclick="instructorDashboard.deleteCourse('${course.id}')"
                        class="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        return card;
    }

    /**
     * CREATE - Créer un nouveau cours
     */
    async createCourse(courseData) {
        try {
            const newCourse = await dataManager.create('courses', {
                ...courseData,
                instructorId: this.currentInstructor.id,
                enrolled: 0,
                rating: 0,
                reviews: 0,
                status: 'draft'
            });

            console.log('✅ Cours créé:', newCourse.id);
            await this.loadMyCourses();
            this.showNotification('Cours créé avec succès!', 'success');
            this.closeModal();
        } catch (error) {
            console.error('❌ Erreur création cours:', error);
            this.showNotification('Erreur lors de la création', 'error');
        }
    }

    /**
     * UPDATE - Modifier un cours
     */
    async editCourse(courseId) {
        const course = await dataManager.getById('courses', courseId);
        if (!course) return;

        // Afficher modal d'édition avec les données
        this.showEditCourseModal(course);
    }

    async updateCourse(courseId, updates) {
        try {
            await dataManager.update('courses', courseId, updates);
            console.log('✅ Cours mis à jour:', courseId);
            await this.loadMyCourses();
            this.showNotification('Cours mis à jour avec succès!', 'success');
            this.closeModal();
        } catch (error) {
            console.error('❌ Erreur mise à jour cours:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    /**
     * DELETE - Supprimer un cours
     */
    async deleteCourse(courseId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours?')) {
            return;
        }

        try {
            await dataManager.delete('courses', courseId);
            console.log('✅ Cours supprimé:', courseId);
            await this.loadMyCourses();
            this.showNotification('Cours supprimé avec succès!', 'success');
        } catch (error) {
            console.error('❌ Erreur suppression cours:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    /**
     * Charger mes étudiants
     */
    async loadMyStudents() {
        try {
            const allEnrollments = await dataManager.getAll('enrollments');
            const myEnrollments = allEnrollments.filter(e =>
                this.courses.some(c => c.id === e.courseId)
            );

            // Charger les infos des étudiants
            const studentIds = [...new Set(myEnrollments.map(e => e.userId))];
            this.students = await Promise.all(
                studentIds.map(id => dataManager.getById('users', id))
            );

            this.renderStudents();
            console.log(`✅ ${this.students.length} étudiants chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement étudiants:', error);
        }
    }

    /**
     * Afficher les étudiants
     */
    renderStudents() {
        const container = document.getElementById('studentsContainer');
        if (!container) return;

        container.innerHTML = '';

        if (this.students.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Aucun étudiant inscrit</p>
                </div>
            `;
            return;
        }

        this.students.forEach(student => {
            const card = document.createElement('div');
            card.className = 'flex items-center gap-4 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow';
            card.innerHTML = `
                <img src="${student.avatar}" alt="${student.name}" 
                     class="w-12 h-12 rounded-full object-cover">
                <div class="flex-1">
                    <h4 class="font-bold text-gray-900">${student.name}</h4>
                    <p class="text-sm text-gray-500">${student.email}</p>
                </div>
                <button onclick="startChat('${student.id}', 'student')"
                        class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                </button>
            `;
            container.appendChild(card);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Charger les statistiques
     */
    async loadStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const totalStudents = this.courses.reduce((sum, c) => sum + (c.enrolled || 0), 0);
        const totalRevenue = this.courses.reduce((sum, c) => sum + (c.price * (c.enrolled || 0)), 0);
        const avgRating = this.courses.length > 0
            ? (this.courses.reduce((sum, c) => sum + (c.rating || 0), 0) / this.courses.length).toFixed(1)
            : 0;

        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <i data-lucide="book-open" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${this.courses.length}</p>
                    <p class="text-blue-100">Cours actifs</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <i data-lucide="users" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalStudents}</p>
                    <p class="text-green-100">Étudiants</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <i data-lucide="star" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${avgRating}</p>
                    <p class="text-yellow-100">Note moyenne</p>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <i data-lucide="dollar-sign" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalRevenue}</p>
                    <p class="text-purple-100">TND Revenue</p>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    /**
     * Afficher modal création cours
     */
    showCreateCourseModal() {
        // Créer et afficher modal
        const modal = document.createElement('div');
        modal.id = 'courseModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6">Créer un nouveau cours</h2>
                <form id="createCourseForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Titre du cours</label>
                        <input type="text" name="title" required
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <textarea name="description" required rows="3"
                                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Type</label>
                            <select name="type" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="live">Live</option>
                                <option value="recorded">Enregistré</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Niveau</label>
                            <select name="level" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="Débutant">Débutant</option>
                                <option value="Intermédiaire">Intermédiaire</option>
                                <option value="Avancé">Avancé</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Prix (TND)</label>
                            <input type="number" name="price" required
                                   class="w-full px-4 py-2 border rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Durée</label>
                            <input type="text" name="duration" required placeholder="Ex: 3 mois"
                                   class="w-full px-4 py-2 border rounded-lg">
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" 
                                class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                            Créer le cours
                        </button>
                        <button type="button" onclick="instructorDashboard.closeModal()"
                                class="px-6 py-3 border rounded-lg hover:bg-gray-50">
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Gérer la soumission
        document.getElementById('createCourseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const courseData = {
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                level: formData.get('level'),
                price: parseInt(formData.get('price')),
                duration: formData.get('duration'),
                language: 'Français',
                category: 'General',
                image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800'
            };
            await this.createCourse(courseData);
        });
    }

    /**
     * Fermer modal
     */
    closeModal() {
        const modal = document.getElementById('courseModal');
        if (modal) {
            modal.remove();
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
        // Bouton créer cours
        const createBtn = document.getElementById('createCourseBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateCourseModal());
        }
    }

    /**
     * Voir détails cours
     */
    viewCourseDetails(courseId) {
        window.location.href = `/pages/formateur/class-details.html?id=${courseId}`;
    }

    /**
     * Afficher modal édition
     */
    showEditCourseModal(course) {
        // Similar to create modal but with pre-filled data
        console.log('Edit course:', course);
        // Implementation similar to showCreateCourseModal
    }
}

// Instance globale
const instructorDashboard = new InstructorDashboard();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    instructorDashboard.init();
});
