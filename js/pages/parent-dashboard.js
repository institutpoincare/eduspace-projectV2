/**
 * Dashboard Parent - Suivi des Enfants
 * Vue d'ensemble pour les parents : enfants, cours, progression
 */

class ParentDashboard {
    constructor() {
        this.parent = null;
        this.children = [];
        this.childrenCourses = [];
    }

    async init() {
        console.log('👨‍👩‍👧‍👦 Initialisation Dashboard Parent');
        await dataManager.init();

        this.parent = await this.getCurrentParent();
        if (!this.parent) {
            window.location.href = 'login.html';
            return;
        }

        await this.loadChildren();
        this.initializeEvents();
    }

    async getCurrentParent() {
        const user = dataManager.getCurrentUser();
        if (user && user.role === 'parent') {
            return user;
        }
        return null;
    }

    async loadChildren() {
        try {
            // Simuler les enfants (à adapter selon votre structure)
            const allUsers = await dataManager.getAll('users');
            this.children = allUsers.filter(u => u.role === 'student').slice(0, 3);

            // Charger les cours de chaque enfant
            const enrollments = await dataManager.getAll('enrollments');

            for (const child of this.children) {
                const childEnrollments = enrollments.filter(e => e.userId === child.id);
                child.courses = await Promise.all(
                    childEnrollments.map(async (e) => {
                        const course = await dataManager.getById('courses', e.courseId);
                        return { ...course, enrollment: e };
                    })
                );
            }

            this.renderChildren();
            this.renderStats();

            console.log(`✅ ${this.children.length} enfants chargés`);
        } catch (error) {
            console.error('❌ Erreur chargement enfants:', error);
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const totalChildren = this.children.length;
        const totalCourses = this.children.reduce((sum, child) => sum + (child.courses?.length || 0), 0);
        const avgProgress = this.children.length > 0
            ? Math.round(this.children.reduce((sum, child) => {
                const childAvg = child.courses?.reduce((s, c) => s + (c.enrollment?.progress || 0), 0) / (child.courses?.length || 1);
                return sum + childAvg;
            }, 0) / this.children.length)
            : 0;

        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <i data-lucide="users" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalChildren}</p>
                    <p class="text-blue-100">Enfants</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <i data-lucide="book-open" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalCourses}</p>
                    <p class="text-green-100">Cours actifs</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <i data-lucide="trending-up" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${avgProgress}%</p>
                    <p class="text-yellow-100">Progression moyenne</p>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderChildren() {
        const container = document.getElementById('childrenContainer');
        if (!container) return;

        container.innerHTML = this.children.map(child => `
            <div class="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                        ${child.name.charAt(0)}
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-lg text-gray-900">${child.name}</h3>
                        <p class="text-sm text-gray-500">${child.email}</p>
                    </div>
                </div>

                <div class="space-y-2 mb-4">
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Cours actifs</span>
                        <span class="font-bold text-gray-900">${child.courses?.length || 0}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-600">Progression moyenne</span>
                        <span class="font-bold text-indigo-600">
                            ${child.courses?.length > 0
                ? Math.round(child.courses.reduce((s, c) => s + (c.enrollment?.progress || 0), 0) / child.courses.length)
                : 0}%
                        </span>
                    </div>
                </div>

                <button onclick="parentDashboard.viewChildDetails('${child.id}')"
                        class="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-bold">
                    Voir détails
                </button>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    viewChildDetails(childId) {
        window.location.href = `eleves.html?id=${childId}`;
    }

    initializeEvents() {
        // Événements
    }
}

// Instance globale
const parentDashboard = new ParentDashboard();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    parentDashboard.init();
});
