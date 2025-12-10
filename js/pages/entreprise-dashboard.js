/**
 * Dashboard Entreprise - Gestion Dynamique
 * Vue d'ensemble pour les entreprises : employés, formations, statistiques
 */

class EntrepriseDashboard {
    constructor() {
        this.company = null;
        this.employees = [];
        this.trainings = [];
    }

    async init() {
        console.log('🏢 Initialisation Dashboard Entreprise');
        await dataManager.init();

        this.company = await this.getCurrentCompany();
        if (!this.company) {
            window.location.href = 'login.html';
            return;
        }

        await this.loadData();
        this.initializeEvents();
    }

    async getCurrentCompany() {
        const companyId = localStorage.getItem('currentUserId') || 'user-6';
        return await dataManager.getById('users', companyId);
    }

    async loadData() {
        try {
            // Charger les employés (simulé - à adapter selon votre structure)
            const allUsers = await dataManager.getAll('users');
            this.employees = allUsers.filter(u => u.role === 'student' || u.role === 'instructor');

            // Charger les formations
            this.trainings = await dataManager.getAll('courses');

            this.renderStats();
            this.renderEmployees();
            this.renderTrainings();

            console.log('✅ Données entreprise chargées');
        } catch (error) {
            console.error('❌ Erreur chargement:', error);
        }
    }

    renderStats() {
        const statsContainer = document.getElementById('statsContainer');
        if (!statsContainer) return;

        const totalEmployees = this.employees.length;
        const activeTrainings = this.trainings.filter(t => t.type === 'live').length;
        const completionRate = 75; // À calculer selon vos données
        const budget = 50000; // À adapter

        statsContainer.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <i data-lucide="users" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${totalEmployees}</p>
                    <p class="text-blue-100">Employés</p>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <i data-lucide="book-open" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${activeTrainings}</p>
                    <p class="text-green-100">Formations actives</p>
                </div>
                <div class="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
                    <i data-lucide="trending-up" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${completionRate}%</p>
                    <p class="text-yellow-100">Taux de complétion</p>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <i data-lucide="dollar-sign" class="w-8 h-8 mb-2"></i>
                    <p class="text-3xl font-bold">${budget} TND</p>
                    <p class="text-purple-100">Budget formation</p>
                </div>
            </div>
        `;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderEmployees() {
        const container = document.getElementById('employeesContainer');
        if (!container) return;

        container.innerHTML = this.employees.slice(0, 5).map(employee => `
            <div class="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                        ${employee.name.charAt(0)}
                    </div>
                    <div>
                        <p class="font-bold text-gray-900">${employee.name}</p>
                        <p class="text-sm text-gray-500">${employee.email}</p>
                    </div>
                </div>
                <button class="text-indigo-600 hover:text-indigo-700">
                    <i data-lucide="more-vertical" class="w-5 h-5"></i>
                </button>
            </div>
        `).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderTrainings() {
        const container = document.getElementById('trainingsContainer');
        if (!container) return;

        container.innerHTML = this.trainings.slice(0, 4).map(training => `
            <div class="bg-white rounded-xl border border-gray-100 p-6 hover:shadow-lg transition-shadow">
                <h3 class="font-bold text-lg text-gray-900 mb-2">${training.title}</h3>
                <p class="text-sm text-gray-500 mb-4">${training.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">${training.duration}</span>
                    <span class="px-3 py-1 rounded-full text-xs font-bold ${training.type === 'live' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }">
                        ${training.type}
                    </span>
                </div>
            </div>
        `).join('');
    }

    initializeEvents() {
        // Événements pour les actions
    }
}

// Instance globale
const entrepriseDashboard = new EntrepriseDashboard();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    entrepriseDashboard.init();
});
