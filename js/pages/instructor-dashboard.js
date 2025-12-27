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
            // Redirection vers la page de login générique (ou accueil si pas de login spécifique)
            // Redirection vers la page d'accueil si pas de login spécifique
            window.location.href = '../../index.html';
            return;
        }

        // Charger les données
        await this.loadMyCourses();
        await this.loadMyStudents();
        await this.loadStats();
        await this.loadUnreadMessages();
        this.updateHeader();
        this.checkLiveSessions();

        // Initialiser les événements
        this.initializeEvents();

        console.log('✅ Dashboard formateur chargé');
    }

    updateHeader() {
        if (this.currentInstructor) {
            const nameEl = document.getElementById('user-name');
            const roleEl = document.getElementById('user-role');
            if (nameEl) nameEl.textContent = this.currentInstructor.name;
            if (roleEl) roleEl.textContent = this.currentInstructor.role || 'Formateur';
            
            // Update welcome message
            const welcomeEl = document.querySelector('h2.text-3xl');
            if (welcomeEl) welcomeEl.textContent = `Bonjour, ${this.currentInstructor.name.split(' ')[0]} ! 👋`;
        }
    }

    checkLiveSessions() {
        // Simulation: Check if any course has a live session soon
        // For now, we just keep it hidden or show if we find a specific flag
        // Real implementation would check course schedules
        const liveCard = document.getElementById('live-session-card');
        if (liveCard) {
            // Logic to show card if live session exists
            // liveCard.classList.remove('hidden');
        }
    }

    /**
     * Récupérer le formateur connecté
     */
    async getCurrentInstructor() {
        const user = dataManager.getCurrentUser();
        console.log("Checking Current User:", user); // Debug
        if (user && (user.role === 'formateur' || user.role === 'instructor')) { // Allow both roles
            return user;
        }
        console.warn("User is not an instructor or not logged in:", user);
        return null;
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
        console.log('🗑️ Tentative de suppression du cours:', courseId);

        if (!courseId) {
            alert('Erreur: ID du cours manquant');
            return;
        }

        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce cours définitivement ?')) {
            return;
        }

        try {
            await dataManager.delete('courses', courseId);
            console.log('✅ Cours supprimé:', courseId);

            // Recharger les données
            await this.loadMyCourses();

            this.showNotification('Cours supprimé avec succès!', 'success');
        } catch (error) {
            console.error('❌ Erreur suppression cours:', error);
            alert('Erreur lors de la suppression: ' + error.message);
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
     * Charger les statistiques détaillées
     */
    async loadStats() {
        // 1. Calculer les revenus et étudiants
        let totalRevenue = 0;
        let pendingRevenue = 0;
        let totalHours = 0;
        let uniqueStudents = new Set();

        // Récupérer tous les enrollments pour plus de précision
        const allEnrollments = await dataManager.getAll('enrollments');
        
        this.courses.forEach(course => {
            // Revenus & Pending
            const courseEnrollments = allEnrollments.filter(e => e.courseId === course.id);
            courseEnrollments.forEach(e => {
                const paid = e.amountPaid || 0;
                const price = course.price || 0;
                totalRevenue += paid;
                if (price > paid) {
                    pendingRevenue += (price - paid);
                }
                uniqueStudents.add(e.userId);
            });

            // Heures (Estimation si pas de sessions précises)
            // Si le cours a des slots, on calcule : semaines * slots * 2h (moyenne)
            const weeks = parseInt(course.weeksDuration) || 12; // Default 12 weeks
            const slotsCount = (course.slots && course.slots.length) || 2; // Default 2 slots
            totalHours += weeks * slotsCount * 2; 
        });

        // Mise à jour du DOM
        this.animateValue('stat-total-revenue', totalRevenue, ' TND');
        this.animateValue('stat-pending-revenue', pendingRevenue, ' TND');
        this.animateValue('stat-total-hours', totalHours, 'h');
        this.animateValue('stat-active-students', uniqueStudents.size, '');

        // Charger la prochaine session
        this.loadNextSession();
        
        // Charger l'activité récente
        this.loadRecentActivity(allEnrollments);
    }

    animateValue(id, end, suffix) {
        const obj = document.getElementById(id);
        if (!obj) return;
        
        // Si c'est 0, on affiche direct
        if (end === 0) {
            obj.textContent = "0" + suffix;
            return;
        }

        const duration = 1000;
        const start = 0;
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            obj.textContent = value + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    /**
     * Charger la prochaine session (Simulation intelligente)
     */
    loadNextSession() {
        // Dans un vrai cas, on chercherait dans le calendrier.
        // Ici on va simuler une session proche pour la démo "2025"
        const now = new Date();
        const nextSessionDate = new Date(now.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000); // Dans 2h 45min
        
        // Trouver un cours actif aléatoire pour l'afficher
        const activeCourse = this.courses.find(c => c.status === 'active') || this.courses[0];
        
        if (activeCourse) {
            document.getElementById('next-class-title').textContent = activeCourse.title;
            document.getElementById('next-class-subtitle').textContent = `Session de ${activeCourse.level} • ${activeCourse.category || 'Général'}`;
            
            // Activer le bouton
            const btn = document.getElementById('btn-join-class');
            btn.onclick = () => {
                alert(`Lancement de la session live pour : ${activeCourse.title}`);
                // window.location.href = 'live-room.html?id=' + activeCourse.id;
            };

            // Lancer le compte à rebours
            this.startCountdown(nextSessionDate);
        } else {
            document.getElementById('next-class-title').textContent = "Aucune session prévue";
            document.getElementById('next-class-subtitle').textContent = "Créez un cours pour commencer";
            document.getElementById('countdown-timer').textContent = "--:--:--";
        }
    }

    startCountdown(endDate) {
        const timerEl = document.getElementById('countdown-timer');
        
        const update = () => {
            const now = new Date().getTime();
            const distance = endDate - now;

            if (distance < 0) {
                timerEl.textContent = "EN DIRECT";
                timerEl.classList.add('text-red-500', 'animate-pulse');
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            timerEl.textContent = 
                (hours < 10 ? "0" + hours : hours) + ":" + 
                (minutes < 10 ? "0" + minutes : minutes) + ":" + 
                (seconds < 10 ? "0" + seconds : seconds);
        };

        setInterval(update, 1000);
        update();
    }

    loadRecentActivity(enrollments) {
        const container = document.getElementById('recent-activity-list');
        if (!container) return;

        // Trier par date (récent en premier)
        const recent = enrollments
            .filter(e => this.courses.some(c => c.id === e.courseId))
            .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
            .slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-gray-400 text-sm">Aucune activité récente</div>';
            return;
        }

        container.innerHTML = recent.map(e => `
            <div class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                <div class="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    ${e.name ? e.name.charAt(0) : 'U'}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-gray-900 truncate">${e.name || 'Étudiant'}</p>
                    <p class="text-xs text-gray-500 truncate">S'est inscrit à ${e.courseName || 'un cours'}</p>
                </div>
                <span class="text-xs text-gray-400 whitespace-nowrap">Il y a 2h</span>
            </div>
        `).join('');
    }

    /**
     * Charger les messages non lus
     */
    async loadUnreadMessages() {
        try {
            const allMessages = await dataManager.getAll('messages');
            const unreadCount = allMessages.filter(msg => 
                msg.to.id === this.currentInstructor.id && !msg.isRead
            ).length;

            const unreadEl = document.getElementById('unread-messages-count');
            if (unreadEl) unreadEl.textContent = unreadCount;
            
            const badge = document.getElementById('badge-messages');
            if (badge) {
                if (unreadCount > 0) badge.classList.remove('hidden');
                else badge.classList.add('hidden');
            }
            
            localStorage.setItem('unreadMessagesCount', unreadCount);
        } catch (error) {
            console.error('❌ Erreur chargement messages:', error);
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
                            <label class="block text-sm font-medium mb-2">Prix (TND) & Type de Paiement</label>
                            <!-- خيارات الدفع: كامل، شهري، أو بالثلاثية -->
                            <div class="flex gap-2">
                                <input type="number" name="price" required
                                    class="w-2/3 px-4 py-2 border rounded-lg" placeholder="Montant">
                                <select name="paymentType" class="w-1/3 px-2 py-2 border rounded-lg bg-gray-50 text-sm">
                                    <option value="total">Total</option>
                                    <option value="session">Par Séance</option>
                                </select>
                            </div>
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
                paymentType: formData.get('paymentType'), // نوع الدفع (كامل، شهري، ثلاثي)
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
        // Remove existing notifications
        const existing = document.querySelectorAll('.toast-notification');
        existing.forEach(e => e.remove());

        const notification = document.createElement('div');
        notification.className = `toast-notification fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 transform transition-all duration-500 translate-x-full flex items-center gap-3 ${type === 'success' ? 'bg-white border-l-4 border-green-500 text-gray-800' : 'bg-white border-l-4 border-red-500 text-gray-800'
            }`;
        
        const icon = type === 'success' ? '<i data-lucide="check-circle" class="w-6 h-6 text-green-500"></i>' : '<i data-lucide="alert-circle" class="w-6 h-6 text-red-500"></i>';
        
        notification.innerHTML = `
            ${icon}
            <div>
                <h4 class="font-bold text-sm">${type === 'success' ? 'Succès' : 'Erreur'}</h4>
                <p class="text-sm text-gray-600">${message}</p>
            </div>
        `;
        
        document.body.appendChild(notification);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.remove('translate-x-full');
        });

        setTimeout(() => {
            notification.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
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
        // Supprimer modal existant si présent
        this.closeModal();

        const modal = document.createElement('div');
        modal.id = 'courseModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 class="text-2xl font-bold mb-6">Modifier le cours</h2>
                <form id="editCourseForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Titre du cours</label>
                        <input type="text" name="title" value="${course.title}" required
                               class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Description</label>
                        <textarea name="description" required rows="3"
                                  class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">${course.description}</textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Type</label>
                            <select name="type" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="live" ${course.type === 'live' ? 'selected' : ''}>Live</option>
                                <option value="recorded" ${course.type === 'recorded' ? 'selected' : ''}>Enregistré</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Niveau</label>
                            <select name="level" required class="w-full px-4 py-2 border rounded-lg">
                                <option value="Débutant" ${course.level === 'Débutant' ? 'selected' : ''}>Débutant</option>
                                <option value="Intermédiaire" ${course.level === 'Intermédiaire' ? 'selected' : ''}>Intermédiaire</option>
                                <option value="Avancé" ${course.level === 'Avancé' ? 'selected' : ''}>Avancé</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Prix (TND) & Type de Paiement</label>
                            <!-- تعديل خيارات الدفع -->
                            <div class="flex gap-2">
                                <input type="number" name="price" value="${course.price}" required
                                    class="w-2/3 px-4 py-2 border rounded-lg">
                                <select name="paymentType" class="w-1/3 px-2 py-2 border rounded-lg bg-gray-50 text-sm">
                                    <option value="total" ${course.paymentType === 'total' ? 'selected' : ''}>Total</option>
                                    <option value="session" ${course.paymentType === 'session' ? 'selected' : ''}>Par Séance</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Durée</label>
                            <input type="text" name="duration" value="${course.duration}" required placeholder="Ex: 3 mois"
                                   class="w-full px-4 py-2 border rounded-lg">
                        </div>
                    </div>
                    <div class="flex gap-3 mt-6">
                        <button type="submit" 
                                class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                            Enregistrer
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
        document.getElementById('editCourseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const updates = {
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                level: formData.get('level'),
                price: parseInt(formData.get('price')),
                paymentType: formData.get('paymentType'), // تحديث نوع الدفع
                duration: formData.get('duration')
            };
            await this.updateCourse(course.id, updates);
        });
    }
}

// Instance globale
const instructorDashboard = new InstructorDashboard();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    instructorDashboard.init();
});
